/**
 * @file AST node deserialization dispatcher and statement deserialization.
 * Dispatches JSON deserialization to specialized decoders and contains statement deserialization logic.
 */

import type { ASTNode, SourceRange } from '../ast/baseNode.js';
import { toCanonicalSourceLocation } from '../ast/baseNode.js';
import type {
  IfStatement,
  ForLoopStatement,
  WhileLoopStatement,
  ReturnStatement,
  CompoundStatement,
  ExpressionStatement,
  VariableDeclarationStatement,
  DmlStatement,
  EnhancedForLoopStatement,
  DoWhileLoopStatement,
  Statement,
} from '../ast/statement.js';
import type { Expression, VariableExpression } from '../ast/expression.js';
import { NodeFactory } from '../translator/nodeFactory.js';
import {
  isExpression,
  isExpressionStatement,
  isIdentifier,
  isStatement,
  isVariableDeclaration,
  isVariableDeclarationStatement,
} from '../guard/index.js';
import type { JsonASTNode } from './jsonSerializer.js';
import type { JsonDeserializer } from './jsonDeserializer.js';
import {
  deserializeBinaryExpression,
  deserializeCallExpression,
  deserializeFieldExpression,
  deserializeArrayExpression,
  deserializeAssignExpression,
  deserializeNewExpression,
  deserializeVariableExpression,
  deserializeUnaryExpression,
  deserializeCastExpression,
  deserializeTernaryExpression,
  deserializeSoqlOrSoslBinding,
  deserializeSoqlExpression,
  deserializeSoslExpression,
  deserializeTypeRefNode,
} from './expressionDeserializer.js';
import {
  deserializeStringVal,
  deserializeIntegerVal,
  deserializeDoubleVal,
  deserializeLongVal,
  deserializeDecimalVal,
  deserializeBooleanVal,
  deserializeConstructorInitializer,
  deserializeValuesInitializer,
  deserializeSizedArrayInitializer,
  deserializeMapInitializer,
  deserializeExpressionElementValue,
  deserializeAnnotationElementValue,
  deserializeArrayElementValue,
  deserializeAnnotationArgument,
  deserializeVariableDeclaration,
  deserializeModifier,
  deserializeIdentifier,
  deserializeParameter,
  deserializeAnnotation,
  deserializeAnnotationModifier,
  deserializeClassDeclaration,
  deserializeEnumDeclaration,
  deserializeEnumValue,
  deserializeInterfaceDeclaration,
  deserializeTriggerDeclaration,
  deserializeMethodDeclaration,
  deserializePropertyDeclaration,
} from './declarationDeserializer.js';

// ============================================================================
// Deserialization Utilities
// ============================================================================

/**
 * Type guard for plain object records.
 * @param x - Value to check.
 * @returns True if x is a non-null object.
 */
function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object';
}

/**
 * Type guard to check if a value is a JsonASTNode.
 * Summit-AST canonical JSON may omit `@type` for TypeRef (object with components, arrayNesting).
 * @param value - The value to check.
 * @returns True if the value is a JsonASTNode.
 */
function isJsonASTNode(value: unknown): value is JsonASTNode {
  if (!isRecord(value)) return false;
  if ('@type' in value && typeof value['@type'] === 'string') return true;
  if ('kind' in value && typeof value.kind === 'string') return true;
  if (
    'components' in value &&
    Array.isArray(value.components) &&
    typeof value.arrayNesting === 'number'
  )
    return true;
  return false;
}

/**
 * Type guard to check if a value is an array of JsonASTNodes.
 * @param value - The value to check.
 * @returns True if the value is an array of JsonASTNodes.
 */
function isJsonASTNodeArray(value: unknown): value is JsonASTNode[] {
  return Array.isArray(value) && value.every((item) => isJsonASTNode(item));
}

/**
 * Safely gets a JsonASTNode property from a JsonASTNode.
 * @param json - The JSON node.
 * @param property - The property name.
 * @returns The property value as JsonASTNode, or throws if invalid.
 * @throws {Error} If the property is not a valid JsonASTNode.
 */
