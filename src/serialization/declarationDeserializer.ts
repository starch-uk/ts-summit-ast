/**
 * @file Declaration, literal, initializer, and element value deserialization helpers.
 * Deserializes declaration-related nodes from JSON.
 */

import type { ASTNode, CanonicalSourceLocation, SourceRange } from '../ast/baseNode.js';
import { toCanonicalSourceLocation } from '../ast/baseNode.js';
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
import { TriggerCase } from '../ast/declaration.js';
import type {
  Annotation,
  AnnotationArgument,
  ClassDeclaration,
  Declaration,
  EnumDeclaration,
  EnumValue,
  InterfaceDeclaration,
  MethodDeclaration,
  Modifier,
  Parameter,
  PropertyDeclaration,
  TriggerDeclaration,
  TypeParameter,
  VariableDeclaration,
} from '../ast/declaration.js';
import type { Expression } from '../ast/expression.js';
import type { Statement } from '../ast/statement.js';
import type { Identifier } from '../ast/baseNode.js';
import { NodeFactory } from '../translator/nodeFactory.js';
import {
  isAnnotation,
  isClassDeclaration,
  isCompoundStatement,
  isElementValue,
  isEnumDeclaration,
  isExpression,
  isInterfaceDeclaration,
  isMethodDeclaration,
  isModifier,
  isPropertyDeclaration,
  isTypeParameter,
  isVariableDeclaration,
  isDeclaration,
  isStatement,
} from '../guard/index.js';
import type { JsonASTNode } from './jsonSerializer.js';
import type { JsonDeserializer } from './jsonDeserializer.js';
import {
  getStringProperty,
  getNumberProperty,
  getJsonASTNodeProperty,
  getJsonASTNodeArrayProperty,
  getOptionalStringProperty,
  isJsonASTNode,
  isRecord,
} from './astDeserializer.js';
import { deserializeTypeRefNode } from './expressionDeserializer.js';

// ============================================================================
// Deserialization Functions
// ============================================================================

/**
 * Parses canonical sourceLocation from JSON (startLine, startColumn, endLine, endColumn or start/end).
 * @param value - The JSON value.
 * @param deserializer - The deserializer instance.
 * @returns CanonicalSourceLocation or undefined.
 */
function parseCanonicalSourceLocation(
  value: unknown,
  deserializer: Readonly<JsonDeserializer>
): CanonicalSourceLocation | undefined {
  const range = deserializer.parseLocation(value);
  return range ? toCanonicalSourceLocation(range) : undefined;
}

/**
 * Filters AST nodes to valid EnumDeclaration members.
 * @param nodes - Deserialized nodes.
 * @returns Filtered array of valid enum member declaration types.
 */
function filterEnumMembers(
  nodes: readonly ASTNode[]
): NonNullable<EnumDeclaration['bodyDeclarations']> {
  const result: (
    | ClassDeclaration
    | EnumDeclaration
    | InterfaceDeclaration
    | MethodDeclaration
    | PropertyDeclaration
    | VariableDeclaration
  )[] = [];
  for (const m of nodes) {
    if (
      isClassDeclaration(m) ||
      isEnumDeclaration(m) ||
      isInterfaceDeclaration(m) ||
      isMethodDeclaration(m) ||
      isPropertyDeclaration(m) ||
      isVariableDeclaration(m)
    ) {
      result.push(m);
    }
  }
  return result;
}

/**
 * Filters AST nodes to valid InterfaceDeclaration members.
 * @param nodes - Deserialized nodes.
 * @returns Filtered array of valid interface member declaration types.
 */
function filterInterfaceMembers(
  nodes: readonly ASTNode[]
): InterfaceDeclaration['bodyDeclarations'] {
  const result: (
    | ClassDeclaration
    | InterfaceDeclaration
    | MethodDeclaration
    | PropertyDeclaration
  )[] = [];
  for (const m of nodes) {
    if (
      isClassDeclaration(m) ||
      isInterfaceDeclaration(m) ||
      isMethodDeclaration(m) ||
      isPropertyDeclaration(m)
    ) {
      result.push(m);
    }
  }
  return result;
}

/**
 * Gets optional JsonASTNode property from JSON.
 * @param json - The JSON node.
 * @param property - The property name.
 * @returns The property value if valid JsonASTNode, undefined otherwise.
 */
