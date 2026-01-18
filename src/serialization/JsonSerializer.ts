/**
 * @file JSON serializer for AST nodes.
 *
 * Converts AST nodes to JSON format for storage, transmission, or debugging.
 */

/* eslint-disable import/group-exports -- Inline exports are standard TypeScript practice */

import type { ASTNode, SourceRange } from '../ast/base.js';
import type {
  Statement,
  IfStatement,
  ForLoopStatement,
  WhileLoopStatement,
  ReturnStatement,
  CompoundStatement,
  ExpressionStatement,
  VariableDeclarationStatement,
} from '../ast/Statement.js';
import type {
  Expression,
  BinaryExpression,
  CallExpression,
  FieldExpression,
  ArrayExpression,
  AssignExpression,
  NewExpression,
  VariableExpression,
} from '../ast/Expression.js';
import type { TypeRef } from '../ast/Type.js';
import type { ElementValue } from '../ast/ElementValue.js';
import type { Modifier } from '../ast/Declaration.js';
import type {
  StringVal,
  IntegerVal,
  DoubleVal,
  LongVal,
  DecimalVal,
  BooleanVal,
} from '../ast/Literal.js';
import type {
  ConstructorInitializer,
  ValuesInitializer,
  SizedArrayInitializer,
  MapInitializer,
} from '../ast/Initializer.js';
import type {
  ExpressionElementValue,
  AnnotationElementValue,
  ArrayElementValue,
} from '../ast/ElementValue.js';
import type { VariableDeclaration, AnnotationArgument } from '../ast/Declaration.js';

/**
 * JSON representation of an AST node.
 */
export interface JsonASTNode {
  '@type': string;
  // eslint-disable-next-line @typescript-eslint/member-ordering -- Index signature must be last
  [key: string]: unknown;
}

/**
 * Options for JSON serialization.
 */
export interface SerializationOptions {
  /**
   * Whether to include source location information.
   */
  includeLocation?: boolean;

  /**
   * Whether to use compact format (minimize whitespace).
   */
  compact?: boolean;

  /**
   * Custom replacer function (similar to JSON.stringify replacer).
   */
  replacer?: (key: string, value: unknown) => unknown;
}

/**
 * JSON Serializer for AST nodes.
 */
export class JsonSerializer {
  private readonly options: Required<SerializationOptions>;

  public constructor(options: Readonly<SerializationOptions> = {}) {
    this.options = {
      compact: options.compact ?? false,
      includeLocation: options.includeLocation ?? true,
      replacer: options.replacer ?? ((_key, value): unknown => value),
    };
  }

  /**
   * Serialize an AST node to JSON string.
   * @param node - The AST node to serialize.
   * @returns The serialized JSON string representation of the node.
   */
  public serialize(node: Readonly<ASTNode>): string {
    const json = this.serializeNode(node);

    const indentSize = 2;
    return this.options.compact ? JSON.stringify(json) : JSON.stringify(json, null, indentSize);
  }

  /**
   * Serialize an AST node to JSON object.
   * @param node - The AST node to serialize.
   * @returns The serialized JSON object representation of the node.
   */
  public serializeNode(node: ASTNode): JsonASTNode {
    const json: JsonASTNode = {
      '@type': node.kind,
    };

    // Add location if requested
    if (this.options.includeLocation && node.location) {
      json.location = this.serializeLocation(node.location);
    }

    // Serialize node-specific properties
    this.serializeNodeProperties(node, json);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Replacer function returns JsonASTNode
    return this.options.replacer('', json) as JsonASTNode;
  }