function getJsonASTNodeProperty(json: Readonly<JsonASTNode>, property: string): JsonASTNode {
  const value = json[property];
  if (!isJsonASTNode(value)) {
    throw new Error(`Invalid JSON AST node: property ${property} is not a valid JsonASTNode`);
  }
  return value;
}

/**
 * Safely gets an optional JsonASTNode property from a JsonASTNode.
 * @param json - The JSON node.
 * @param property - The property name.
 * @returns The property value as JsonASTNode, or undefined if not present/invalid.
 */
function getOptionalJsonASTNodeProperty(
  json: Readonly<JsonASTNode>,
  property: string
): JsonASTNode | undefined {
  const value = json[property];
  if (value === null || value === undefined) {
    return undefined;
  }
  if (!isJsonASTNode(value)) {
    return undefined;
  }
  return value;
}

/**
 * Safely gets a JsonASTNode array property from a JsonASTNode.
 * @param json - The JSON node.
 * @param property - The property name.
 * @returns The property value as JsonASTNode[], or throws if invalid.
 * @throws {Error} If the property is not a valid JsonASTNode array.
 */
function getJsonASTNodeArrayProperty(json: Readonly<JsonASTNode>, property: string): JsonASTNode[] {
  const value = json[property];
  if (!isJsonASTNodeArray(value)) {
    throw new Error(`Invalid JSON AST node: property ${property} is not a valid JsonASTNode array`);
  }
  return value;
}

/**
 * Gets a JsonASTNode from a record (e.g. TypeRef component object) by key.
 * @param record - Record with JSON structure.
 * @param key - Property name.
 * @returns The JsonASTNode value.
 * @throws {Error} If the property is not a valid JsonASTNode.
 */
function getJsonASTNodeFromRecord(
  record: Readonly<Record<string, unknown>>,
  key: string
): JsonASTNode {
  const value = record[key];
  if (!isJsonASTNode(value)) {
    throw new Error(`Invalid JSON: property ${key} is not a valid JsonASTNode`);
  }
  return value;
}

/**
 * Gets a JsonASTNode array from a record by key.
 * @param record - Record with JSON structure.
 * @param key - Property name.
 * @returns The JsonASTNode array, or empty array if missing/invalid.
 */
function getJsonASTNodeArrayFromRecord(
  record: Readonly<Record<string, unknown>>,
  key: string
): JsonASTNode[] {
  const value = record[key];
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is JsonASTNode => isJsonASTNode(item));
}

/**
 * Safely gets a string property from a JsonASTNode.
 * @param json - The JSON node.
 * @param property - The property name.
 * @returns The property value as string, or throws if invalid.
 * @throws {Error} If the property is not a valid string.
 */
function getStringProperty(json: Readonly<JsonASTNode>, property: string): string {
  const value = json[property];
  if (typeof value !== 'string') {
    throw new Error(`Invalid JSON AST node: property ${property} is not a string`);
  }
  return value;
}

/**
 * Gets an optional string property from a JsonASTNode (or canonical inline object with 'string').
 * @param json - The JSON node or record.
 * @param property - The property name (e.g. 'name', 'string').
 * @returns The property value as string, or undefined if missing/invalid.
 */
