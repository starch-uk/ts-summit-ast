/**
 * @file Declaration, literal, initializer, and element value deserialization helpers.
 * Deserializes declaration-related nodes from JSON.
 */

import type { SourceRange } from '../ast/baseNode.js';
import type {
  StringVal,
  IntegerVal,
  DoubleVal,
  LongVal,
  DecimalVal,
  BooleanVal,
} from '../ast/literal.js';
import type {
  ConstructorInitializer,
  ValuesInitializer,
  SizedArrayInitializer,
  MapInitializer,
} from '../ast/initializer.js';
import type {
  ExpressionElementValue,
  AnnotationElementValue,
  ArrayElementValue,
  ElementValue,
} from '../ast/initializer.js';
import type { AnnotationArgument, VariableDeclaration, Modifier } from '../ast/declaration.js';
import type { Annotation } from '../ast/declaration.js';
import type { Expression } from '../ast/expression.js';
import type { Identifier } from '../ast/baseNode.js';
import type { JsonASTNode } from './jsonSerializer.js';
import type { JsonDeserializer } from './jsonDeserializer.js';
import { NodeFactory } from '../translator/nodeFactory.js';
import { getStringProperty, getNumberProperty } from './astDeserializer.js';
import { deserializeTypeRefNode } from './expressionDeserializer.js';

/**
 * Deserializes a StringVal literal.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @returns The deserialized StringVal node.
 */
export function deserializeStringVal(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>
): StringVal {
  const value = getStringProperty(json, 'value');

  const rawValue = json.raw;
  const raw =
    rawValue !== null && rawValue !== undefined && typeof rawValue === 'string'
      ? rawValue
      : `"${value}"`;

  return NodeFactory.createStringVal(value, raw, locationOption);
}

/**
 * Deserializes an IntegerVal literal.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @returns The deserialized IntegerVal node.
 */
export function deserializeIntegerVal(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>
): IntegerVal {
  const value = getNumberProperty(json, 'value');

  const rawValue = json.raw;
  const raw =
    rawValue !== null && rawValue !== undefined && typeof rawValue === 'string'
      ? rawValue
      : String(value);

  return NodeFactory.createIntegerVal(value, raw, locationOption);
}

/**
 * Deserializes a DoubleVal literal.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @returns The deserialized DoubleVal node.
 */
export function deserializeDoubleVal(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>
): DoubleVal {
  const value = getNumberProperty(json, 'value');

  const rawValue = json.raw;
  const raw =
    rawValue !== null && rawValue !== undefined && typeof rawValue === 'string'
      ? rawValue
      : String(value);

  return NodeFactory.createDoubleVal(value, raw, locationOption);
}

/**
 * Deserializes a LongVal literal.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @returns The deserialized LongVal node.
 */
export function deserializeLongVal(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>
): LongVal {
  const value = getNumberProperty(json, 'value');

  const rawValue = json.raw;
  const raw =
    rawValue !== null && rawValue !== undefined && typeof rawValue === 'string'
      ? rawValue
      : String(value);

  return NodeFactory.createLongVal(value, raw, locationOption);
}

/**
 * Deserializes a DecimalVal literal.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @returns The deserialized DecimalVal node.
 */
export function deserializeDecimalVal(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>
): DecimalVal {
  const value = getNumberProperty(json, 'value');

  const rawValue = json.raw;
  const raw =
    rawValue !== null && rawValue !== undefined && typeof rawValue === 'string'
      ? rawValue
      : String(value);

  return NodeFactory.createDecimalVal(value, raw, locationOption);
}

/**
 * Deserializes a BooleanVal literal.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @returns The deserialized BooleanVal node.
 */
export function deserializeBooleanVal(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>
): BooleanVal {
  const valueProp = json.value;
  if (typeof valueProp !== 'boolean') {
    throw new Error('Invalid JSON AST node: property value is not a boolean');
  }
  const value = valueProp;

  return NodeFactory.createBooleanVal(value, locationOption);
}

/**
 * Deserializes a ConstructorInitializer from JSON.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized ConstructorInitializer node.
 */
export function deserializeConstructorInitializer(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
): ConstructorInitializer {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const type = deserializeTypeRefNode(json.type as JsonASTNode, undefined, deserializer);

  const args =
    json.args !== null && json.args !== undefined
      ? ((json.args as JsonASTNode[]).map((arg: Readonly<JsonASTNode>) =>
          deserializer.deserializeNode(arg)
        ) as Expression[])
      : [];

  return NodeFactory.createConstructorInitializer(type, args, locationOption);
}

/**
 * Deserializes a ValuesInitializer from JSON.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized ValuesInitializer node.
 */
export function deserializeValuesInitializer(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
): ValuesInitializer {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const type = deserializeTypeRefNode(json.type as JsonASTNode, undefined, deserializer);

  const values =
    json.values !== null && json.values !== undefined
      ? ((json.values as JsonASTNode[]).map((val: Readonly<JsonASTNode>) =>
          deserializer.deserializeNode(val)
        ) as Expression[])
      : [];

  return NodeFactory.createValuesInitializer(type, values, locationOption);
}

