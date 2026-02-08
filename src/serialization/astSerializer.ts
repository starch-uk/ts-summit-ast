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
} from '../ast/initializer.js';
import type {
  Annotation,
  ClassDeclaration,
  EnumDeclaration,
  InterfaceDeclaration,
  MethodDeclaration,
  PropertyDeclaration,
  VariableDeclaration,
  AnnotationArgument,
  Modifier,
} from '../ast/declaration.js';
import {
  isIfStatement,
  isForLoopStatement,
  isWhileLoopStatement,
  isReturnStatement,
  isCompoundStatement,
  isExpressionStatement,
  isVariableDeclarationStatement,
} from '../guard/statementGuard.js';
import {
  isBinaryExpression,
  isCallExpression,
  isFieldExpression,
  isArrayExpression,
  isNewExpression,
  isVariableExpression,
  isAssignExpression,
} from '../guard/expressionGuard.js';
import { isStringVal, isNumberLiteral, isBooleanVal } from '../guard/literalGuard.js';
import {
  isVariableDeclaration,
  isModifier,
  isTypeRef,
  isAnnotationArgument,
  isClassDeclaration,
  isEnumDeclaration,
  isInterfaceDeclaration,
  isMethodDeclaration,
  isPropertyDeclaration,
} from '../guard/declarationGuard.js';
import {
  isConstructorInitializer,
  isValuesInitializer,
  isSizedArrayInitializer,
  isMapInitializer,
  isExpressionElementValue,
  isAnnotationElementValue,
  isArrayElementValue,
} from '../guard/initGuard.js';
import type { JsonSerializer } from './jsonSerializer.js';
import type { JsonASTNode } from './jsonSerializer.js';

