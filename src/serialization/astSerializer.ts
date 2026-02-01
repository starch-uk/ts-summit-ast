/**
 * @file AST node serialization.
 * Dispatches serialization to specialized encoders and contains all serialization logic.
 */

import type { ASTNode } from '../ast/baseNode.js';
import type {
  Statement,
  IfStatement,
  ForLoopStatement,
  WhileLoopStatement,
  ReturnStatement,
  CompoundStatement,
  ExpressionStatement,
  VariableDeclarationStatement,
} from '../ast/statement.js';
import type {
  BinaryExpression,
  CallExpression,
  FieldExpression,
  ArrayExpression,
  AssignExpression,
  NewExpression,
  VariableExpression,
  Expression,
} from '../ast/expression.js';
import type { TypeRef, TypeRefComponent } from '../ast/baseNode.js';
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
import type { VariableDeclaration, AnnotationArgument, Modifier } from '../ast/declaration.js';
import type { JsonASTNode } from './jsonSerializer.js';
import type { JsonSerializer } from './jsonSerializer.js';

/** Readonly view of JSON AST node for serializer function parameters (satisfies prefer-readonly-parameter-types). */
interface ReadonlyJsonASTNodeParam {
  readonly '@type': string;
  // eslint-disable-next-line @typescript-eslint/member-ordering -- Index signature must be last
  readonly [key: string]: unknown;
}

/** Readonly view of serializer for function parameters (satisfies prefer-readonly-parameter-types). */
interface ReadonlyJsonSerializerLike {
  readonly serializeNode: (node: Readonly<ASTNode>) => JsonASTNode;
}

/**
 * Cast readonly json to mutable for population (serializer mutates the object).
 * @param json - Read-only JSON AST node to cast to mutable.
 * @returns Mutable JSON AST node for population.
 */
function asMutableJson(json: Readonly<JsonASTNode>): JsonASTNode {
  return json as JsonASTNode;
}

/**
 * Type guard for ASTNode when serializing unknown node properties.
 * @param x - Value to check.
 * @returns True if x is an ASTNode.
 */
function isASTNodeForSerialize(x: unknown): x is ASTNode {
  return x !== null && typeof x === 'object' && 'kind' in x;
}

/**
 * Type guard for TypeRef when serializing unknown node properties.
 * @param x - Value to check.
 * @returns True if x is a TypeRef.
 */
function isTypeRefForSerialize(x: unknown): x is TypeRef {
  return x !== null && typeof x === 'object' && 'components' in x && 'arrayNesting' in x;
}

// ============================================================================
// Statement Serialization
// ============================================================================

/**
 * Serialize an if statement node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeIfStatement(
  node: Readonly<IfStatement>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.condition = serializer.serializeNode(node.condition);
  out.thenStatement = serializer.serializeNode(node.thenStatement);
  if (node.elseStatement) {
    out.elseStatement = serializer.serializeNode(node.elseStatement);
  }
}

/**
 * Serialize a for loop statement node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeForLoopStatement(
  node: Readonly<ForLoopStatement>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  if (node.init) {
    out.init = serializer.serializeNode(node.init);
  }
  if (node.condition) {
    out.condition = serializer.serializeNode(node.condition);
  }
  if (node.update) {
    out.update = serializer.serializeNode(node.update);
  }
  out.body = serializer.serializeNode(node.body);
}

/**
 * Serialize a while loop statement node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeWhileLoopStatement(
  node: Readonly<WhileLoopStatement>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.condition = serializer.serializeNode(node.condition);
  out.body = serializer.serializeNode(node.body);
}

/**
 * Serialize a return statement node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeReturnStatement(
  node: Readonly<ReturnStatement>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  if (node.expression) {
    out.expression = serializer.serializeNode(node.expression);
  }
}

/**
 * Serialize a compound statement (block) node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeCompoundStatement(
  node: Readonly<CompoundStatement>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.statements = node.statements.map((stmt: Readonly<Statement>) =>
    serializer.serializeNode(stmt)
  );
}

/**
 * Serialize an expression statement node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeExpressionStatement(
  node: Readonly<ExpressionStatement>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.expression = serializer.serializeNode(node.expression);
}

/**
 * Serialize a variable declaration statement node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeVariableDeclarationStatement(
  node: Readonly<VariableDeclarationStatement>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.declaration = serializer.serializeNode(node.declaration);
}

// ============================================================================
// Expression Serialization
// ============================================================================

/**
 * Serialize a binary expression node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeBinaryExpression(
  node: Readonly<BinaryExpression>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.operator = node.operator;
  out.left = serializer.serializeNode(node.left);
  out.right = serializer.serializeNode(node.right);
}

/**
 * Serializes a TypeRef node to JSON (TypeRef is an AST node in summit-ast).
 * @param typeRef - The type reference node to serialize.
 * @param serializer - The serializer instance.
 * @returns The serialized TypeRef JSON representation.
 */