  /**
   * Serialize source location.
   * @param location - The source range location to serialize.
   * @returns The serialized location object with start and end positions.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Utility method that may be used as instance method
  private serializeLocation(location: SourceRange): unknown {
    return {
      end: {
        column: location.end.column,
        line: location.end.line,
        ...(location.end.offset !== undefined && { offset: location.end.offset }),
      },
      start: {
        column: location.start.column,
        line: location.start.line,
        ...(location.start.offset !== undefined && { offset: location.start.offset }),
      },
    };
  }

  /**
   * Serialize node-specific properties based on kind.
   * @param node - The AST node whose properties are to be serialized.
   * @param json - The JSON object to populate with serialized properties.
   */
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeNodeProperties(node: ASTNode, json: JsonASTNode): void {
    switch (node.kind) {
      // Statement nodes
      case 'IfStatement':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific statement type
        this.serializeIfStatement(node as IfStatement, json);
        break;
      case 'ForLoopStatement':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific statement type
        this.serializeForLoopStatement(node as ForLoopStatement, json);
        break;
      case 'WhileLoopStatement':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific statement type
        this.serializeWhileLoopStatement(node as WhileLoopStatement, json);
        break;
      case 'ReturnStatement':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific statement type
        this.serializeReturnStatement(node as ReturnStatement, json);
        break;
      case 'CompoundStatement':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific statement type
        this.serializeCompoundStatement(node as CompoundStatement, json);
        break;
      case 'ExpressionStatement':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific statement type
        this.serializeExpressionStatement(node as ExpressionStatement, json);
        break;
      case 'VariableDeclarationStatement':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific statement type
        this.serializeVariableDeclarationStatement(node as VariableDeclarationStatement, json);
        break;
      case 'EnhancedForLoopStatement':
      case 'DoWhileLoopStatement':
        // Use generic serialization
        break;

      // Expression nodes
      case 'BinaryExpression':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific expression type
        this.serializeBinaryExpression(node as BinaryExpression, json);
        break;
      case 'CallExpression':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific expression type
        this.serializeCallExpression(node as CallExpression, json);
        break;
      case 'FieldExpression':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific expression type
        this.serializeFieldExpression(node as FieldExpression, json);
        break;
      case 'ArrayExpression':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific expression type
        this.serializeArrayExpression(node as ArrayExpression, json);
        break;
      case 'AssignExpression':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific expression type
        this.serializeAssignExpression(node as AssignExpression, json);
        break;
      case 'NewExpression':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific expression type
        this.serializeNewExpression(node as NewExpression, json);
        break;
      case 'VariableExpression':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific expression type
        this.serializeVariableExpression(node as VariableExpression, json);
        break;
      case 'SoqlExpression':
      case 'SoslExpression':
        // Use generic serialization
        break;

      // Literal nodes
      case 'StringVal':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific literal type
        this.serializeStringVal(node as StringVal, json);
        break;
      case 'IntegerVal':
      case 'DoubleVal':
      case 'LongVal':
      case 'DecimalVal':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific literal type
        this.serializeNumericLiteral(node as DecimalVal | DoubleVal | IntegerVal | LongVal, json);
        break;
      case 'BooleanVal':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific literal type
        this.serializeBooleanVal(node as BooleanVal, json);
        break;
      case 'NullVal':
        // No additional properties
        break;

      // Declaration nodes
      case 'VariableDeclaration':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific declaration type
        this.serializeVariableDeclaration(node as VariableDeclaration, json);
        break;

      // Modifier
      case 'Modifier':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific modifier type
        this.serializeModifier(node as Modifier, json);
        break;

      // TypeRef (AST node in summit-ast)
      case 'TypeRef':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific type ref
        this.serializeTypeRefNode(node as TypeRef, json);
        break;

      // Initializer nodes
      case 'ConstructorInitializer':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific initializer type
        this.serializeConstructorInitializer(node as ConstructorInitializer, json);
        break;
      case 'ValuesInitializer':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific initializer type
        this.serializeValuesInitializer(node as ValuesInitializer, json);
        break;
      case 'SizedArrayInitializer':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific initializer type
        this.serializeSizedArrayInitializer(node as SizedArrayInitializer, json);
        break;
      case 'MapInitializer':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific initializer type
        this.serializeMapInitializer(node as MapInitializer, json);
        break;

      // ElementValue nodes
      case 'ExpressionElementValue':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific element value type
        this.serializeExpressionElementValue(node as ExpressionElementValue, json);
        break;
      case 'AnnotationElementValue':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific element value type
        this.serializeAnnotationElementValue(node as AnnotationElementValue, json);
        break;
      case 'ArrayElementValue':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific element value type
        this.serializeArrayElementValue(node as ArrayElementValue, json);
        break;

      // Declaration nodes
      case 'AnnotationArgument':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from ASTNode to specific annotation argument type
        this.serializeAnnotationArgument(node as AnnotationArgument, json);
        break;

      default:
        // For unknown node types, try to serialize all properties
        this.serializeUnknownNode(node, json);
    }
  }