/** Readonly view of JSON AST node for serializer function parameters (satisfies prefer-readonly-parameter-types). */
interface ReadonlyJsonASTNodeParam {
  readonly [key: string]: unknown;
  readonly '@type': string;
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
  return x !== null && typeof x === 'object' && '@type' in x;
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
  if (node.value) {
    out.value = serializer.serializeNode(node.value);
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
  const g = node.group;
  out.group = {
    declarations: g.declarations.map((d) => ({
      id: serializer.serializeNode(d.id),
      ...(d.initializer && { initializer: serializer.serializeNode(d.initializer) }),
      ...(d.sourceLocation && { sourceLocation: d.sourceLocation }),
    })),
    modifiers: g.modifiers.map((m) => serializer.serializeNode(m)),
    type: serializeTypeRef(g.type, serializer),
    ...(g.sourceLocation && { sourceLocation: g.sourceLocation }),
  };
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
  out.op = node.op;
  out.left = serializer.serializeNode(node.left);
  out.right = serializer.serializeNode(node.right);
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
  out.id = serializer.serializeNode(node.id);
  if (node.receiver) {
    out.receiver = serializer.serializeNode(node.receiver);
  }
  out.args = node.args.map((arg: Readonly<Expression>) => serializer.serializeNode(arg));
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
  out.field = serializer.serializeNode(node.field);
  if (node.obj) {
    out.obj = serializer.serializeNode(node.obj);
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
  out.target = serializer.serializeNode(node.target);
  out.source = serializer.serializeNode(node.source);
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
  out.pairs = node.pairs.map((pair: Readonly<{ first: Expression; second: Expression }>) => ({
    first: serializer.serializeNode(pair.first),
    second: serializer.serializeNode(pair.second),
  }));
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
  out.values = node.values.map(
    (val: Readonly<AnnotationElementValue | ArrayElementValue | ExpressionElementValue>) =>
      serializer.serializeNode(val)
  );
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
  out.id = serializer.serializeNode(node.id);
  out.type = serializeTypeRef(node.type, serializer);
  if (node.initializer) {
    out.initializer = serializer.serializeNode(node.initializer);
  }
  const emptyArrayLength = 0;
  if (node.modifiers && node.modifiers.length > emptyArrayLength) {
    out.modifiers = node.modifiers.map((mod: Readonly<Modifier>) => serializer.serializeNode(mod));
  }
}

// Modifier serialization (summit-ast format)

/** Maps our modifier keyword to summit-ast KeywordModifier enum (uppercase, no spaces). */
const MODIFIER_KEYWORD_TO_CANONICAL: Record<string, string> = {
  abstract: 'ABSTRACT',
  deprecated: 'DEPRECATED',
  final: 'FINAL',
  future: 'FUTURE',
  global: 'GLOBAL',
  'inherited sharing': 'INHERITEDSHARING',
  native: 'NATIVE',
  override: 'OVERRIDE',
  private: 'PRIVATE',
  protected: 'PROTECTED',
  public: 'PUBLIC',
  static: 'STATIC',
  strictfp: 'STRICTFP',
  synchronized: 'SYNCHRONIZED',
  testMethod: 'TESTMETHOD',
  transient: 'TRANSIENT',
  virtual: 'VIRTUAL',
  volatile: 'VOLATILE',
  webservice: 'WEBSERVICE',
  'with sharing': 'WITHSHARING',
  'without sharing': 'WITHOUTSHARING',
};

/**
 * Serialize an Annotation to summit-ast AnnotationModifier format.
 * @param node - The annotation AST node to serialize.
 * @param serializer - The serializer instance.
 * @returns JsonASTNode in AnnotationModifier format.
 */
function serializeAnnotationAsModifier(
  node: Readonly<Annotation>,
  serializer: Readonly<JsonSerializer>
): JsonASTNode {
  const nameStr = typeof node.name === 'string' ? node.name : '';
  const nameObj: JsonASTNode = {
    '@type': 'Identifier',
    sourceLocation: node.sourceLocation ?? {},
    string: nameStr,
  };
  const args = (node.arguments ?? []).map((a: Readonly<AnnotationArgument>) => {
    const argJson: JsonASTNode = {
      '@type': 'AnnotationArgument',
      name: { sourceLocation: a.sourceLocation ?? {}, string: a.name ?? 'value' },
      value: serializer.serializeNode(a.value),
      ...(a.isNameImplicit !== undefined && { isNameImplicit: a.isNameImplicit }),
      ...(a.sourceLocation && { sourceLocation: a.sourceLocation }),
    };
    return argJson;
  });
  return {
    '@type': 'AnnotationModifier',
    args,
    name: nameObj,
    ...(node.sourceLocation && { sourceLocation: node.sourceLocation }),
  };
}

/**
 * Serialize a keyword Modifier to summit-ast KeywordModifier format (uppercase enum).
 * @param node - The modifier AST node to serialize.
 * @param json - The JSON object to populate.
 */
function serializeModifierAsKeywordModifier(
  node: Readonly<Modifier>,
  json: Readonly<JsonASTNode>
): void {
  const out = asMutableJson(json);
  out['@type'] = 'KeywordModifier';
  out.keyword =
    MODIFIER_KEYWORD_TO_CANONICAL[node.keyword] ?? node.keyword.toUpperCase().replace(/\s+/g, '');
}

/**
 * Build modifiers array in summit-ast format: annotations first (as AnnotationModifier), then keyword modifiers (as KeywordModifier).
 * @param annotations - Annotations from the declaration.
 * @param modifiers - Keyword modifiers from the declaration.
 * @param serializer - The serializer instance.
 * @returns Combined modifiers array.
 */
function buildModifiersArrayForSummitAst(
  annotations: readonly Annotation[] | undefined,
  modifiers: readonly Modifier[] | undefined,
  serializer: Readonly<JsonSerializer>
): JsonASTNode[] {
  const result: JsonASTNode[] = [];
  const emptyLength = 0;
  if (annotations && annotations.length > emptyLength) {
    for (const ann of annotations) {
      result.push(serializeAnnotationAsModifier(ann, serializer));
    }
  }
  if (modifiers && modifiers.length > emptyLength) {
    for (const mod of modifiers) {
      const json: JsonASTNode = { '@type': 'Modifier' };
      serializeModifierAsKeywordModifier(mod, json);
      result.push(json);
    }
  }
  return result;
}

/**
 * Serialize an unknown AST node to JSON (fallback for node types without dedicated serializers).
 * @param node - The AST node to serialize.
 * @param json - The output JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeUnknownNode(
  node: Readonly<ASTNode>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  const out = asMutableJson(json);
  for (const key in node) {
    if (
      key !== '@type' &&
      key !== 'sourceLocation' &&
      Object.prototype.hasOwnProperty.call(node, key)
    ) {
      const desc = Object.getOwnPropertyDescriptor(node, key);
      const value: unknown = desc && 'value' in desc ? desc.value : undefined;

      if (isASTNodeForSerialize(value)) {
        out[key] = serializer.serializeNode(value);
      } else if (Array.isArray(value)) {
        const emptyArrayLength = 0;
        const zeroIndex = 0;
        if (value.length > emptyArrayLength) {
          const first: unknown = value[zeroIndex];
          const isNodeOrRef =
            first !== null &&
            first !== undefined &&
            typeof first === 'object' &&
            ('@type' in first || ('components' in first && 'arrayNesting' in first));
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
        out[key] = value;
      }
    }
  }
}

/**
 * Serialize a modifier node to JSON (legacy/fallback - outputs KeywordModifier for summit-ast compatibility).
 * @param node - The AST node to serialize.
 * @param json - The JSON object to populate.
 */
function serializeModifier(node: Readonly<Modifier>, json: Readonly<JsonASTNode>): void {
  serializeModifierAsKeywordModifier(node, json);
}

/**
 * Serialize ClassDeclaration with modifiers in summit-ast format (AnnotationModifier + KeywordModifier combined).
 * @param node - The class declaration AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeClassDeclaration(
  node: Readonly<ClassDeclaration>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  serializeUnknownNode(node, json, serializer);
  const out = asMutableJson(json);
  out.modifiers = buildModifiersArrayForSummitAst(node.annotations, node.modifiers, serializer);
  delete out.annotations;
}

/**
 * Serialize InterfaceDeclaration with modifiers in summit-ast format.
 * @param node - The interface declaration AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeInterfaceDeclaration(
  node: Readonly<InterfaceDeclaration>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  serializeUnknownNode(node, json, serializer);
  const out = asMutableJson(json);
  out.modifiers = buildModifiersArrayForSummitAst(undefined, node.modifiers, serializer);
}

/**
 * Serialize MethodDeclaration with modifiers in summit-ast format.
 * @param node - The method declaration AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeMethodDeclaration(
  node: Readonly<MethodDeclaration>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  serializeUnknownNode(node, json, serializer);
  const out = asMutableJson(json);
  out.modifiers = buildModifiersArrayForSummitAst(node.annotations, node.modifiers, serializer);
  delete out.annotations;
}

/**
 * Serialize PropertyDeclaration with modifiers in summit-ast format.
 * @param node - The property declaration AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializePropertyDeclaration(
  node: Readonly<PropertyDeclaration>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  serializeUnknownNode(node, json, serializer);
  const out = asMutableJson(json);
  out.modifiers = buildModifiersArrayForSummitAst(node.annotations, node.modifiers, serializer);
  delete out.annotations;
}

/**
 * Serialize EnumDeclaration with modifiers in summit-ast format.
 * @param node - The enum declaration AST node to serialize.
 * @param json - The JSON object to populate.
 * @param serializer - The serializer instance.
 */
function serializeEnumDeclaration(
  node: Readonly<EnumDeclaration>,
  json: Readonly<JsonASTNode>,
  serializer: Readonly<JsonSerializer>
): void {
  serializeUnknownNode(node, json, serializer);
  const out = asMutableJson(json);
  out.modifiers = buildModifiersArrayForSummitAst(undefined, node.modifiers, serializer);
}

// ============================================================================
// Dispatcher
// ============================================================================

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
  if (isIfStatement(node)) {
    serializeIfStatement(node, json, serializer);
  } else if (isForLoopStatement(node)) {
    serializeForLoopStatement(node, json, serializer);
  } else if (isWhileLoopStatement(node)) {
    serializeWhileLoopStatement(node, json, serializer);
  } else if (isReturnStatement(node)) {
    serializeReturnStatement(node, json, serializer);
  } else if (isCompoundStatement(node)) {
    serializeCompoundStatement(node, json, serializer);
  } else if (isExpressionStatement(node)) {
    serializeExpressionStatement(node, json, serializer);
  } else if (isVariableDeclarationStatement(node)) {
    serializeVariableDeclarationStatement(node, json, serializer);
  } else if (isBinaryExpression(node)) {
    serializeBinaryExpression(node, json, serializer);
  } else if (isCallExpression(node)) {
    serializeCallExpression(node, json, serializer);
  } else if (isFieldExpression(node)) {
    serializeFieldExpression(node, json, serializer);
  } else if (isArrayExpression(node)) {
    serializeArrayExpression(node, json, serializer);
  } else if (isAssignExpression(node)) {
    serializeAssignExpression(node, json, serializer);
  } else if (isNewExpression(node)) {
    serializeNewExpression(node, json, serializer);
  } else if (isVariableExpression(node)) {
    serializeVariableExpression(node, json, serializer);
  } else if (isStringVal(node)) {
    serializeStringVal(node, json);
  } else if (isNumberLiteral(node)) {
    serializeNumericLiteral(node, json);
  } else if (isBooleanVal(node)) {
    serializeBooleanVal(node, json);
  } else if (isVariableDeclaration(node)) {
    serializeVariableDeclaration(node, json, serializer);
  } else if (isModifier(node)) {
    serializeModifier(node, json);
  } else if (isTypeRef(node)) {
    serializeTypeRefNode(node, json, serializer);
  } else if (isConstructorInitializer(node)) {
    serializeConstructorInitializer(node, json, serializer);
  } else if (isValuesInitializer(node)) {
    serializeValuesInitializer(node, json, serializer);
  } else if (isSizedArrayInitializer(node)) {
    serializeSizedArrayInitializer(node, json, serializer);
  } else if (isMapInitializer(node)) {
    serializeMapInitializer(node, json, serializer);
  } else if (isExpressionElementValue(node)) {
    serializeExpressionElementValue(node, json, serializer);
  } else if (isAnnotationElementValue(node)) {
    serializeAnnotationElementValue(node, json, serializer);
  } else if (isArrayElementValue(node)) {
    serializeArrayElementValue(node, json, serializer);
  } else if (isAnnotationArgument(node)) {
    serializeAnnotationArgument(node, json, serializer);
  } else if (isClassDeclaration(node)) {
    serializeClassDeclaration(node, json, serializer);
  } else if (isInterfaceDeclaration(node)) {
    serializeInterfaceDeclaration(node, json, serializer);
  } else if (isMethodDeclaration(node)) {
    serializeMethodDeclaration(node, json, serializer);
  } else if (isPropertyDeclaration(node)) {
    serializePropertyDeclaration(node, json, serializer);
  } else if (isEnumDeclaration(node)) {
    serializeEnumDeclaration(node, json, serializer);
  } else {
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