/**
 * Deserializes a SizedArrayInitializer from JSON.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized SizedArrayInitializer node.
 */
export function deserializeSizedArrayInitializer(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
): SizedArrayInitializer {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const type = deserializeTypeRefNode(json.type as JsonASTNode, undefined, deserializer);

  const size = deserializer.deserializeNode(json.size as JsonASTNode) as Expression;

  return NodeFactory.createSizedArrayInitializer(type, size, locationOption);
}

/**
 * Deserializes a MapInitializer from JSON.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized MapInitializer node.
 */
export function deserializeMapInitializer(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
): MapInitializer {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const type = deserializeTypeRefNode(json.type as JsonASTNode, undefined, deserializer);

  const pairs =
    json.pairs !== null && json.pairs !== undefined
      ? (json.pairs as JsonASTNode[]).map((pair: Readonly<JsonASTNode>) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
          const pairObj = pair as { key?: unknown; value?: unknown };
          return {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
            key: deserializer.deserializeNode(pairObj.key as JsonASTNode) as Expression,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
            value: deserializer.deserializeNode(pairObj.value as JsonASTNode) as Expression,
          };
        })
      : [];

  return NodeFactory.createMapInitializer(type, pairs, locationOption);
}

/**
 * Deserializes an ExpressionElementValue.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized ExpressionElementValue node.
 */
export function deserializeExpressionElementValue(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
): ExpressionElementValue {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const value = deserializer.deserializeNode(json.value as JsonASTNode) as Expression;
  return NodeFactory.createExpressionElementValue(value, locationOption);
}

/**
 * Deserializes an AnnotationElementValue.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized AnnotationElementValue node.
 */
export function deserializeAnnotationElementValue(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
): AnnotationElementValue {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
  const value = deserializer.deserializeNode(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
    json.value as JsonASTNode
  ) as Annotation;
  return NodeFactory.createAnnotationElementValue(value, locationOption);
}

/**
 * Deserializes an ArrayElementValue.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized ArrayElementValue node.
 */
export function deserializeArrayElementValue(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
): ArrayElementValue {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const values =
    json.values !== null && json.values !== undefined
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access returns unknown due to index signature
        ((json.values as JsonASTNode[]).map((val: Readonly<JsonASTNode>) =>
          deserializer.deserializeNode(val)
        ) as ElementValue[])
      : [];
  return NodeFactory.createArrayElementValue(values, locationOption);
}

/**
 * Deserializes an AnnotationArgument.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized AnnotationArgument node.
 */
export function deserializeAnnotationArgument(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: JsonDeserializer
): AnnotationArgument {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
  const name = json.name as string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
  const value = deserializer.deserializeNode(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
    json.value as JsonASTNode
  ) as ElementValue;

  const isNameImplicitValue = json.isNameImplicit as boolean | undefined;
  const isNameImplicit = (isNameImplicitValue ?? name === undefined) || name === '';

  return {
    isNameImplicit,
    kind: 'AnnotationArgument',
    location: locationOption?.location,
    name,
    value,
  };
}

/**
 * Deserializes a VariableDeclaration.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized VariableDeclaration node.
 */
export function deserializeVariableDeclaration(
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- JSON deserialization requires mutable object
  json: JsonASTNode,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
  locationOption?: { location: SourceRange },
  deserializer?: JsonDeserializer
): VariableDeclaration {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
  const name = json.name as string;

  const type = deserializeTypeRefNode(json.type as JsonASTNode, undefined, deserializer);

  const initializer =
    json.initializer !== null && json.initializer !== undefined && json.initializer !== false
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
        (deserializer.deserializeNode(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
          json.initializer as JsonASTNode
        ) as Expression)
      : undefined;

  const modifiers =
    json.modifiers !== null && json.modifiers !== undefined
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
        (json.modifiers as JsonASTNode[]).map(
          (mod: Readonly<JsonASTNode>) =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
            deserializer.deserializeNode(mod) as Modifier
        )
      : undefined;

  return NodeFactory.createVariableDeclaration(name, type, initializer, modifiers, locationOption);
}

/**
 * Deserializes a Modifier.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @returns The deserialized Modifier node.
 */
export function deserializeModifier(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>
): Modifier {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
  const keyword = json.keyword as string;
  // Validate keyword is a valid ModifierKeyword
  const validKeywords = [
    'public',
    'private',
    'protected',
    'static',
    'final',
    'abstract',
    'transient',
    'volatile',
    'synchronized',
    'native',
    'strictfp',
    'global',
    'webservice',
    'override',
    'testMethod',
    'future',
    'deprecated',
  ];
  if (!validKeywords.includes(keyword)) {
    throw new Error(`Invalid modifier keyword: ${keyword}`);
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing to ModifierKeyword
    keyword: keyword as Modifier['keyword'],
    kind: 'Modifier',
    location: locationOption?.location,
  };
}

/**
 * Deserializes an Identifier node.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @returns The deserialized Identifier node.
 */
export function deserializeIdentifier(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>
): Identifier {
  const name = getStringProperty(json, 'name');

  return NodeFactory.createIdentifier(name, locationOption);
}
