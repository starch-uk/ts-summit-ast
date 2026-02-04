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
  Expression,
} from '../ast/expression.js';
import type { TypeRef } from '../ast/baseNode.js';
import { NodeFactory } from '../translator/nodeFactory.js';
import { isExpression, isIdentifier, isInitializer } from '../guard/index.js';
import type { JsonASTNode } from './jsonSerializer.js';
import type { JsonDeserializer } from './jsonDeserializer.js';
import {
  getJsonASTNodeArrayFromRecord,
  getJsonASTNodeFromRecord,
  getJsonASTNodeProperty,
  getOptionalJsonASTNodeProperty,
  getJsonASTNodeArrayProperty,
  getStringProperty,
} from './astDeserializer.js';

// ============================================================================
// Helper: operator validation (used before main deserializers)
// ============================================================================

/**
 * Validate and narrow a binary operator string to BinaryExpression['operator'].
 * @param operator - The operator string to convert.
 * @returns The validated binary operator.
 * @throws {Error} If the operator is invalid.
 */
function toBinaryOperator(operator: string): BinaryExpression['operator'] {
  switch (operator) {
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
      return operator;
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
  const components = componentsArray.map((comp: unknown) => {
    const record: Record<string, unknown> =
      comp !== null && typeof comp === 'object' ? { ...comp } : {};
    const idNode = getJsonASTNodeFromRecord(record, 'id');
    const argsRaw = getJsonASTNodeArrayFromRecord(record, 'args');
    const idDeserialized = deserializer.deserializeNode(idNode);
    if (!isIdentifier(idDeserialized)) {
      throw new Error('Invalid TypeRef component: id is not an Identifier');
    }
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
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized BinaryExpression node.
 * @throws {Error} If the deserializer instance is not provided or if left/right operands are invalid.
 */
function deserializeBinaryExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): BinaryExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const operatorRaw = getStringProperty(json, 'operator');
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
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized CallExpression node.
 * @throws {Error} If the deserializer instance is not provided or if target/arguments are invalid.
 */
function deserializeCallExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): CallExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const methodName = getStringProperty(json, 'methodName');

  const targetNode = getOptionalJsonASTNodeProperty(json, 'target');
  let target: Expression | undefined = undefined;
  if (targetNode !== undefined) {
    const targetDeserialized = deserializer.deserializeNode(targetNode);
    if (!isExpression(targetDeserialized)) {
      throw new Error('Invalid CallExpression: target is not an Expression node');
    }
    target = targetDeserialized;
  }

  const argsArray = getJsonASTNodeArrayProperty(json, 'arguments');
  const args: Expression[] = [];
  for (const argNode of argsArray) {
    const argDeserialized = deserializer.deserializeNode(argNode);
    if (!isExpression(argDeserialized)) {
      throw new Error('Invalid CallExpression: argument is not an Expression node');
    }
    args.push(argDeserialized);
  }

  const typeArgumentsArray = getOptionalJsonASTNodeProperty(json, 'typeArguments');
  const typeArguments =
    typeArgumentsArray !== undefined && Array.isArray(typeArgumentsArray)
      ? typeArgumentsArray.map((type: Readonly<JsonASTNode>) =>
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
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized FieldExpression node.
 * @throws {Error} If the deserializer instance is not provided or if target is invalid.
 */
function deserializeFieldExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): FieldExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const fieldName = getStringProperty(json, 'fieldName');

  const targetNode = getOptionalJsonASTNodeProperty(json, 'target');
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
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized AssignExpression node.
 * @throws {Error} If the deserializer instance is not provided or if left/right operands are invalid.
 */
function deserializeAssignExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): AssignExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const operatorRaw = getStringProperty(json, 'operator');
  const operator = toAssignOperator(operatorRaw);

  const leftNode = getJsonASTNodeProperty(json, 'left');
  const leftDeserialized = deserializer.deserializeNode(leftNode);
  if (!isExpression(leftDeserialized)) {
    throw new Error('Invalid AssignExpression: left is not an Expression node');
  }

  const rightNode = getJsonASTNodeProperty(json, 'right');
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
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized VariableExpression node.
 * @throws {Error} If the deserializer instance is not provided or if id is not an Identifier node.
 */
function deserializeVariableExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): VariableExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const idNode = getJsonASTNodeProperty(json, 'id');
  const idDeserialized = deserializer.deserializeNode(idNode);
  if (!isIdentifier(idDeserialized)) {
    throw new Error('Invalid VariableExpression: id is not an Identifier node');
  }

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

export {
  deserializeBinaryExpression,
  deserializeCallExpression,
  deserializeFieldExpression,
  deserializeArrayExpression,
  deserializeAssignExpression,
  deserializeVariableExpression,
  deserializeNewExpression,
  deserializeTypeRefNode,
};
