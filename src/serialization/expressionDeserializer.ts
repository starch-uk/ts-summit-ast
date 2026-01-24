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
import type { TypeRef, Identifier } from '../ast/baseNode.js';
import { NodeFactory } from '../translator/nodeFactory.js';
import { isExpression, isIdentifier } from '../guard/index.js';
import type { JsonASTNode } from './jsonSerializer.js';
import type { JsonDeserializer } from './jsonDeserializer.js';
import {
  getJsonASTNodeProperty,
  getOptionalJsonASTNodeProperty,
  getJsonASTNodeArrayProperty,
  getStringProperty,
} from './astDeserializer.js';

/**
 * Deserializes a BinaryExpression.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized BinaryExpression node.
 */
export function deserializeBinaryExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
): BinaryExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const operator = getStringProperty(json, 'operator');
  const validOperators: BinaryExpression['operator'][] = [
    '-',
    '!=',
    '!==',
    '*',
    '/',
    '&',
    '&&',
    '%',
    '^',
    '+',
    '<',
    '<<',
    '<=',
    '==',
    '===',
    '>',
    '>=',
    '>>',
    '>>>',
    '|',
    '||',
    'instanceof',
  ];
  if (!validOperators.includes(operator as BinaryExpression['operator'])) {
    throw new Error(`Invalid binary operator: ${operator}`);
  }

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

  return NodeFactory.createBinaryExpression(
    operator as BinaryExpression['operator'],
    leftDeserialized,
    rightDeserialized,
    locationOption
  );
}

/**
 * Deserializes a CallExpression.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized CallExpression node.
 */
export function deserializeCallExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
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

  return NodeFactory.createCallExpression(methodName, args, target, typeArguments, locationOption);
}

/**
 * Deserializes a FieldExpression.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized FieldExpression node.
 */
export function deserializeFieldExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
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
 */
export function deserializeArrayExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
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
 */
export function deserializeAssignExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
): AssignExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const operator = getStringProperty(json, 'operator');
  const validOperators: AssignExpression['operator'][] = [
    '-=',
    '*=',
    '/=',
    '&=',
    '%=',
    '^=',
    '+=',
    '<<=',
    '=',
    '>>=',
    '>>>=',
    '|=',
  ];
  if (!validOperators.includes(operator as AssignExpression['operator'])) {
    throw new Error(`Invalid assign operator: ${operator}`);
  }

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

  return NodeFactory.createAssignExpression(
    operator as AssignExpression['operator'],
    leftDeserialized,
    rightDeserialized,
    locationOption
  );
}

/**
 * Deserializes a VariableExpression.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized VariableExpression node.
 */
export function deserializeVariableExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
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
 */
export function deserializeNewExpression(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
): NewExpression {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
  const initializerNode = json.initializer as JsonASTNode;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing
  const initializer = deserializer.deserializeNode(initializerNode) as
    | import('../ast/initializer.js').Initializer
    | undefined;
  if (!initializer) {
    throw new Error('Invalid NewExpression: initializer is required');
  }

  return NodeFactory.createNewExpression(initializer, locationOption);
}

/**
 * Deserialize a type reference from JSON.
 * @param typeRefJson - The JSON object representing the type reference.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized type reference.
 */
function deserializeTypeRef(
  typeRefJson: Readonly<JsonASTNode>,
  deserializer: JsonDeserializer
): TypeRef {
  return deserializeTypeRefNode(typeRefJson, undefined, deserializer);
}

/**
 * Deserializes a TypeRef node.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized TypeRef node.
 */
export function deserializeTypeRefNode(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
): TypeRef {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
  const componentsArray = json.components as JsonASTNode[] | undefined;
  const components = (componentsArray ?? []).map((comp: Readonly<JsonASTNode>) => ({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    args: ((comp as { args?: JsonASTNode[] }).args ?? []).map((arg: Readonly<JsonASTNode>) =>
      deserializeTypeRef(arg, deserializer)
    ),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    id: deserializer.deserializeNode(comp.id as JsonASTNode) as Identifier,
  }));

  const defaultArrayNesting = 0;

  const arrayNestingValue = json.arrayNesting;
  const arrayNesting =
    arrayNestingValue !== null && arrayNestingValue !== undefined
      ? (arrayNestingValue as number)
      : defaultArrayNesting;

  return NodeFactory.createTypeRef(components, arrayNesting, locationOption);
}