  // Statement serialization methods

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeIfStatement(node: Readonly<IfStatement>, json: JsonASTNode): void {
    json.condition = this.serializeNode(node.condition);
    json.thenStatement = this.serializeNode(node.thenStatement);
    if (node.elseStatement) {
      json.elseStatement = this.serializeNode(node.elseStatement);
    }
  }

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeForLoopStatement(node: Readonly<ForLoopStatement>, json: JsonASTNode): void {
    if (node.init) {
      json.init = this.serializeNode(node.init);
    }
    if (node.condition) {
      json.condition = this.serializeNode(node.condition);
    }
    if (node.update) {
      json.update = this.serializeNode(node.update);
    }
    json.body = this.serializeNode(node.body);
  }

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeWhileLoopStatement(node: Readonly<WhileLoopStatement>, json: JsonASTNode): void {
    json.condition = this.serializeNode(node.condition);
    json.body = this.serializeNode(node.body);
  }

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeReturnStatement(node: Readonly<ReturnStatement>, json: JsonASTNode): void {
    if (node.expression) {
      json.expression = this.serializeNode(node.expression);
    }
  }

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeCompoundStatement(node: Readonly<CompoundStatement>, json: JsonASTNode): void {
    json.statements = node.statements.map((stmt: Readonly<Statement>) => this.serializeNode(stmt));
  }

  private serializeExpressionStatement(
    node: Readonly<ExpressionStatement>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
    json: JsonASTNode
  ): void {
    json.expression = this.serializeNode(node.expression);
  }

  private serializeVariableDeclarationStatement(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    node: Readonly<VariableDeclarationStatement>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
    json: JsonASTNode
  ): void {
    json.declaration = this.serializeNode(node.declaration);
  }

