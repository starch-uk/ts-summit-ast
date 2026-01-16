/**
 * Translator from parse trees to AST nodes
 * 
 * This is a parser-agnostic translator that works with any parse tree
 * conforming to the ParseTreeNode interface.
 */

import type { ParseTreeNode } from '../parser/ParseTreeTypes.js';
import type { ASTNode } from '../ast/base.js';
import type { Statement } from '../ast/nodes/Statement.js';
import type { Expression } from '../ast/nodes/Expression.js';
import type { Declaration } from '../ast/nodes/Declaration.js';
import type { Type } from '../ast/nodes/Type.js';
import { NodeFactory } from './NodeFactory.js';

/**
 * Options for translation
 */
export interface TranslationOptions {
  /**
   * Whether to include source location information
   */
  includeLocation?: boolean;

  /**
   * Custom error handler
   */
  onError?: (error: TranslationError) => void;

  /**
   * Whether to continue translation on errors
   */
  continueOnError?: boolean;
}

/**
 * Translation error
 */
export class TranslationError extends Error {
  constructor(
    message: string,
    public readonly node?: ParseTreeNode,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}

/**
 * Result of translation
 */
export interface TranslationResult {
  readonly ast?: ASTNode;
  readonly errors: TranslationError[];
}

/**
 * AST Translator class
 * Converts parse trees to AST nodes
 */
export class ASTTranslator {
  private readonly options: Required<TranslationOptions>;

  constructor(options: TranslationOptions = {}) {
    this.options = {
      includeLocation: options.includeLocation ?? true,
      onError: options.onError ?? (() => {}),
      continueOnError: options.continueOnError ?? false,
      ...options,
    };
  }

  /**
   * Translate a parse tree node to an AST node
   */
  translate(node: ParseTreeNode): TranslationResult {
    const errors: TranslationError[] = [];

    try {
      const ast = this.translateNode(node);
      return { ast, errors };
    } catch (error) {
      const translationError =
        error instanceof TranslationError
          ? error
          : new TranslationError(
              `Translation failed: ${error instanceof Error ? error.message : String(error)}`,
              node,
              error instanceof Error ? error : undefined
            );

      errors.push(translationError);
      this.options.onError(translationError);

      if (!this.options.continueOnError) {
        return { errors };
      }

      // Return a placeholder or null node if continuing on error
      return { ast: undefined, errors };
    }
  }

  /**
   * Translate a single node based on its type
   */
  private translateNode(node: ParseTreeNode): ASTNode {
    const nodeType = node.type.toLowerCase();

    // Try to translate as statement
    const statement = this.tryTranslateStatement(node, nodeType);
    if (statement) {
      return statement;
    }

    // Try to translate as expression
    const expression = this.tryTranslateExpression(node, nodeType);
    if (expression) {
      return expression;
    }

    // Try to translate as declaration
    const declaration = this.tryTranslateDeclaration(node, nodeType);
    if (declaration) {
      return declaration;
    }

    // Unknown node type
    throw new TranslationError(
      `Unknown node type: ${node.type}`,
      node
    );
  }

  /**
   * Try to translate node as a statement
   */
  private tryTranslateStatement(
    node: ParseTreeNode,
    nodeType: string
  ): Statement | null {
    switch (nodeType) {
      case 'if_statement':
      case 'if':
        return this.translateIfStatement(node);
      case 'for_statement':
      case 'for':
        return this.translateForStatement(node);
      case 'while_statement':
      case 'while':
        return this.translateWhileStatement(node);
      case 'return_statement':
      case 'return':
        return this.translateReturnStatement(node);
      case 'block':
      case 'block_statement':
        return this.translateBlock(node);
      case 'expression_statement':
        return this.translateExpressionStatement(node);
      default:
        return null;
    }
  }

  /**
   * Try to translate node as an expression
   */
  private tryTranslateExpression(
    node: ParseTreeNode,
    nodeType: string
  ): Expression | null {
    switch (nodeType) {
      case 'identifier':
      case 'name':
        return this.translateIdentifier(node);
      case 'string_literal':
      case 'string':
        return this.translateStringLiteral(node);
      case 'number_literal':
      case 'number':
      case 'integer':
        return this.translateNumberLiteral(node);
      case 'boolean_literal':
      case 'boolean':
        return this.translateBooleanLiteral(node);
      case 'null_literal':
      case 'null':
        return NodeFactory.createNullLiteral(this.getLocationOption(node));
      case 'method_call':
      case 'method_invocation':
        return this.translateMethodCall(node);
      case 'binary_expression':
      case 'binary':
        return this.translateBinaryExpression(node);
      default:
        return null;
    }
  }

