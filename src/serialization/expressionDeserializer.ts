/**
 * @file Expression deserialization helpers.
 * Deserializes expression nodes from JSON.
 */

import type { SourceRange } from '../ast/baseNode.js';
import type {
  BinaryExpression,
  AssignExpression,
  ArrayExpression,
  CallExpression,
  NewExpression,
  VariableExpression,
  FieldExpression,
  UnaryExpression,
  CastExpression,
  TernaryExpression,
  SoqlExpression,
  SoslExpression,
  SoqlOrSoslBinding,
  Expression,
} from '../ast/expression.js';
import type { Identifier, TypeRef } from '../ast/baseNode.js';
import { NodeFactory } from '../translator/nodeFactory.js';
import { isExpression, isIdentifier, isInitializer, isSoqlOrSoslBinding } from '../guard/index.js';
import type { JsonASTNode } from './jsonSerializer.js';
import type { JsonDeserializer } from './jsonDeserializer.js';
import {
  getJsonASTNodeArrayFromRecord,
  getJsonASTNodeFromRecord,
  getJsonASTNodeProperty,
  getOptionalJsonASTNodeProperty,
  getStringProperty,
  isJsonASTNode,
} from './astDeserializer.js';

// ============================================================================
// Helper: operator validation and canonical op enum (used before main deserializers)
// ============================================================================

/** Map Summit-AST canonical binary op enum to operator symbol. */
const BINARY_OP_FROM_CANONICAL: Record<string, string> = {
  ADDITION: '+',
  ALTERNATIVE_NOT_EQUAL: '<>',
  BITWISE_AND: '&',
  BITWISE_OR: '|',
  BITWISE_XOR: '^',
  DIVISION: '/',
  EQUAL: '==',
  EXACTLY_EQUAL: '===',
  EXACTLY_NOT_EQUAL: '!==',
  GREATER_THAN: '>',
  GREATER_THAN_OR_EQUAL: '>=',
  INSTANCEOF: 'instanceof',
  LEFT_SHIFT: '<<',
  LESS_THAN: '<',
  LESS_THAN_OR_EQUAL: '<=',
  LOGICAL_AND: '&&',
  LOGICAL_OR: '||',
  MULTIPLICATION: '*',
  NOT_EQUAL: '!=',
  NULL_COALESCING: '??',
  RIGHT_SHIFT_SIGNED: '>>',
  RIGHT_SHIFT_UNSIGNED: '>>>',
  SUBTRACTION: '-',
};

/** Map Summit-AST canonical unary op enum to operator symbol. */
const UNARY_OP_FROM_CANONICAL: Record<string, string> = {
  BITWISE_NOT: '~',
  LOGICAL_COMPLEMENT: '!',
  NEGATION: '-',
  PLUS: '+',
  POST_DECREMENT: '--',
  POST_INCREMENT: '++',
  PRE_DECREMENT: '--',
  PRE_INCREMENT: '++',
};

/**
 * Validate and narrow a binary operator string to BinaryExpression['operator'].
 * Accepts symbol or canonical op enum.
 * @param operator - The operator string to convert.
 * @returns The validated binary operator.
 * @throws {Error} If the operator is invalid.
 */
function toBinaryOperator(operator: string): BinaryExpression['op'] {
  const symbol = BINARY_OP_FROM_CANONICAL[operator] ?? operator;
  switch (symbol) {
    case '-':
    case '!=':
    case '!==':
    case '*':
    case '/':
    case '&':
    case '&&':
    case '%':
    case '^':
    case '+':
    case '<':
    case '<<':
    case '<=':
    case '==':
    case '===':
    case '>':
    case '>=':
    case '>>':
    case '>>>':
    case '|':
    case '||':
    case 'instanceof':
      return symbol as BinaryExpression['op'];
    default:
      throw new Error(`Invalid binary operator: ${operator}`);
  }
}

/**
 * Validate and narrow an assign operator string to AssignExpression['operator'].
 * @param operator - The operator string to convert.
 * @returns The validated assign operator.
 * @throws {Error} If the operator is invalid.
 */
function toAssignOperator(operator: string): AssignExpression['operator'] {
  switch (operator) {
    case '-=':
    case '*=':
    case '/=':
    case '&=':
    case '%=':
    case '^=':
    case '+=':
    case '<<=':
    case '=':
    case '>>=':
    case '>>>=':
    case '|=':
      return operator;
    default:
      throw new Error(`Invalid assign operator: ${operator}`);
  }
}

/**
 * Validate and narrow a unary operator string to UnaryExpression['operator'].
 * Accepts symbol or canonical op enum.
 * @param operator - The operator string (symbol or canonical).
 * @returns The validated unary operator.
 * @throws {Error} If the operator is invalid.
 */