function serializeTypeRef(
  typeRef: Readonly<TypeRef>,
  serializer: ReadonlyJsonSerializerLike
): unknown {
  // TypeRef is an AST node, so serialize it as a node
  return serializer.serializeNode(typeRef);
}

/**
 * Serialize a type reference node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeTypeRefNode(
  node: Readonly<TypeRef>,
  json: Readonly<JsonASTNode>,
  serializer: ReadonlyJsonSerializerLike
): void {
  const out = asMutableJson(json);
  out.components = node.components.map((comp: Readonly<TypeRefComponent>) => ({
    args: comp.args.map((arg: Readonly<TypeRef>) => serializeTypeRef(arg, serializer)),
    id: serializer.serializeNode(comp.id),
  }));
  out.arrayNesting = node.arrayNesting;
}

/**
 * Serialize a call expression node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeCallExpression(
  node: Readonly<CallExpression>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.methodName = node.methodName;
  if (node.target) {
    out.target = serializer.serializeNode(node.target);
  }
  out.arguments = node.arguments.map((arg: Readonly<Expression>) => serializer.serializeNode(arg));
  if (node.typeArguments) {
    out.typeArguments = node.typeArguments.map((type: Readonly<TypeRef>) =>
      serializeTypeRef(type, serializer)
    );
  }
}

/**
 * Serialize a field expression node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeFieldExpression(
  node: Readonly<FieldExpression>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.fieldName = node.fieldName;
  if (node.target) {
    out.target = serializer.serializeNode(node.target);
  }
}

/**
 * Serialize an array expression node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeArrayExpression(
  node: Readonly<ArrayExpression>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.array = serializer.serializeNode(node.array);
  out.index = serializer.serializeNode(node.index);
}

/**
 * Serialize an assignment expression node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeAssignExpression(
  node: Readonly<AssignExpression>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.operator = node.operator;
  out.left = serializer.serializeNode(node.left);
  out.right = serializer.serializeNode(node.right);
}

/**
 * Serialize a new expression node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeNewExpression(
  node: Readonly<Readonly<NewExpression>>,
  json: ReadonlyJsonASTNodeParam,
  serializer: ReadonlyJsonSerializerLike
): void {
  const out = asMutableJson(json as Readonly<JsonASTNode>);
  out.initializer = serializer.serializeNode(node.initializer);
}

/**
 * Serialize a variable expression node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeVariableExpression(
  node: Readonly<VariableExpression>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.id = serializer.serializeNode(node.id);
}

// ============================================================================
// Literal Serialization
// ============================================================================

/**
 * Serialize a string value literal node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 */
function serializeStringVal(node: Readonly<StringVal>, json: Readonly<JsonASTNode>): void {
  const out = asMutableJson(json);
  out.value = node.value;
  out.raw = node.raw;
}

/**
 * Serialize a numeric literal node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 */
function serializeNumericLiteral(
  node: Readonly<DecimalVal | DoubleVal | IntegerVal | LongVal>,
  json: Readonly<JsonASTNode>
): void {
  const out = asMutableJson(json);
  out.value = node.value;
  out.raw = node.raw;
}

/**
 * Serialize a boolean value literal node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 */
function serializeBooleanVal(node: Readonly<BooleanVal>, json: Readonly<JsonASTNode>): void {
  const out = asMutableJson(json);
  out.value = node.value;
}

// ============================================================================
// Initializer Serialization
// ============================================================================