  /**
   * Try to translate node as a declaration
   */
  private tryTranslateDeclaration(
    node: ParseTreeNode,
    nodeType: string
  ): Declaration | null {
    switch (nodeType) {
      case 'class_declaration':
      case 'class':
        return this.translateClassDeclaration(node);
      case 'method_declaration':
      case 'method':
        return this.translateMethodDeclaration(node);
      case 'variable_declaration':
      case 'variable':
        return this.translateVariableDeclaration(node);
      default:
        return null;
    }
  }

  // Statement translation methods

  private translateIfStatement(node: ParseTreeNode): Statement {
    const condition = this.getChildExpression(node, 'condition');
    if (!condition) {
      throw new TranslationError('If statement requires a condition', node);
    }
    const thenBody = this.getChildStatement(node, 'thenBody', 'then');
    if (!thenBody) {
      throw new TranslationError('If statement requires a then body', node);
    }
    const elseBody = this.getChildStatement(node, 'elseBody', 'else', true);

    return NodeFactory.createIfStatement(
      condition,
      thenBody,
      elseBody,
      this.getLocationOption(node)
    );
  }

  private translateForStatement(node: ParseTreeNode): Statement {
    const init = this.getChildStatement(node, 'init', undefined, true);
    const condition = this.getChildExpression(node, 'condition', true);
    const update = this.getChildExpression(node, 'update', true);
    const body = this.getChildStatement(node, 'body');
    if (!body) {
      throw new TranslationError('For statement requires a body', node);
    }

    return NodeFactory.createForStatement(
      body,
      init as any, // Type assertion needed due to union type
      condition,
      update,
      this.getLocationOption(node)
    );
  }

  private translateWhileStatement(node: ParseTreeNode): Statement {
    const condition = this.getChildExpression(node, 'condition');
    if (!condition) {
      throw new TranslationError('While statement requires a condition', node);
    }
    const body = this.getChildStatement(node, 'body');
    if (!body) {
      throw new TranslationError('While statement requires a body', node);
    }

    return NodeFactory.createWhileStatement(
      condition,
      body,
      this.getLocationOption(node)
    );
  }

  private translateReturnStatement(node: ParseTreeNode): Statement {
    const expression = this.getChildExpression(node, 'expression', true);

    return NodeFactory.createReturnStatement(
      expression,
      this.getLocationOption(node)
    );
  }

  private translateBlock(node: ParseTreeNode): Statement {
    const statements = this.getChildren(node)
      .map((child) => this.translateNode(child) as Statement)
      .filter((stmt): stmt is Statement => stmt !== null);

    return NodeFactory.createBlock(statements, this.getLocationOption(node));
  }

  private translateExpressionStatement(node: ParseTreeNode): Statement {
    const expression = this.getChildExpression(node, 'expression');
    if (!expression) {
      throw new TranslationError('Expression statement requires an expression', node);
    }

    return NodeFactory.createExpressionStatement(
      expression,
      this.getLocationOption(node)
    );
  }

  // Expression translation methods

  private translateIdentifier(node: ParseTreeNode): Expression {
    const name = this.getText(node) || node.type;
    return NodeFactory.createIdentifier(name, this.getLocationOption(node));
  }