function toUnaryOperator(operator: string): UnaryExpression['op'] {
  const symbol = UNARY_OP_FROM_CANONICAL[operator] ?? operator;
  switch (symbol) {
    case '-':
    case '+':
    case '!':
    case '~':
    case '++':
    case '--':
      return symbol as UnaryExpression['op'];
    default:
      throw new Error(`Invalid unary operator: ${operator}`);
  }
}

/**
 * Gets an Identifier from JSON that may be a full Identifier node or canonical inline { string, sourceLocation }.
 * @param idJson - The JSON value (Identifier node or inline { string }).
 * @param deserializer - The deserializer instance.
 * @returns The Identifier node.
 * @throws {Error} If the value is not a valid Identifier or inline { string }.
 */
function getIdentifierFromJson(
  idJson: unknown,
  deserializer: Readonly<JsonDeserializer>
): Identifier {
  if (idJson !== null && typeof idJson === 'object' && 'string' in idJson) {
    const rec = idJson as Record<string, unknown>;
    const name = typeof rec.string === 'string' ? rec.string : '';
    const loc = deserializer.parseLocation(rec.sourceLocation);
    return NodeFactory.createIdentifier(name, loc ? { location: loc } : undefined);
  }
  if (!isJsonASTNode(idJson)) {
    throw new Error('Invalid id: expected Identifier or inline { string }');
  }
  const node = deserializer.deserializeNode(idJson);
  if (!isIdentifier(node)) {
    throw new Error('Invalid id: expected Identifier or inline { string }');
  }
  return node;
}

/**
 * Forward declaration for mutual recursion with deserializeTypeRefNode.
 * @throws {Error} If called before assignment (stub implementation).
 */
let deserializeTypeRef: (
  typeRefJson: Readonly<JsonASTNode>,
  deserializer: Readonly<JsonDeserializer>
) => TypeRef = (): TypeRef => {
  throw new Error('deserializeTypeRef not yet initialized');
};

/**
 * Deserializes a TypeRef node from JSON.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized TypeRef node.
 * @throws {Error} If the deserializer instance is not provided.
 */
function deserializeTypeRefNode(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): TypeRef {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const rawComponents = json.components;
  const componentsArray = Array.isArray(rawComponents) ? rawComponents : [];
  const components = componentsArray.map((comp: unknown): { args: TypeRef[]; id: Identifier } => {
    const record: Record<string, unknown> =
      comp !== null && typeof comp === 'object' ? { ...comp } : {};
    const idVal = record.id;
    const idDeserialized =
      idVal !== null && typeof idVal === 'object' && 'string' in idVal
        ? getIdentifierFromJson(idVal, deserializer)
        : ((): Identifier => {
            const idNode = getJsonASTNodeFromRecord(record, 'id');
            const node = deserializer.deserializeNode(idNode);
            if (!isIdentifier(node)) {
              throw new Error('Invalid TypeRef component: id is not an Identifier');
            }
            return node;
          })();
    const argsRaw = getJsonASTNodeArrayFromRecord(record, 'args');
    const args = argsRaw.map((arg: Readonly<JsonASTNode>) => deserializeTypeRef(arg, deserializer));
    return { args, id: idDeserialized };
  });

  const defaultArrayNesting = 0;

  const arrayNestingValue = json.arrayNesting;
  const arrayNesting =
    typeof arrayNestingValue === 'number' ? arrayNestingValue : defaultArrayNesting;

  return NodeFactory.createTypeRef(components, arrayNesting, locationOption);
}

deserializeTypeRef = (
  typeRefJson: Readonly<JsonASTNode>,
  deserializer: Readonly<JsonDeserializer>
): TypeRef => deserializeTypeRefNode(typeRefJson, undefined, deserializer);

// ============================================================================
// Deserialization Functions
// ============================================================================

/**
 * Deserializes a BinaryExpression.
 * Accepts internal (operator, left, right) or canonical (op, left, right).
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized BinaryExpression node.
 * @throws {Error} If the deserializer instance is not provided or JSON is invalid.
 */
function deserializeBinaryExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): BinaryExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const operatorRaw =
    typeof json.operator === 'string' ? json.operator : typeof json.op === 'string' ? json.op : '';
  const operator = toBinaryOperator(operatorRaw);

  const leftNode = getJsonASTNodeProperty(json, 'left');
  const leftDeserialized = deserializer.deserializeNode(leftNode);
  if (!isExpression(leftDeserialized)) {
    throw new Error('Invalid BinaryExpression: left is not an Expression node');
  }

  const rightNode = getJsonASTNodeProperty(json, 'right');
  const rightDeserialized = deserializer.deserializeNode(rightNode);
  if (!isExpression(rightDeserialized)) {
    throw new Error('Invalid BinaryExpression: right is not an Expression node');
  }

  return NodeFactory.createBinaryExpression(operator, {
    left: leftDeserialized,
    right: rightDeserialized,
    ...locationOption,
  });
}

