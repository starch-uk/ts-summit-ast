/**
 * Translator from parse trees to AST nodes
 * 
 * This is a parser-agnostic translator that works with any parse tree
 * conforming to the ParseTreeNode interface.
 */

import type { ParseTreeNode } from '../parser/ParseTreeTypes.js';
import type { ASTNode } from '../ast/base.js';
import type { Statement, Block, DmlOperation } from '../ast/nodes/Statement.js';
import type { Expression } from '../ast/nodes/Expression.js';
import type { Declaration, VariableDeclaration, ClassDeclaration, Annotation, AnnotationArgument, TypeParameter } from '../ast/nodes/Declaration.js';
import type { Modifier, ModifierKeyword } from '../ast/nodes/Modifier.js';
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

    // Handle compilation_unit - return a CompilationUnit AST node
    if (nodeType === 'compilation_unit' || nodeType === 'compilationunit') {
      const children = this.getChildren(node);
      const declarations: Declaration[] = [];
      
      // Translate all declarations
      for (const child of children) {
        const childType = child.type.toLowerCase();
        if (childType === 'class_declaration' || childType === 'class' ||
            childType === 'interface_declaration' || childType === 'interface' ||
            childType === 'enum_declaration' || childType === 'enum' ||
            childType === 'trigger_declaration' || childType === 'trigger' ||
            childType === 'annotation_declaration' || childType === 'annotationtype') {
          const decl = this.translateNode(child) as Declaration;
          if (decl) {
            declarations.push(decl);
          }
        }
      }
      
      // Create CompilationUnit manually
      // Use node.location directly (not getLocationOption which returns { location: ... })
      const location = this.options.includeLocation && node.location ? node.location : undefined;
      return {
        kind: 'CompilationUnit',
        declarations,
        location,
      } as ASTNode;
    }

    // Skip type-related nodes that should only be handled via tryTranslateType
    // These nodes are not standalone AST nodes, they're part of type structures
    const nodeTypeLower = nodeType.toLowerCase();
    if (nodeTypeLower === 'base_type' || nodeTypeLower === 'array_dimensions' || 
        nodeTypeLower === 'type_arguments' || nodeTypeLower === 'type_parameters') {
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
      case 'for_each_statement':
      case 'foreach':
        return this.translateForEachStatement(node);
      case 'while_statement':
      case 'while':
        return this.translateWhileStatement(node);
      case 'do_while_statement':
      case 'dowhile':
      case 'do':
        return this.translateDoWhileStatement(node);
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
        return this.translateBlock(node);
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
        return this.translateAssignmentExpression(node);
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
      case 'interface_declaration':
      case 'interface':
        return this.translateInterfaceDeclaration(node);
      case 'method_declaration':
      case 'method':
        return this.translateMethodDeclaration(node);
      case 'constructor_declaration':
      case 'constructor':
        return this.translateConstructorDeclaration(node);
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
        return this.translateEnumConstantDeclaration(node);
      case 'annotation_declaration':
      case 'annotation_type':
        return this.translateAnnotationDeclaration(node);
      case 'trigger_declaration':
      case 'trigger':
        // For now, return a placeholder declaration so compilation unit is valid
        // In a full implementation, we'd create a proper TriggerDeclaration AST node
        const triggerNameNode = this.getChild(node, 'name');
        const triggerName = triggerNameNode ? (this.getText(triggerNameNode) || this.getProperty<string>(triggerNameNode, 'name') || 'Unknown') : 'Unknown';
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
      default:
        return null;
    }
  }

  // Statement translation methods

  private translateIfStatement(node: ParseTreeNode): Statement {
    // Try to get named properties first (for integration tests)
    let condition = this.getChildExpression(node, 'condition', true);
    let thenStatement = this.getChildStatement(node, 'thenStatement', 'thenBody', true);
    let elseStatement = this.getChildStatement(node, 'elseStatement', 'elseBody', true);
    
    // If named properties not found, try positional children (for parser output)
    if (!condition || !thenStatement) {
      const children = this.getChildren(node);
      if (children.length < 2) {
        throw new TranslationError('If statement requires at least condition and then body', node);
      }
      
      if (!condition) {
        const cond = this.tryTranslateExpression(children[0], children[0].type.toLowerCase());
        if (!cond) {
          throw new TranslationError('If statement requires a condition', node);
        }
        condition = cond;
      }
      
      if (!thenStatement) {
        const then = this.tryTranslateStatement(children[1], children[1].type.toLowerCase());
        if (!then) {
          throw new TranslationError('If statement requires a then body', node);
        }
        thenStatement = then;
      }
      
      if (!elseStatement && children.length > 2) {
        const els = this.tryTranslateStatement(children[2], children[2].type.toLowerCase());
        elseStatement = els || undefined;
      }
    }

    return NodeFactory.createIfStatement(
      condition!,
      thenStatement!,
      elseStatement,
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
    // While statement has children: [condition, body]
    const children = this.getChildren(node);
    if (children.length < 2) {
      throw new TranslationError('While statement requires condition and body', node);
    }
    
    const condition = this.tryTranslateExpression(children[0], children[0].type.toLowerCase());
    if (!condition) {
      throw new TranslationError('While statement requires a condition', node);
    }
    
    const body = this.tryTranslateStatement(children[1], children[1].type.toLowerCase());
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
    // Return statement has children: [expression?]
    const children = this.getChildren(node);
    const expression = children.length > 0
      ? (this.tryTranslateExpression(children[0], children[0].type.toLowerCase()) || undefined)
      : undefined;

    return NodeFactory.createReturnStatement(
      expression,
      this.getLocationOption(node)
    );
  }

  private translateBlock(node: ParseTreeNode): Statement {
    const statements = this.getChildren(node)
      .filter((child) => {
        // Filter out type-related structural nodes that shouldn't be translated as statements
        const childType = child.type.toLowerCase();
        return childType !== 'base_type' && 
               childType !== 'array_dimensions' && 
               childType !== 'type_arguments' && 
               childType !== 'type_parameters';
      })
      .map((child) => {
        try {
          return this.translateNode(child) as Statement;
        } catch (error) {
          // If translation fails, try to translate as statement or expression
          const stmt = this.tryTranslateStatement(child, child.type.toLowerCase());
          if (stmt) return stmt;
          const expr = this.tryTranslateExpression(child, child.type.toLowerCase());
          if (expr) {
            return NodeFactory.createExpressionStatement(expr, this.getLocationOption(child));
          }
          // Skip nodes that can't be translated
          return null;
        }
      })
      .filter((stmt): stmt is Statement => stmt !== null);

    return NodeFactory.createBlock(statements, this.getLocationOption(node));
  }

  private translateExpressionStatement(node: ParseTreeNode): Statement {
    // Expression statement has children: [expression]
    const children = this.getChildren(node);
    if (children.length === 0) {
      throw new TranslationError('Expression statement requires an expression', node);
    }
    
    const expression = this.tryTranslateExpression(children[0], children[0].type.toLowerCase());
    if (!expression) {
      throw new TranslationError('Expression statement requires an expression', node);
    }

    return NodeFactory.createExpressionStatement(
      expression,
      this.getLocationOption(node)
    );
  }

  private translateForEachStatement(node: ParseTreeNode): Statement {
    // Try to get named properties first (for integration tests)
    let variable = this.getChild(node, 'variable');
    let iterable = this.getChildExpression(node, 'iterable', true);
    let body = this.getChildStatement(node, 'body', undefined, true);
    
    // If named properties not found, try positional children (for parser output)
    // Parser structure: [type, name, iterable, body]
    if (!variable || !iterable || !body) {
      const children = this.getChildren(node);
      if (children.length < 4) {
        throw new TranslationError('For-each statement requires type, name, iterable, and body', node);
      }
      
      // First child is type, second is name, third is iterable, fourth is body
      const typeNode = children[0];
      const nameNode = children[1];
      const iterableNode = children[2];
      const bodyNode = children[3];
      
      if (!variable && typeNode && nameNode) {
        // Construct variable declaration from type and name
        const varType = this.tryTranslateType(typeNode);
        if (!varType) {
          throw new TranslationError('For-each statement requires a valid type', typeNode);
        }
        const varName = this.getText(nameNode) || this.getProperty<string>(nameNode, 'name') || '';
        if (!varName) {
          throw new TranslationError('For-each statement requires a variable name', nameNode);
        }
        variable = {
          type: 'variable_declaration',
          children: [typeNode, nameNode],
          location: nameNode.location,
        };
      }
      
      if (!iterable && iterableNode) {
        const iterableExpr = this.tryTranslateExpression(iterableNode, iterableNode.type.toLowerCase());
        if (!iterableExpr) {
          throw new TranslationError('For-each statement requires an iterable', iterableNode);
        }
        iterable = iterableExpr;
      }
      
      if (!body && bodyNode) {
        const bodyStmt = this.tryTranslateStatement(bodyNode, bodyNode.type.toLowerCase());
        if (!bodyStmt) {
          throw new TranslationError('For-each statement requires a body', bodyNode);
        }
        body = bodyStmt;
      }
    }
    
    // Translate variable declaration if we have it
    let varDecl: VariableDeclaration | null = null;
    if (variable) {
      const decl = this.tryTranslateDeclaration(variable, variable.type.toLowerCase());
      if (decl && decl.kind === 'VariableDeclaration') {
        varDecl = decl as VariableDeclaration;
      } else {
        // If translation failed, try to construct from children
        const varChildren = this.getChildren(variable);
        if (varChildren.length >= 2) {
          const varType = this.tryTranslateType(varChildren[0]);
          const varNameNode = varChildren[1];
          const varName = this.getText(varNameNode) || this.getProperty<string>(varNameNode, 'name') || '';
          if (varType && varName) {
            varDecl = NodeFactory.createVariableDeclaration(
              varName,
              varType,
              undefined,
              undefined,
              this.getLocationOption(varNameNode)
            );
          }
        }
      }
    }
    
    if (!varDecl) {
      throw new TranslationError('For-each statement requires a variable', node);
    }
    if (!iterable) {
      throw new TranslationError('For-each statement requires an iterable', node);
    }
    if (!body) {
      throw new TranslationError('For-each statement requires a body', node);
    }

    return NodeFactory.createForEachStatement(
      varDecl,
      iterable,
      body,
      this.getLocationOption(node)
    );
  }

  private translateDoWhileStatement(node: ParseTreeNode): Statement {
    // Do-while statement has children: [body, condition]
    const children = this.getChildren(node);
    if (children.length < 2) {
      throw new TranslationError('Do-while statement requires body and condition', node);
    }
    
    const body = this.tryTranslateStatement(children[0], children[0].type.toLowerCase());
    if (!body) {
      throw new TranslationError('Do-while statement requires a body', node);
    }
    
    const condition = this.tryTranslateExpression(children[1], children[1].type.toLowerCase());
    if (!condition) {
      throw new TranslationError('Do-while statement requires a condition', node);
    }

    return NodeFactory.createDoWhileStatement(
      body,
      condition,
      this.getLocationOption(node)
    );
  }

  private translateSwitchStatement(node: ParseTreeNode): Statement {
    const expression = this.getChildExpression(node, 'expression');
    if (!expression) {
      throw new TranslationError('Switch statement requires an expression', node);
    }
    const casesNode = this.getChild(node, 'cases');
    const cases: any[] = [];
    if (casesNode) {
      const caseChildren = this.getChildren(casesNode);
      for (const caseNode of caseChildren) {
        const value = this.getChildExpression(caseNode, 'value', true);
        const statements = this.getChildren(caseNode, 'statements')
          .map((child) => this.translateNode(child) as Statement)
          .filter((stmt): stmt is Statement => stmt !== null);
        cases.push({
          kind: 'SwitchCase',
          value,
          statements,
          location: caseNode.location,
        });
      }
    }
    const defaultNode = this.getChild(node, 'defaultCase', 'default');
    let defaultCase: any = undefined;
    if (defaultNode) {
      const statements = this.getChildren(defaultNode, 'statements')
        .map((child) => this.translateNode(child) as Statement)
        .filter((stmt): stmt is Statement => stmt !== null);
      defaultCase = {
        kind: 'SwitchCase',
        value: undefined,
        statements,
        location: defaultNode.location,
      };
    }

    return NodeFactory.createSwitchStatement(
      expression,
      cases,
      defaultCase,
      this.getLocationOption(node)
    );
  }

  private translateTryStatement(node: ParseTreeNode): Statement {
    // Try to get named properties first (for integration tests)
    let tryBlock = this.getChild(node, 'tryBlock', 'try');
    let catchClausesNode = this.getChild(node, 'catch_clauses', 'catchClauses');
    let finallyBlock = this.getChild(node, 'finallyBlock', 'finally');
    
    // If named properties not found, try positional children (for parser output)
    // Parser structure: [tryBlock, catch_clauses?, finallyBlock?]
    if (!tryBlock) {
      const children = this.getChildren(node);
      if (children.length === 0) {
        throw new TranslationError('Try statement requires a try block', node);
      }
      tryBlock = children[0]; // First child is try block
      
      // Find catch_clauses and finallyBlock in remaining children
      for (let i = 1; i < children.length; i++) {
        const child = children[i];
        if (child.type === 'catch_clauses' && !catchClausesNode) {
          catchClausesNode = child;
        } else if (child.type === 'block' && !finallyBlock && i === children.length - 1) {
          // Last block child is likely the finally block
          finallyBlock = child;
        }
      }
    }
    
    if (!tryBlock) {
      throw new TranslationError('Try statement requires a try block', node);
    }
    const tryBlockStmt = this.translateBlock(tryBlock) as Block;

    const catchClauses: any[] = [];
    if (catchClausesNode) {
      const catchChildren = this.getChildren(catchClausesNode);
      for (const catchNode of catchChildren) {
        // Catch clause structure: [exceptionType, name, block]
        const catchChildren = this.getChildren(catchNode);
        let exceptionType: Type | undefined = undefined;
        let varDecl: any = undefined;
        let block: ParseTreeNode | null = null;
        
        // Try named properties first
        const exceptionTypeExpr = this.getChildExpression(catchNode, 'exceptionType', true);
        if (exceptionTypeExpr) {
          // If it's an expression, try to convert it to a type (for integration tests)
          // In practice, exceptionType should be a Type, not an Expression
          exceptionType = undefined; // We'll get it from the type node instead
        }
        const exceptionTypeNode = this.getChild(catchNode, 'exceptionType');
        if (exceptionTypeNode) {
          exceptionType = this.tryTranslateType(exceptionTypeNode) || undefined;
        }
        
        const variable = this.getChild(catchNode, 'variable', 'name');
        if (variable) {
          const decl = this.tryTranslateDeclaration(variable, variable.type.toLowerCase());
          if (decl && decl.kind === 'VariableDeclaration') {
            varDecl = decl;
          }
        }
        block = this.getChild(catchNode, 'block');
        
        // If not found, try positional children
        if (!exceptionType && catchChildren.length >= 1) {
          exceptionType = this.tryTranslateType(catchChildren[0]) || undefined;
        }
        if (!varDecl && catchChildren.length >= 2) {
          const nameNode = catchChildren[1];
          if (nameNode.type === 'name') {
            const name = this.getText(nameNode) || this.getProperty<string>(nameNode, 'name') || '';
            if (name && exceptionType) {
              // Create a variable declaration for the catch parameter
              varDecl = NodeFactory.createVariableDeclaration(
                name,
                exceptionType,
                undefined,
                undefined,
                this.getLocationOption(nameNode)
              );
            }
          }
        }
        if (!block && catchChildren.length >= 3) {
          block = catchChildren[2];
        }
        
        if (!block) {
          throw new TranslationError('Catch clause requires a block', catchNode);
        }
        const blockStmt = this.translateBlock(block);
        catchClauses.push({
          kind: 'CatchClause',
          exceptionType,
          variable: varDecl,
          block: blockStmt,
          location: catchNode.location,
        });
      }
    }
    
    let finallyBlockStmt: any = undefined;
    if (finallyBlock) {
      finallyBlockStmt = this.translateBlock(finallyBlock);
    }

    return NodeFactory.createTryStatement(
      tryBlockStmt,
      catchClauses,
      finallyBlockStmt,
      this.getLocationOption(node)
    );
  }

  private translateBreakStatement(node: ParseTreeNode): Statement {
    const label = this.getProperty<string>(node, 'label');
    return NodeFactory.createBreakStatement(label, this.getLocationOption(node));
  }

  private translateContinueStatement(node: ParseTreeNode): Statement {
    const label = this.getProperty<string>(node, 'label');
    return NodeFactory.createContinueStatement(label, this.getLocationOption(node));
  }

  private translateThrowStatement(node: ParseTreeNode): Statement {
    // Try to get named property first (for integration tests)
    let expression = this.getChildExpression(node, 'expression', true);
    
    // If not found, try positional children (for parser output)
    // Parser structure: [expression]
    if (!expression) {
      const children = this.getChildren(node);
      if (children.length > 0) {
        const expr = this.tryTranslateExpression(children[0], children[0].type.toLowerCase());
        if (expr) {
          expression = expr;
        }
      }
    }
    
    if (!expression) {
      throw new TranslationError('Throw statement requires an expression', node);
    }
    return NodeFactory.createThrowStatement(expression, this.getLocationOption(node));
  }

  private translateVariableDeclarationStatement(node: ParseTreeNode): Statement {
    const declaration = this.getChild(node, 'declaration');
    if (!declaration) {
      throw new TranslationError('Variable declaration statement requires a declaration', node);
    }
    const varDecl = this.tryTranslateDeclaration(declaration, declaration.type.toLowerCase());
    if (!varDecl || varDecl.kind !== 'VariableDeclaration') {
      throw new TranslationError('Variable declaration statement requires a variable declaration', declaration);
    }
    return NodeFactory.createVariableDeclarationStatement(varDecl as VariableDeclaration, this.getLocationOption(node));
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
    // Parser creates method_call_expression with children: [expr, { type: 'arguments', children: args }]
    // where expr is:
    //   - identifier (method name) if no target: no_receiver()
    //   - field_access_expression (target.method) if there's a target: x.method()
    const children = this.getChildren(node);
    let target: Expression | undefined = undefined;
    let methodName = '';
    let argsNode: ParseTreeNode | null = null;
    
    // Try to get from named properties first (for integration tests)
    const targetFromProp = this.getChildExpression(node, 'target', true);
    if (targetFromProp) {
      target = targetFromProp;
    }
    
    const methodNameFromProp = this.getProperty<string>(node, 'methodName', 'name');
    if (methodNameFromProp) {
      methodName = methodNameFromProp;
    }
    
    // Try to get arguments from named property first (for integration tests)
    if (node.arguments && Array.isArray(node.arguments)) {
      // arguments is a named property (integration test)
      argsNode = { type: 'arguments', children: node.arguments };
    } else {
      argsNode = this.getChild(node, 'arguments', 'args');
    }
    
    // If not found as named properties, try positional children (parser output)
    if (!methodName && children.length >= 2) {
      const firstChild = children[0];
      const secondChild = children[1];
      
      // Second child should be arguments
      if (secondChild.type === 'arguments' || secondChild.type === 'args') {
        argsNode = secondChild;
      }
      
      // First child is either:
      //   - identifier: method name (no target)
      //   - field_access_expression: target.method (has target)
      if (firstChild.type === 'identifier') {
        // No target, first child is the method name
        methodName = this.getText(firstChild) || this.getProperty<string>(firstChild, 'name') || '';
      } else if (firstChild.type === 'field_access_expression' || firstChild.type === 'field_access') {
        // Has target, first child is field access expression
        const fieldAccess = this.tryTranslateExpression(firstChild, firstChild.type.toLowerCase());
        if (fieldAccess && fieldAccess.kind === 'FieldAccessExpression') {
          target = (fieldAccess as any).target;
          methodName = (fieldAccess as any).fieldName;
        }
      } else {
        // Try to translate as expression - might be a complex target
        const firstExpr = this.tryTranslateExpression(firstChild, firstChild.type.toLowerCase());
        if (firstExpr && firstExpr.kind === 'FieldAccessExpression') {
          target = (firstExpr as any).target;
          methodName = (firstExpr as any).fieldName;
        } else if (firstExpr && firstExpr.kind === 'Identifier') {
          methodName = (firstExpr as any).name;
        }
      }
    }
    
    if (!methodName) {
      throw new TranslationError('Method call requires a method name', node);
    }
    
    const args: Expression[] = [];
    if (argsNode) {
      const argChildren = this.getChildren(argsNode);
      for (const argChild of argChildren) {
        const expr = this.tryTranslateExpression(argChild, argChild.type.toLowerCase());
        if (expr) {
          args.push(expr);
        }
      }
    }

    return NodeFactory.createMethodCallExpression(
      methodName,
      args,
      target,
      undefined,
      this.getLocationOption(node)
    );
  }

  private translateBinaryExpression(node: ParseTreeNode): Expression {
    const operator = this.getProperty<string>(node, 'operator', 'op') || '==';
    // Try to get left and right as optional first (to allow fallback)
    let left = this.getChildExpression(node, 'left', true);
    let right = this.getChildExpression(node, 'right', true);

    if (!left || !right) {
      // Try children array (parser uses positional children: [left, right])
      const children = this.getChildren(node);
      if (children.length >= 2) {
        const leftExpr = this.tryTranslateExpression(children[0], children[0].type.toLowerCase());
        const rightExpr = this.tryTranslateExpression(children[1], children[1].type.toLowerCase());
        if (leftExpr && rightExpr) {
          return NodeFactory.createBinaryExpression(
            operator as any,
            leftExpr,
            rightExpr,
            this.getLocationOption(node)
          );
        }
      }
      throw new TranslationError('Binary expression requires both left and right operands', node);
    }

    return NodeFactory.createBinaryExpression(
      operator as any,
      left,
      right,
      this.getLocationOption(node)
    );
  }

  private translateUnaryExpression(node: ParseTreeNode): Expression {
    const operator = this.getProperty<string>(node, 'operator', 'op') || '!';
    const prefix = this.getProperty<boolean>(node, 'prefix') ?? true;
    const operand = this.getChildExpression(node, 'operand', true);
    if (!operand) {
      // Try to get from children array
      const children = this.getChildren(node);
      if (children.length > 0) {
        const expr = this.tryTranslateExpression(children[0], children[0].type.toLowerCase());
        if (expr) {
          return NodeFactory.createUnaryExpression(
            operator as any,
            expr,
            prefix,
            this.getLocationOption(node)
          );
        }
      }
      throw new TranslationError('Unary expression requires an operand', node);
    }

    return NodeFactory.createUnaryExpression(
      operator as any,
      operand,
      prefix,
      this.getLocationOption(node)
    );
  }

  private translateAssignmentExpression(node: ParseTreeNode): Expression {
    const operator = this.getProperty<string>(node, 'operator', 'op') || '=';
    const left = this.getChildExpression(node, 'left');
    const right = this.getChildExpression(node, 'right');

    if (!left || !right) {
      throw new TranslationError('Assignment expression requires both left and right operands', node);
    }

    return NodeFactory.createAssignmentExpression(
      operator as any,
      left,
      right,
      this.getLocationOption(node)
    );
  }

  private translateFieldAccess(node: ParseTreeNode): Expression {
    // Parser creates field_access_expression with children: [target, { type: 'field', text: fieldName }]
    const children = this.getChildren(node);
    let target: Expression | undefined = undefined;
    let fieldName = '';
    
    // Try to get target from named property first
    const targetFromProp = this.getChildExpression(node, 'target', true);
    if (targetFromProp) {
      target = targetFromProp;
    } else if (children.length >= 2) {
      // First child is the target expression
      const targetNode = children[0];
      target = this.tryTranslateExpression(targetNode, targetNode.type.toLowerCase()) || undefined;
    }
    
    // Try to get field name from named property or second child
    const fieldNode = this.getChild(node, 'field');
    if (fieldNode) {
      fieldName = this.getText(fieldNode) || this.getProperty<string>(fieldNode, 'name') || this.getProperty<string>(fieldNode, 'text') || '';
    } else if (children.length >= 2) {
      // Second child is the field node
      const fieldChild = children[1];
      fieldName = this.getText(fieldChild) || this.getProperty<string>(fieldChild, 'name') || this.getProperty<string>(fieldChild, 'text') || '';
    }
    
    if (!fieldName) {
      throw new TranslationError('Field access requires a field name', node);
    }

    return NodeFactory.createFieldAccessExpression(
      fieldName,
      target,
      this.getLocationOption(node)
    );
  }

  private translateArrayAccess(node: ParseTreeNode): Expression {
    // Try to get array and index as optional first (to allow fallback)
    const array = this.getChildExpression(node, 'array', true);
    if (!array) {
      // Try first child
      const children = this.getChildren(node);
      if (children.length >= 2) {
        const arrExpr = this.tryTranslateExpression(children[0], children[0].type.toLowerCase());
        const idxExpr = this.tryTranslateExpression(children[1], children[1].type.toLowerCase());
        if (arrExpr && idxExpr) {
          return NodeFactory.createArrayAccessExpression(
            arrExpr,
            idxExpr,
            this.getLocationOption(node)
          );
        }
      }
      throw new TranslationError('Array access requires array and index', node);
    }
    const index = this.getChildExpression(node, 'index', true);
    if (!index) {
      // Try second child if index not found
      const children = this.getChildren(node);
      if (children.length >= 2) {
        const idxExpr = this.tryTranslateExpression(children[1], children[1].type.toLowerCase());
        if (idxExpr) {
          return NodeFactory.createArrayAccessExpression(
            array,
            idxExpr,
            this.getLocationOption(node)
          );
        }
      }
      throw new TranslationError('Array access requires an index', node);
    }

    return NodeFactory.createArrayAccessExpression(
      array,
      index,
      this.getLocationOption(node)
    );
  }

  private translateTernaryExpression(node: ParseTreeNode): Expression {
    // Try to get condition, then, and else as optional first (to allow fallback)
    const condition = this.getChildExpression(node, 'condition', true);
    const thenExpr = this.getChildExpression(node, 'thenExpression', true, 'then');
    const elseExpr = this.getChildExpression(node, 'elseExpression', true, 'else');

    if (!condition || !thenExpr || !elseExpr) {
      // Try children array
      const children = this.getChildren(node);
      if (children.length >= 3) {
        const cond = this.tryTranslateExpression(children[0], children[0].type.toLowerCase());
        const then = this.tryTranslateExpression(children[1], children[1].type.toLowerCase());
        const els = this.tryTranslateExpression(children[2], children[2].type.toLowerCase());
        if (cond && then && els) {
          return NodeFactory.createTernaryExpression(
            cond,
            then,
            els,
            this.getLocationOption(node)
          );
        }
      }
      throw new TranslationError('Ternary expression requires condition, then, and else expressions', node);
    }

    return NodeFactory.createTernaryExpression(
      condition,
      thenExpr,
      elseExpr,
      this.getLocationOption(node)
    );
  }

  private translateCastExpression(node: ParseTreeNode): Expression {
    // Parser creates cast_expression with children: [type, expression]
    const children = this.getChildren(node);
    let typeNode = this.getChild(node, 'type');
    if (!typeNode && children.length > 0) {
      // First child is the type
      typeNode = children[0];
    }
    const type = typeNode ? this.tryTranslateType(typeNode) : null;
    if (!type) {
      throw new TranslationError('Cast expression requires a type', node);
    }
    
    // Try to get expression
    let expression = this.getChildExpression(node, 'expression', true);
    if (!expression && children.length >= 2) {
      // Second child is the expression
      expression = this.tryTranslateExpression(children[1], children[1].type.toLowerCase()) || undefined;
    }
    if (!expression) {
      throw new TranslationError('Cast expression requires an expression', node);
    }

    return NodeFactory.createCastExpression(
      type,
      expression,
      this.getLocationOption(node)
    );
  }

  private translateInstanceOfExpression(node: ParseTreeNode): Expression {
    // Try to get expression as optional first (to allow fallback)
    const expression = this.getChildExpression(node, 'expression', true);
    const typeNode = this.getChild(node, 'type');
    const type = typeNode ? this.tryTranslateType(typeNode) : null;

    if (!expression || !type) {
      // Try children array
      const children = this.getChildren(node);
      if (children.length >= 2) {
        const expr = this.tryTranslateExpression(children[0], children[0].type.toLowerCase());
        const t = this.tryTranslateType(children[1]);
        if (expr && t) {
          return NodeFactory.createInstanceOfExpression(
            expr,
            t,
            this.getLocationOption(node)
          );
        }
      }
      throw new TranslationError('Instanceof expression requires expression and type', node);
    }

    return NodeFactory.createInstanceOfExpression(
      expression,
      type,
      this.getLocationOption(node)
    );
  }

  private translateNewExpression(node: ParseTreeNode): Expression {
    // Parser creates new_expression with children: [type, arguments?, arrayInitializer?]
    const children = this.getChildren(node);
    let typeNode = this.getChild(node, 'type');
    if (!typeNode && children.length > 0) {
      // First child is the type
      typeNode = children[0];
    }
    const type = typeNode ? this.tryTranslateType(typeNode) : null;
    if (!type) {
      throw new TranslationError('New expression requires a type', node);
    }
    
    // Look for arguments node
    let argsNode = this.getChild(node, 'arguments', 'args');
    if (!argsNode) {
      // Check if any child is an 'arguments' node
      const children = this.getChildren(node);
      argsNode = children.find(c => c.type === 'arguments' || c.type === 'args') || null;
    }
    const args: Expression[] = [];
    if (argsNode) {
      const argChildren = this.getChildren(argsNode);
      for (const argChild of argChildren) {
        const expr = this.tryTranslateExpression(argChild, argChild.type.toLowerCase());
        if (expr) {
          args.push(expr);
        }
      }
    }
    
    // Look for arrayInitializer node
    let arrayInitNode = this.getChild(node, 'arrayInitializer', 'arrayInit');
    if (!arrayInitNode) {
      // Check if any child is an 'arrayInitializer' node
      const children = this.getChildren(node);
      arrayInitNode = children.find(c => c.type === 'arrayInitializer' || c.type === 'arrayInit') || null;
    }
    const arrayInit: Expression[] = [];
    // Check if we have an arrayInitializer node (even if empty)
    if (arrayInitNode) {
      const initChildren = this.getChildren(arrayInitNode);
      for (const initChild of initChildren) {
        // Handle map entries specially - they have type 'map_entry' with children [key, value]
        // For now, we'll just add both key and value as separate expressions
        // The actual map entry structure would need a special node type
        if (initChild.type === 'map_entry' || initChild.type.toLowerCase() === 'map_entry') {
          const mapEntryChildren = this.getChildren(initChild);
          if (mapEntryChildren.length >= 2) {
            const keyExpr = this.tryTranslateExpression(mapEntryChildren[0], mapEntryChildren[0].type.toLowerCase());
            const valueExpr = this.tryTranslateExpression(mapEntryChildren[1], mapEntryChildren[1].type.toLowerCase());
            if (keyExpr && valueExpr) {
              // For map entries, we'll add them as a pair - this is a simplification
              // In a full implementation, we'd want a MapEntryExpression or similar
              arrayInit.push(keyExpr);
              arrayInit.push(valueExpr);
            }
          }
        } else {
          const expr = this.tryTranslateExpression(initChild, initChild.type.toLowerCase());
          if (expr) {
            arrayInit.push(expr);
          }
        }
      }
    }

    // For initializers, arrayInitializer should be defined even if empty (for empty List/Set/Map)
    // If arrayInitNode exists (even with no children), we should create an empty array
    return NodeFactory.createNewExpression(
      type,
      args.length > 0 ? args : undefined,
      arrayInitNode !== null ? arrayInit : undefined,
      this.getLocationOption(node)
    );
  }

  private translateNewArrayExpression(node: ParseTreeNode): Expression {
    // Parser creates new_array_expression with children: [type, size]
    const children = this.getChildren(node);
    let typeNode = this.getChild(node, 'type');
    if (!typeNode && children.length > 0) {
      // First child is the type
      typeNode = children[0];
    }
    const type = typeNode ? this.tryTranslateType(typeNode) : null;
    if (!type) {
      throw new TranslationError('New array expression requires a type', node);
    }
    
    // Second child is the size expression
    let size: Expression | undefined = undefined;
    // Try named property first
    size = this.getChildExpression(node, 'size', true);
    // If not found, try positional children
    if (!size && children.length >= 2) {
      // Try to translate the second child as an expression
      const sizeChild = children[1];
      // Try translating as expression first
      size = this.tryTranslateExpression(sizeChild, sizeChild.type.toLowerCase()) || undefined;
      // If that fails and it's a number literal, translate it directly
      if (!size && (sizeChild.type === 'number_literal' || sizeChild.type === 'number')) {
        size = this.translateNumberLiteral(sizeChild) || undefined;
      }
    }
    if (!size) {
      // Provide more helpful error message
      const childTypes = children.map(c => c.type).join(', ');
      throw new TranslationError(`New array expression requires a size. Found ${children.length} children with types: ${childTypes}`, node);
    }

    // NewArrayExpression is represented as NewExpression with arrayInitializer containing the size
    return NodeFactory.createNewArrayExpression(
      type,
      size,
      this.getLocationOption(node)
    );
  }

  private translateLambdaExpression(node: ParseTreeNode): Expression {
    const paramsNode = this.getChild(node, 'parameters', 'params');
    const parameters: any[] = [];
    if (paramsNode) {
      const paramChildren = this.getChildren(paramsNode);
      for (const paramNode of paramChildren) {
        const name = this.getText(paramNode) || this.getProperty<string>(paramNode, 'name') || '';
        const typeNode = this.getChild(paramNode, 'type');
        const type = typeNode ? this.tryTranslateType(typeNode) : undefined;
        parameters.push({
          kind: 'LambdaParameter',
          name,
          type,
          location: paramNode.location,
        });
      }
    }
    const bodyNode = this.getChild(node, 'body');
    if (!bodyNode) {
      throw new TranslationError('Lambda expression requires a body', node);
    }
    const bodyExpr = this.tryTranslateExpression(bodyNode, bodyNode.type.toLowerCase());
    const bodyStmt = bodyExpr ? undefined : this.tryTranslateStatement(bodyNode, bodyNode.type.toLowerCase());
    if (!bodyExpr && !bodyStmt) {
      throw new TranslationError('Lambda body must be an expression or statement', bodyNode);
    }

    return NodeFactory.createLambdaExpression(
      parameters,
      (bodyExpr || bodyStmt)!,
      this.getLocationOption(node)
    );
  }

  private translateParenthesizedExpression(node: ParseTreeNode): Expression {
    // Try to get expression as optional first (to allow fallback)
    const expression = this.getChildExpression(node, 'expression', true);
    if (!expression) {
      // Try first child
      const children = this.getChildren(node);
      if (children.length > 0) {
        const expr = this.tryTranslateExpression(children[0], children[0].type.toLowerCase());
        if (expr) {
          return NodeFactory.createParenthesizedExpression(
            expr,
            this.getLocationOption(node)
          );
        }
      }
      throw new TranslationError('Parenthesized expression requires an expression', node);
    }

    return NodeFactory.createParenthesizedExpression(
      expression,
      this.getLocationOption(node)
    );
  }

  private translateSoqlQuery(node: ParseTreeNode): Expression {
    const query = this.getText(node) || this.getProperty<string>(node, 'query') || '';
    // Extract bound expressions from children
    const boundExpressions: Expression[] = [];
    const boundExpressionsNode = this.getChild(node, 'bound_expressions');
    if (boundExpressionsNode) {
      const boundChildren = this.getChildren(boundExpressionsNode);
      for (const boundChild of boundChildren) {
        const expr = this.tryTranslateExpression(boundChild, boundChild.type.toLowerCase());
        if (expr) {
          boundExpressions.push(expr);
        }
      }
    }
    return NodeFactory.createSoqlQueryExpression(query, boundExpressions.length > 0 ? boundExpressions : undefined, this.getLocationOption(node));
  }

  private translateSoslQuery(node: ParseTreeNode): Expression {
    const query = this.getText(node) || this.getProperty<string>(node, 'query') || '';
    // Extract bound expressions from children
    const boundExpressions: Expression[] = [];
    const boundExpressionsNode = this.getChild(node, 'bound_expressions');
    if (boundExpressionsNode) {
      const boundChildren = this.getChildren(boundExpressionsNode);
      for (const boundChild of boundChildren) {
        const expr = this.tryTranslateExpression(boundChild, boundChild.type.toLowerCase());
        if (expr) {
          boundExpressions.push(expr);
        }
      }
    }
    return NodeFactory.createSoslQueryExpression(query, boundExpressions.length > 0 ? boundExpressions : undefined, this.getLocationOption(node));
  }

  private translateTriggerContextVariable(node: ParseTreeNode): Expression {
    // Extract variable name from text like "Trigger.new" -> "new"
    const text = this.getText(node) || this.getProperty<string>(node, 'text') || '';
    const variableName = text.replace(/^Trigger\./i, '');
    return NodeFactory.createTriggerContextVariableExpression(variableName, this.getLocationOption(node));
  }

  private translateDmlStatement(node: ParseTreeNode): Statement {
    // DML statement has: text = operation, children = [target]
    const operation = (this.getText(node) || this.getProperty<string>(node, 'text') || 'insert').toLowerCase() as DmlOperation;
    const children = this.getChildren(node);
    if (children.length === 0) {
      throw new TranslationError('DML statement requires a target expression', node);
    }
    
    const target = this.tryTranslateExpression(children[0], children[0].type.toLowerCase());
    if (!target) {
      throw new TranslationError('DML statement requires a target expression', node);
    }
    
    return NodeFactory.createDmlStatement(operation, target, this.getLocationOption(node));
  }

  // Declaration translation methods

  private translateClassDeclaration(node: ParseTreeNode): Declaration {
    const nameNode = this.getChild(node, 'name');
    const name = nameNode ? (this.getText(nameNode) || this.getProperty<string>(nameNode, 'name') || 'Unknown') : 'Unknown';
    const modifiers = this.extractModifiers(node);
    const typeParameters = this.extractTypeParameters(node);
    const members: any[] = [];
    const extendsClause = this.getChild(node, 'extends_clause', 'extendsClause');
    const implementsClause = this.getChild(node, 'implements_clause', 'implementsClause');
    // Check for members, body, or block (parser uses 'block' for class body)
    // Search through children for a 'block', 'body', or 'members' node
    const children = this.getChildren(node);
    const membersNode = children.find(c => c.type === 'block' || c.type === 'body' || c.type === 'members') || null;
    if (membersNode) {
      const memberChildren = this.getChildren(membersNode);
      for (const memberNode of memberChildren) {
        const decl = this.tryTranslateDeclaration(memberNode, memberNode.type.toLowerCase());
        if (decl) {
          members.push(decl);
        }
      }
    }

    // Extract the type from extends_clause (it has a type child)
    let extendsType: Type | undefined = undefined;
    if (extendsClause) {
      const typeChild = this.getChild(extendsClause, 'type') || this.getChildren(extendsClause).find(c => c.type === 'type');
      if (typeChild) {
        extendsType = this.tryTranslateType(typeChild) || undefined;
      }
    }
    
    // Extract types from implements_clause (each child is a type)
    let implementsTypes: Type[] | undefined = undefined;
    if (implementsClause) {
      const typeChildren = this.getChildren(implementsClause).filter(c => c.type === 'type');
      if (typeChildren.length > 0) {
        implementsTypes = typeChildren.map(c => this.tryTranslateType(c)!).filter(Boolean);
      }
    }

    return NodeFactory.createClassDeclaration(
      name,
      members,
      modifiers,
      extendsType,
      implementsTypes,
      typeParameters.length > 0 ? typeParameters : undefined,
      this.getLocationOption(node)
    );
  }

  private translateInterfaceDeclaration(node: ParseTreeNode): Declaration {
    const nameNode = this.getChild(node, 'name');
    const name = nameNode ? (this.getText(nameNode) || this.getProperty<string>(nameNode, 'name') || 'Unknown') : 'Unknown';
    const modifiers = this.extractModifiers(node);
    const typeParameters = this.extractTypeParameters(node);
    const members: any[] = [];
    const extendsClause = this.getChild(node, 'extends_clause', 'extendsClause');
    // Parser creates a 'block' node for interface body, not 'body' or 'members'
    const membersNode = this.getChild(node, 'members', 'body') || this.getChild(node, 'block');
    if (membersNode) {
      const memberChildren = this.getChildren(membersNode);
      for (const memberNode of memberChildren) {
        const decl = this.tryTranslateDeclaration(memberNode, memberNode.type.toLowerCase());
        if (decl) {
          members.push(decl);
        }
      }
    }

    return NodeFactory.createInterfaceDeclaration(
      name,
      members,
      modifiers,
      extendsClause ? this.getChildren(extendsClause).map(c => this.tryTranslateType(c)!).filter(Boolean) : undefined,
      typeParameters.length > 0 ? typeParameters : undefined,
      this.getLocationOption(node)
    );
  }

  private translateMethodDeclaration(node: ParseTreeNode): Declaration {
    const nameNode = this.getChild(node, 'name');
    const name = nameNode ? (this.getText(nameNode) || this.getProperty<string>(nameNode, 'name') || 'unknown') : 'unknown';
    const modifiers = this.extractModifiers(node);
    const annotations = this.extractAnnotations(node);
    const typeParameters = this.extractTypeParameters(node);
    const returnTypeNode = this.getChild(node, 'returnType', 'type');
    const returnType = returnTypeNode
      ? (this.tryTranslateType(returnTypeNode) || NodeFactory.createPrimitiveType('void'))
      : NodeFactory.createPrimitiveType('void');
    const parameters: any[] = [];
    const paramsNode = this.getChild(node, 'parameters', 'params');
    if (paramsNode) {
      const paramChildren = this.getChildren(paramsNode);
      for (const paramNode of paramChildren) {
        const paramNameNode = this.getChild(paramNode, 'name');
        const paramName = paramNameNode ? (this.getText(paramNameNode) || this.getProperty<string>(paramNameNode, 'name') || 'param') : 'param';
        const paramTypeNode = this.getChild(paramNode, 'type');
        const paramType = paramTypeNode
          ? (this.tryTranslateType(paramTypeNode) || NodeFactory.createPrimitiveType('Object'))
          : NodeFactory.createPrimitiveType('Object');
        const paramModifiers = this.extractModifiers(paramNode);
        const paramAnnotations = this.extractAnnotations(paramNode);
        parameters.push({
          kind: 'Parameter',
          name: paramName,
          type: paramType,
          modifiers: paramModifiers.length > 0 ? paramModifiers : undefined,
          annotations: paramAnnotations.length > 0 ? paramAnnotations : undefined,
          location: paramNode.location,
        });
      }
    }
    // Method body can be 'body' or 'block' node
    const bodyNode = this.getChild(node, 'body') || this.getChild(node, 'block');
    const body = bodyNode ? (this.translateBlock(bodyNode) as Block) : undefined;

    return NodeFactory.createMethodDeclaration(
      name,
      returnType,
      parameters,
      body,
      modifiers,
      typeParameters.length > 0 ? typeParameters : undefined,
      annotations.length > 0 ? annotations : undefined,
      this.getLocationOption(node)
    );
  }

  private translateConstructorDeclaration(node: ParseTreeNode): Declaration {
    const modifiers = this.extractModifiers(node);
    const annotations = this.extractAnnotations(node);
    const parameters: any[] = [];
    const paramsNode = this.getChild(node, 'parameters', 'params');
    if (paramsNode) {
      const paramChildren = this.getChildren(paramsNode);
      for (const paramNode of paramChildren) {
        const paramNameNode = this.getChild(paramNode, 'name');
        const paramName = paramNameNode ? (this.getText(paramNameNode) || this.getProperty<string>(paramNameNode, 'name') || 'param') : 'param';
        const paramTypeNode = this.getChild(paramNode, 'type');
        const paramType = paramTypeNode
          ? (this.tryTranslateType(paramTypeNode) || NodeFactory.createPrimitiveType('Object'))
          : NodeFactory.createPrimitiveType('Object');
        const paramModifiers = this.extractModifiers(paramNode);
        const paramAnnotations = this.extractAnnotations(paramNode);
        parameters.push({
          kind: 'Parameter',
          name: paramName,
          type: paramType,
          modifiers: paramModifiers.length > 0 ? paramModifiers : undefined,
          annotations: paramAnnotations.length > 0 ? paramAnnotations : undefined,
          location: paramNode.location,
        });
      }
    }
    const bodyNode = this.getChild(node, 'body');
    if (!bodyNode) {
      throw new TranslationError('Constructor requires a body', node);
    }
    const body = this.translateBlock(bodyNode) as Block;

    return NodeFactory.createConstructorDeclaration(
      parameters,
      body,
      modifiers,
      annotations.length > 0 ? annotations : undefined,
      this.getLocationOption(node)
    );
  }

  private translateFieldDeclaration(node: ParseTreeNode): Declaration {
    const nameNode = this.getChild(node, 'name');
    const name = nameNode ? (this.getText(nameNode) || this.getProperty<string>(nameNode, 'name') || 'unknown') : 'unknown';
    const modifiers = this.extractModifiers(node);
    const typeNode = this.getChild(node, 'type');
    const type = typeNode
      ? (this.tryTranslateType(typeNode) || NodeFactory.createPrimitiveType('Object'))
      : NodeFactory.createPrimitiveType('Object');
    
    // Look for initializer - it could be a direct child expression or in an 'initializer' property
    let initializer: Expression | undefined;
    // Try to find an expression child that's not type, name, modifiers, or annotations
    const children = this.getChildren(node);
    for (const child of children) {
      const childType = child.type.toLowerCase();
      if (childType !== 'type' && childType !== 'name' && childType !== 'modifiers' && 
          childType !== 'annotations' && childType !== 'modifier' && childType !== 'annotation' &&
          childType !== 'base_type' && childType !== 'array_dimensions' && childType !== 'type_arguments') {
        const expr = this.tryTranslateExpression(child, childType);
        if (expr) {
          initializer = expr;
          break;
        }
      }
    }

    return NodeFactory.createVariableDeclaration(
      name,
      type,
      initializer,
      modifiers.length > 0 ? modifiers : undefined,
      this.getLocationOption(node)
    );
  }

  private translatePropertyDeclaration(node: ParseTreeNode): Declaration {
    const nameNode = this.getChild(node, 'name');
    const name = nameNode ? (this.getText(nameNode) || this.getProperty<string>(nameNode, 'name') || 'unknown') : 'unknown';
    const modifiers = this.extractModifiers(node);
    const annotations = this.extractAnnotations(node);
    const typeNode = this.getChild(node, 'type');
    const type = typeNode
      ? (this.tryTranslateType(typeNode) || NodeFactory.createPrimitiveType('Object'))
      : NodeFactory.createPrimitiveType('Object');
    const getterNode = this.getChild(node, 'getter');
    const getter = getterNode ? (this.translateBlock(getterNode) as Block) : undefined;
    const setterNode = this.getChild(node, 'setter');
    const setter = setterNode ? (this.translateBlock(setterNode) as Block) : undefined;

    return NodeFactory.createPropertyDeclaration(
      name,
      type,
      modifiers,
      getter,
      setter,
      annotations.length > 0 ? annotations : undefined,
      this.getLocationOption(node)
    );
  }

  private translateEnumDeclaration(node: ParseTreeNode): Declaration {
    const nameNode = this.getChild(node, 'name');
    const name = nameNode ? (this.getText(nameNode) || this.getProperty<string>(nameNode, 'name') || 'Unknown') : 'Unknown';
    const modifiers = this.extractModifiers(node);
    const constants: any[] = [];
    const members: any[] = [];
    
    // Constants are in the body/block
    // Parser creates a 'block' node for enum body, not 'body' or 'members'
    const bodyNode = this.getChild(node, 'body', 'members') || this.getChild(node, 'block');
    if (bodyNode) {
      const bodyChildren = this.getChildren(bodyNode);
      for (const childNode of bodyChildren) {
        if (childNode.type === 'enum_constant' || childNode.type.toLowerCase() === 'enum_constant') {
          const constNameNode = this.getChild(childNode, 'name');
          const constName = constNameNode ? (this.getText(constNameNode) || this.getProperty<string>(constNameNode, 'name') || 'UNKNOWN') : 'UNKNOWN';
          // Enum constants can have arguments (constructor-like)
          const args = this.getChildren(childNode, 'arguments', 'args')
            .map((child) => this.tryTranslateExpression(child, child.type.toLowerCase()))
            .filter((expr): expr is Expression => expr !== null);
          constants.push(NodeFactory.createEnumConstantDeclaration(
            constName,
            args.length > 0 ? args : undefined,
            undefined,
            this.getLocationOption(childNode)
          ));
        } else {
          // Other enum members (methods, inner classes, etc.)
          const decl = this.tryTranslateDeclaration(childNode, childNode.type.toLowerCase());
          if (decl) {
            members.push(decl);
          }
        }
      }
    }

    return NodeFactory.createEnumDeclaration(
      name,
      constants,
      modifiers,
      members.length > 0 ? members : undefined,
      this.getLocationOption(node)
    );
  }

  private translateEnumConstantDeclaration(node: ParseTreeNode): Declaration {
    const nameNode = this.getChild(node, 'name');
    const name = nameNode ? (this.getText(nameNode) || this.getProperty<string>(nameNode, 'name') || 'UNKNOWN') : 'UNKNOWN';
    // Enum constants can have constructor arguments
    const args = this.getChildren(node, 'arguments', 'args')
      .map((child) => this.tryTranslateExpression(child, child.type.toLowerCase()))
      .filter((expr): expr is Expression => expr !== null);
    // Enum constants can also have anonymous class bodies
    const bodyNode = this.getChild(node, 'body');
    let body: ClassDeclaration | undefined;
    if (bodyNode) {
      const classDecl = this.tryTranslateDeclaration(bodyNode, bodyNode.type.toLowerCase());
      if (classDecl && classDecl.kind === 'ClassDeclaration') {
        body = classDecl as ClassDeclaration;
      }
    }

    return NodeFactory.createEnumConstantDeclaration(
      name,
      args.length > 0 ? args : undefined,
      body,
      this.getLocationOption(node)
    );
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

  private translateAnnotationDeclaration(node: ParseTreeNode): Declaration {
    const nameNode = this.getChild(node, 'name');
    const name = nameNode ? (this.getText(nameNode) || this.getProperty<string>(nameNode, 'name') || 'Unknown') : 'Unknown';
    const modifiers = this.extractModifiers(node);
    const members: any[] = [];
    
    const membersNode = this.getChild(node, 'members', 'body');
    if (membersNode) {
      const memberChildren = this.getChildren(membersNode);
      for (const memberNode of memberChildren) {
        if (memberNode.type === 'annotation_member' || memberNode.type.toLowerCase() === 'annotation_member') {
          const memberNameNode = this.getChild(memberNode, 'name');
          const memberName = memberNameNode ? (this.getText(memberNameNode) || this.getProperty<string>(memberNameNode, 'name') || '') : '';
          // Type is the first child (returnType)
          const memberChildren = this.getChildren(memberNode);
          const memberTypeNode = memberChildren.find(c => c.type === 'type' || c.type === 'primitive_type') || memberChildren[0];
          const memberType = memberTypeNode
            ? (this.tryTranslateType(memberTypeNode) || NodeFactory.createPrimitiveType('Object'))
            : NodeFactory.createPrimitiveType('Object');
          
          // Default value is the last child if it's not the name node
          let defaultValue: Expression | undefined;
          const allChildren = this.getChildren(memberNode);
          // Look for a child that's not 'name' and not the type - it should be the default value expression
          for (const child of allChildren) {
            if (child.type !== 'name' && child !== memberTypeNode) {
              const expr = this.tryTranslateExpression(child, child.type.toLowerCase());
              if (expr) {
                defaultValue = expr;
                break;
              }
            }
          }
          
          if (memberName && memberType) {
            members.push({
              kind: 'AnnotationMember',
              name: memberName,
              type: memberType,
              defaultValue,
              location: memberNode.location,
            });
          }
        }
      }
    }

    return NodeFactory.createAnnotationDeclaration(
      name,
      members,
      modifiers,
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
    // First check if it's a direct property
    if (propertyName in node) {
      const value = (node as any)[propertyName];
      return value && typeof value === 'object' && 'type' in value ? value : null;
    }

    if (altPropertyName && altPropertyName in node) {
      const value = (node as any)[altPropertyName];
      return value && typeof value === 'object' && 'type' in value ? value : null;
    }

    // If not a property, search through children for matching type
    const children = this.getChildren(node);
    for (const child of children) {
      if (child.type === propertyName || child.type.toLowerCase() === propertyName.toLowerCase()) {
        return child;
      }
    }
    
    // If altPropertyName provided, also search for it
    if (altPropertyName) {
      for (const child of children) {
        if (child.type === altPropertyName || child.type.toLowerCase() === altPropertyName.toLowerCase()) {
          return child;
        }
      }
    }

    // No matching child found
    return null;
  }

  private getChildExpression(
    node: ParseTreeNode,
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
    
    // Handle base_type nodes (children of type nodes)
    if (nodeType === 'base_type') {
      const name = this.getText(node) || this.getProperty<string>(node, 'name') || 'Object';
      return NodeFactory.createPrimitiveType(name, this.getLocationOption(node));
    }
    
    // Handle primitive_type nodes
    if (nodeType === 'primitive_type') {
      const name = this.getText(node) || this.getProperty<string>(node, 'name') || 'Object';
      return NodeFactory.createPrimitiveType(name, this.getLocationOption(node));
    }
    
    // Handle type nodes - extract base_type from children
    if (nodeType === 'type') {
      // Look for base_type child
      const baseTypeNode = this.getChild(node, 'base_type');
      if (baseTypeNode) {
        const name = this.getText(baseTypeNode) || this.getProperty<string>(baseTypeNode, 'name') || 'Object';
        const baseType = NodeFactory.createPrimitiveType(name, this.getLocationOption(baseTypeNode));
        
        // Check for array dimensions
        const arrayDimensionsNode = this.getChild(node, 'array_dimensions');
        const arrayDimensions = arrayDimensionsNode 
          ? parseInt(this.getText(arrayDimensionsNode) || '0', 10) 
          : 0;
        
        // Check for type arguments (generics)
        const typeArgumentsNode = this.getChild(node, 'type_arguments');
        let typeArguments: Type[] | undefined;
        if (typeArgumentsNode) {
          const typeArgChildren = this.getChildren(typeArgumentsNode);
          typeArguments = typeArgChildren
            .map(child => this.tryTranslateType(child))
            .filter((t): t is Type => t !== null);
          if (typeArguments.length === 0) {
            typeArguments = undefined;
          }
        }
        
        // Create appropriate type based on structure
        if (arrayDimensions > 0) {
          // Array type - apply dimensions from innermost to outermost
          let elementType: Type = baseType;
          for (let i = 0; i < arrayDimensions; i++) {
            elementType = NodeFactory.createArrayType(elementType, 1, this.getLocationOption(node));
          }
          return elementType;
        } else if (typeArguments && typeArguments.length > 0) {
          // Generic type
          return NodeFactory.createGenericType(
            baseType,
            typeArguments,
            this.getLocationOption(node)
          );
        } else {
          // Simple primitive/class type
          return baseType;
        }
      }
      
      // Fallback: try to get name directly from type node
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

  /**
   * Extract modifiers from a parse tree node
   */
  private extractModifiers(node: ParseTreeNode): Modifier[] {
    const modifiers: Modifier[] = [];
    const modifiersNode = this.getChild(node, 'modifiers');
    if (modifiersNode) {
      const modifierChildren = this.getChildren(modifiersNode);
      for (const modifierNode of modifierChildren) {
        const modifierText = this.getText(modifierNode) || this.getProperty<string>(modifierNode, 'text') || '';
        if (modifierText) {
          const lowerText = modifierText.toLowerCase();
          // Map Apex-specific keywords to ModifierKeyword type
          let keyword: ModifierKeyword | null = null;
          if (lowerText === 'public') keyword = 'public';
          else if (lowerText === 'private') keyword = 'private';
          else if (lowerText === 'protected') keyword = 'protected';
          else if (lowerText === 'global') keyword = 'global';
          else if (lowerText === 'static') keyword = 'static';
          else if (lowerText === 'final') keyword = 'final';
          else if (lowerText === 'abstract') keyword = 'abstract';
          else if (lowerText === 'override') keyword = 'override';
          else if (lowerText === 'transient') keyword = 'transient';
          else if (lowerText === 'webservice') keyword = 'webservice';
          else if (lowerText === 'testmethod' || lowerText === 'test') keyword = 'testMethod';
          else if (lowerText === 'future') keyword = 'future';
          else if (lowerText === 'deprecated') keyword = 'deprecated';
          
          if (keyword) {
            modifiers.push({
              kind: 'Modifier',
              keyword,
              location: modifierNode.location,
            });
          }
        }
      }
    }
    return modifiers;
  }

  /**
   * Extract type parameters from a parse tree node
   */
  private extractTypeParameters(node: ParseTreeNode): TypeParameter[] {
    const typeParams: TypeParameter[] = [];
    const typeParamsNode = this.getChild(node, 'type_parameters', 'typeParameters');
    if (typeParamsNode) {
      const paramChildren = this.getChildren(typeParamsNode);
      for (const paramNode of paramChildren) {
        if (paramNode.type === 'type_parameter' || paramNode.type.toLowerCase() === 'type_parameter') {
          const nameNode = this.getChild(paramNode, 'name');
          const name = nameNode ? (this.getText(nameNode) || this.getProperty<string>(nameNode, 'name') || '') : '';
          if (name) {
            // Look for extends bound - it's the child that's not 'name'
            const allChildren = this.getChildren(paramNode);
            let extendsBound: Type | undefined;
            for (const child of allChildren) {
              if (child !== nameNode && (child.type === 'type' || child.type === 'primitive_type')) {
                const bound = this.tryTranslateType(child);
                if (bound) {
                  extendsBound = bound;
                  break;
                }
              }
            }
            typeParams.push({
              kind: 'TypeParameter',
              name,
              extendsBound,
              location: paramNode.location,
            });
          }
        }
      }
    }
    return typeParams;
  }

  /**
   * Extract annotations from a parse tree node
   */
  private extractAnnotations(node: ParseTreeNode): Annotation[] {
    const annotations: Annotation[] = [];
    const annotationsNode = this.getChild(node, 'annotations');
    if (annotationsNode) {
      const annotationChildren = this.getChildren(annotationsNode);
      for (const annotationNode of annotationChildren) {
        const annotationNameNode = this.getChild(annotationNode, 'name');
        const annotationName = annotationNameNode ? (this.getText(annotationNameNode) || this.getProperty<string>(annotationNameNode, 'name') || '') : '';
        if (annotationName) {
          const argsNode = this.getChild(annotationNode, 'arguments', 'args');
          const args: AnnotationArgument[] = [];
          if (argsNode) {
            const argChildren = this.getChildren(argsNode);
            for (const argNode of argChildren) {
              const argNameNode = this.getChild(argNode, 'name');
              const argName = argNameNode ? (this.getText(argNameNode) || this.getProperty<string>(argNameNode, 'name')) : undefined;
              const argValue = this.getChildExpression(argNode, 'value', true);
              if (argValue) {
                args.push({
                  kind: 'AnnotationArgument',
                  name: argName,
                  value: argValue,
                  location: argNode.location,
                });
              }
            }
          }
          annotations.push({
            kind: 'Annotation',
            name: annotationName,
            arguments: args.length > 0 ? args : undefined,
            location: annotationNode.location,
          });
        }
      }
    }
    return annotations;
  }
}
