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

// ============================================================================
// Statement Serialization
// ============================================================================

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeIfStatement(
  node: Readonly<IfStatement>,
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.condition = serializer.serializeNode(node.condition);
  json.thenStatement = serializer.serializeNode(node.thenStatement);
  if (node.elseStatement) {
    json.elseStatement = serializer.serializeNode(node.elseStatement);
  }
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeForLoopStatement(
  node: Readonly<ForLoopStatement>,
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  if (node.init) {
    json.init = serializer.serializeNode(node.init);
  }
  if (node.condition) {
    json.condition = serializer.serializeNode(node.condition);
  }
  if (node.update) {
    json.update = serializer.serializeNode(node.update);
  }
  json.body = serializer.serializeNode(node.body);
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeWhileLoopStatement(
  node: Readonly<WhileLoopStatement>,
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.condition = serializer.serializeNode(node.condition);
  json.body = serializer.serializeNode(node.body);
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeReturnStatement(
  node: Readonly<ReturnStatement>,
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  if (node.expression) {
    json.expression = serializer.serializeNode(node.expression);
  }
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeCompoundStatement(
  node: Readonly<CompoundStatement>,
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.statements = node.statements.map((stmt: Readonly<Statement>) =>
    serializer.serializeNode(stmt)
  );
}

export function serializeExpressionStatement(
  node: Readonly<ExpressionStatement>,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.expression = serializer.serializeNode(node.expression);
}

export function serializeVariableDeclarationStatement(
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
  node: Readonly<VariableDeclarationStatement>,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.declaration = serializer.serializeNode(node.declaration);
}

// ============================================================================
// Expression Serialization
// ============================================================================

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeBinaryExpression(
  node: Readonly<BinaryExpression>,
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.operator = node.operator;
  json.left = serializer.serializeNode(node.left);
  json.right = serializer.serializeNode(node.right);
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeCallExpression(
  node: Readonly<CallExpression>,
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.methodName = node.methodName;
  if (node.target) {
    json.target = serializer.serializeNode(node.target);
  }
  json.arguments = node.arguments.map((arg: Readonly<Expression>) => serializer.serializeNode(arg));
  if (node.typeArguments) {
    json.typeArguments = node.typeArguments.map((type: Readonly<TypeRef>) =>
      serializeTypeRef(type, serializer)
    );
  }
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeFieldExpression(
  node: Readonly<FieldExpression>,
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.fieldName = node.fieldName;
  if (node.target) {
    json.target = serializer.serializeNode(node.target);
  }
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeArrayExpression(
  node: Readonly<ArrayExpression>,
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.array = serializer.serializeNode(node.array);
  json.index = serializer.serializeNode(node.index);
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeAssignExpression(
  node: Readonly<AssignExpression>,
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.operator = node.operator;
  json.left = serializer.serializeNode(node.left);
  json.right = serializer.serializeNode(node.right);
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeNewExpression(
  node: Readonly<NewExpression>,
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.initializer = serializer.serializeNode(node.initializer);
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeVariableExpression(
  node: Readonly<VariableExpression>,
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.id = serializer.serializeNode(node.id);
}

/**
 * Serializes a TypeRef node to JSON (TypeRef is an AST node in summit-ast).
 * @param typeRef - The type reference node to serialize.
 * @param serializer - The serializer instance.
 * @returns The serialized TypeRef JSON representation.
 */
export function serializeTypeRef(typeRef: Readonly<TypeRef>, serializer: JsonSerializer): unknown {
  // TypeRef is an AST node, so serialize it as a node
  return serializer.serializeNode(typeRef);
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeTypeRefNode(
  node: Readonly<TypeRef>,
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.components = node.components.map((comp: Readonly<TypeRefComponent>) => ({
    args: comp.args.map((arg: Readonly<TypeRef>) => serializeTypeRef(arg, serializer)),
    id: serializer.serializeNode(comp.id),
  }));
  json.arrayNesting = node.arrayNesting;
}

// ============================================================================
// Literal Serialization
// ============================================================================

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeStringVal(node: Readonly<StringVal>, json: JsonASTNode): void {
  json.value = node.value;
  json.raw = node.raw;
}

export function serializeNumericLiteral(
  node: Readonly<DecimalVal | DoubleVal | IntegerVal | LongVal>,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  json: JsonASTNode
): void {
  json.value = node.value;
  json.raw = node.raw;
}

export function serializeBooleanVal(
  node: Readonly<BooleanVal>,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  json: JsonASTNode
): void {
  json.value = node.value;
}

// ============================================================================
// Initializer Serialization
// ============================================================================

export function serializeConstructorInitializer(
  node: Readonly<ConstructorInitializer>,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.type = serializeTypeRef(node.type, serializer);
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Callback parameter is effectively readonly
  json.args = node.args.map((arg: Readonly<Expression>) => serializer.serializeNode(arg));
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeValuesInitializer(
  node: Readonly<ValuesInitializer>,
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.type = serializeTypeRef(node.type, serializer);
  json.values = node.values.map((val) => serializer.serializeNode(val));
}

export function serializeSizedArrayInitializer(
  node: Readonly<SizedArrayInitializer>,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.type = serializeTypeRef(node.type, serializer);
  json.size = serializer.serializeNode(node.size);
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeMapInitializer(
  node: Readonly<MapInitializer>,
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.type = serializeTypeRef(node.type, serializer);
  json.pairs = node.pairs.map((pair: Readonly<{ key: Expression; value: Expression }>) => ({
    key: serializer.serializeNode(pair.key),
    value: serializer.serializeNode(pair.value),
  }));
}

// ============================================================================
// ElementValue Serialization
// ============================================================================

export function serializeExpressionElementValue(
  node: Readonly<ExpressionElementValue>,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.value = serializer.serializeNode(node.value);
}

export function serializeAnnotationElementValue(
  node: Readonly<AnnotationElementValue>,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.value = serializer.serializeNode(node.value);
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeArrayElementValue(
  node: Readonly<ArrayElementValue>,
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Callback parameter is effectively readonly
  json.values = node.values.map((val: Readonly<ElementValue>) => serializer.serializeNode(val));
}

// ============================================================================
// Declaration Serialization
// ============================================================================

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeAnnotationArgument(
  node: Readonly<AnnotationArgument>,
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Check for non-empty string
  if (node.name !== null && node.name !== undefined && node.name !== '') {
    json.name = node.name;
  }
  json.value = serializer.serializeNode(node.value);
  if (node.isNameImplicit !== undefined) {
    json.isNameImplicit = node.isNameImplicit;
  }
}

export function serializeVariableDeclaration(
  node: Readonly<VariableDeclaration>,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  json: JsonASTNode,
  serializer: JsonSerializer
): void {
  json.name = node.name;
  json.type = serializeTypeRef(node.type, serializer);
  if (node.initializer) {
    json.initializer = serializer.serializeNode(node.initializer);
  }

  const emptyArrayLength = 0;

  if (node.modifiers && node.modifiers.length > emptyArrayLength) {
    json.modifiers = node.modifiers.map((mod: Readonly<Modifier>) => serializer.serializeNode(mod));
  }
}

// Modifier serialization

export function serializeModifier(
  node: Readonly<Modifier>,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  json: JsonASTNode
): void {
  json.keyword = node.keyword;
}

// ============================================================================
// Dispatcher
// ============================================================================

/**
 * Serialize node-specific properties based on kind.
 * @param node - The AST node whose properties are to be serialized.
 * @param json - The JSON object to populate with serialized properties.
 * @param serializer - The serializer instance to use for recursive serialization.
 */
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
export function serializeNodeProperties(
  node: ASTNode,
  json: JsonASTNode,
  serializer: JsonSerializer
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

// Fallback for unknown node types

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
function serializeUnknownNode(node: ASTNode, json: JsonASTNode, serializer: JsonSerializer): void {
  // Try to serialize all enumerable properties
  for (const key in node) {
    if (key !== 'kind' && key !== 'location' && Object.prototype.hasOwnProperty.call(node, key)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Dynamic property access for unknown nodes
      const value = (node as unknown as Record<string, unknown>)[key];

      if (value !== null && value !== undefined && typeof value === 'object' && 'kind' in value) {
        // It's an AST node
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from unknown to ASTNode
        json[key] = serializer.serializeNode(value as ASTNode);
      } else if (Array.isArray(value)) {
        const emptyArrayLength = 0;
        const zeroIndex = 0;
        if (value.length > emptyArrayLength) {
          // Non-empty array: check if it contains AST nodes or TypeRefs

          if (
            value[zeroIndex] !== null &&
            value[zeroIndex] !== undefined &&
            typeof value[zeroIndex] === 'object' &&
            ('kind' in value[zeroIndex] ||
              ('components' in value[zeroIndex] && 'arrayNesting' in value[zeroIndex]))
          ) {
            // It's an array of AST nodes or TypeRefs

            json[key] = value.map((item) => {
              if ('kind' in item) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- Dynamic serialization for unknown node types
                return serializer.serializeNode(item);
              } else if ('components' in item && 'arrayNesting' in item) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Dynamic serialization for unknown node types
                return serializeTypeRef(item as TypeRef, serializer);
              }
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- Dynamic serialization for unknown node types
              return item;
            });
          }
        } else {
          // Empty array: serialize as empty array
          json[key] = [];
        }
      } else if (
        value !== null &&
        value !== undefined &&
        typeof value === 'object' &&
        'components' in value &&
        'arrayNesting' in value
      ) {
        // It's a TypeRef
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing to TypeRef
        json[key] = serializeTypeRef(value as TypeRef, serializer);
      } else {
        // Primitive value
        json[key] = value;
      }
    }
  }
}
