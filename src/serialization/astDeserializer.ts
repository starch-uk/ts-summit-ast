/**
 * @file AST node deserialization dispatcher and statement deserialization.
 * Dispatches JSON deserialization to specialized decoders and contains statement deserialization logic.
 */

import type { ASTNode, SourceRange } from '../ast/baseNode.js';
import type {
  IfStatement,
  ForLoopStatement,
  WhileLoopStatement,
  ReturnStatement,
  CompoundStatement,
  ExpressionStatement,
  VariableDeclarationStatement,
  Statement,
} from '../ast/statement.js';
import type { Expression } from '../ast/expression.js';
import type { VariableDeclaration } from '../ast/declaration.js';
import type { Identifier } from '../ast/baseNode.js';
import type { JsonASTNode } from './jsonSerializer.js';
import type { JsonDeserializer } from './jsonDeserializer.js';
import { NodeFactory } from '../translator/nodeFactory.js';
import { isExpression, isStatement, isIdentifier } from '../guard/index.js';
import {
  deserializeBinaryExpression,
  deserializeCallExpression,
  deserializeFieldExpression,
  deserializeArrayExpression,
  deserializeAssignExpression,
  deserializeNewExpression,
  deserializeVariableExpression,
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
} from './declarationDeserializer.js';

// ============================================================================
// Deserialization Utilities
// ============================================================================

/**
 * Type guard to check if a value is a JsonASTNode.
 * @param value - The value to check.
 * @returns True if the value is a JsonASTNode.
 */
export function isJsonASTNode(value: unknown): value is JsonASTNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    (('@type' in value && typeof (value as { '@type': unknown })['@type'] === 'string') ||
      ('kind' in value && typeof (value as { kind: unknown }).kind === 'string'))
  );
}

/**
 * Type guard to check if a value is an array of JsonASTNodes.
 * @param value - The value to check.
 * @returns True if the value is an array of JsonASTNodes.
 */
export function isJsonASTNodeArray(value: unknown): value is JsonASTNode[] {
  return Array.isArray(value) && value.every((item) => isJsonASTNode(item));
}

/**
 * Safely gets a JsonASTNode property from a JsonASTNode.
 * @param json - The JSON node.
 * @param property - The property name.
 * @returns The property value as JsonASTNode, or throws if invalid.
 * @throws {Error} If the property is not a valid JsonASTNode.
 */