/**
 * Deserializes a CallExpression.
 * Accepts internal (methodName, target, arguments) or canonical (id.string, receiver, args).
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized CallExpression node.
 * @throws {Error} If the deserializer instance is not provided or JSON is invalid.
 */
function deserializeCallExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): CallExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const methodName =
    (typeof json.methodName === 'string' ? json.methodName : undefined) ??
    (json.id != null && typeof json.id === 'object' && 'string' in json.id
      ? ((): string => {
          const s = (json.id as Record<string, unknown>).string;
          return typeof s === 'string' ? s : '';
        })()
      : undefined);
  if (methodName === undefined) {
    throw new Error('Invalid CallExpression: missing methodName or id.string');
  }

  const targetNode =
    getOptionalJsonASTNodeProperty(json, 'target') ??
    getOptionalJsonASTNodeProperty(json, 'receiver');
  let target: Expression | undefined = undefined;
  if (targetNode !== undefined) {
    const targetDeserialized = deserializer.deserializeNode(targetNode);
    if (!isExpression(targetDeserialized)) {
      throw new Error('Invalid CallExpression: target is not an Expression node');
    }
    target = targetDeserialized;
  }

  const argsJson = json.arguments ?? json.args;
  const argsArray = Array.isArray(argsJson) ? argsJson : [];
  const args: Expression[] = [];
  for (const argNode of argsArray) {
    if (!isJsonASTNode(argNode)) continue;
    const argDeserialized = deserializer.deserializeNode(argNode);
    if (!isExpression(argDeserialized)) {
      throw new Error('Invalid CallExpression: argument is not an Expression node');
    }
    args.push(argDeserialized);
  }

  const typeArgumentsArray = getOptionalJsonASTNodeProperty(json, 'typeArguments');
  const typeArguments =
    typeArgumentsArray !== undefined && Array.isArray(typeArgumentsArray)
      ? (typeArgumentsArray as JsonASTNode[]).map((type: Readonly<JsonASTNode>) =>
          deserializeTypeRef(type, deserializer)
        )
      : undefined;

  return NodeFactory.createCallExpression({
    args,
    methodName,
    options: locationOption,
    target,
    typeArguments,
  });
}

/**
 * Deserializes a FieldExpression.
 * Accepts internal (fieldName, target) or canonical (field.string, obj).
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized FieldExpression node.
 * @throws {Error} If the deserializer instance is not provided or JSON is invalid.
 */
function deserializeFieldExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): FieldExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const fieldName =
    (typeof json.fieldName === 'string' ? json.fieldName : undefined) ??
    (json.field != null && typeof json.field === 'object' && 'string' in json.field
      ? ((): string => {
          const s = (json.field as Record<string, unknown>).string;
          return typeof s === 'string' ? s : '';
        })()
      : undefined);
  if (fieldName === undefined) {
    throw new Error('Invalid FieldExpression: missing fieldName or field.string');
  }

  const targetNode =
    getOptionalJsonASTNodeProperty(json, 'target') ?? getOptionalJsonASTNodeProperty(json, 'obj');
  let target: Expression | undefined = undefined;
  if (targetNode !== undefined) {
    const targetDeserialized = deserializer.deserializeNode(targetNode);
    if (!isExpression(targetDeserialized)) {
      throw new Error('Invalid FieldExpression: target is not an Expression node');
    }
    target = targetDeserialized;
  }

  return NodeFactory.createFieldExpression(fieldName, target, locationOption);
}

/**
 * Deserializes an ArrayExpression.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized ArrayExpression node.
 * @throws {Error} If the deserializer instance is not provided or if array/index are invalid.
 */
function deserializeArrayExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): ArrayExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const arrayNode = getJsonASTNodeProperty(json, 'array');
  const arrayDeserialized = deserializer.deserializeNode(arrayNode);
  if (!isExpression(arrayDeserialized)) {
    throw new Error('Invalid ArrayExpression: array is not an Expression node');
  }

  const indexNode = getJsonASTNodeProperty(json, 'index');
  const indexDeserialized = deserializer.deserializeNode(indexNode);
  if (!isExpression(indexDeserialized)) {
    throw new Error('Invalid ArrayExpression: index is not an Expression node');
  }

  return NodeFactory.createArrayExpression(arrayDeserialized, indexDeserialized, locationOption);
}

