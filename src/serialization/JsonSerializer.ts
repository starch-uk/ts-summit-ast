/**
 * @file JSON serializer for AST nodes.
 *
 * Converts AST nodes to JSON format for storage, transmission, or debugging.
 */

import type { ASTNode, SourceRange } from '../ast/base.js';
import type { StatementNode } from '../ast/Statement.js';
import type { ExpressionNode } from '../ast/Expression.js';
import type { TypeRef } from '../ast/Type.js';
import type { Modifier } from '../ast/Declaration.js';

/**
 * JSON representation of an AST node.
 */
export interface JsonASTNode {
  '@type': string;
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

  constructor(options: SerializationOptions = {}) {
    this.options = {
      compact: options.compact ?? false,
      includeLocation: options.includeLocation ?? true,
      replacer: options.replacer ?? ((_key, value) => value),
    };
  }

  /**
   * Serialize an AST node to JSON string.
   * @param node
   */
  serialize(node: ASTNode): string {
    const json = this.serializeNode(node);
    return this.options.compact ? JSON.stringify(json) : JSON.stringify(json, null, 2);
  }

  /**
   * Serialize an AST node to JSON object.
   * @param node
   */
  serializeNode(node: ASTNode): JsonASTNode {
    const json: JsonASTNode = {
      '@type': node.kind,
    };

    // Add location if requested
    if (this.options.includeLocation && node.location) {
      json.location = this.serializeLocation(node.location);
    }

    // Serialize node-specific properties
    this.serializeNodeProperties(node, json);

    return this.options.replacer('', json) as JsonASTNode;
  }

  /**
   * Serialize source location.
   * @param location
   */
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
   * @param node
   * @param json
   */
  private serializeNodeProperties(node: ASTNode, json: JsonASTNode): void {
    switch (node.kind) {
      // Statement nodes
      case 'IfStatement':
        this.serializeIfStatement(node as any, json);
        break;
      case 'ForLoopStatement':
        this.serializeForLoopStatement(node as any, json);
        break;
      case 'WhileLoopStatement':
        this.serializeWhileLoopStatement(node as any, json);
        break;
      case 'ReturnStatement':
        this.serializeReturnStatement(node as any, json);
        break;
      case 'CompoundStatement':
        this.serializeCompoundStatement(node as any, json);
        break;
      case 'ExpressionStatement':
        this.serializeExpressionStatement(node as any, json);
        break;
      case 'VariableDeclarationStatement':
        this.serializeVariableDeclarationStatement(node as any, json);
        break;
      case 'EnhancedForLoopStatement':
      case 'DoWhileLoopStatement':
        // Use generic serialization
        break;

      // Expression nodes
      case 'BinaryExpression':
        this.serializeBinaryExpression(node as any, json);
        break;
      case 'CallExpression':
        this.serializeCallExpression(node as any, json);
        break;
      case 'FieldExpression':
        this.serializeFieldExpression(node as any, json);
        break;
      case 'ArrayExpression':
        this.serializeArrayExpression(node as any, json);
        break;
      case 'AssignExpression':
        this.serializeAssignExpression(node as any, json);
        break;
      case 'NewExpression':
        this.serializeNewExpression(node as any, json);
        break;
      case 'VariableExpression':
        this.serializeVariableExpression(node as any, json);
        break;
      case 'SoqlExpression':
      case 'SoslExpression':
        // Use generic serialization
        break;

      // Literal nodes
      case 'StringVal':
        this.serializeStringVal(node as any, json);
        break;
      case 'IntegerVal':
      case 'DoubleVal':
      case 'LongVal':
      case 'DecimalVal':
        this.serializeNumericLiteral(node as any, json);
        break;
      case 'BooleanVal':
        this.serializeBooleanVal(node as any, json);
        break;
      case 'NullVal':
        // No additional properties
        break;

      // Declaration nodes
      case 'VariableDeclaration':
        this.serializeVariableDeclaration(node as any, json);
        break;

      // Modifier
      case 'Modifier':
        this.serializeModifier(node as any, json);
        break;

      // TypeRef (AST node in summit-ast)
      case 'TypeRef':
        this.serializeTypeRefNode(node as any, json);
        break;

      // Initializer nodes
      case 'ConstructorInitializer':
        this.serializeConstructorInitializer(node as any, json);
        break;
      case 'ValuesInitializer':
        this.serializeValuesInitializer(node as any, json);
        break;
      case 'SizedArrayInitializer':
        this.serializeSizedArrayInitializer(node as any, json);
        break;
      case 'MapInitializer':
        this.serializeMapInitializer(node as any, json);
        break;

      // ElementValue nodes
      case 'ExpressionElementValue':
        this.serializeExpressionElementValue(node as any, json);
        break;
      case 'AnnotationElementValue':
        this.serializeAnnotationElementValue(node as any, json);
        break;
      case 'ArrayElementValue':
        this.serializeArrayElementValue(node as any, json);
        break;

      // Declaration nodes
      case 'AnnotationArgument':
        this.serializeAnnotationArgument(node as any, json);
        break;

      default:
        // For unknown node types, try to serialize all properties
        this.serializeUnknownNode(node, json);
    }
  }