function getOptionalStringProperty(
  json: Readonly<Record<string, unknown>>,
  property: string
): string | undefined {
  const value = json[property];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Gets the identifier name from JSON that may be a full Identifier node or canonical inline { string }.
 * @param idJson - The JSON value (Identifier node or inline { string }).
 * @param deserializer - The deserializer instance.
 * @returns The identifier string.
 * @throws {Error} If the value is not a valid Identifier or inline { string }.
 */
function getIdentifierNameFromIdJson(
  idJson: unknown,
  deserializer: Readonly<JsonDeserializer>
): string {
  if (isRecord(idJson) && 'string' in idJson) {
    const s = idJson.string;
    return typeof s === 'string' ? s : '';
  }
  if (!isJsonASTNode(idJson)) {
    throw new Error('Invalid id: expected Identifier or inline { string }');
  }
  const node = deserializer.deserializeNode(idJson);
  if (!isIdentifier(node)) {
    throw new Error('Invalid id: expected Identifier or inline { string }');
  }
  return node.string;
}

/**
 * Safely gets a number property from a JsonASTNode.
 * @param json - The JSON node.
 * @param property - The property name.
 * @returns The property value as number, or throws if invalid.
 * @throws {Error} If the property is not a valid number.
 */
function getNumberProperty(json: Readonly<JsonASTNode>, property: string): number {
  const value = json[property];
  if (typeof value !== 'number') {
    throw new Error(`Invalid JSON AST node: property ${property} is not a number`);
  }
  return value;
}

// ============================================================================
// Statement Deserialization
// ============================================================================

/**
 * Deserializes an IfStatement.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized IfStatement node.
 * @throws {Error} If the deserializer instance is not provided.
 */
function deserializeIfStatement(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): IfStatement {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const conditionNode = getJsonASTNodeProperty(json, 'condition');
  const conditionDeserialized = deserializer.deserializeNode(conditionNode);
  if (!isExpression(conditionDeserialized)) {
    throw new Error('Invalid IfStatement: condition is not an Expression node');
  }

  const thenStatementNode =
    getOptionalJsonASTNodeProperty(json, 'thenStatement') ??
    getOptionalJsonASTNodeProperty(json, 'thenBody');
  if (!thenStatementNode) {
    throw new Error('Invalid IfStatement: missing thenStatement or thenBody');
  }
  const thenStatementDeserialized = deserializer.deserializeNode(thenStatementNode);
  if (!isStatement(thenStatementDeserialized)) {
    throw new Error('Invalid IfStatement: thenStatement is not a Statement node');
  }

  const elseValue =
    getOptionalJsonASTNodeProperty(json, 'elseStatement') ??
    getOptionalJsonASTNodeProperty(json, 'elseBody');
  const elseStatement =
    elseValue !== undefined
      ? ((): Statement => {
          const elseDeserialized = deserializer.deserializeNode(elseValue);
          if (!isStatement(elseDeserialized)) {
            throw new Error('Invalid IfStatement: elseStatement is not a Statement node');
          }
          return elseDeserialized;
        })()
      : undefined;

  return NodeFactory.createIfStatement({
    condition: conditionDeserialized,
    elseStatement,
    options: locationOption,
    thenStatement: thenStatementDeserialized,
  });
}

/**
 * Deserializes a ForLoopStatement.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized ForLoopStatement node.
 * @throws {Error} If the deserializer instance is not provided.
 */
function deserializeForLoopStatement(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): ForLoopStatement {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const initNode = getOptionalJsonASTNodeProperty(json, 'init');
  let init: ExpressionStatement | VariableDeclarationStatement | undefined = undefined;
  if (initNode !== undefined) {
    const initDeserialized = deserializer.deserializeNode(initNode);
    if (isExpressionStatement(initDeserialized)) {
      init = initDeserialized;
    } else if (isVariableDeclarationStatement(initDeserialized)) {
      init = initDeserialized;
    }
  }

  const conditionNode = getOptionalJsonASTNodeProperty(json, 'condition');
  let condition: Expression | undefined = undefined;
  if (conditionNode !== undefined) {
    const conditionDeserialized = deserializer.deserializeNode(conditionNode);
    // Convert Identifier to VariableExpression if needed (Identifier is not an Expression)
    if (conditionDeserialized['@type'] === 'Identifier' && isIdentifier(conditionDeserialized)) {
      condition = NodeFactory.createVariableExpression(conditionDeserialized, locationOption);
    } else if (isExpression(conditionDeserialized)) {
      condition = conditionDeserialized;
    } else {
      throw new Error('Invalid ForLoopStatement: condition is not an Expression node');
    }
  }

  const updateNode = getOptionalJsonASTNodeProperty(json, 'update');
  let update: Expression | undefined = undefined;
  if (updateNode !== undefined) {
    const updateDeserialized = deserializer.deserializeNode(updateNode);
    // Convert Identifier to VariableExpression if needed (Identifier is not an Expression)
    if (updateDeserialized['@type'] === 'Identifier' && isIdentifier(updateDeserialized)) {
      update = NodeFactory.createVariableExpression(updateDeserialized, locationOption);
    } else if (isExpression(updateDeserialized)) {
      update = updateDeserialized;
    } else {
      throw new Error('Invalid ForLoopStatement: update is not an Expression node');
    }
  }

  const bodyNode = getJsonASTNodeProperty(json, 'body');
  const bodyDeserialized = deserializer.deserializeNode(bodyNode);
  if (!isStatement(bodyDeserialized)) {
    throw new Error('Invalid ForLoopStatement: body is not a Statement node');
  }

  return NodeFactory.createForLoopStatement({
    body: bodyDeserialized,
    condition,
    init,
    options: locationOption,
    update,
  });
}

/**
 * Deserializes a WhileLoopStatement.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized WhileLoopStatement node.
 * @throws {Error} If the deserializer instance is not provided.
 */
function deserializeWhileLoopStatement(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): WhileLoopStatement {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const conditionNode = getJsonASTNodeProperty(json, 'condition');
  const conditionDeserialized = deserializer.deserializeNode(conditionNode);
  if (!isExpression(conditionDeserialized)) {
    throw new Error('Invalid WhileLoopStatement: condition is not an Expression node');
  }

  const bodyNode = getJsonASTNodeProperty(json, 'body');
  const bodyDeserialized = deserializer.deserializeNode(bodyNode);
  if (!isStatement(bodyDeserialized)) {
    throw new Error('Invalid WhileLoopStatement: body is not a Statement node');
  }

  return NodeFactory.createWhileLoopStatement(
    conditionDeserialized,
    bodyDeserialized,
    locationOption
  );
}

/**
 * Deserializes a DoWhileLoopStatement.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized DoWhileLoopStatement node.
 * @throws {Error} If the deserializer instance is not provided or JSON is invalid.
 */
function deserializeDoWhileLoopStatement(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): DoWhileLoopStatement {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const bodyNode = getJsonASTNodeProperty(json, 'body');
  const bodyDeserialized = deserializer.deserializeNode(bodyNode);
  if (!isStatement(bodyDeserialized)) {
    throw new Error('Invalid DoWhileLoopStatement: body is not a Statement node');
  }
  const conditionNode = getJsonASTNodeProperty(json, 'condition');
  const conditionDeserialized = deserializer.deserializeNode(conditionNode);
  if (!isExpression(conditionDeserialized)) {
    throw new Error('Invalid DoWhileLoopStatement: condition is not an Expression node');
  }
  return NodeFactory.createDoWhileLoopStatement(
    bodyDeserialized,
    conditionDeserialized,
    locationOption
  );
}

/**
 * Deserializes an EnhancedForLoopStatement.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized EnhancedForLoopStatement node.
 * @throws {Error} If the deserializer instance is not provided or JSON is invalid.
 */
function deserializeEnhancedForLoopStatement(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): EnhancedForLoopStatement {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const variableNode = getJsonASTNodeProperty(json, 'variable');
  const variableDeserialized = deserializer.deserializeNode(variableNode);
  if (!isVariableDeclaration(variableDeserialized)) {
    throw new Error('Invalid EnhancedForLoopStatement: variable is not a VariableDeclaration node');
  }
  const iterableNode = getJsonASTNodeProperty(json, 'iterable');
  const iterableDeserialized = deserializer.deserializeNode(iterableNode);
  if (!isExpression(iterableDeserialized)) {
    throw new Error('Invalid EnhancedForLoopStatement: iterable is not an Expression node');
  }
  const bodyNode = getJsonASTNodeProperty(json, 'body');
  const bodyDeserialized = deserializer.deserializeNode(bodyNode);
  if (!isStatement(bodyDeserialized)) {
    throw new Error('Invalid EnhancedForLoopStatement: body is not a Statement node');
  }
  return NodeFactory.createEnhancedForLoopStatement({
    body: bodyDeserialized,
    iterable: iterableDeserialized,
    options: locationOption,
    variable: variableDeserialized,
  });
}

/**
 * Deserializes a ReturnStatement.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized ReturnStatement node.
 * @throws {Error} If the deserializer instance is not provided.
 */
function deserializeReturnStatement(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): ReturnStatement {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  // Canonical format uses 'value'; internal uses 'expression'
  const expressionNode =
    getOptionalJsonASTNodeProperty(json, 'expression') ??
    getOptionalJsonASTNodeProperty(json, 'value');
  let expression: Expression | undefined = undefined;
  if (expressionNode !== undefined) {
    const expressionDeserialized = deserializer.deserializeNode(expressionNode);
    if (!isExpression(expressionDeserialized)) {
      throw new Error('Invalid ReturnStatement: expression is not an Expression node');
    }
    expression = expressionDeserialized;
  }

  return NodeFactory.createReturnStatement(expression, locationOption);
}

/**
 * Deserializes a CompoundStatement.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized CompoundStatement node.
 * @throws {Error} If the deserializer instance is not provided.
 */
function deserializeCompoundStatement(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): CompoundStatement {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const statementsArray = getJsonASTNodeArrayProperty(json, 'statements');

  const statements: Statement[] = [];
  for (const stmtNode of statementsArray) {
    const stmtDeserialized = deserializer.deserializeNode(stmtNode);
    if (!isStatement(stmtDeserialized)) {
      throw new Error('Invalid CompoundStatement: statement is not a Statement node');
    }
    statements.push(stmtDeserialized);
  }

  return NodeFactory.createCompoundStatement(statements, locationOption);
}

/**
 * Deserializes an ExpressionStatement.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized ExpressionStatement node.
 * @throws {Error} If the deserializer instance is not provided.
 */
function deserializeExpressionStatement(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): ExpressionStatement {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const raw = json.expression;
  if (raw == null) {
    throw new Error('Invalid ExpressionStatement: missing expression');
  }
  // Canonical format may have expression as inline Identifier { string, sourceLocation }
  const isInlineId = isRecord(raw) && 'string' in raw && !('@type' in raw) && !('kind' in raw);
  const expression: Expression = isInlineId
    ? ((): VariableExpression => {
        const rec = raw;
        const name = typeof rec.string === 'string' ? rec.string : '';
        const loc = deserializer.parseLocation(rec.sourceLocation);
        const id = NodeFactory.createIdentifier(name, loc != null ? { location: loc } : undefined);
        return NodeFactory.createVariableExpression(id, locationOption);
      })()
    : ((): Expression => {
        if (!isJsonASTNode(raw)) {
          throw new Error('Invalid ExpressionStatement: expression is not a valid JsonASTNode');
        }
        const node = deserializer.deserializeNode(raw);
        if (node['@type'] === 'Identifier' && isIdentifier(node)) {
          return NodeFactory.createVariableExpression(node, locationOption);
        }
        if (isExpression(node)) return node;
        throw new Error('Invalid ExpressionStatement: expression is not an Expression node');
      })();
  return NodeFactory.createExpressionStatement(expression, locationOption);
}

/**
 * Deserializes a VariableDeclarationStatement.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized VariableDeclarationStatement node.
 * @throws {Error} If the deserializer instance is not provided.
 */
function deserializeVariableDeclarationStatement(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): VariableDeclarationStatement {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  // Canonical format uses 'group' (type, declarations[], modifiers); internal uses 'declaration'
  const declarationNode = getOptionalJsonASTNodeProperty(json, 'declaration');
  if (declarationNode !== undefined) {
    const deserialized = deserializer.deserializeNode(declarationNode);
    if (!isVariableDeclaration(deserialized)) {
      throw new Error(
        'Invalid VariableDeclarationStatement: declaration is not a VariableDeclaration node'
      );
    }
    return NodeFactory.createVariableDeclarationStatement(deserialized, locationOption);
  }
  const EMPTY_LENGTH = 0;
  const group = isRecord(json.group) ? json.group : undefined;
  if (
    group == null ||
    !Array.isArray(group.declarations) ||
    group.declarations.length === EMPTY_LENGTH
  ) {
    throw new Error(
      'Invalid VariableDeclarationStatement: missing declaration or group.declarations'
    );
  }
  const FIRST_DECLARATION_INDEX = 0;
  const rawFirst: unknown = group.declarations[FIRST_DECLARATION_INDEX];
  const first = isRecord(rawFirst) ? rawFirst : undefined;
  if (first == null) {
    throw new Error('Invalid VariableDeclarationStatement: first declaration is not an object');
  }
  const name = getIdentifierNameFromIdJson(first.id, deserializer);
  const groupType = group.type;
  const typeNode =
    groupType != null &&
    typeof groupType === 'object' &&
    !Array.isArray(groupType) &&
    !Object.prototype.hasOwnProperty.call(groupType, '@type')
      ? { ...groupType, '@type': 'TypeRef' }
      : groupType;
  const synthetic: JsonASTNode = {
    '@type': 'VariableDeclaration',
    initializer: first.initializer,
    modifiers: group.modifiers ?? [],
    name,
    type: typeNode,
  } as JsonASTNode;
  const decl = deserializeVariableDeclaration(synthetic, locationOption, deserializer);
  return NodeFactory.createVariableDeclarationStatement(decl, locationOption);
}

/**
 * Deserializes a CompilationUnit (canonical format has typeDeclaration; internal has declarations array).
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized CompilationUnit node.
 * @throws {Error} If the deserializer instance is not provided or JSON is invalid.
 */
function deserializeCompilationUnit(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): ASTNode {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const NON_EMPTY_LENGTH = 1;
  const FIRST_INDEX = 0;
  const typeDeclarationNode =
    getOptionalJsonASTNodeProperty(json, 'typeDeclaration') ??
    (Array.isArray(json.declarations) && json.declarations.length >= NON_EMPTY_LENGTH
      ? isJsonASTNode(json.declarations[FIRST_INDEX])
        ? json.declarations[FIRST_INDEX]
        : undefined
      : undefined);
  if (!typeDeclarationNode) {
    throw new Error('Invalid CompilationUnit: missing typeDeclaration or declarations');
  }
  const decl = deserializer.deserializeNode(typeDeclarationNode);
  return {
    '@type': 'CompilationUnit',
    typeDeclaration: decl,
    ...(locationOption?.location && {
      sourceLocation: toCanonicalSourceLocation(locationOption.location),
    }),
  } as ASTNode;
}

/**
 * Deserializes a DmlStatement. Canonical format uses `@type` Insert/Update/Delete/Upsert and 'value' for target.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized DmlStatement node.
 * @throws {Error} If the deserializer instance is not provided or JSON is invalid.
 */
function deserializeDmlStatement(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): DmlStatement {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const operationRaw: string | undefined =
    typeof json.operation === 'string'
      ? json.operation
      : typeof json['@type'] === 'string'
        ? json['@type'].toLowerCase()
        : undefined;
  const operation =
    operationRaw === 'insert' ||
    operationRaw === 'update' ||
    operationRaw === 'delete' ||
    operationRaw === 'upsert' ||
    operationRaw === 'merge' ||
    operationRaw === 'undelete'
      ? operationRaw
      : 'insert';
  const targetNode =
    getOptionalJsonASTNodeProperty(json, 'target') ?? getOptionalJsonASTNodeProperty(json, 'value');
  if (!targetNode) {
    throw new Error('Invalid DmlStatement: missing target or value');
  }
  const targetDeserialized = deserializer.deserializeNode(targetNode);
  if (!isExpression(targetDeserialized)) {
    throw new Error('Invalid DmlStatement: target is not an Expression node');
  }
  return NodeFactory.createDmlStatement(operation, targetDeserialized, locationOption);
}

// ============================================================================
// Dispatcher
// ============================================================================

/**
 * Deserialize node based on its kind.
 * @param json - The JSON object to deserialize.
 * @param options - Options including nodeType, location, and deserializer.
 * @returns The deserialized AST node.
 * @throws {Error} If the node type is unknown or not yet implemented.
 */
function deserializeNodeByKind(
  json: Readonly<JsonASTNode>,
  options: Readonly<{
    deserializer: Readonly<JsonDeserializer>;
    location?: SourceRange;
    nodeType: string;
  }>
): ASTNode {
  const { nodeType, location, deserializer } = options;
  const locationOption = location ? { location } : undefined;

  switch (nodeType) {
    // Root
    case 'CompilationUnit':
      return deserializeCompilationUnit(json, locationOption, deserializer);

    // Statement nodes
    case 'IfStatement':
      return deserializeIfStatement(json, locationOption, deserializer);
    case 'ForLoopStatement':
      return deserializeForLoopStatement(json, locationOption, deserializer);
    case 'WhileLoopStatement':
      return deserializeWhileLoopStatement(json, locationOption, deserializer);
    case 'ReturnStatement':
      return deserializeReturnStatement(json, locationOption, deserializer);
    case 'CompoundStatement':
      return deserializeCompoundStatement(json, locationOption, deserializer);
    case 'ExpressionStatement':
      return deserializeExpressionStatement(json, locationOption, deserializer);
    case 'VariableDeclarationStatement':
      return deserializeVariableDeclarationStatement(json, locationOption, deserializer);
    case 'UntranslatedStatement':
      return NodeFactory.createUntranslatedStatement(locationOption);
    case 'DmlStatement':
      return deserializeDmlStatement(json, locationOption, deserializer);
    case 'Insert':
    case 'Update':
    case 'Delete':
    case 'Upsert':
      return deserializeDmlStatement(
        { ...json, '@type': nodeType, operation: nodeType.toLowerCase() } as JsonASTNode,
        locationOption,
        deserializer
      );
    case 'DoWhileLoopStatement':
      return deserializeDoWhileLoopStatement(json, locationOption, deserializer);
    case 'EnhancedForLoopStatement':
      return deserializeEnhancedForLoopStatement(json, locationOption, deserializer);

    // Expression nodes
    case 'BinaryExpression':
      return deserializeBinaryExpression(json, locationOption, deserializer);
    case 'CallExpression':
      return deserializeCallExpression(json, locationOption, deserializer);
    case 'FieldExpression':
      return deserializeFieldExpression(json, locationOption, deserializer);
    case 'ArrayExpression':
      return deserializeArrayExpression(json, locationOption, deserializer);
    case 'AssignExpression':
      return deserializeAssignExpression(json, locationOption, deserializer);
    case 'NewExpression':
      return deserializeNewExpression(json, locationOption, deserializer);
    case 'VariableExpression':
      return deserializeVariableExpression(json, locationOption, deserializer);
    case 'UnaryExpression':
      return deserializeUnaryExpression(json, locationOption, deserializer);
    case 'CastExpression':
      return deserializeCastExpression(json, locationOption, deserializer);
    case 'TernaryExpression':
      return deserializeTernaryExpression(json, locationOption, deserializer);
    case 'SoqlExpression':
      return deserializeSoqlExpression(json, locationOption, deserializer);
    case 'SoslExpression':
      return deserializeSoslExpression(json, locationOption, deserializer);
    case 'SoqlOrSoslBinding':
      return deserializeSoqlOrSoslBinding(json, locationOption, deserializer);
    case 'UntranslatedExpression':
      return NodeFactory.createUntranslatedExpression(locationOption);

    // Literal nodes
    case 'StringVal':
      return deserializeStringVal(json, locationOption);
    case 'IntegerVal':
      return deserializeIntegerVal(json, locationOption);
    case 'DoubleVal':
      return deserializeDoubleVal(json, locationOption);
    case 'LongVal':
      return deserializeLongVal(json, locationOption);
    case 'DecimalVal':
      return deserializeDecimalVal(json, locationOption);
    case 'BooleanVal':
      return deserializeBooleanVal(json, locationOption);
    case 'NullVal':
      return NodeFactory.createNullVal(locationOption);

    // Declaration nodes
    case 'ClassDeclaration':
      return deserializeClassDeclaration(json, locationOption, deserializer);
    case 'InterfaceDeclaration':
      return deserializeInterfaceDeclaration(json, locationOption, deserializer);
    case 'TriggerDeclaration':
      return deserializeTriggerDeclaration(json, locationOption, deserializer);
    case 'EnumDeclaration':
      return deserializeEnumDeclaration(json, locationOption, deserializer);
    case 'EnumValue':
      return deserializeEnumValue(json);
    case 'MethodDeclaration':
      return deserializeMethodDeclaration(json, locationOption, deserializer);
    case 'PropertyDeclaration':
      return deserializePropertyDeclaration(json, locationOption, deserializer);
    case 'Parameter':
      return deserializeParameter(json, deserializer);
    case 'Annotation':
      return deserializeAnnotation(json, deserializer);
    case 'AnnotationArgument':
      return deserializeAnnotationArgument(json, locationOption, deserializer);
    case 'VariableDeclaration':
      return deserializeVariableDeclaration(json, locationOption, deserializer);

    // Modifier
    case 'Modifier':
      return deserializeModifier(json, locationOption);

    // Backward compatibility
    case 'ForStatement':
      return deserializeForLoopStatement(json, locationOption, deserializer);
    case 'WhileStatement':
      return deserializeWhileLoopStatement(json, locationOption, deserializer);
    case 'Block':
      return deserializeCompoundStatement(json, locationOption, deserializer);
    case 'MethodCallExpression':
      return deserializeCallExpression(json, locationOption, deserializer);
    case 'StringLiteral':
      return deserializeStringVal(json, locationOption);
    case 'NumberLiteral':
      return deserializeIntegerVal(json, locationOption);
    case 'BooleanLiteral':
      return deserializeBooleanVal(json, locationOption);
    case 'NullLiteral':
      return NodeFactory.createNullVal(locationOption);

    // Helper nodes
    case 'Identifier':
      return deserializeIdentifier(json, locationOption);

    // TypeRef (AST node in summit-ast)
    case 'TypeRef':
      return deserializeTypeRefNode(json, locationOption, deserializer);

    // Initializer nodes
    case 'ConstructorInitializer':
      return deserializeConstructorInitializer(json, locationOption, deserializer);
    case 'ValuesInitializer':
      return deserializeValuesInitializer(json, locationOption, deserializer);
    case 'SizedArrayInitializer':
      return deserializeSizedArrayInitializer(json, locationOption, deserializer);
    case 'MapInitializer':
      return deserializeMapInitializer(json, locationOption, deserializer);

    // ElementValue nodes
    case 'ExpressionElementValue':
      return deserializeExpressionElementValue(json, locationOption, deserializer);
    case 'AnnotationElementValue':
      return deserializeAnnotationElementValue(json, locationOption, deserializer);
    case 'ArrayElementValue':
      return deserializeArrayElementValue(json, locationOption, deserializer);

    // Backward compatibility: upstream element value type names
    case 'ExpressionValue':
      return deserializeExpressionElementValue(json, locationOption, deserializer);
    case 'AnnotationValue':
      return deserializeAnnotationElementValue(json, locationOption, deserializer);
    case 'ArrayValue':
      return deserializeArrayElementValue(json, locationOption, deserializer);

    // AnnotationModifier: annotation in modifiers array (upstream); convert to Annotation
    case 'AnnotationModifier':
      return deserializeAnnotationModifier(json, deserializer);

    // KeywordModifier: upstream name for Modifier
    case 'KeywordModifier':
      return deserializeModifier(json, locationOption);

    default:
      throw new Error(`Unknown node type: ${nodeType}`);
  }
}

export {
  getJsonASTNodeArrayFromRecord,
  getJsonASTNodeArrayProperty,
  getJsonASTNodeFromRecord,
  getJsonASTNodeProperty,
  getNumberProperty,
  getOptionalJsonASTNodeProperty,
  getOptionalStringProperty,
  getStringProperty,
  isJsonASTNode,
  isJsonASTNodeArray,
  isRecord,
  deserializeIfStatement,
  deserializeForLoopStatement,
  deserializeWhileLoopStatement,
  deserializeReturnStatement,
  deserializeCompoundStatement,
  deserializeExpressionStatement,
  deserializeVariableDeclarationStatement,
  deserializeNodeByKind,
};
