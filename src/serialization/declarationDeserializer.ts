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
} from '../ast/initializer.js';
import type { AnnotationArgument, VariableDeclaration, Modifier } from '../ast/declaration.js';
import type { Annotation } from '../ast/declaration.js';
import type { Expression } from '../ast/expression.js';
import type { Identifier } from '../ast/baseNode.js';
import { NodeFactory } from '../translator/nodeFactory.js';
import { isElementValue, isExpression, isModifier } from '../guard/index.js';
import type { JsonASTNode } from './jsonSerializer.js';
import type { JsonDeserializer } from './jsonDeserializer.js';
import {
  getStringProperty,
  getNumberProperty,
  getJsonASTNodeProperty,
  getJsonASTNodeArrayProperty,
  isJsonASTNode,
} from './astDeserializer.js';
import { deserializeTypeRefNode } from './expressionDeserializer.js';

// ============================================================================
// Deserialization Functions
// ============================================================================

/**
 * Deserializes a StringVal literal.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @returns The deserialized StringVal node.
 */
function deserializeStringVal(
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
function deserializeIntegerVal(
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
function deserializeDoubleVal(
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
function deserializeLongVal(
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
function deserializeDecimalVal(
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
 * @throws {Error} If the JSON value is not a boolean.
 */
function deserializeBooleanVal(
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
 * Deserialize a single expression node from JSON.
 * @param node - The JSON node to deserialize.
 * @param deserializer - The deserializer instance.
 * @param context - The context string for error messages.
 * @returns The deserialized expression AST node.
 * @throws {Error} If the deserialized node is not an Expression.
 */
function deserializeExpressionFromJsonNode(
  node: Readonly<JsonASTNode>,
  deserializer: Readonly<JsonDeserializer>,
  context: string
): Expression {
  const deserialized = deserializer.deserializeNode(node);
  if (!isExpression(deserialized)) {
    throw new Error(`Invalid ${context}: node is not an Expression`);
  }
  return deserialized;
}

/**
 * Deserialize an array of expression nodes from JSON.
 * @param nodes - The array of JSON nodes to deserialize.
 * @param deserializer - The deserializer instance.
 * @param context - The context string for error messages.
 * @returns The array of deserialized expressions.
 */
function deserializeExpressionArrayFromJson(
  nodes: readonly Readonly<JsonASTNode>[],
  deserializer: Readonly<JsonDeserializer>,
  context: string
): Expression[] {
  return nodes.map((node: Readonly<JsonASTNode>) =>
    deserializeExpressionFromJsonNode(node, deserializer, context)
  );
}

/**
 * Deserializes a ConstructorInitializer from JSON.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized ConstructorInitializer node.
 * @throws {Error} If the deserializer instance is not provided.
 */
function deserializeConstructorInitializer(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): ConstructorInitializer {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const typeNode = getJsonASTNodeProperty(json, 'type');
  const type = deserializeTypeRefNode(typeNode, undefined, deserializer);

  const argsProperty = json.args;
  const args: Expression[] =
    argsProperty !== null && argsProperty !== undefined
      ? deserializeExpressionArrayFromJson(
          getJsonASTNodeArrayProperty(json, 'args'),
          deserializer,
          'ConstructorInitializer.args'
        )
      : [];

  return NodeFactory.createConstructorInitializer(type, args, locationOption);
}

/**
 * Deserializes a ValuesInitializer from JSON.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized ValuesInitializer node.
 * @throws {Error} If the deserializer instance is not provided.
 */
function deserializeValuesInitializer(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): ValuesInitializer {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const typeNode = getJsonASTNodeProperty(json, 'type');
  const type = deserializeTypeRefNode(typeNode, undefined, deserializer);

  const valuesProperty = json.values;
  const values: Expression[] =
    valuesProperty !== null && valuesProperty !== undefined
      ? deserializeExpressionArrayFromJson(
          getJsonASTNodeArrayProperty(json, 'values'),
          deserializer,
          'ValuesInitializer.values'
        )
      : [];

  return NodeFactory.createValuesInitializer(type, values, locationOption);
}

/**
 * Deserializes a SizedArrayInitializer from JSON.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized SizedArrayInitializer node.
 * @throws {Error} If the deserializer instance is not provided.
 */
function deserializeSizedArrayInitializer(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): SizedArrayInitializer {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const typeNode = getJsonASTNodeProperty(json, 'type');
  const type = deserializeTypeRefNode(typeNode, undefined, deserializer);

  const sizeNode = getJsonASTNodeProperty(json, 'size');
  const size = deserializeExpressionFromJsonNode(
    sizeNode,
    deserializer,
    'SizedArrayInitializer.size'
  );

  return NodeFactory.createSizedArrayInitializer(type, size, locationOption);
}

/**
 * Deserializes a MapInitializer from JSON.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized MapInitializer node.
 * @throws {Error} If the deserializer instance is not provided or if pair key/value is invalid.
 */
function deserializeMapInitializer(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): MapInitializer {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const typeNode = getJsonASTNodeProperty(json, 'type');
  const type = deserializeTypeRefNode(typeNode, undefined, deserializer);

  const pairsProperty = json.pairs;
  const pairsArray =
    pairsProperty !== null && pairsProperty !== undefined && Array.isArray(pairsProperty)
      ? pairsProperty
      : [];
  const pairs: { key: Expression; value: Expression }[] = pairsArray.map(
    (pair: Readonly<{ key?: unknown; value?: unknown }>) => {
      const rawKey = pair.key;
      const rawValue = pair.value;
      if (!isJsonASTNode(rawKey) || !isJsonASTNode(rawValue)) {
        throw new Error('Invalid MapInitializer: pair key/value is not a JsonASTNode');
      }
      const key = deserializeExpressionFromJsonNode(rawKey, deserializer, 'MapInitializer.key');
      const value = deserializeExpressionFromJsonNode(
        rawValue,
        deserializer,
        'MapInitializer.value'
      );
      return { key, value };
    }
  );

  return NodeFactory.createMapInitializer(type, pairs, locationOption);
}

/**
 * Deserializes an ExpressionElementValue.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized ExpressionElementValue node.
 * @throws {Error} If the deserializer instance is not provided.
 */
function deserializeExpressionElementValue(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): ExpressionElementValue {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const valueNode = getJsonASTNodeProperty(json, 'value');
  const value = deserializeExpressionFromJsonNode(
    valueNode,
    deserializer,
    'ExpressionElementValue.value'
  );
  return NodeFactory.createExpressionElementValue(value, locationOption);
}

/**
 * Deserializes an AnnotationElementValue.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized AnnotationElementValue node.
 * @throws {Error} If the deserializer instance is not provided.
 */
function deserializeAnnotationElementValue(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
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
 * @throws {Error} If the deserializer instance is not provided or if child is not an ElementValue node.
 */
function deserializeArrayElementValue(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): ArrayElementValue {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const values =
    json.values !== null && json.values !== undefined
      ? getJsonASTNodeArrayProperty(json, 'values').map((val: Readonly<JsonASTNode>) => {
          const deserialized = deserializer.deserializeNode(val);
          if (!isElementValue(deserialized)) {
            throw new Error('Invalid ArrayElementValue: child is not an ElementValue node');
          }
          return deserialized;
        })
      : [];
  return NodeFactory.createArrayElementValue(values, locationOption);
}

/**
 * Deserializes an AnnotationArgument.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized AnnotationArgument node.
 * @throws {Error} If the deserializer instance is not provided or if value is not an ElementValue node.
 */
function deserializeAnnotationArgument(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): AnnotationArgument {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const nameProp = json.name;
  const name = typeof nameProp === 'string' ? nameProp : undefined;

  const valueNode = getJsonASTNodeProperty(json, 'value');
  const rawValue = deserializer.deserializeNode(valueNode);
  if (!isElementValue(rawValue)) {
    throw new Error('Invalid AnnotationArgument: value is not an ElementValue node');
  }
  const value = rawValue;

  const isNameImplicitValueRaw = json.isNameImplicit;
  const isNameImplicitValue =
    typeof isNameImplicitValueRaw === 'boolean' ? isNameImplicitValueRaw : undefined;
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
 * @param locationOption.location - The source location range.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized VariableDeclaration node.
 * @throws {Error} If the deserializer instance is not provided or if modifier is not a Modifier node.
 */
function deserializeVariableDeclaration(
  json: Readonly<JsonASTNode>,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
  locationOption?: { location: SourceRange },
  deserializer?: Readonly<JsonDeserializer>
): VariableDeclaration {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  const name = getStringProperty(json, 'name');

  const typeNode = getJsonASTNodeProperty(json, 'type');
  const type = deserializeTypeRefNode(typeNode, undefined, deserializer);

  const initializer =
    json.initializer !== null && json.initializer !== undefined && json.initializer !== false
      ? ((): Expression => {
          const initNode = getJsonASTNodeProperty(json, 'initializer');
          return deserializeExpressionFromJsonNode(
            initNode,
            deserializer,
            'VariableDeclaration.initializer'
          );
        })()
      : undefined;

  const modifiers =
    json.modifiers !== null && json.modifiers !== undefined
      ? getJsonASTNodeArrayProperty(json, 'modifiers').map((mod: Readonly<JsonASTNode>) => {
          const deserialized = deserializer.deserializeNode(mod);
          if (!isModifier(deserialized)) {
            throw new Error('Invalid VariableDeclaration: modifier is not a Modifier node');
          }
          return deserialized;
        })
      : undefined;

  return NodeFactory.createVariableDeclaration(name, type, initializer, modifiers, locationOption);
}

/**
 * Deserializes a Modifier.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @returns The deserialized Modifier node.
 * @throws {Error} If the modifier keyword is invalid.
 */
function deserializeModifier(
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
function deserializeIdentifier(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>
): Identifier {
  const name = getStringProperty(json, 'name');

  return NodeFactory.createIdentifier(name, locationOption);
}

export {
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
};
