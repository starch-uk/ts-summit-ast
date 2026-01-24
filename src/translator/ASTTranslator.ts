/**
 * @file Translator from parse trees to AST nodes.
 *
 * This is a parser-agnostic translator that works with any parse tree
 * conforming to the ParseTreeNode interface.
 */

import type { ParseTreeNode } from '../parser/parseTree.js';
import type { ASTNode } from '../ast/baseNode.js';
import type { Statement } from '../ast/statement.js';
import type { Expression } from '../ast/expression.js';
import type { Declaration, Annotation, TypeParameter } from '../ast/declaration.js';
import type { Modifier } from '../ast/declaration.js';
import type { TypeRef } from '../ast/baseNode.js';
import type { ElementValue } from '../ast/initializer.js';
import { NodeFactory } from './nodeFactory.js';
import type { NodeFactoryOptions } from './nodeFactory.js';
import type { TranslateContext } from './translateUtil.js';
import {
  getChildren,
  getChild,
  getProperty,
  getText,
  getLocationOption as getLocationOptionUtil,
  tryTranslateType as tryTranslateTypeUtil,
  extractModifiers,
  extractAnnotations,
  extractTypeParameters,
  buildAnnotationFromNode,
  parseElementValue,
} from './translateUtil.js';
import * as stmtTranslate from './statementTranslator.js';
import * as exprTranslate from './expressionTranslator.js';
import * as classTranslate from './declarationTranslator.js';
import * as memberTranslate from './declarationTranslator.js';

/**
 * Options for translation.
 */
interface TranslationOptions {
  /**
   * Whether to include source location information.
   */
  includeLocation?: boolean;

  /**
   * Custom error handler.
   */
  onError?: (error: Readonly<TranslationError>) => void;

  /**
   * Whether to continue translation on errors.
   */
  continueOnError?: boolean;
}

/**
 * Error thrown during AST translation from parse tree to AST nodes.
 */
class TranslationError extends Error {
  public constructor(
    message: string,
    public readonly node?: Readonly<ParseTreeNode>,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}

/**
 * Contains the result of translating a parse tree to an AST.
 */
interface TranslationResult {
  readonly ast?: ASTNode;
  readonly errors: TranslationError[];
}

/**
 * AST Translator class
 * Converts parse trees to AST nodes.
 */
class ASTTranslator implements TranslateContext {
  private readonly options: Required<TranslationOptions>;
  public currentClassName: string | undefined = undefined;

  public constructor(options: Readonly<TranslationOptions> = {}) {
    this.options = {
      continueOnError: options.continueOnError ?? false,
      includeLocation: options.includeLocation ?? true,
      onError:
        options.onError ??
        (() => {
          // Default empty error handler
        }),
      ...options,
    };
  }