  // Expression serialization methods

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeBinaryExpression(node: Readonly<BinaryExpression>, json: JsonASTNode): void {
    json.operator = node.operator;
    json.left = this.serializeNode(node.left);
    json.right = this.serializeNode(node.right);
  }

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeCallExpression(node: Readonly<CallExpression>, json: JsonASTNode): void {
    json.methodName = node.methodName;
    if (node.target) {
      json.target = this.serializeNode(node.target);
    }
    json.arguments = node.arguments.map((arg: Readonly<Expression>) => this.serializeNode(arg));
    if (node.typeArguments) {
      json.typeArguments = node.typeArguments.map((type: Readonly<TypeRef>) =>
        this.serializeTypeRef(type)
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeFieldExpression(node: Readonly<FieldExpression>, json: JsonASTNode): void {
    json.fieldName = node.fieldName;
    if (node.target) {
      json.target = this.serializeNode(node.target);
    }
  }

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeArrayExpression(node: Readonly<ArrayExpression>, json: JsonASTNode): void {
    json.array = this.serializeNode(node.array);
    json.index = this.serializeNode(node.index);
  }

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeAssignExpression(node: Readonly<AssignExpression>, json: JsonASTNode): void {
    json.operator = node.operator;
    json.left = this.serializeNode(node.left);
    json.right = this.serializeNode(node.right);
  }

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeNewExpression(node: Readonly<NewExpression>, json: JsonASTNode): void {
    json.initializer = this.serializeNode(node.initializer);
  }

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeVariableExpression(node: Readonly<VariableExpression>, json: JsonASTNode): void {
    json.id = this.serializeNode(node.id);
  }

  // Literal serialization methods

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeStringVal(node: Readonly<StringVal>, json: JsonASTNode): void {
    json.value = node.value;
    json.raw = node.raw;
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Utility method that may be used as instance method
  private serializeNumericLiteral(
    node: Readonly<DecimalVal | DoubleVal | IntegerVal | LongVal>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
    json: JsonASTNode
  ): void {
    json.value = node.value;
    json.raw = node.raw;
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Utility method that may be used as instance method
  private serializeBooleanVal(
    node: Readonly<BooleanVal>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
    json: JsonASTNode
  ): void {
    json.value = node.value;
  }

  /**
   * TypeRef serialization (TypeRef is an AST node in summit-ast).
   * @param typeRef - The TypeRef node to serialize.
   * @returns The serialized TypeRef JSON representation.
   */
  private serializeTypeRef(typeRef: Readonly<TypeRef>): unknown {
    // TypeRef is an AST node, so serialize it as a node
    return this.serializeNode(typeRef);
  }

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeTypeRefNode(node: Readonly<TypeRef>, json: JsonASTNode): void {
    json.components = node.components.map(
      (comp: Readonly<import('../ast/Type.js').TypeRefComponent>) => ({
        args: comp.args.map((arg: Readonly<TypeRef>) => this.serializeTypeRef(arg)),
        id: this.serializeNode(comp.id),
      })
    );
    json.arrayNesting = node.arrayNesting;
  }

  /**
   * Initializer serialization methods.
   * @param node - The constructor initializer node.
   * @param json - The JSON object to populate.
   */

  private serializeConstructorInitializer(
    node: Readonly<ConstructorInitializer>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
    json: JsonASTNode
  ): void {
    json.type = this.serializeTypeRef(node.type);
    json.args = node.args.map((arg: Readonly<Expression>) => this.serializeNode(arg));
  }

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeValuesInitializer(node: Readonly<ValuesInitializer>, json: JsonASTNode): void {
    json.type = this.serializeTypeRef(node.type);
    json.values = node.values.map((val) => this.serializeNode(val));
  }

  private serializeSizedArrayInitializer(
    node: Readonly<SizedArrayInitializer>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
    json: JsonASTNode
  ): void {
    json.type = this.serializeTypeRef(node.type);
    json.size = this.serializeNode(node.size);
  }

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeMapInitializer(node: Readonly<MapInitializer>, json: JsonASTNode): void {
    json.type = this.serializeTypeRef(node.type);
    json.pairs = node.pairs.map((pair: Readonly<{ key: Expression; value: Expression }>) => ({
      key: this.serializeNode(pair.key),
      value: this.serializeNode(pair.value),
    }));
  }

  /**
   * ElementValue serialization methods.
   * @param node
   * @param json
   */

  private serializeExpressionElementValue(
    node: Readonly<ExpressionElementValue>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
    json: JsonASTNode
  ): void {
    json.value = this.serializeNode(node.value);
  }

  private serializeAnnotationElementValue(
    node: Readonly<AnnotationElementValue>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
    json: JsonASTNode
  ): void {
    json.value = this.serializeNode(node.value);
  }

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeArrayElementValue(node: Readonly<ArrayElementValue>, json: JsonASTNode): void {
    json.values = node.values.map((val: Readonly<ElementValue>) => this.serializeNode(val));
  }

  /**
   * Declaration serialization methods.
   * @param node - The declaration node to serialize.
   * @param json - The JSON object to populate with serialized declaration properties.
   */
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeAnnotationArgument(node: Readonly<AnnotationArgument>, json: JsonASTNode): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Check for non-empty string
    if (node.name !== null && node.name !== undefined && node.name !== '') {
      json.name = node.name;
    }
    json.value = this.serializeNode(node.value);
    if (node.isNameImplicit !== undefined) {
      json.isNameImplicit = node.isNameImplicit;
    }
  }

  private serializeVariableDeclaration(
    node: Readonly<VariableDeclaration>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
    json: JsonASTNode
  ): void {
    json.name = node.name;
    json.type = this.serializeTypeRef(node.type);
    if (node.initializer) {
      json.initializer = this.serializeNode(node.initializer);
    }

    const emptyArrayLength = 0;

    if (
      node.modifiers !== null &&
      node.modifiers !== undefined &&
      node.modifiers.length > emptyArrayLength
    ) {
      json.modifiers = node.modifiers.map((mod: Readonly<Modifier>) => this.serializeNode(mod));
    }
  }

  // Modifier serialization

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Utility method that may be used as instance method
  private serializeModifier(
    node: Readonly<Modifier>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
    json: JsonASTNode
  ): void {
    json.keyword = node.keyword;
  }

  // Fallback for unknown node types

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- json parameter needs to be mutable
  private serializeUnknownNode(node: ASTNode, json: JsonASTNode): void {
    // Try to serialize all enumerable properties
    for (const key in node) {
      if (key !== 'kind' && key !== 'location' && Object.prototype.hasOwnProperty.call(node, key)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Dynamic property access for unknown nodes
        const value = (node as unknown as Record<string, unknown>)[key];

        if (value !== null && value !== undefined && typeof value === 'object' && 'kind' in value) {
          // It's an AST node
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing from unknown to ASTNode
          json[key] = this.serializeNode(value as ASTNode);
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
                  return this.serializeNode(item);
                } else if ('components' in item && 'arrayNesting' in item) {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Dynamic serialization for unknown node types
                  return this.serializeTypeRef(item as TypeRef);
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
          json[key] = this.serializeTypeRef(value as import('../ast/Type.js').TypeRef);
        } else {
          // Primitive value
          json[key] = value;
        }
      }
    }
  }
}