export function getJsonASTNodeProperty(json: Readonly<JsonASTNode>, property: string): JsonASTNode {
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
export function getOptionalJsonASTNodeProperty(
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
export function getJsonASTNodeArrayProperty(
  json: Readonly<JsonASTNode>,
  property: string
): JsonASTNode[] {
  const value = json[property];
  if (!isJsonASTNodeArray(value)) {
    throw new Error(`Invalid JSON AST node: property ${property} is not a valid JsonASTNode array`);
  }
  return value;
}

/**
 * Safely gets a string property from a JsonASTNode.
 * @param json - The JSON node.
 * @param property - The property name.
 * @returns The property value as string, or throws if invalid.
 * @throws {Error} If the property is not a valid string.
 */
export function getStringProperty(json: Readonly<JsonASTNode>, property: string): string {
  const value = json[property];
  if (typeof value !== 'string') {
    throw new Error(`Invalid JSON AST node: property ${property} is not a string`);
  }
  return value;
}

/**
 * Safely gets a number property from a JsonASTNode.
 * @param json - The JSON node.
 * @param property - The property name.
 * @returns The property value as number, or throws if invalid.
 * @throws {Error} If the property is not a valid number.
 */
export function getNumberProperty(json: Readonly<JsonASTNode>, property: string): number {
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
 */
export function deserializeIfStatement(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
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

  return NodeFactory.createIfStatement(
    conditionDeserialized,
    thenStatementDeserialized,
    elseStatement,
    locationOption
  );
}

/**
 * Deserializes a ForLoopStatement.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized ForLoopStatement node.
 */
export function deserializeForLoopStatement(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
): ForLoopStatement {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const initNode = getOptionalJsonASTNodeProperty(json, 'init');
  let init: ExpressionStatement | VariableDeclarationStatement | undefined = undefined;
  if (initNode !== undefined) {
    const initDeserialized = deserializer.deserializeNode(initNode);
    if (
      isStatement(initDeserialized) &&
      (initDeserialized.kind === 'ExpressionStatement' ||
        initDeserialized.kind === 'VariableDeclarationStatement')
    ) {
      init = initDeserialized as ExpressionStatement | VariableDeclarationStatement;
    }
  }

  const conditionNode = getOptionalJsonASTNodeProperty(json, 'condition');
  let condition: Expression | undefined = undefined;
  if (conditionNode !== undefined) {
    const conditionDeserialized = deserializer.deserializeNode(conditionNode);
    // Convert Identifier to VariableExpression if needed (Identifier is not an Expression)
    if (conditionDeserialized.kind === 'Identifier' && isIdentifier(conditionDeserialized)) {
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
    if (updateDeserialized.kind === 'Identifier' && isIdentifier(updateDeserialized)) {
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

  return NodeFactory.createForLoopStatement(
    bodyDeserialized,
    init,
    condition,
    update,
    locationOption
  );
}

/**
 * Deserializes a WhileLoopStatement.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized WhileLoopStatement node.
 */
export function deserializeWhileLoopStatement(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
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
 * Deserializes a ReturnStatement.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized ReturnStatement node.
 */
export function deserializeReturnStatement(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
): ReturnStatement {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const expressionNode = getOptionalJsonASTNodeProperty(json, 'expression');
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
 */
export function deserializeCompoundStatement(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
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
 */
export function deserializeExpressionStatement(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
): ExpressionStatement {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const expressionNode = getJsonASTNodeProperty(json, 'expression');
  const deserialized = deserializer.deserializeNode(expressionNode);

  // Convert Identifier to VariableExpression if needed (Identifier is not an Expression)
  const expression: Expression =
    deserialized.kind === 'Identifier' && isIdentifier(deserialized)
      ? NodeFactory.createVariableExpression(deserialized, locationOption)
      : isExpression(deserialized)
        ? deserialized
        : ((): never => {
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
 */
export function deserializeVariableDeclarationStatement(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
): VariableDeclarationStatement {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const declarationNode = getJsonASTNodeProperty(json, 'declaration');
  const deserialized = deserializer.deserializeNode(declarationNode);
  if (deserialized.kind !== 'VariableDeclaration') {
    throw new Error(
      'Invalid VariableDeclarationStatement: declaration is not a VariableDeclaration node'
    );
  }
  const declaration = deserialized as VariableDeclaration;

  return NodeFactory.createVariableDeclarationStatement(declaration, locationOption);
}

// ============================================================================
// Dispatcher
// ============================================================================

/**
 * Deserialize node based on its kind.
 * @param json - The JSON object to deserialize.
 * @param nodeType - The kind of AST node to deserialize (e.g., 'IfStatement', 'BinaryExpression').
 * @param location - The optional source location.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized AST node.
 * @throws {Error} If the node type is unknown or not yet implemented.
 */
export function deserializeNodeByKind(
  json: Readonly<JsonASTNode>,
  nodeType: string,
  location: SourceRange | undefined,
  deserializer: JsonDeserializer
): ASTNode {
  const locationOption = location ? { location } : undefined;

  switch (nodeType) {
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
    case 'EnhancedForLoopStatement':
    case 'DoWhileLoopStatement':
      // Use generic deserialization
      throw new Error(`Deserialization for ${nodeType} not yet implemented`);

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
    case 'SoqlExpression':
    case 'SoslExpression':
      // Use generic deserialization
      throw new Error(`Deserialization for ${nodeType} not yet implemented`);

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

    // Declaration nodes
    case 'AnnotationArgument':
      return deserializeAnnotationArgument(json, locationOption, deserializer);

    default:
      throw new Error(`Unknown node type: ${nodeType}`);
  }
}