function getOptionalJsonASTNodeProperty(
  json: Readonly<JsonASTNode>,
  property: string
): JsonASTNode | undefined {
  const v = json[property];
  return v != null && isJsonASTNode(v) ? v : undefined;
}

/**
 * Gets optional JsonASTNode array property from JSON.
 * @param json - The JSON node.
 * @param property - The property name.
 * @returns The property value if valid array of JsonASTNode, undefined otherwise.
 */
function getOptionalJsonASTNodeArrayProperty(
  json: Readonly<JsonASTNode>,
  property: string
): JsonASTNode[] | undefined {
  const v = json[property];
  return Array.isArray(v) && v.every((x) => isJsonASTNode(x)) ? v : undefined;
}

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
 * Normalize a value that may be a full JsonASTNode or literal-shaped/inline object to JsonASTNode.
 * Used when deserializing MapInitializer pairs (canonical first/second) that may have lost `@type`.
 * @param raw - The raw value (string, number, or object).
 * @param context - Description for error messages.
 * @returns The normalized JsonASTNode.
 * @throws {Error} If the value cannot be normalized.
 */
function toExpressionLikeJsonNode(raw: unknown, context: string): JsonASTNode {
  if (raw === undefined || raw === null) {
    throw new Error(`Invalid ${context}: missing value`);
  }
  if (typeof raw === 'string') {
    const result: JsonASTNode = { '@type': 'StringVal', raw: `"${raw}"`, value: raw };
    return result;
  }
  if (typeof raw === 'number') {
    const result: JsonASTNode = { '@type': 'IntegerVal', raw: String(raw), value: raw };
    return result;
  }
  if (typeof raw === 'object' && isJsonASTNode(raw)) {
    return raw;
  }
  if (typeof raw === 'object' && isRecord(raw)) {
    const o = raw;
    const hasType = '@type' in o || 'kind' in o;
    if (hasType) {
      const typeStr =
        typeof o['@type'] === 'string'
          ? o['@type']
          : typeof o.kind === 'string'
            ? o.kind
            : 'Unknown';
      const result: JsonASTNode = { ...o, '@type': typeStr };
      return result;
    }
    if ('value' in o) {
      const v = o.value;
      const kind =
        typeof v === 'string'
          ? 'StringVal'
          : typeof v === 'number'
            ? 'IntegerVal'
            : typeof v === 'boolean'
              ? 'BooleanVal'
              : 'StringVal';
      const resultVal: JsonASTNode = { ...o, '@type': kind };
      return resultVal;
    }
    if ('string' in o) {
      const resultId: JsonASTNode = { ...o, '@type': 'Identifier' };
      return resultId;
    }
  }
  throw new Error(`Invalid ${context}: expected expression-like JSON node (got ${typeof raw})`);
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
    (pair: Readonly<{ key?: unknown; value?: unknown; first?: unknown; second?: unknown }>) => {
      // Canonical format uses first/second; internal uses key/value
      const rawKey = pair.key ?? pair.first;
      const rawValue = pair.value ?? pair.second;
      const keyNode = toExpressionLikeJsonNode(rawKey, 'MapInitializer.key');
      const valueNode = toExpressionLikeJsonNode(rawValue, 'MapInitializer.value');
      const key = deserializeExpressionFromJsonNode(keyNode, deserializer, 'MapInitializer.key');
      const value = deserializeExpressionFromJsonNode(
        valueNode,
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
  const valueNode = getJsonASTNodeProperty(json, 'value');
  const deserialized = deserializer.deserializeNode(valueNode);
  if (!isAnnotation(deserialized)) {
    throw new Error('Invalid AnnotationElementValue: value is not an Annotation node');
  }
  return NodeFactory.createAnnotationElementValue(deserialized, locationOption);
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
    '@type': 'AnnotationArgument',
    isNameImplicit,
    name,
    value,
    ...(locationOption?.location && {
      sourceLocation: toCanonicalSourceLocation(locationOption.location),
    }),
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
  locationOption?: Readonly<{ location: SourceRange }>,
  deserializer?: Readonly<JsonDeserializer>
): VariableDeclaration {
  if (!deserializer) {
    throw new Error('Deserializer instance required');
  }
  // Summit-AST canonical JSON encodes the variable name as an Identifier node under `id`.
  // Older/legacy JSON may use a plain string `name`. Support both for compatibility.
  const idNode =
    json.id !== null && json.id !== undefined ? getJsonASTNodeProperty(json, 'id') : undefined;
  const name: string =
    idNode !== undefined
      ? (getOptionalStringProperty(idNode, 'string') ??
        getOptionalStringProperty(idNode, 'name') ??
        '')
      : getStringProperty(json, 'name');
  if (name === '') {
    throw new Error('Invalid VariableDeclaration: id missing name or string');
  }

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

  return NodeFactory.createVariableDeclaration({
    initializer,
    modifiers,
    name,
    ...(locationOption ?? {}),
    type,
  });
}

/**
 * Deserializes a Modifier.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @returns The deserialized Modifier node.
 * @throws {Error} If the modifier keyword is invalid.
 */
/** Valid modifier keywords for runtime validation. */
const VALID_MODIFIER_KEYWORDS: readonly Modifier['keyword'][] = [
  'abstract',
  'deprecated',
  'final',
  'future',
  'global',
  'native',
  'override',
  'private',
  'protected',
  'public',
  'static',
  'strictfp',
  'synchronized',
  'testMethod',
  'transient',
  'volatile',
  'webservice',
] as const;

/**
 * Parse and validate a modifier keyword from JSON.
 * @param value - Raw value from JSON.
 * @returns Valid Modifier keyword.
 * @throws {Error} If the keyword is invalid.
 */
function parseModifierKeyword(value: unknown): Modifier['keyword'] {
  const s = typeof value === 'string' ? value.toLowerCase() : '';
  const found = VALID_MODIFIER_KEYWORDS.find((k) => k === s);
  if (found !== undefined) {
    return found;
  }
  throw new Error(`Invalid modifier keyword: ${String(value)}`);
}

/**
 * Deserializes a Modifier node.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @returns The deserialized Modifier node.
 * @throws {Error} If the modifier keyword is invalid.
 */
function deserializeModifier(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>
): Modifier {
  const keyword = parseModifierKeyword(getStringProperty(json, 'keyword'));
  return {
    '@type': 'Modifier',
    keyword,
    ...(locationOption?.location && {
      sourceLocation: toCanonicalSourceLocation(locationOption.location),
    }),
  };
}

/**
 * Deserializes an Identifier node.
 * Accepts internal (name) or canonical (string).
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @returns The deserialized Identifier node.
 * @throws {Error} If JSON is invalid.
 */
function deserializeIdentifier(
  json: Readonly<JsonASTNode>,
  locationOption?: Readonly<{ location: SourceRange }>
): Identifier {
  const name = getOptionalStringProperty(json, 'name') ?? getOptionalStringProperty(json, 'string');
  if (name === undefined) {
    throw new Error('Invalid Identifier: missing name or string');
  }
  return NodeFactory.createIdentifier(name, locationOption);
}

// ============================================================================
// Declaration deserialization (Class/Enum/Interface/Method/Property/etc.)
// ============================================================================

/**
 * Deserializes type parameters from JSON.
 * @param json - The JSON node.
 * @param deserializer - The deserializer instance.
 * @returns Array of TypeParameter or undefined.
 * @throws {Error} If JSON is invalid.
 */
function deserializeTypeParameters(
  json: Readonly<JsonASTNode>,
  deserializer: Readonly<JsonDeserializer>
): TypeParameter[] | undefined {
  const arr =
    getOptionalJsonASTNodeArrayProperty(json, 'typeParameters') ??
    getOptionalJsonASTNodeArrayProperty(json, 'typeParameterDeclarations');
  if (!arr) return undefined;
  const result: TypeParameter[] = [];
  for (const tp of arr) {
    const node = deserializer.deserializeNode(tp);
    if (!isTypeParameter(node)) {
      throw new Error('Invalid typeParameters: expected TypeParameter');
    }
    result.push(node);
  }
  return result;
}

/**
 * Deserializes a single Parameter from JSON.
 * @param json - The parameter JSON node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized Parameter.
 * @throws {Error} If JSON is invalid.
 */
function deserializeParameter(
  json: Readonly<JsonASTNode>,
  deserializer: Readonly<JsonDeserializer>
): Parameter {
  const EMPTY_LENGTH = 0;
  const idNode = getOptionalJsonASTNodeProperty(json, 'id');
  const typeNode = getOptionalJsonASTNodeProperty(json, 'type');
  if (!typeNode) throw new Error('Invalid Parameter: missing type');
  const name = idNode
    ? deserializeIdentifier(idNode).string
    : (getOptionalStringProperty(json, 'name') ?? '');
  const type = deserializeTypeRefNode(typeNode, undefined, deserializer);
  const modifiersJson = getOptionalJsonASTNodeArrayProperty(json, 'modifiers') ?? [];
  const modifiers = modifiersJson.map((m: Readonly<JsonASTNode>) => {
    const mod = deserializer.deserializeNode(m);
    if (!isModifier(mod)) throw new Error('Invalid Parameter: modifier is not Modifier');
    return mod;
  });
  const param: Parameter = {
    '@type': 'Parameter',
    name,
    type,
    ...(modifiers.length > EMPTY_LENGTH && { modifiers }),
    ...(typeof json.sourceLocation === 'object' && json.sourceLocation != null
      ? ((): Record<string, never> | { sourceLocation?: CanonicalSourceLocation } => {
          const loc = parseCanonicalSourceLocation(json.sourceLocation, deserializer);
          return loc != null ? { sourceLocation: loc } : {};
        })()
      : {}),
  };
  return param;
}

/**
 * Extracts name string from JSON value (handles Identifier object without `@type`).
 * @param nameVal - The name value (string or object with string/name).
 * @param json - Fallback json for getOptionalStringProperty.
 * @returns The name string.
 */
function extractNameFromJsonValue(
  nameVal: unknown,
  json: Readonly<Record<string, unknown>>
): string {
  if (
    nameVal != null &&
    typeof nameVal === 'object' &&
    !Array.isArray(nameVal) &&
    isRecord(nameVal)
  ) {
    return (
      getOptionalStringProperty(nameVal, 'string') ??
      getOptionalStringProperty(nameVal, 'name') ??
      ''
    );
  }
  return typeof nameVal === 'string' ? nameVal : (getOptionalStringProperty(json, 'name') ?? '');
}

/**
 * Deserializes AnnotationModifier (upstream shape) to Annotation.
 * Summit-ast uses name as object with `string` property and args array.
 * @param json - The AnnotationModifier JSON node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized Annotation.
 * @throws {Error} If JSON is invalid.
 */
function deserializeAnnotationModifier(
  json: Readonly<JsonASTNode>,
  deserializer: Readonly<JsonDeserializer>
): Annotation {
  const name = extractNameFromJsonValue(json.name, json);
  const argsJson =
    getOptionalJsonASTNodeArrayProperty(json, 'arguments') ??
    getOptionalJsonASTNodeArrayProperty(json, 'args') ??
    getOptionalJsonASTNodeArrayProperty(json, 'values') ??
    [];
  const EMPTY_LENGTH = 0;
  const args = argsJson.map((a: Readonly<JsonASTNode>) =>
    deserializeAnnotationArgument(a, undefined, deserializer)
  );
  const ann: Annotation = {
    '@type': 'Annotation',
    name,
    ...(args.length > EMPTY_LENGTH && { arguments: args }),
  };
  return ann;
}

/**
 * Deserializes a single Annotation from JSON.
 * @param json - The annotation JSON node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized Annotation.
 * @throws {Error} If JSON is invalid.
 */
function deserializeAnnotation(
  json: Readonly<JsonASTNode>,
  deserializer: Readonly<JsonDeserializer>
): Annotation {
  const name = extractNameFromJsonValue(json.name, json);
  const argsJson =
    getOptionalJsonASTNodeArrayProperty(json, 'arguments') ??
    getOptionalJsonASTNodeArrayProperty(json, 'args') ??
    getOptionalJsonASTNodeArrayProperty(json, 'values') ??
    [];
  const EMPTY_LENGTH = 0;
  const args = argsJson.map((a: Readonly<JsonASTNode>) =>
    deserializeAnnotationArgument(a, undefined, deserializer)
  );
  const ann: Annotation = {
    '@type': 'Annotation',
    name,
    ...(args.length > EMPTY_LENGTH && { arguments: args }),
  };
  return ann;
}

/**
 * Deserializes parameters from JSON.
 * @param json - The JSON node.
 * @param deserializer - The deserializer instance.
 * @returns Array of Parameter.
 * @throws {Error} If JSON is invalid.
 */
function deserializeParameters(
  json: Readonly<JsonASTNode>,
  deserializer: Readonly<JsonDeserializer>
): Parameter[] {
  const arr =
    getOptionalJsonASTNodeArrayProperty(json, 'parameters') ??
    getOptionalJsonASTNodeArrayProperty(json, 'parameterDeclarations') ??
    [];
  const result: Parameter[] = [];
  for (const p of arr) {
    result.push(deserializeParameter(p, deserializer));
  }
  return result;
}

/**
 * Deserializes annotations from JSON.
 * @param json - The JSON node.
 * @param deserializer - The deserializer instance.
 * @returns Array of Annotation or undefined.
 * @throws {Error} If JSON is invalid.
 */
function deserializeAnnotations(
  json: Readonly<JsonASTNode>,
  deserializer: Readonly<JsonDeserializer>
): Annotation[] | undefined {
  const arr = getOptionalJsonASTNodeArrayProperty(json, 'annotations');
  if (!arr) return undefined;
  const result: Annotation[] = [];
  for (const a of arr) {
    const node = deserializer.deserializeNode(a);
    if (!isAnnotation(node)) throw new Error('Invalid annotations: expected Annotation');
    result.push(node);
  }
  return result;
}

/**
 * Deserializes an EnumValue from JSON.
 * @param json - The JSON object to deserialize.
 * @returns The deserialized EnumValue node.
 * @throws {Error} If JSON is invalid.
 */
function deserializeEnumValue(json: Readonly<JsonASTNode>): EnumValue {
  const idNode = getOptionalJsonASTNodeProperty(json, 'id');
  if (!idNode) throw new Error('Invalid EnumValue: missing id');
  const id = deserializeIdentifier(idNode);
  return NodeFactory.createEnumValue(id);
}

/**
 * Deserializes an EnumDeclaration from JSON.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized EnumDeclaration node.
 * @throws {Error} If JSON is invalid.
 */
function deserializeEnumDeclaration(
  json: Readonly<JsonASTNode>,
  locationOption: Readonly<{ location: SourceRange }> | undefined,
  deserializer: Readonly<JsonDeserializer>
): EnumDeclaration {
  const idNode = getOptionalJsonASTNodeProperty(json, 'id');
  const name = idNode
    ? deserializeIdentifier(idNode).string
    : (getOptionalStringProperty(json, 'name') ?? '');
  const modifiers = (getOptionalJsonASTNodeArrayProperty(json, 'modifiers') ?? []).map(
    (m: Readonly<JsonASTNode>) => {
      const mod = deserializer.deserializeNode(m);
      if (!isModifier(mod)) throw new Error('Invalid EnumDeclaration: modifier is not Modifier');
      return mod;
    }
  );
  const valuesJson = getOptionalJsonASTNodeArrayProperty(json, 'values') ?? [];
  const values = valuesJson.map((v: Readonly<JsonASTNode>) => deserializeEnumValue(v));
  const bodyDeclarationsJson =
    getOptionalJsonASTNodeArrayProperty(json, 'bodyDeclarations') ??
    getOptionalJsonASTNodeArrayProperty(json, 'members') ??
    getOptionalJsonASTNodeArrayProperty(json, 'innerTypeDeclarations');
  const bodyDeclarations = bodyDeclarationsJson
    ? filterEnumMembers(
        bodyDeclarationsJson.map((m: Readonly<JsonASTNode>) => deserializer.deserializeNode(m))
      )
    : undefined;
  return NodeFactory.createEnumDeclaration({
    bodyDeclarations,
    modifiers,
    name,
    options: locationOption,
    values,
  });
}

/**
 * Deserializes an InterfaceDeclaration from JSON.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized InterfaceDeclaration node.
 * @throws {Error} If JSON is invalid.
 */
function deserializeInterfaceDeclaration(
  json: Readonly<JsonASTNode>,
  locationOption: Readonly<{ location: SourceRange }> | undefined,
  deserializer: Readonly<JsonDeserializer>
): InterfaceDeclaration {
  const idNode = getOptionalJsonASTNodeProperty(json, 'id');
  const name = idNode
    ? deserializeIdentifier(idNode).string
    : (getOptionalStringProperty(json, 'name') ?? '');
  const modifiers = (getOptionalJsonASTNodeArrayProperty(json, 'modifiers') ?? []).map(
    (m: Readonly<JsonASTNode>) => {
      const mod = deserializer.deserializeNode(m);
      if (!isModifier(mod))
        throw new Error('Invalid InterfaceDeclaration: modifier is not Modifier');
      return mod;
    }
  );
  const extendsTypesJson =
    getOptionalJsonASTNodeArrayProperty(json, 'extendsTypes') ??
    getOptionalJsonASTNodeArrayProperty(json, 'extendsClause');
  const extendsClause = extendsTypesJson
    ? extendsTypesJson.map((t: Readonly<JsonASTNode>) =>
        deserializeTypeRefNode(t, undefined, deserializer)
      )
    : undefined;
  const bodyDeclarationsJson =
    getOptionalJsonASTNodeArrayProperty(json, 'bodyDeclarations') ??
    getOptionalJsonASTNodeArrayProperty(json, 'members') ??
    getOptionalJsonASTNodeArrayProperty(json, 'methodDeclarations') ??
    [];
  const bodyDeclarations = filterInterfaceMembers(
    bodyDeclarationsJson.map((m: Readonly<JsonASTNode>) => deserializer.deserializeNode(m))
  );
  return NodeFactory.createInterfaceDeclaration({
    extendsTypes: extendsClause,
    bodyDeclarations,
    modifiers,
    name,
    options: locationOption,
    typeParameters: deserializeTypeParameters(json, deserializer),
  });
}

/**
 * Deserializes a MethodDeclaration from JSON.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized MethodDeclaration node.
 * @throws {Error} If JSON is invalid.
 */
function deserializeMethodDeclaration(
  json: Readonly<JsonASTNode>,
  locationOption: Readonly<{ location: SourceRange }> | undefined,
  deserializer: Readonly<JsonDeserializer>
): MethodDeclaration {
  const EMPTY_LENGTH = 0;
  const idNode = getOptionalJsonASTNodeProperty(json, 'id');
  const name = idNode
    ? deserializeIdentifier(idNode).string
    : (getOptionalStringProperty(json, 'name') ?? '');
  const returnTypeNode = getOptionalJsonASTNodeProperty(json, 'returnType');
  if (!returnTypeNode) throw new Error('Invalid MethodDeclaration: missing returnType');
  const returnType = deserializeTypeRefNode(returnTypeNode, undefined, deserializer);
  const modifiers = (getOptionalJsonASTNodeArrayProperty(json, 'modifiers') ?? []).map(
    (m: Readonly<JsonASTNode>) => {
      const mod = deserializer.deserializeNode(m);
      if (!isModifier(mod)) throw new Error('Invalid MethodDeclaration: modifier is not Modifier');
      return mod;
    }
  );
  const bodyNode = getOptionalJsonASTNodeProperty(json, 'body');
  const bodyDeserialized = bodyNode ? deserializer.deserializeNode(bodyNode) : undefined;
  const body =
    bodyDeserialized != null && isCompoundStatement(bodyDeserialized)
      ? bodyDeserialized
      : undefined;
  const annotations = deserializeAnnotations(json, deserializer);
  const isConstructor = typeof json.isConstructor === 'boolean' ? json.isConstructor : undefined;
  return NodeFactory.createMethodDeclaration({
    modifiers,
    name,
    parameterDeclarations: deserializeParameters(json, deserializer),
    returnType,
    ...(annotations != null && annotations.length > EMPTY_LENGTH && { annotations }),
    ...(body != null && { body }),
    ...(isConstructor !== undefined && { isConstructor }),
    options: locationOption,
    typeParameters: deserializeTypeParameters(json, deserializer),
  });
}

/**
 * Deserializes a PropertyDeclaration from JSON.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized PropertyDeclaration node.
 * @throws {Error} If JSON is invalid.
 */
function deserializePropertyDeclaration(
  json: Readonly<JsonASTNode>,
  locationOption: Readonly<{ location: SourceRange }> | undefined,
  deserializer: Readonly<JsonDeserializer>
): PropertyDeclaration {
  const idNode = getOptionalJsonASTNodeProperty(json, 'id');
  const name = idNode
    ? deserializeIdentifier(idNode).string
    : (getOptionalStringProperty(json, 'name') ?? '');
  const typeNode = getOptionalJsonASTNodeProperty(json, 'type');
  if (!typeNode) throw new Error('Invalid PropertyDeclaration: missing type');
  const type = deserializeTypeRefNode(typeNode, undefined, deserializer);
  const modifiers = (getOptionalJsonASTNodeArrayProperty(json, 'modifiers') ?? []).map(
    (m: Readonly<JsonASTNode>) => {
      const mod = deserializer.deserializeNode(m);
      if (!isModifier(mod))
        throw new Error('Invalid PropertyDeclaration: modifier is not Modifier');
      return mod;
    }
  );
  const getterNode = getOptionalJsonASTNodeProperty(json, 'getter');
  const setterNode = getOptionalJsonASTNodeProperty(json, 'setter');
  const getterDeserialized = getterNode ? deserializer.deserializeNode(getterNode) : undefined;
  const setterDeserialized = setterNode ? deserializer.deserializeNode(setterNode) : undefined;
  const getter =
    getterDeserialized != null && isCompoundStatement(getterDeserialized)
      ? getterDeserialized
      : undefined;
  const setter =
    setterDeserialized != null && isCompoundStatement(setterDeserialized)
      ? setterDeserialized
      : undefined;
  const annotations = deserializeAnnotations(json, deserializer);
  return NodeFactory.createPropertyDeclaration({
    modifiers,
    name,
    type,
    ...(getter != null && { getter }),
    ...(setter != null && { setter }),
    ...(annotations && { annotations }),
    options: locationOption,
  });
}

/**
 * Deserializes a ClassDeclaration from JSON.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized ClassDeclaration node.
 * @throws {Error} If JSON is invalid.
 */
function deserializeClassDeclaration(
  json: Readonly<JsonASTNode>,
  locationOption: Readonly<{ location: SourceRange }> | undefined,
  deserializer: Readonly<JsonDeserializer>
): ClassDeclaration {
  const idNode = getOptionalJsonASTNodeProperty(json, 'id');
  const name = idNode
    ? deserializeIdentifier(idNode).string
    : (getOptionalStringProperty(json, 'name') ?? '');
  const modifiersJson = getOptionalJsonASTNodeArrayProperty(json, 'modifiers') ?? [];
  const modifiers: Modifier[] = [];
  const annotationModifiers: Annotation[] = [];
  for (const m of modifiersJson) {
    const rec = m as Record<string, unknown>;
    const typeStr = rec['@type'] ?? rec.kind;
    if (typeStr === 'AnnotationModifier') {
      annotationModifiers.push(deserializeAnnotationModifier(m, deserializer));
    } else {
      const mod = deserializer.deserializeNode(m);
      if (!isModifier(mod)) throw new Error('Invalid ClassDeclaration: modifier is not Modifier');
      modifiers.push(mod);
    }
  }
  const extendsTypeNode =
    getOptionalJsonASTNodeProperty(json, 'extendsType') ??
    getOptionalJsonASTNodeProperty(json, 'extendsClause');
  const extendsClause = extendsTypeNode
    ? deserializeTypeRefNode(extendsTypeNode, undefined, deserializer)
    : undefined;
  const implementsTypesJson =
    getOptionalJsonASTNodeArrayProperty(json, 'implementsTypes') ??
    getOptionalJsonASTNodeArrayProperty(json, 'implementsClause');
  const implementsClause = implementsTypesJson
    ? implementsTypesJson.map((t: Readonly<JsonASTNode>) =>
        deserializeTypeRefNode(t, undefined, deserializer)
      )
    : undefined;

  // Upstream splits bodyDeclarations into fieldDeclarations/propertyDeclarations/methodDeclarations + innerTypeDeclarations.
  const bodyDeclarations: (
    | ClassDeclaration
    | EnumDeclaration
    | InterfaceDeclaration
    | MethodDeclaration
    | PropertyDeclaration
    | VariableDeclaration
  )[] = [];
  const innerTypes = getOptionalJsonASTNodeArrayProperty(json, 'innerTypeDeclarations') ?? [];
  for (const it of innerTypes) {
    const node = deserializer.deserializeNode(it);
    if (
      isClassDeclaration(node) ||
      isEnumDeclaration(node) ||
      isInterfaceDeclaration(node) ||
      isMethodDeclaration(node) ||
      isPropertyDeclaration(node) ||
      isVariableDeclaration(node)
    ) {
      bodyDeclarations.push(node);
    }
  }
  const fields = getOptionalJsonASTNodeArrayProperty(json, 'fieldDeclarations') ?? [];
  for (const f of fields) {
    const node = deserializer.deserializeNode(f);
    if (isVariableDeclaration(node)) bodyDeclarations.push(node);
  }
  const props = getOptionalJsonASTNodeArrayProperty(json, 'propertyDeclarations') ?? [];
  for (const p of props) {
    const node = deserializer.deserializeNode(p);
    if (isPropertyDeclaration(node)) bodyDeclarations.push(node);
  }
  const methods = getOptionalJsonASTNodeArrayProperty(json, 'methodDeclarations') ?? [];
  for (const m of methods) {
    const node = deserializer.deserializeNode(m);
    if (isMethodDeclaration(node)) bodyDeclarations.push(node);
  }

  const EMPTY_LENGTH = 0;
  const directAnnotations = deserializeAnnotations(json, deserializer);
  const annotations =
    annotationModifiers.length > EMPTY_LENGTH
      ? [...annotationModifiers, ...(directAnnotations ?? [])]
      : directAnnotations;
  const typeParameters = deserializeTypeParameters(json, deserializer);

  return NodeFactory.createClassDeclaration({
    modifiers,
    name,
    ...(extendsClause != null && { extendsType: extendsClause }),
    ...(implementsClause != null && { implementsTypes: implementsClause }),
    bodyDeclarations,
    ...(annotations && annotations.length > EMPTY_LENGTH && { annotations }),
    ...(typeParameters && { typeParameters }),
    options: locationOption,
  });
}

/**
 * Deserializes a TriggerDeclaration from JSON.
 * @param json - The JSON object to deserialize.
 * @param locationOption - Optional source location data for the deserialized node.
 * @param deserializer - The deserializer instance.
 * @returns The deserialized TriggerDeclaration node.
 */
function deserializeTriggerDeclaration(
  json: Readonly<JsonASTNode>,
  locationOption: Readonly<{ location: SourceRange }> | undefined,
  deserializer: Readonly<JsonDeserializer>
): TriggerDeclaration {
  const idNode = getJsonASTNodeProperty(json, 'id');
  const id = deserializeIdentifier(idNode);
  const targetNode = getJsonASTNodeProperty(json, 'target');
  const target = deserializeIdentifier(targetNode);
  const casesJson = getOptionalJsonASTNodeArrayProperty(json, 'cases') ?? [];
  const cases: TriggerCase[] = casesJson.map((c: unknown) => {
    const s = typeof c === 'string' ? c : String(c);
    if (Object.values(TriggerCase).includes(s as TriggerCase)) {
      return s as TriggerCase;
    }
    return TriggerCase.TRIGGER_BEFORE_INSERT; // fallback for unknown
  });
  const bodyJson = getOptionalJsonASTNodeArrayProperty(json, 'body') ?? [];
  const body: (Declaration | Statement)[] = [];
  for (const b of bodyJson) {
    const node = deserializer.deserializeNode(b);
    if (isDeclaration(node) || isStatement(node)) body.push(node);
  }
  return NodeFactory.createTriggerDeclaration({
    body,
    cases,
    id,
    options: locationOption,
    target,
  });
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
  deserializeParameter,
  deserializeAnnotation,
  deserializeAnnotationModifier,
  deserializeClassDeclaration,
  deserializeEnumDeclaration,
  deserializeEnumValue,
  deserializeInterfaceDeclaration,
  deserializeMethodDeclaration,
  deserializePropertyDeclaration,
  deserializeTriggerDeclaration,
};