/**
 * Deserializes an AssignExpression.
 * Accepts internal (left, right) or canonical (target, source).
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized AssignExpression node.
 * @throws {Error} If the deserializer instance is not provided or JSON is invalid.
 */
function deserializeAssignExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): AssignExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const operatorRaw = typeof json.operator === 'string' ? json.operator : '=';
  const operator = toAssignOperator(operatorRaw);

  const leftNode =
    getOptionalJsonASTNodeProperty(json, 'left') ?? getOptionalJsonASTNodeProperty(json, 'target');
  const rightNode =
    getOptionalJsonASTNodeProperty(json, 'right') ?? getOptionalJsonASTNodeProperty(json, 'source');
  if (!leftNode || !rightNode) {
    throw new Error('Invalid AssignExpression: missing left/right or target/source');
  }
  const leftDeserialized = deserializer.deserializeNode(leftNode);
  if (!isExpression(leftDeserialized)) {
    throw new Error('Invalid AssignExpression: left is not an Expression node');
  }
  const rightDeserialized = deserializer.deserializeNode(rightNode);
  if (!isExpression(rightDeserialized)) {
    throw new Error('Invalid AssignExpression: right is not an Expression node');
  }

  return NodeFactory.createAssignExpression(operator, {
    left: leftDeserialized,
    right: rightDeserialized,
    ...locationOption,
  });
}

/**
 * Deserializes a VariableExpression.
 * Accepts internal (id as Identifier node) or canonical (id as { string, sourceLocation }).
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized VariableExpression node.
 * @throws {Error} If the deserializer instance is not provided or JSON is invalid.
 */
function deserializeVariableExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): VariableExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const idJson = json.id;
  if (idJson === null || idJson === undefined) {
    throw new Error('Invalid VariableExpression: missing id');
  }
  const idDeserialized = getIdentifierFromJson(idJson, deserializer);

  return NodeFactory.createVariableExpression(idDeserialized, locationOption);
}

/**
 * Deserializes a NewExpression initializer.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized NewExpression node.
 * @throws {Error} If the deserializer instance is not provided or if initializer is required but missing.
 */
function deserializeNewExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): NewExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const initializerNode = getJsonASTNodeProperty(json, 'initializer');
  const deserialized = deserializer.deserializeNode(initializerNode);
  if (!isInitializer(deserialized)) {
    throw new Error('Invalid NewExpression: initializer is not an Initializer node');
  }

  return NodeFactory.createNewExpression(deserialized, locationOption);
}

/**
 * Deserializes a UnaryExpression.
 * Accepts internal (operator, operand) or canonical (op, value).
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized UnaryExpression node.
 * @throws {Error} If the deserializer instance is not provided or JSON is invalid.
 */
function deserializeUnaryExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): UnaryExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const operatorRaw =
    typeof json.operator === 'string' ? json.operator : typeof json.op === 'string' ? json.op : '';
  const operator = toUnaryOperator(operatorRaw);
  const operandNode =
    getOptionalJsonASTNodeProperty(json, 'operand') ??
    getOptionalJsonASTNodeProperty(json, 'value');
  if (!operandNode) {
    throw new Error('Invalid UnaryExpression: missing operand or value');
  }
  const operandDeserialized = deserializer.deserializeNode(operandNode);
  if (!isExpression(operandDeserialized)) {
    throw new Error('Invalid UnaryExpression: operand is not an Expression node');
  }
  const prefix = json.prefix !== false;
  return NodeFactory.createUnaryExpression(operator, {
    operand: operandDeserialized,
    prefix,
    ...locationOption,
  });
}

/**
 * Deserializes a CastExpression.
 * Accepts internal (expression) or canonical (value).
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized CastExpression node.
 * @throws {Error} If the deserializer instance is not provided or JSON is invalid.
 */
function deserializeCastExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): CastExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const typeNode = getJsonASTNodeProperty(json, 'type');
  const type = deserializeTypeRef(typeNode, deserializer);
  const expressionNode =
    getOptionalJsonASTNodeProperty(json, 'expression') ??
    getOptionalJsonASTNodeProperty(json, 'value');
  if (!expressionNode) {
    throw new Error('Invalid CastExpression: missing expression or value');
  }
  const expressionDeserialized = deserializer.deserializeNode(expressionNode);
  if (!isExpression(expressionDeserialized)) {
    throw new Error('Invalid CastExpression: expression is not an Expression node');
  }
  return NodeFactory.createCastExpression(type, expressionDeserialized, locationOption);
}