  private translateStringLiteral(node: ParseTreeNode): Expression {
    const text = this.getText(node) || '';
    // Remove quotes if present
    const value = text.replace(/^["']|["']$/g, '');
    return NodeFactory.createStringLiteral(
      value,
      text,
      this.getLocationOption(node)
    );
  }

  private translateNumberLiteral(node: ParseTreeNode): Expression {
    const text = this.getText(node) || '0';
    const value = parseFloat(text);
    return NodeFactory.createNumberLiteral(
      value,
      text,
      this.getLocationOption(node)
    );
  }

  private translateBooleanLiteral(node: ParseTreeNode): Expression {
    const text = this.getText(node)?.toLowerCase() || 'false';
    const value = text === 'true';
    return NodeFactory.createBooleanLiteral(
      value,
      this.getLocationOption(node)
    );
  }

  private translateMethodCall(node: ParseTreeNode): Expression {
    const methodName = this.getProperty<string>(node, 'methodName', 'name') || '';
    const target = this.getChildExpression(node, 'target', true);
    const args = this.getChildren(node, 'arguments', 'args')
      .map((child) => this.tryTranslateExpression(child, child.type.toLowerCase()))
      .filter((expr): expr is Expression => expr !== null);

    return NodeFactory.createMethodCallExpression(
      methodName,
      args,
      target || undefined,
      undefined,
      this.getLocationOption(node)
    );
  }

  private translateBinaryExpression(node: ParseTreeNode): Expression {
    const operator = this.getProperty<string>(node, 'operator', 'op') || '==';
    const left = this.getChildExpression(node, 'left');
    const right = this.getChildExpression(node, 'right');

    if (!left || !right) {
      throw new TranslationError('Binary expression requires both left and right operands', node);
    }

    return NodeFactory.createBinaryExpression(
      operator as any,
      left,
      right,
      this.getLocationOption(node)
    );
  }

  // Declaration translation methods

  private translateClassDeclaration(node: ParseTreeNode): Declaration {
    // TODO: Extract modifiers, members, etc.
    throw new TranslationError('Class declaration translation not yet implemented', node);
  }

  private translateMethodDeclaration(node: ParseTreeNode): Declaration {
    // TODO: Extract return type, parameters, body, etc.
    throw new TranslationError('Method declaration translation not yet implemented', node);
  }

  private translateVariableDeclaration(node: ParseTreeNode): Declaration {
    const name = this.getProperty<string>(node, 'name') || 'unknown';
    const typeNode = this.getChild(node, 'type');
    const type = typeNode
      ? (this.tryTranslateType(typeNode) || NodeFactory.createPrimitiveType('Object'))
      : NodeFactory.createPrimitiveType('Object');
    const initializer = this.getChildExpression(node, 'initializer', true);

    return NodeFactory.createVariableDeclaration(
      name,
      type,
      initializer,
      undefined,
      this.getLocationOption(node)
    );
  }

  // Helper methods

  private getChildren(
    node: ParseTreeNode,
    propertyName?: string,
    altPropertyName?: string
  ): ParseTreeNode[] {
    // Try named property first
    if (propertyName && propertyName in node) {
      const value = (node as any)[propertyName];
      return Array.isArray(value) ? value : [value];
    }

    // Try alternate property name
    if (altPropertyName && altPropertyName in node) {
      const value = (node as any)[altPropertyName];
      return Array.isArray(value) ? value : [value];
    }

    // Fall back to children array
    return node.children || [];
  }

  private getChild(
    node: ParseTreeNode,
    propertyName: string,
    altPropertyName?: string
  ): ParseTreeNode | null {
    if (propertyName in node) {
      const value = (node as any)[propertyName];
      return value && typeof value === 'object' && 'type' in value ? value : null;
    }

    if (altPropertyName && altPropertyName in node) {
      const value = (node as any)[altPropertyName];
      return value && typeof value === 'object' && 'type' in value ? value : null;
    }

    const children = this.getChildren(node);
    return children.length > 0 ? children[0] : null;
  }

  private getChildExpression(
    node: ParseTreeNode,
    propertyName: string,
    optional = false,
    altPropertyName?: string
  ): Expression | undefined {
    const child = this.getChild(node, propertyName, altPropertyName);
    if (!child) {
      if (optional) {
        return undefined;
      }
      throw new TranslationError(
        `Required expression child '${propertyName}' not found`,
        node
      );
    }

    const expression = this.tryTranslateExpression(child, child.type.toLowerCase());
    if (!expression) {
      if (optional) {
        return undefined;
      }
      throw new TranslationError(
        `Failed to translate expression child '${propertyName}'`,
        child
      );
    }

    return expression;
  }

  private getChildStatement(
    node: ParseTreeNode,
    propertyName: string,
    altPropertyName?: string,
    optional = false
  ): Statement | undefined {
    const child = this.getChild(node, propertyName, altPropertyName);
    if (!child) {
      if (optional) {
        return undefined;
      }
      throw new TranslationError(
        `Required statement child '${propertyName}' not found`,
        node
      );
    }

    const statement = this.tryTranslateStatement(child, child.type.toLowerCase());
    if (!statement) {
      if (optional) {
        return undefined;
      }
      throw new TranslationError(
        `Failed to translate statement child '${propertyName}'`,
        child
      );
    }

    return statement;
  }

  private tryTranslateType(node: ParseTreeNode): Type | null {
    const nodeType = node.type.toLowerCase();
    if (nodeType === 'primitive_type' || nodeType === 'type') {
      const name = this.getText(node) || this.getProperty<string>(node, 'name') || 'Object';
      return NodeFactory.createPrimitiveType(name, this.getLocationOption(node));
    }
    return null;
  }

  private getProperty<T>(node: ParseTreeNode, ...names: string[]): T | undefined {
    for (const name of names) {
      if (name in node) {
        return (node as any)[name] as T;
      }
    }
    return undefined;
  }

  private getText(node: ParseTreeNode): string | undefined {
    return node.text || this.getProperty<string>(node, 'value', 'content');
  }

  private getLocationOption(node: ParseTreeNode) {
    return this.options.includeLocation && node.location
      ? { location: node.location }
      : undefined;
  }
}
