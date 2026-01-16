/**
 * JSON serializer for AST nodes
 * 
 * Converts AST nodes to JSON format for storage, transmission, or debugging.
 */

import type { ASTNode, SourceRange } from '../ast/base.js';
import type { StatementNode } from '../ast/nodes/Statement.js';
import type { ExpressionNode } from '../ast/nodes/Expression.js';
import type { TypeNode } from '../ast/nodes/Type.js';
import type { Modifier } from '../ast/nodes/Modifier.js';
import type { AnyASTNode } from '../ast/nodes/index.js';

/**
 * JSON representation of an AST node
 */
export interface JsonASTNode {
  kind: string;
  [key: string]: unknown;
}

/**
 * Options for JSON serialization
 */
export interface SerializationOptions {
  /**
   * Whether to include source location information
   */
  includeLocation?: boolean;

  /**
   * Whether to use compact format (minimize whitespace)
   */
  compact?: boolean;

  /**
   * Custom replacer function (similar to JSON.stringify replacer)
   */
  replacer?: (key: string, value: unknown) => unknown;
}

/**
 * JSON Serializer for AST nodes
 */
export class JsonSerializer {
  private readonly options: Required<SerializationOptions>;

  constructor(options: SerializationOptions = {}) {
    this.options = {
      includeLocation: options.includeLocation ?? true,
      compact: options.compact ?? false,
      replacer: options.replacer ?? ((_key, value) => value),
    };
  }

  /**
   * Serialize an AST node to JSON string
   */
  serialize(node: ASTNode): string {
    const json = this.serializeNode(node);
    return this.options.compact
      ? JSON.stringify(json)
      : JSON.stringify(json, null, 2);
  }

  /**
   * Serialize an AST node to JSON object
   */
  serializeNode(node: ASTNode): JsonASTNode {
    const json: JsonASTNode = {
      kind: node.kind,
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
   * Serialize source location
   */
  private serializeLocation(location: SourceRange): unknown {
    return {
      start: {
        line: location.start.line,
        column: location.start.column,
        ...(location.start.offset !== undefined && { offset: location.start.offset }),
      },
      end: {
        line: location.end.line,
        column: location.end.column,
        ...(location.end.offset !== undefined && { offset: location.end.offset }),
      },
    };
  }

  /**
   * Serialize node-specific properties based on kind
   */
  private serializeNodeProperties(node: ASTNode, json: JsonASTNode): void {
    switch (node.kind) {
      // Statement nodes
      case 'IfStatement':
        this.serializeIfStatement(node as any, json);
        break;
      case 'ForStatement':
        this.serializeForStatement(node as any, json);
        break;
      case 'WhileStatement':
        this.serializeWhileStatement(node as any, json);
        break;
      case 'ReturnStatement':
        this.serializeReturnStatement(node as any, json);
        break;
      case 'Block':
        this.serializeBlock(node as any, json);
        break;
      case 'ExpressionStatement':
        this.serializeExpressionStatement(node as any, json);
        break;
      case 'VariableDeclarationStatement':
        this.serializeVariableDeclarationStatement(node as any, json);
        break;

      // Expression nodes
      case 'BinaryExpression':
        this.serializeBinaryExpression(node as any, json);
        break;
      case 'MethodCallExpression':
        this.serializeMethodCallExpression(node as any, json);
        break;
      case 'Identifier':
        this.serializeIdentifier(node as any, json);
        break;

      // Literal nodes
      case 'StringLiteral':
        this.serializeStringLiteral(node as any, json);
        break;
      case 'NumberLiteral':
        this.serializeNumberLiteral(node as any, json);
        break;
      case 'BooleanLiteral':
        this.serializeBooleanLiteral(node as any, json);
        break;
      case 'NullLiteral':
        // No additional properties
        break;

      // Type nodes
      case 'PrimitiveType':
        this.serializePrimitiveType(node as any, json);
        break;
      case 'ClassType':
        this.serializeClassType(node as any, json);
        break;

      // Declaration nodes
      case 'VariableDeclaration':
        this.serializeVariableDeclaration(node as any, json);
        break;

      // Modifier
      case 'Modifier':
        this.serializeModifier(node as any, json);
        break;

      default:
        // For unknown node types, try to serialize all properties
        this.serializeUnknownNode(node, json);
    }
  }

  // Statement serialization methods

  private serializeIfStatement(node: any, json: JsonASTNode): void {
    json.condition = this.serializeNode(node.condition);
    json.thenBody = this.serializeNode(node.thenBody);
    if (node.elseBody) {
      json.elseBody = this.serializeNode(node.elseBody);
    }
  }

  private serializeForStatement(node: any, json: JsonASTNode): void {
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

  private serializeWhileStatement(node: any, json: JsonASTNode): void {
    json.condition = this.serializeNode(node.condition);
    json.body = this.serializeNode(node.body);
  }

  private serializeReturnStatement(node: any, json: JsonASTNode): void {
    if (node.expression) {
      json.expression = this.serializeNode(node.expression);
    }
  }

  private serializeBlock(node: any, json: JsonASTNode): void {
    json.statements = node.statements.map((stmt: StatementNode) =>
      this.serializeNode(stmt)
    );
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

  private serializeMethodCallExpression(node: any, json: JsonASTNode): void {
    json.methodName = node.methodName;
    if (node.target) {
      json.target = this.serializeNode(node.target);
    }
    json.arguments = node.arguments.map((arg: ExpressionNode) =>
      this.serializeNode(arg)
    );
    if (node.typeArguments) {
      json.typeArguments = node.typeArguments.map((type: TypeNode) =>
        this.serializeNode(type)
      );
    }
  }

  private serializeIdentifier(node: any, json: JsonASTNode): void {
    json.name = node.name;
  }

  // Literal serialization methods

  private serializeStringLiteral(node: any, json: JsonASTNode): void {
    json.value = node.value;
    json.raw = node.raw;
  }

  private serializeNumberLiteral(node: any, json: JsonASTNode): void {
    json.value = node.value;
    json.raw = node.raw;
  }

  private serializeBooleanLiteral(node: any, json: JsonASTNode): void {
    json.value = node.value;
  }

  // Type serialization methods

  private serializePrimitiveType(node: any, json: JsonASTNode): void {
    json.name = node.name;
  }

  private serializeClassType(node: any, json: JsonASTNode): void {
    json.name = node.name;
    if (node.packageName) {
      json.packageName = node.packageName;
    }
  }

  // Declaration serialization methods

  private serializeVariableDeclaration(node: any, json: JsonASTNode): void {
    json.name = node.name;
    json.type = this.serializeNode(node.type);
    if (node.initializer) {
      json.initializer = this.serializeNode(node.initializer);
    }
    if (node.modifiers && node.modifiers.length > 0) {
      json.modifiers = node.modifiers.map((mod: Modifier) =>
        this.serializeNode(mod)
      );
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
        } else if (Array.isArray(value) && value.length > 0 && value[0] && typeof value[0] === 'object' && 'kind' in value[0]) {
          // It's an array of AST nodes
          json[key] = value.map((item: AnyASTNode) => this.serializeNode(item));
        } else {
          // Primitive value
          json[key] = value;
        }
      }
    }
  }
}