/**
 * Serialize a constructor initializer node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeConstructorInitializer(
  node: Readonly<ConstructorInitializer>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.type = serializeTypeRef(node.type, serializer);
  out.args = node.args.map((arg: Readonly<Expression>) => serializer.serializeNode(arg));
}

/**
 * Serialize a values initializer node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeValuesInitializer(
  node: Readonly<ValuesInitializer>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.type = serializeTypeRef(node.type, serializer);
  out.values = node.values.map((val) => serializer.serializeNode(val));
}

/**
 * Serialize a sized array initializer node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeSizedArrayInitializer(
  node: Readonly<SizedArrayInitializer>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.type = serializeTypeRef(node.type, serializer);
  out.size = serializer.serializeNode(node.size);
}

/**
 * Serialize a map initializer node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeMapInitializer(
  node: Readonly<Readonly<MapInitializer>>,
  json: ReadonlyJsonASTNodeParam,
  serializer: ReadonlyJsonSerializerLike
): void {
  const out = asMutableJson(json as Readonly<JsonASTNode>);
  out.type = serializeTypeRef(node.type, serializer);
  out.pairs = node.pairs.map(
    (pair: Readonly<{ key: Readonly<Expression>; value: Readonly<Expression> }>) => ({
      key: serializer.serializeNode(pair.key),
      value: serializer.serializeNode(pair.value),
    })
  );
}

// ============================================================================
// ElementValue Serialization
// ============================================================================

/**
 * Serialize an expression element value node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeExpressionElementValue(
  node: Readonly<ExpressionElementValue>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.value = serializer.serializeNode(node.value);
}

/**
 * Serialize an annotation element value node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeAnnotationElementValue(
  node: Readonly<AnnotationElementValue>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.value = serializer.serializeNode(node.value);
}

/**
 * Serialize an array element value node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeArrayElementValue(
  node: Readonly<ArrayElementValue>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.values = node.values.map((val: Readonly<ElementValue>) => serializer.serializeNode(val));
}

// ============================================================================
// Declaration Serialization
// ============================================================================

/**
 * Serialize an annotation argument node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeAnnotationArgument(
  node: Readonly<AnnotationArgument>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  if (typeof node.name === 'string' && node.name !== '') {
    out.name = node.name;
  }
  out.value = serializer.serializeNode(node.value);
  if (node.isNameImplicit !== undefined) {
    out.isNameImplicit = node.isNameImplicit;
  }
}

/**
 * Serialize a variable declaration node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeVariableDeclaration(
  node: Readonly<VariableDeclaration>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  out.name = node.name;
  out.type = serializeTypeRef(node.type, serializer);
  if (node.initializer) {
    out.initializer = serializer.serializeNode(node.initializer);
  }
  const emptyArrayLength = 0;
  if (node.modifiers && node.modifiers.length > emptyArrayLength) {
    out.modifiers = node.modifiers.map((mod: Readonly<Modifier>) => serializer.serializeNode(mod));
  }
}

// Modifier serialization

/**
 * Serialize a modifier node to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 */
function serializeModifier(node: Readonly<Modifier>, json: Readonly<JsonASTNode>): void {
  const out = asMutableJson(json);
  out.keyword = node.keyword;
}

// ============================================================================
// Dispatcher
// ============================================================================