/**
 * Deserializes a TernaryExpression.
 * Accepts internal (thenExpression, elseExpression) or canonical (thenValue, elseValue).
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized TernaryExpression node.
 * @throws {Error} If the deserializer instance is not provided or JSON is invalid.
 */
function deserializeTernaryExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): TernaryExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const conditionNode = getJsonASTNodeProperty(json, 'condition');
  const conditionDeserialized = deserializer.deserializeNode(conditionNode);
  if (!isExpression(conditionDeserialized)) {
    throw new Error('Invalid TernaryExpression: condition is not an Expression node');
  }
  const thenNode =
    getOptionalJsonASTNodeProperty(json, 'thenExpression') ??
    getOptionalJsonASTNodeProperty(json, 'thenValue');
  const elseNode =
    getOptionalJsonASTNodeProperty(json, 'elseExpression') ??
    getOptionalJsonASTNodeProperty(json, 'elseValue');
  if (!thenNode || !elseNode) {
    throw new Error('Invalid TernaryExpression: missing then/else expression or value');
  }
  const thenDeserialized = deserializer.deserializeNode(thenNode);
  const elseDeserialized = deserializer.deserializeNode(elseNode);
  if (!isExpression(thenDeserialized) || !isExpression(elseDeserialized)) {
    throw new Error('Invalid TernaryExpression: then/else are not Expression nodes');
  }
  return NodeFactory.createTernaryExpression({
    condition: conditionDeserialized,
    elseExpression: elseDeserialized,
    thenExpression: thenDeserialized,
    ...locationOption,
  });
}

/**
 * Deserializes a SoqlOrSoslBinding.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized SoqlOrSoslBinding node.
 * @throws {Error} If the deserializer instance is not provided or JSON is invalid.
 */
function deserializeSoqlOrSoslBinding(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): SoqlOrSoslBinding {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const exprNode = getJsonASTNodeProperty(json, 'expr');
  const exprDeserialized = deserializer.deserializeNode(exprNode);
  if (!isExpression(exprDeserialized)) {
    throw new Error('Invalid SoqlOrSoslBinding: expr is not an Expression node');
  }
  return NodeFactory.createSoqlOrSoslBinding(exprDeserialized, locationOption);
}

/**
 * Deserializes a SoqlExpression.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized SoqlExpression node.
 * @throws {Error} If the deserializer instance is not provided or JSON is invalid.
 */
function deserializeSoqlExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): SoqlExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const query = getStringProperty(json as JsonASTNode, 'query');
  const bindingsRaw = json.bindings;
  const bindingsArray = Array.isArray(bindingsRaw) ? bindingsRaw : [];
  const bindings: SoqlOrSoslBinding[] = bindingsArray.map((item: unknown) => {
    if (!isJsonASTNode(item)) {
      throw new Error('Invalid SoqlExpression: bindings must be JsonASTNode');
    }
    const node = deserializer.deserializeNode(item);
    if (!isSoqlOrSoslBinding(node)) {
      throw new Error('Invalid SoqlExpression: bindings must be SoqlOrSoslBinding nodes');
    }
    return node;
  });
  return NodeFactory.createSoqlExpression(query, bindings, locationOption);
}

/**
 * Deserializes a SoslExpression.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized SoslExpression node.
 * @throws {Error} If the deserializer instance is not provided or JSON is invalid.
 */
function deserializeSoslExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): SoslExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const query = getStringProperty(json as JsonASTNode, 'query');
  const bindingsRaw = json.bindings;
  const bindingsArray = Array.isArray(bindingsRaw) ? bindingsRaw : [];
  const bindings: SoqlOrSoslBinding[] = bindingsArray.map((item: unknown) => {
    if (!isJsonASTNode(item)) {
      throw new Error('Invalid SoslExpression: bindings must be JsonASTNode');
    }
    const node = deserializer.deserializeNode(item);
    if (!isSoqlOrSoslBinding(node)) {
      throw new Error('Invalid SoslExpression: bindings must be SoqlOrSoslBinding nodes');
    }
    return node;
  });
  return NodeFactory.createSoslExpression(query, bindings, locationOption);
}

export {
  deserializeBinaryExpression,
  deserializeCallExpression,
  deserializeFieldExpression,
  deserializeArrayExpression,
  deserializeAssignExpression,
  deserializeVariableExpression,
  deserializeNewExpression,
  deserializeUnaryExpression,
  deserializeCastExpression,
  deserializeTernaryExpression,
  deserializeSoqlOrSoslBinding,
  deserializeSoqlExpression,
  deserializeSoslExpression,
  deserializeTypeRefNode,
};
