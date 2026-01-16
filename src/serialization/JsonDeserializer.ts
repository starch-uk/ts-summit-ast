/**
 * JSON deserializer for AST nodes
 * 
 * Converts JSON back to AST nodes.
 */

import type { ASTNode, SourceRange } from '../ast/base.js';
import { NodeFactory } from '../translator/NodeFactory.js';
import type {
  IfStatement,
  ForStatement,
  WhileStatement,
  ReturnStatement,
  Block,
  ExpressionStatement,
  VariableDeclarationStatement,
} from '../ast/nodes/Statement.js';
import type {
  BinaryExpression,
  MethodCallExpression,
  Identifier,
} from '../ast/nodes/Expression.js';
import type {
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
} from '../ast/nodes/Literal.js';
import type {
  PrimitiveType,
  ClassType,
} from '../ast/nodes/Type.js';
import type {
  VariableDeclaration,
} from '../ast/nodes/Declaration.js';
import type { Modifier } from '../ast/nodes/Modifier.js';
import type { Expression } from '../ast/nodes/Expression.js';
import type { Statement } from '../ast/nodes/Statement.js';
import type { Type } from '../ast/nodes/Type.js';
import type { JsonASTNode } from './JsonSerializer.js';

/**
 * Options for JSON deserialization
 */
export interface DeserializationOptions {
  /**
   * Whether to validate the JSON structure
   */
  validate?: boolean;

  /**
   * Custom reviver function (similar to JSON.parse reviver)
   */
  reviver?: (key: string, value: unknown) => unknown;
}

/**
 * JSON Deserializer for AST nodes
 */
export class JsonDeserializer {
  private readonly options: Required<DeserializationOptions>;

  constructor(options: DeserializationOptions = {}) {
    this.options = {
      validate: options.validate ?? true,
      reviver: options.reviver ?? ((_key, value) => value),
    };
  }

  /**
   * Deserialize JSON string to AST node
   */
  deserialize(json: string): ASTNode {
    const parsed = JSON.parse(json, this.options.reviver);
    return this.deserializeNode(parsed);
  }

  /**
   * Deserialize JSON object to AST node
   */
  deserializeNode(json: JsonASTNode): ASTNode {
    if (!json || typeof json !== 'object' || !('kind' in json)) {
      throw new Error('Invalid JSON AST node: missing kind property');
    }

    if (this.options.validate) {
      this.validateNode(json);
    }

    const location = this.deserializeLocation(json.location as any);

    return this.deserializeNodeByKind(json, location);
  }

  /**
   * Deserialize source location
   */
  private deserializeLocation(location: any): SourceRange | undefined {
    if (!location) {
      return undefined;
    }

    return {
      start: {
        line: location.start?.line ?? 0,
        column: location.start?.column ?? 0,
        offset: location.start?.offset,
      },
      end: {
        line: location.end?.line ?? 0,
        column: location.end?.column ?? 0,
        offset: location.end?.offset,
      },
    };
  }

  /**
   * Deserialize node based on its kind
   */
  private deserializeNodeByKind(
    json: JsonASTNode,
    location?: SourceRange
  ): ASTNode {
    const locationOption = location ? { location } : undefined;

    switch (json.kind) {
      // Statement nodes
      case 'IfStatement':
        return this.deserializeIfStatement(json, locationOption);
      case 'ForStatement':
        return this.deserializeForStatement(json, locationOption);
      case 'WhileStatement':
        return this.deserializeWhileStatement(json, locationOption);
      case 'ReturnStatement':
        return this.deserializeReturnStatement(json, locationOption);
      case 'Block':
        return this.deserializeBlock(json, locationOption);
      case 'ExpressionStatement':
        return this.deserializeExpressionStatement(json, locationOption);
      case 'VariableDeclarationStatement':
        return this.deserializeVariableDeclarationStatement(json, locationOption);

      // Expression nodes
      case 'BinaryExpression':
        return this.deserializeBinaryExpression(json, locationOption);
      case 'MethodCallExpression':
        return this.deserializeMethodCallExpression(json, locationOption);
      case 'Identifier':
        return this.deserializeIdentifier(json, locationOption);

      // Literal nodes
      case 'StringLiteral':
        return this.deserializeStringLiteral(json, locationOption);
      case 'NumberLiteral':
        return this.deserializeNumberLiteral(json, locationOption);
      case 'BooleanLiteral':
        return this.deserializeBooleanLiteral(json, locationOption);
      case 'NullLiteral':
        return NodeFactory.createNullLiteral(locationOption);

      // Type nodes
      case 'PrimitiveType':
        return this.deserializePrimitiveType(json, locationOption);
      case 'ClassType':
        return this.deserializeClassType(json, locationOption);

      // Declaration nodes
      case 'VariableDeclaration':
        return this.deserializeVariableDeclaration(json, locationOption);

      // Modifier
      case 'Modifier':
        return this.deserializeModifier(json, locationOption);

      default:
        throw new Error(`Unknown node kind: ${json.kind}`);
    }
  }

  // Statement deserialization methods

  private deserializeIfStatement(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): IfStatement {
    const condition = this.deserializeNode(json.condition as JsonASTNode) as Expression;
    const thenStatement = this.deserializeNode((json.thenStatement || json.thenBody) as JsonASTNode) as Statement;
    const elseStatement = (json.elseStatement || json.elseBody)
      ? (this.deserializeNode((json.elseStatement || json.elseBody) as JsonASTNode) as Statement)
      : undefined;

    return NodeFactory.createIfStatement(condition, thenStatement, elseStatement, locationOption);
  }