/**
 * Serialize an unknown AST node to JSON (fallback for node types without dedicated serializers).
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeUnknownNode(
  node: Readonly<ASTNode>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  // Try to serialize all enumerable properties
  for (const key in node) {
    if (key !== 'kind' && key !== 'location' && Object.prototype.hasOwnProperty.call(node, key)) {
      const desc = Object.getOwnPropertyDescriptor(node, key);
      const value: unknown = desc && 'value' in desc ? desc.value : undefined;

      if (isASTNodeForSerialize(value)) {
        out[key] = serializer.serializeNode(value);
      } else if (Array.isArray(value)) {
        const emptyArrayLength = 0;
        const zeroIndex = 0;
        if (value.length > emptyArrayLength) {
          // Non-empty array: check if it contains AST nodes or TypeRefs
          const first: unknown = value[zeroIndex];
          const isNodeOrRef =
            first !== null &&
            first !== undefined &&
            typeof first === 'object' &&
            ('kind' in first || ('components' in first && 'arrayNesting' in first));
          if (isNodeOrRef) {
            out[key] = (value as unknown[]).map((item: unknown) => {
              if (isASTNodeForSerialize(item)) {
                return serializer.serializeNode(item);
              }
              if (isTypeRefForSerialize(item)) {
                return serializeTypeRef(item, serializer);
              }
              return item;
            });
          }
        } else {
          // Empty array: serialize as empty array
          out[key] = [];
        }
      } else if (
        value !== null &&
        value !== undefined &&
        typeof value === 'object' &&
        'components' in value &&
        'arrayNesting' in value
      ) {
        if (isTypeRefForSerialize(value)) {
          out[key] = serializeTypeRef(value, serializer);
        } else {
          out[key] = value;
        }
      } else {
        // Primitive value
        out[key] = value;
      }
    }
  }
}

/**
 * Serialize node-specific properties to JSON.
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeNodeProperties(
  node: Readonly<ASTNode>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  switch (node.kind) {
    // Statement nodes
    case 'IfStatement':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific statement type
      serializeIfStatement(node as IfStatement, json, serializer);
      break;
    case 'ForLoopStatement':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific statement type
      serializeForLoopStatement(node as ForLoopStatement, json, serializer);
      break;
    case 'WhileLoopStatement':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific statement type
      serializeWhileLoopStatement(node as WhileLoopStatement, json, serializer);
      break;
    case 'ReturnStatement':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific statement type
      serializeReturnStatement(node as ReturnStatement, json, serializer);
      break;
    case 'CompoundStatement':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific statement type
      serializeCompoundStatement(node as CompoundStatement, json, serializer);
      break;
    case 'ExpressionStatement':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific statement type
      serializeExpressionStatement(node as ExpressionStatement, json, serializer);
      break;
    case 'VariableDeclarationStatement':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific statement type
      serializeVariableDeclarationStatement(node as VariableDeclarationStatement, json, serializer);
      break;
    case 'EnhancedForLoopStatement':
    case 'DoWhileLoopStatement':
      // Use generic serialization
      break;

    // Expression nodes
    case 'BinaryExpression':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific expression type
      serializeBinaryExpression(node as BinaryExpression, json, serializer);
      break;
    case 'CallExpression':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific expression type
      serializeCallExpression(node as CallExpression, json, serializer);
      break;
    case 'FieldExpression':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific expression type
      serializeFieldExpression(node as FieldExpression, json, serializer);
      break;
    case 'ArrayExpression':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific expression type
      serializeArrayExpression(node as ArrayExpression, json, serializer);
      break;
    case 'AssignExpression':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific expression type
      serializeAssignExpression(node as AssignExpression, json, serializer);
      break;
    case 'NewExpression':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific expression type
      serializeNewExpression(node as NewExpression, json, serializer);
      break;
    case 'VariableExpression':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific expression type
      serializeVariableExpression(node as VariableExpression, json, serializer);
      break;
    case 'SoqlExpression':
    case 'SoslExpression':
      // Use generic serialization
      break;

    // Literal nodes
    case 'StringVal':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific literal type
      serializeStringVal(node as StringVal, json);
      break;
    case 'IntegerVal':
    case 'DoubleVal':
    case 'LongVal':
    case 'DecimalVal':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific literal type
      serializeNumericLiteral(node as DecimalVal | DoubleVal | IntegerVal | LongVal, json);
      break;
    case 'BooleanVal':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific literal type
      serializeBooleanVal(node as BooleanVal, json);
      break;
    case 'NullVal':
      // No additional properties
      break;

    // Declaration nodes
    case 'VariableDeclaration':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific declaration type
      serializeVariableDeclaration(node as VariableDeclaration, json, serializer);
      break;

    // Modifier
    case 'Modifier':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific modifier type
      serializeModifier(node as Modifier, json);
      break;

    // TypeRef (AST node in summit-ast)
    case 'TypeRef':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific type ref
      serializeTypeRefNode(node as TypeRef, json, serializer);
      break;

    // Initializer nodes
    case 'ConstructorInitializer':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific initializer type
      serializeConstructorInitializer(node as ConstructorInitializer, json, serializer);
      break;
    case 'ValuesInitializer':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific initializer type
      serializeValuesInitializer(node as ValuesInitializer, json, serializer);
      break;
    case 'SizedArrayInitializer':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific initializer type
      serializeSizedArrayInitializer(node as SizedArrayInitializer, json, serializer);
      break;
    case 'MapInitializer':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific initializer type
      serializeMapInitializer(node as MapInitializer, json, serializer);
      break;

    // ElementValue nodes
    case 'ExpressionElementValue':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific element value type
      serializeExpressionElementValue(node as ExpressionElementValue, json, serializer);
      break;
    case 'AnnotationElementValue':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific element value type
      serializeAnnotationElementValue(node as AnnotationElementValue, json, serializer);
      break;
    case 'ArrayElementValue':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific element value type
      serializeArrayElementValue(node as ArrayElementValue, json, serializer);
      break;

    // Declaration nodes
    case 'AnnotationArgument':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific annotation argument type
      serializeAnnotationArgument(node as AnnotationArgument, json, serializer);
      break;

    default:
      // For unknown node types, try to serialize all properties
      serializeUnknownNode(node, json, serializer);
  }
}

export {
  serializeIfStatement,
  serializeForLoopStatement,
  serializeWhileLoopStatement,
  serializeReturnStatement,
  serializeCompoundStatement,
  serializeExpressionStatement,
  serializeVariableDeclarationStatement,
  serializeBinaryExpression,
  serializeCallExpression,
  serializeFieldExpression,
  serializeArrayExpression,
  serializeAssignExpression,
  serializeNewExpression,
  serializeVariableExpression,
  serializeTypeRef,
  serializeTypeRefNode,
  serializeStringVal,
  serializeNumericLiteral,
  serializeBooleanVal,
  serializeConstructorInitializer,
  serializeValuesInitializer,
  serializeSizedArrayInitializer,
  serializeMapInitializer,
  serializeExpressionElementValue,
  serializeAnnotationElementValue,
  serializeArrayElementValue,
  serializeAnnotationArgument,
  serializeVariableDeclaration,
  serializeModifier,
  serializeNodeProperties,
};