  /**
   * Translate a parse tree node to an AST node.
   * @param node - The parse tree node to translate.
   * @returns The translation result containing the AST node and any errors.
   */
  public translate(node: Readonly<ParseTreeNode>): TranslationResult {
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
   * Translate a single node based on its type.
   * @param node - The parse tree node to translate.
   * @returns The translated AST node.
   * @throws {TranslationError} If the node type is unknown or translation fails.
   */
  public translateNode(node: Readonly<ParseTreeNode>): ASTNode {
    const nodeType = node.type.toLowerCase();

    // Handle compilation_unit - return a CompilationUnit AST node
    if (nodeType === 'compilation_unit' || nodeType === 'compilationunit') {
      const children = this.getChildren(node);
      const declarations: Declaration[] = [];

      // Translate all declarations
      for (const child of children) {
        const childType = child.type.toLowerCase();
        if (
          childType === 'class_declaration' ||
          childType === 'class' ||
          childType === 'interface_declaration' ||
          childType === 'interface' ||
          childType === 'enum_declaration' ||
          childType === 'enum' ||
          childType === 'trigger_declaration' ||
          childType === 'trigger' ||
          childType === 'annotation_declaration' ||
          childType === 'annotationtype'
        ) {
          const translatedNode = this.translateNode(child);
          if (
            translatedNode.kind === 'ClassDeclaration' ||
            translatedNode.kind === 'InterfaceDeclaration' ||
            translatedNode.kind === 'EnumDeclaration' ||
            translatedNode.kind === 'MethodDeclaration' ||
            translatedNode.kind === 'PropertyDeclaration' ||
            translatedNode.kind === 'VariableDeclaration' ||
            translatedNode.kind === 'AnnotationDeclaration'
          ) {
            const decl = translatedNode as Declaration;
            declarations.push(decl);
          }
        }
      }

      // Create CompilationUnit manually
      // Use node.location directly (not getLocationOption which returns { location: ... })
      const location = this.options.includeLocation && node.location ? node.location : undefined;
      return {
        declarations,
        kind: 'CompilationUnit',
        location,
      } as ASTNode;
    }

    // Skip type-related nodes that should only be handled via tryTranslateType
    // These nodes are not standalone AST nodes, they're part of type structures
    const nodeTypeLower = nodeType.toLowerCase();
    if (
      nodeTypeLower === 'base_type' ||
      nodeTypeLower === 'array_dimensions' ||
      nodeTypeLower === 'type_arguments' ||
      nodeTypeLower === 'type_parameters'
    ) {
      // These are structural nodes within types, not translatable as standalone AST nodes
      throw new TranslationError(
        `Type structural node (${node.type}) should not be translated directly. It should be part of a type node.`,
        node
      );
    }

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
    throw new TranslationError(`Unknown node type: ${node.type}`, node);
  }

  /**
   * Try to translate node as a statement.
   * @param node - The parse tree node to translate.
   * @param nodeType - The type of the node (normalized to lowercase).
   * @returns The translated statement node, or null if the node is not a statement.
   */
  public translateCompoundStatement(node: Readonly<ParseTreeNode>): Statement {
    return stmtTranslate.translateCompoundStatement(this, node);
  }

  public tryTranslateStatement(node: Readonly<ParseTreeNode>, nodeType: string): Statement | null {
    switch (nodeType) {
      case 'if_statement':
      case 'if':
        return this.translateIfStatement(node);
      case 'for_statement':
      case 'for':
        return this.translateForLoopStatement(node);
      case 'for_each_statement':
      case 'foreach':
        return this.translateEnhancedForLoopStatement(node);
      case 'while_statement':
      case 'while':
        return this.translateWhileLoopStatement(node);
      case 'do_while_statement':
      case 'dowhile':
      case 'do':
        return this.translateDoWhileLoopStatement(node);
      case 'switch_statement':
      case 'switch':
        return this.translateSwitchStatement(node);
      case 'try_statement':
      case 'try':
        return this.translateTryStatement(node);
      case 'return_statement':
      case 'return':
        return this.translateReturnStatement(node);
      case 'break_statement':
      case 'break':
        return this.translateBreakStatement(node);
      case 'continue_statement':
      case 'continue':
        return this.translateContinueStatement(node);
      case 'throw_statement':
      case 'throw':
        return this.translateThrowStatement(node);
      case 'block':
      case 'block_statement':
        return this.translateCompoundStatement(node);
      case 'expression_statement':
        return this.translateExpressionStatement(node);
      case 'variable_declaration_statement':
        return this.translateVariableDeclarationStatement(node);
      case 'dml_statement':
      case 'dml':
        return this.translateDmlStatement(node);
      default:
        return null;
    }
  }

  /**
   * Try to translate node as an expression.
   * @param node - The parse tree node to translate.
   * @param nodeType - The type of the node (normalized to lowercase).
   * @returns The translated expression node, or null if the node is not an expression.
   */
  public tryTranslateExpression(
    node: Readonly<ParseTreeNode>,
    nodeType: string
  ): Expression | null {
    switch (nodeType) {
      case 'identifier':
      case 'name':
        // Identifier is not an expression - create VariableExpression instead
        const id = NodeFactory.createIdentifier(
          this.getText(node) ?? node.type,
          this.getLocationOption(node)
        );
        return NodeFactory.createVariableExpression(id, this.getLocationOption(node));
      case 'string_literal':
      case 'string':
        return this.translateStringVal(node);
      case 'number_literal':
      case 'number':
      case 'integer':
        return this.translateIntegerVal(node);
      case 'boolean_literal':
      case 'boolean':
        return this.translateBooleanVal(node);
      case 'null_literal':
      case 'null':
        return NodeFactory.createNullVal(this.getLocationOption(node));
      case 'method_call_expression':
      case 'method_call':
      case 'method_invocation':
        return this.translateMethodCall(node);
      case 'field_access_expression':
      case 'field_access':
        return this.translateFieldAccess(node);
      case 'array_access_expression':
      case 'array_access':
        return this.translateArrayAccess(node);
      case 'binary_expression':
      case 'binary':
        return this.translateBinaryExpression(node);
      case 'unary_expression':
      case 'unary':
        return this.translateUnaryExpression(node);
      case 'assignment_expression':
      case 'assignment':
        return this.translateAssignExpression(node);
      case 'ternary_expression':
      case 'ternary':
        return this.translateTernaryExpression(node);
      case 'cast_expression':
      case 'cast':
        return this.translateCastExpression(node);
      case 'instanceof_expression':
      case 'instanceof':
        return this.translateInstanceOfExpression(node);
      case 'new_expression':
      case 'new':
        return this.translateNewExpression(node);
      case 'new_array_expression':
      case 'new_array':
        return this.translateNewArrayExpression(node);
      case 'lambda_expression':
      case 'lambda':
        return this.translateLambdaExpression(node);
      case 'this_expression':
      case 'this':
        return NodeFactory.createThisExpression(this.getLocationOption(node));
      case 'super_expression':
      case 'super':
        return NodeFactory.createSuperExpression(this.getLocationOption(node));
      case 'parenthesized_expression':
      case 'parenthesized':
        return this.translateParenthesizedExpression(node);
      case 'soql_query':
      case 'soql':
        return this.translateSoqlQuery(node);
      case 'sosl_query':
      case 'sosl':
        return this.translateSoslQuery(node);
      case 'trigger_context_variable':
      case 'trigger_context':
        return this.translateTriggerContextVariable(node);
      default:
        return null;
    }
  }

  /**
   * Try to translate node as a declaration.
   * @param node - The parse tree node to translate.
   * @param nodeType - The type of the node (normalized to lowercase).
   * @returns The translated declaration node, or null if the node is not a declaration.
   */
  public tryTranslateDeclaration(
    node: Readonly<ParseTreeNode>,
    nodeType: string
  ): Declaration | null {
    switch (nodeType) {
      case 'class_declaration':
      case 'class':
        return this.translateClassDeclaration(node);
      case 'interface_declaration':
      case 'interface':
        return this.translateInterfaceDeclaration(node);
      case 'method_declaration':
      case 'method':
        return this.translateMethodDeclaration(node);
      case 'constructor_declaration':
      case 'constructor':
        return this.translateMethodDeclaration(node);
      case 'variable_declaration':
      case 'variable':
        return this.translateVariableDeclaration(node);
      case 'field_declaration':
      case 'field':
        return this.translateFieldDeclaration(node);
      case 'property_declaration':
      case 'property':
        return this.translatePropertyDeclaration(node);
      case 'enum_declaration':
      case 'enum':
        return this.translateEnumDeclaration(node);
      case 'enum_constant':
      case 'enum_constant_declaration':
        // EnumValue is not a Declaration - it's a separate node type
        // This case should not be reached in normal translation flow
        return null;
      case 'annotation_declaration':
      case 'annotation_type':
        // Annotation declarations are not supported in summit-ast
        return this.translateAnnotationDeclaration(node);
      case 'trigger_declaration':
      case 'trigger':
        // For now, return a placeholder declaration so compilation unit is valid
        // In a full implementation, we'd create a proper TriggerDeclaration AST node
        const triggerNameNode = this.getChild(node, 'name');
        const triggerName = triggerNameNode
          ? (this.getText(triggerNameNode) ??
            this.getProperty<string>(triggerNameNode, 'name') ??
            'Unknown')
          : 'Unknown';
        // Return a minimal class declaration as a placeholder
        // This allows the compilation unit to be valid
        return NodeFactory.createClassDeclaration(
          triggerName + '_trigger_placeholder',
          [],
          [],
          undefined,
          undefined,
          undefined,
          this.getLocationOption(node)
        );
      case 'instance_initializer':
      case 'static_initializer':
      case 'initializer_block':
        return this.translateInitializerBlock(node);
      default:
        return null;
    }
  }

  // Statement translation methods

  private translateIfStatement(node: Readonly<ParseTreeNode>): Statement {
    return stmtTranslate.translateIfStatement(this, node);
  }

  // @ts-expect-error -- Kept for reference
  private translateIfStatementOld(_node: Readonly<ParseTreeNode>): Statement {
    // Try to get named properties first (for integration tests)
    let condition = this.getChildExpression(_node, 'condition', true);
    let thenStatement = this.getChildStatement(_node, 'thenStatement', 'thenBody', true);
    let elseStatement = this.getChildStatement(_node, 'elseStatement', 'elseBody', true);

    // If named properties not found, try positional children (for parser output)
    if (!condition || !thenStatement) {
      const children = this.getChildren(_node);

      const minimumChildrenCount = 2;
      if (children.length < minimumChildrenCount) {
        throw new TranslationError('If statement requires at least condition and then body', _node);
      }

      if (!condition) {
        const zeroIndex = 0;
        const conditionChild = children[zeroIndex];
        const cond = this.tryTranslateExpression(conditionChild, conditionChild.type.toLowerCase());
        if (!cond) {
          throw new TranslationError('If statement requires a condition', _node);
        }
        condition = cond;
      }

      if (!thenStatement) {
        const secondChildIndex = 1;
        const thenChild = children[secondChildIndex];
        const then = this.tryTranslateStatement(thenChild, thenChild.type.toLowerCase());
        if (!then) {
          throw new TranslationError('If statement requires a then body', _node);
        }
        thenStatement = then;
      }

      const elseChildIndex = 2;
      if (!elseStatement && children.length > elseChildIndex) {
        const elseChild = children[elseChildIndex];
        const els = this.tryTranslateStatement(elseChild, elseChild.type.toLowerCase());
        elseStatement = els ?? undefined;
      }
    }

    return NodeFactory.createIfStatement(
      condition,
      thenStatement,
      elseStatement,
      this.getLocationOption(_node)
    );
  }

  private translateForLoopStatement(node: Readonly<ParseTreeNode>): Statement {
    return stmtTranslate.translateForLoopStatement(this, node);
  }

  private translateWhileLoopStatement(node: Readonly<ParseTreeNode>): Statement {
    return stmtTranslate.translateWhileLoopStatement(this, node);
  }

  private translateReturnStatement(node: Readonly<ParseTreeNode>): Statement {
    return stmtTranslate.translateReturnStatement(this, node);
  }

  private translateExpressionStatement(node: Readonly<ParseTreeNode>): Statement {
    return stmtTranslate.translateExpressionStatement(this, node);
  }

  private translateEnhancedForLoopStatement(node: Readonly<ParseTreeNode>): Statement {
    return stmtTranslate.translateEnhancedForLoopStatement(this, node);
  }

  private translateDoWhileLoopStatement(node: Readonly<ParseTreeNode>): Statement {
    return stmtTranslate.translateDoWhileLoopStatement(this, node);
  }

  private translateSwitchStatement(node: Readonly<ParseTreeNode>): Statement {
    return stmtTranslate.translateSwitchStatement(this, node);
  }

  private translateTryStatement(node: Readonly<ParseTreeNode>): Statement {
    return stmtTranslate.translateTryStatement(this, node);
  }

  private translateBreakStatement(node: Readonly<ParseTreeNode>): Statement {
    return stmtTranslate.translateBreakStatement(this, node);
  }

  private translateContinueStatement(node: Readonly<ParseTreeNode>): Statement {
    return stmtTranslate.translateContinueStatement(this, node);
  }

  private translateThrowStatement(node: Readonly<ParseTreeNode>): Statement {
    return stmtTranslate.translateThrowStatement(this, node);
  }

  private translateVariableDeclarationStatement(node: Readonly<ParseTreeNode>): Statement {
    return stmtTranslate.translateVariableDeclarationStatement(this, node);
  }

  // Expression translation methods

  private translateStringVal(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateStringVal(this, node);
  }

  private translateIntegerVal(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateIntegerVal(this, node);
  }

  private translateBooleanVal(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateBooleanVal(this, node);
  }

  private translateMethodCall(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateMethodCall(this, node);
  }

  private translateBinaryExpression(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateBinaryExpression(this, node);
  }

  private translateUnaryExpression(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateUnaryExpression(this, node);
  }

  private translateAssignExpression(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateAssignExpression(this, node);
  }

  private translateFieldAccess(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateFieldAccess(this, node);
  }

  private translateArrayAccess(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateArrayAccess(this, node);
  }

  private translateTernaryExpression(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateTernaryExpression(this, node);
  }

  private translateCastExpression(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateCastExpression(this, node);
  }

  private translateInstanceOfExpression(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateInstanceOfExpression(this, node);
  }

  private translateNewExpression(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateNewExpression(this, node);
  }

  private translateNewArrayExpression(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateNewArrayExpression(this, node);
  }

  private translateLambdaExpression(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateLambdaExpression(this, node);
  }

  private translateParenthesizedExpression(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateParenthesizedExpression(this, node);
  }

  private translateSoqlQuery(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateSoqlQuery(this, node);
  }

  private translateSoslQuery(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateSoslQuery(this, node);
  }

  private translateTriggerContextVariable(node: Readonly<ParseTreeNode>): Expression {
    return exprTranslate.translateTriggerContextVariable(this, node);
  }

  private translateDmlStatement(node: Readonly<ParseTreeNode>): Statement {
    return stmtTranslate.translateDmlStatement(this, node);
  }

  // Declaration translation methods

  private translateClassDeclaration(node: Readonly<ParseTreeNode>): Declaration {
    return classTranslate.translateClassDeclaration(this, node);
  }

  private translateInterfaceDeclaration(node: Readonly<ParseTreeNode>): Declaration {
    return memberTranslate.translateInterfaceDeclaration(this, node);
  }

  private translateMethodDeclaration(node: Readonly<ParseTreeNode>): Declaration {
    return memberTranslate.translateMethodDeclaration(this, node);
  }

  /**
   * Translate instance or static initializer block to a MethodDeclaration
   * (summit-ast models initializer blocks as method-like declarations).
   * @param node - The parse tree node representing the initializer block.
   * @returns The translated method declaration representing the initializer block.
   */
  private translateInitializerBlock(node: Readonly<ParseTreeNode>): Declaration {
    return memberTranslate.translateInitializerBlock(this, node);
  }

  private translateFieldDeclaration(node: Readonly<ParseTreeNode>): Declaration {
    return memberTranslate.translateFieldDeclaration(this, node);
  }

  private translatePropertyDeclaration(node: Readonly<ParseTreeNode>): Declaration {
    return memberTranslate.translatePropertyDeclaration(this, node);
  }

  private translateEnumDeclaration(node: Readonly<ParseTreeNode>): Declaration {
    return classTranslate.translateEnumDeclaration(this, node);
  }

  /**
   * Translate a variable declaration from parse tree to AST.
   * @param node - The parse tree node representing the variable declaration.
   * @returns The translated VariableDeclaration AST node.
   * @throws {TranslationError} If the variable declaration is malformed.
   */
  private translateVariableDeclaration(node: Readonly<ParseTreeNode>): Declaration {
    return memberTranslate.translateVariableDeclaration(this, node);
  }

  // Annotation declarations are not supported in summit-ast - removed
  //   // Annotation declarations are not supported in summit-ast

  /**
   * This method is kept for reference but throws an error if called.
   * @param node - The parse tree node representing the annotation declaration.
   * @throws {TranslationError} Always throws, as annotation declarations are not supported.
   */
  private translateAnnotationDeclaration(node: Readonly<ParseTreeNode>): never {
    throw new TranslationError('Annotation declarations are not supported in summit-ast', node);
  }

  // Helper methods

  public getChildren(
    node: Readonly<ParseTreeNode>,
    propertyName?: string,
    altPropertyName?: string
  ): Readonly<ParseTreeNode>[] {
    return getChildren(node, propertyName, altPropertyName);
  }

  public getChild(
    node: Readonly<ParseTreeNode>,
    propertyName: string,
    altPropertyName?: string
  ): Readonly<ParseTreeNode> | null {
    return getChild(node, propertyName, altPropertyName);
  }

  public getChildExpression(
    node: Readonly<ParseTreeNode>,
    propertyName: string,
    optionalOrAlt: boolean | string = false,
    altPropertyName?: string
  ): Expression | undefined {
    // Handle case where optionalOrAlt is actually altPropertyName
    let optional = false;
    if (typeof optionalOrAlt === 'string') {
      altPropertyName = optionalOrAlt;
    } else {
      optional = optionalOrAlt;
    }
    const child = this.getChild(node, propertyName, altPropertyName);
    if (!child) {
      if (optional) {
        return undefined;
      }
      throw new TranslationError(`Required expression child '${propertyName}' not found`, node);
    }

    const expression = this.tryTranslateExpression(child, child.type.toLowerCase());
    if (!expression) {
      if (optional) {
        return undefined;
      }
      throw new TranslationError(`Failed to translate expression child '${propertyName}'`, child);
    }

    return expression;
  }

  public getChildStatement(
    node: Readonly<ParseTreeNode>,
    propertyName: string,
    altPropertyName?: string,
    optional = false
  ): Statement | undefined {
    const child = this.getChild(node, propertyName, altPropertyName);
    if (!child) {
      if (optional) {
        return undefined;
      }
      throw new TranslationError(`Required statement child '${propertyName}' not found`, node);
    }

    const statement = this.tryTranslateStatement(child, child.type.toLowerCase());
    if (!statement) {
      if (optional) {
        return undefined;
      }
      throw new TranslationError(`Failed to translate statement child '${propertyName}'`, child);
    }

    return statement;
  }

  public getClassName(node: Readonly<ParseTreeNode>): string | undefined {
    if (this.currentClassName != null) return this.currentClassName;
    // Try to find parent class declaration
    let current: ParseTreeNode | undefined = node;
    while (current) {
      if (current.type === 'class_declaration' || current.type === 'class') {
        const nameNode = this.getChild(current, 'name');
        return nameNode
          ? (this.getText(nameNode) ?? this.getProperty<string>(nameNode, 'name'))
          : undefined;
      }
      current = (current as { parent?: ParseTreeNode }).parent;
    }
    return undefined;
  }

  public tryTranslateType(node: Readonly<ParseTreeNode>): TypeRef | null {
    return tryTranslateTypeUtil(node, this.options.includeLocation);
  }

  public getProperty<T>(node: Readonly<ParseTreeNode>, ...names: string[]): T | undefined {
    return getProperty<T>(node, ...names);
  }

  public getText(node: Readonly<ParseTreeNode>): string | undefined {
    return getText(node);
  }

  /**
   * Get location option for node factory if location is enabled.
   * @param node - The parse tree node containing location information.
   * @returns The location option object if location is enabled and available, otherwise undefined.
   */
  public getLocationOption(
    node: Readonly<ParseTreeNode>
  ): Readonly<NodeFactoryOptions> | undefined {
    return getLocationOptionUtil(node, this.options.includeLocation);
  }

  public get includeLocation(): boolean {
    return this.options.includeLocation;
  }

  public extractModifiers(node: Readonly<ParseTreeNode>): Modifier[] {
    return extractModifiers(this, node);
  }

  public extractTypeParameters(node: Readonly<ParseTreeNode>): TypeParameter[] {
    return extractTypeParameters(this, node);
  }

  public buildAnnotationFromNode(annotationNode: Readonly<ParseTreeNode>): Annotation | null {
    return buildAnnotationFromNode(this, annotationNode);
  }

  public parseElementValue(valueNode: Readonly<ParseTreeNode>): ElementValue | null {
    return parseElementValue(this, valueNode);
  }

  public extractAnnotations(node: Readonly<ParseTreeNode>): Annotation[] {
    return extractAnnotations(this, node);
  }
}

export type { TranslationOptions, TranslationError, TranslationResult };
export { ASTTranslator };