  private deserializeForStatement(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): ForStatement {
    const init = json.init
      ? (this.deserializeNode(json.init as JsonASTNode) as Statement)
      : undefined;
    const condition = json.condition
      ? (this.deserializeNode(json.condition as JsonASTNode) as Expression)
      : undefined;
    const update = json.update
      ? (this.deserializeNode(json.update as JsonASTNode) as Expression)
      : undefined;
    const body = this.deserializeNode(json.body as JsonASTNode) as Statement;

    return NodeFactory.createForStatement(
      body,
      init as any,
      condition,
      update,
      locationOption
    );
  }

  private deserializeWhileStatement(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): WhileStatement {
    const condition = this.deserializeNode(json.condition as JsonASTNode) as Expression;
    const body = this.deserializeNode(json.body as JsonASTNode) as Statement;

    return NodeFactory.createWhileStatement(condition, body, locationOption);
  }

  private deserializeReturnStatement(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): ReturnStatement {
    const expression = json.expression
      ? (this.deserializeNode(json.expression as JsonASTNode) as Expression)
      : undefined;

    return NodeFactory.createReturnStatement(expression, locationOption);
  }

  private deserializeBlock(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): Block {
    const statements = (json.statements as JsonASTNode[]).map((stmt) =>
      this.deserializeNode(stmt) as Statement
    );

    return NodeFactory.createBlock(statements, locationOption);
  }

  private deserializeExpressionStatement(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): ExpressionStatement {
    const expression = this.deserializeNode(json.expression as JsonASTNode) as Expression;

    return NodeFactory.createExpressionStatement(expression, locationOption);
  }

  private deserializeVariableDeclarationStatement(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): VariableDeclarationStatement {
    const declaration = this.deserializeNode(
      json.declaration as JsonASTNode
    ) as VariableDeclaration;

    return NodeFactory.createVariableDeclarationStatement(declaration, locationOption);
  }

  // Expression deserialization methods

  private deserializeBinaryExpression(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): BinaryExpression {
    const operator = json.operator as string;
    const left = this.deserializeNode(json.left as JsonASTNode) as Expression;
    const right = this.deserializeNode(json.right as JsonASTNode) as Expression;

    return NodeFactory.createBinaryExpression(
      operator as any,
      left,
      right,
      locationOption
    );
  }

  private deserializeMethodCallExpression(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): MethodCallExpression {
    const methodName = json.methodName as string;
    const target = json.target
      ? (this.deserializeNode(json.target as JsonASTNode) as Expression)
      : undefined;
    const args = (json.arguments as JsonASTNode[]).map((arg) =>
      this.deserializeNode(arg) as Expression
    );
    const typeArguments = json.typeArguments
      ? ((json.typeArguments as JsonASTNode[]).map((type) =>
          this.deserializeNode(type) as Type
        ))
      : undefined;

    return NodeFactory.createMethodCallExpression(
      methodName,
      args,
      target,
      typeArguments,
      locationOption
    );
  }

  private deserializeIdentifier(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): Identifier {
    const name = json.name as string;

    return NodeFactory.createIdentifier(name, locationOption);
  }

  // Literal deserialization methods

  private deserializeStringLiteral(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): StringLiteral {
    const value = json.value as string;
    const raw = (json.raw as string) || `"${value}"`;

    return NodeFactory.createStringLiteral(value, raw, locationOption);
  }

  private deserializeNumberLiteral(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): NumberLiteral {
    const value = json.value as number;
    const raw = (json.raw as string) || String(value);

    return NodeFactory.createNumberLiteral(value, raw, locationOption);
  }

  private deserializeBooleanLiteral(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): BooleanLiteral {
    const value = json.value as boolean;

    return NodeFactory.createBooleanLiteral(value, locationOption);
  }

  // Type deserialization methods

  private deserializePrimitiveType(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): PrimitiveType {
    const name = json.name as string;

    return NodeFactory.createPrimitiveType(name, locationOption);
  }

  private deserializeClassType(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): ClassType {
    const name = json.name as string;
    const packageName = json.packageName as string | undefined;

    return NodeFactory.createClassType(name, packageName, locationOption);
  }

  // Declaration deserialization methods

  private deserializeVariableDeclaration(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): VariableDeclaration {
    const name = json.name as string;
    const type = this.deserializeNode(json.type as JsonASTNode) as Type;
    const initializer = json.initializer
      ? (this.deserializeNode(json.initializer as JsonASTNode) as Expression)
      : undefined;
    const modifiers = json.modifiers
      ? ((json.modifiers as JsonASTNode[]).map((mod) =>
          this.deserializeNode(mod) as Modifier
        ))
      : undefined;

    return NodeFactory.createVariableDeclaration(
      name,
      type,
      initializer,
      modifiers,
      locationOption
    );
  }

  // Modifier deserialization

  private deserializeModifier(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): Modifier {
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
      kind: 'Modifier',
      keyword: keyword as Modifier['keyword'],
      location: locationOption?.location,
    };
  }

  /**
   * Validate JSON node structure
   */
  private validateNode(json: JsonASTNode): void {
    if (!json.kind || typeof json.kind !== 'string') {
      throw new Error('Invalid JSON AST node: kind must be a string');
    }
  }
}