  // Statement serialization methods

  private serializeIfStatement(node: any, json: JsonASTNode): void {
    json.condition = this.serializeNode(node.condition);
    json.thenStatement = this.serializeNode(node.thenStatement);
    if (node.elseStatement) {
      json.elseStatement = this.serializeNode(node.elseStatement);
    }
  }

  private serializeForLoopStatement(node: any, json: JsonASTNode): void {
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

  private serializeWhileLoopStatement(node: any, json: JsonASTNode): void {
    json.condition = this.serializeNode(node.condition);
    json.body = this.serializeNode(node.body);
  }

  private serializeReturnStatement(node: any, json: JsonASTNode): void {
    if (node.expression) {
      json.expression = this.serializeNode(node.expression);
    }
  }

  private serializeCompoundStatement(node: any, json: JsonASTNode): void {
    json.statements = node.statements.map((stmt: StatementNode) => this.serializeNode(stmt));
  }

  private serializeExpressionStatement(node: any, json: JsonASTNode): void {
    json.expression = this.serializeNode(node.expression);
  }

  private serializeVariableDeclarationStatement(node: any, json: JsonASTNode): void {
    json.declaration = this.serializeNode(node.declaration);
  }

  // Expression serialization methods

  private serializeBinaryExpression(node: any, json: JsonASTNode): void {
    json.operator = node.operator;
    json.left = this.serializeNode(node.left);
    json.right = this.serializeNode(node.right);
  }

  private serializeCallExpression(node: any, json: JsonASTNode): void {
    json.methodName = node.methodName;
    if (node.target) {
      json.target = this.serializeNode(node.target);
    }
    json.arguments = node.arguments.map((arg: ExpressionNode) => this.serializeNode(arg));
    if (node.typeArguments) {
      json.typeArguments = node.typeArguments.map((type: TypeRef) => this.serializeTypeRef(type));
    }
  }

  private serializeFieldExpression(node: any, json: JsonASTNode): void {
    json.fieldName = node.fieldName;
    if (node.target) {
      json.target = this.serializeNode(node.target);
    }
  }

  private serializeArrayExpression(node: any, json: JsonASTNode): void {
    json.array = this.serializeNode(node.array);
    json.index = this.serializeNode(node.index);
  }

  private serializeAssignExpression(node: any, json: JsonASTNode): void {
    json.operator = node.operator;
    json.left = this.serializeNode(node.left);
    json.right = this.serializeNode(node.right);
  }

  private serializeNewExpression(node: any, json: JsonASTNode): void {
    json.initializer = this.serializeNode(node.initializer);
  }

  private serializeVariableExpression(node: any, json: JsonASTNode): void {
    json.id = this.serializeNode(node.id);
  }

  // Literal serialization methods

  private serializeStringVal(node: any, json: JsonASTNode): void {
    json.value = node.value;
    json.raw = node.raw;
  }

  private serializeNumericLiteral(node: any, json: JsonASTNode): void {
    json.value = node.value;
    json.raw = node.raw;
  }

  private serializeBooleanVal(node: any, json: JsonASTNode): void {
    json.value = node.value;
  }

  /**
   * TypeRef serialization (TypeRef is an AST node in summit-ast).
   * @param typeRef
   */
  private serializeTypeRef(typeRef: TypeRef): unknown {
    // TypeRef is an AST node, so serialize it as a node
    return this.serializeNode(typeRef);
  }

  private serializeTypeRefNode(node: TypeRef, json: JsonASTNode): void {
    json.components = node.components.map((comp) => ({
      args: comp.args.map((arg) => this.serializeTypeRef(arg)),
      id: this.serializeNode(comp.id),
    }));
    json.arrayNesting = node.arrayNesting;
  }

  /**
   * Initializer serialization methods.
   * @param node
   * @param json
   */
  private serializeConstructorInitializer(node: any, json: JsonASTNode): void {
    json.type = this.serializeTypeRef(node.type);
    json.args = node.args.map((arg: any) => this.serializeNode(arg));
  }

  private serializeValuesInitializer(node: any, json: JsonASTNode): void {
    json.type = this.serializeTypeRef(node.type);
    json.values = node.values.map((val: any) => this.serializeNode(val));
  }

  private serializeSizedArrayInitializer(node: any, json: JsonASTNode): void {
    json.type = this.serializeTypeRef(node.type);
    json.size = this.serializeNode(node.size);
  }

  private serializeMapInitializer(node: any, json: JsonASTNode): void {
    json.type = this.serializeTypeRef(node.type);
    json.pairs = node.pairs.map((pair: any) => ({
      key: this.serializeNode(pair.key),
      value: this.serializeNode(pair.value),
    }));
  }

  /**
   * ElementValue serialization methods.
   * @param node
   * @param json
   */
  private serializeExpressionElementValue(node: any, json: JsonASTNode): void {
    json.value = this.serializeNode(node.value);
  }

  private serializeAnnotationElementValue(node: any, json: JsonASTNode): void {
    json.value = this.serializeNode(node.value);
  }

  private serializeArrayElementValue(node: any, json: JsonASTNode): void {
    json.values = node.values.map((val: any) => this.serializeNode(val));
  }

  /**
   * Declaration serialization methods.
   * @param node
   * @param json
   */
  private serializeAnnotationArgument(node: any, json: JsonASTNode): void {
    if (node.name) {
      json.name = node.name;
    }
    json.value = this.serializeNode(node.value);
    if (node.isNameImplicit !== undefined) {
      json.isNameImplicit = node.isNameImplicit;
    }
  }

  private serializeVariableDeclaration(node: any, json: JsonASTNode): void {
    json.name = node.name;
    json.type = this.serializeTypeRef(node.type);
    if (node.initializer) {
      json.initializer = this.serializeNode(node.initializer);
    }
    if (node.modifiers && node.modifiers.length > 0) {
      json.modifiers = node.modifiers.map((mod: Modifier) => this.serializeNode(mod));
    }
  }

  // Modifier serialization

  private serializeModifier(node: any, json: JsonASTNode): void {
    json.keyword = node.keyword;
  }

  // Fallback for unknown node types

  private serializeUnknownNode(node: any, json: JsonASTNode): void {
    // Try to serialize all enumerable properties
    for (const key in node) {
      if (key !== 'kind' && key !== 'location' && Object.prototype.hasOwnProperty.call(node, key)) {
        const value = node[key];
        if (value && typeof value === 'object' && 'kind' in value) {
          // It's an AST node
          json[key] = this.serializeNode(value);
        } else if (
          Array.isArray(value) &&
          value.length > 0 &&
          value[0] &&
          typeof value[0] === 'object' &&
          ('kind' in value[0] || ('components' in value[0] && 'arrayNesting' in value[0]))
        ) {
          // It's an array of AST nodes or TypeRefs
          json[key] = value.map((item: any) => {
            if ('kind' in item) {
              return this.serializeNode(item);
            } else if ('components' in item && 'arrayNesting' in item) {
              return this.serializeTypeRef(item);
            }
            return item;
          });
        } else if (
          value &&
          typeof value === 'object' &&
          'components' in value &&
          'arrayNesting' in value
        ) {
          // It's a TypeRef
          json[key] = this.serializeTypeRef(value);
        } else {
          // Primitive value
          json[key] = value;
        }
      }
    }
  }
}
