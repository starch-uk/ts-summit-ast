/**
 * @file Factory for creating statement AST nodes.
 * Specialized factory for creating statement node types.
 */

import type {
  IfStatement,
  ForLoopStatement,
  EnhancedForLoopStatement,
  WhileLoopStatement,
  DoWhileLoopStatement,
  SwitchStatement,
  TryStatement,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
  ThrowStatement,
  CompoundStatement,
  ExpressionStatement,
  VariableDeclarationStatement,
  DmlStatement,
  CatchClause,
} from '../ast/Statement.js';
import type { Expression } from '../ast/Expression.js';
import type { VariableDeclaration } from '../ast/Declaration.js';
import type { Statement, SwitchCase } from '../ast/Statement.js';

import type { NodeFactoryOptions } from './NodeFactoryOptions.js';

/**
 * Factory for statement nodes.
 */
export class StatementFactory {
  /**
   * Creates an if statement.
   * @param condition - The condition expression.
   * @param thenStatement - The statement to execute if the condition is true.
   * @param elseStatement - The statement to execute if the condition is false.
   * @param options - Optional factory options.
   * @returns The created if statement.
   */
  public static createIfStatement(
    condition: Expression,
    thenStatement: Statement,
    elseStatement?: Statement,
    options?: NodeFactoryOptions
  ): IfStatement {
    return {
      condition,
      elseStatement,
      kind: 'IfStatement',
      location: options?.location,
      thenStatement,
    };
  }

  /**
   * Creates a for loop statement.
   * @param body - The body statement of the for loop.
   * @param init - The initialization statement.
   * @param condition - The loop condition expression.
   * @param update - The update expression.
   * @param options - Optional factory options.
   * @returns The created for loop statement.
   */
  public static createForLoopStatement(
    body: Readonly<Statement>,
    init?: Readonly<ExpressionStatement | VariableDeclarationStatement>,
    condition?: Readonly<Expression>,
    update?: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ForLoopStatement {
    return {
      body,
      condition,
      init,
      kind: 'ForLoopStatement',
      location: options?.location,
      update,
    };
  }

  /**
   * Creates a while loop statement.
   * @param condition - The loop condition expression.
   * @param body - The body statement of the while loop.
   * @param options - Optional factory options.
   * @returns The created while loop statement.
   */
  public static createWhileLoopStatement(
    condition: Expression,
    body: Statement,
    options?: NodeFactoryOptions
  ): WhileLoopStatement {
    return {
      body,
      condition,
      kind: 'WhileLoopStatement',
      location: options?.location,
    };
  }

  /**
   * Creates a for loop statement.
   * @param body - The body statement of the for loop.
   * @param init - The initialization statement.
   * @param condition - The loop condition expression.
   * @param update - The update expression.
   * @param options - Optional factory options.
   * @returns The created for loop statement.
   * @deprecated Use createForLoopStatement instead.
   */
  public static createForStatement(
    body: Readonly<Statement>,
    init?: Readonly<ExpressionStatement | VariableDeclarationStatement>,
    condition?: Readonly<Expression>,
    update?: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ForLoopStatement {
    return this.createForLoopStatement(body, init, condition, update, options);
  }

  /**
   * Creates a while loop statement.
   * @param condition - The loop condition expression.
   * @param body - The body statement of the while loop.
   * @param options - Optional factory options.
   * @returns The created while loop statement.
   * @deprecated Use createWhileLoopStatement instead.
   */
  public static createWhileStatement(
    condition: Expression,
    body: Statement,
    options?: NodeFactoryOptions
  ): WhileLoopStatement {
    return this.createWhileLoopStatement(condition, body, options);
  }

  /**
   * Creates a return statement.
   * @param expression - The expression to return, if any.
   * @param options - Optional factory options.
   * @returns The created return statement.
   */
  public static createReturnStatement(
    expression?: Expression,
    options?: NodeFactoryOptions
  ): ReturnStatement {
    return {
      expression,
      kind: 'ReturnStatement',
      location: options?.location,
    };
  }

  /**
   * Creates a compound statement (block).
   * @param statements - The statements in the compound statement.
   * @param options - Optional factory options.
   * @returns The created compound statement.
   */
  public static createCompoundStatement(
    statements: readonly Statement[],
    options?: Readonly<NodeFactoryOptions>
  ): CompoundStatement {
    return {
      kind: 'CompoundStatement',
      location: options?.location,
      statements: [...statements],
    };
  }

  /**
   * Creates a block statement.
   * @param statements - The statements in the block.
   * @param options - Optional factory options.
   * @returns The created compound statement.
   * @deprecated Use createCompoundStatement instead.
   */
  public static createBlock(
    statements: readonly Statement[],
    options?: Readonly<NodeFactoryOptions>
  ): CompoundStatement {
    return this.createCompoundStatement(statements, options);
  }

  /**
   * Creates an expression statement.
   * @param expression - The expression.
   * @param options - Optional factory options.
   * @returns The created expression statement.
   */
  public static createExpressionStatement(
    expression: Expression,
    options?: NodeFactoryOptions
  ): ExpressionStatement {
    return {
      expression,
      kind: 'ExpressionStatement',
      location: options?.location,
    };
  }

  /**
   * Creates a variable declaration statement.
   * @param declaration - The variable declaration.
   * @param options - Optional factory options.
   * @returns The created variable declaration statement.
   */
  public static createVariableDeclarationStatement(
    declaration: Readonly<VariableDeclaration>,
    options?: Readonly<NodeFactoryOptions>
  ): VariableDeclarationStatement {
    return {
      declaration,
      kind: 'VariableDeclarationStatement',
      location: options?.location,
    };
  }

  /**
   * Creates an enhanced for loop statement.
   * @param variable - The loop variable declaration.
   * @param iterable - The iterable expression.
   * @param body - The body statement of the enhanced for loop.
   * @param options - Optional factory options.
   * @returns The created enhanced for loop statement.
   */
  public static createEnhancedForLoopStatement(
    variable: Readonly<VariableDeclaration>,
    iterable: Readonly<Expression>,
    body: Readonly<Statement>,
    options?: Readonly<NodeFactoryOptions>
  ): EnhancedForLoopStatement {
    return {
      body,
      iterable,
      kind: 'EnhancedForLoopStatement',
      location: options?.location,
      variable,
    };
  }

  /**
   * Creates a do-while loop statement.
   * @param body - The body statement of the do-while loop.
   * @param condition - The loop condition expression.
   * @param options - Optional factory options.
   * @returns The created do-while loop statement.
   */
  public static createDoWhileLoopStatement(
    body: Statement,
    condition: Expression,
    options?: NodeFactoryOptions
  ): DoWhileLoopStatement {
    return {
      body,
      condition,
      kind: 'DoWhileLoopStatement',
      location: options?.location,
    };
  }

  /**
   * Creates a for-each loop statement.
   * @param variable - The loop variable declaration.
   * @param iterable - The iterable expression.
   * @param body - The body statement of the for-each loop.
   * @param options - Optional factory options.
   * @returns The created enhanced for loop statement.
   * @deprecated Use createEnhancedForLoopStatement instead.
   */
  public static createForEachStatement(
    variable: Readonly<VariableDeclaration>,
    iterable: Readonly<Expression>,
    body: Readonly<Statement>,
    options?: Readonly<NodeFactoryOptions>
  ): EnhancedForLoopStatement {
    return this.createEnhancedForLoopStatement(variable, iterable, body, options);
  }

  /**
   * Creates a do-while loop statement.
   * @param body - The body statement of the do-while loop.
   * @param condition - The loop condition expression.
   * @param options - Optional factory options.
   * @returns The created do-while loop statement.
   * @deprecated Use createDoWhileLoopStatement instead.
   */
  public static createDoWhileStatement(
    body: Statement,
    condition: Expression,
    options?: NodeFactoryOptions
  ): DoWhileLoopStatement {
    return this.createDoWhileLoopStatement(body, condition, options);
  }

  /**
   * Creates a switch statement.
   * @param expression - The switch expression.
   * @param cases - The switch cases.
   * @param defaultCase - The default case, if any.
   * @param options - Optional factory options.
   * @returns The created switch statement.
   */
  public static createSwitchStatement(
    expression: Readonly<Expression>,
    cases: readonly SwitchCase[],
    defaultCase?: Readonly<SwitchCase>,

    options?: Readonly<NodeFactoryOptions>
  ): SwitchStatement {
    return {
      cases: [...cases],
      defaultCase,
      expression,
      kind: 'SwitchStatement',
      location: options?.location,
    };
  }

  /**
   * Creates a try statement.
   * @param tryBlock - The try block statement.
   * @param catchClauses - The catch clauses.
   * @param finallyBlock - The finally block statement, if any.
   * @param options - Optional factory options.
   * @returns The created try statement.
   */
  public static createTryStatement(
    tryBlock: Readonly<CompoundStatement>,
    catchClauses: readonly CatchClause[],
    finallyBlock?: Readonly<CompoundStatement>,
    options?: Readonly<NodeFactoryOptions>
  ): TryStatement {
    return {
      catchClauses: [...catchClauses],
      finallyBlock,
      kind: 'TryStatement',
      location: options?.location,
      tryBlock,
    };
  }

  /**
   * Creates a break statement.
   * @param label - The optional label to break to.
   * @param options - Optional factory options.
   * @returns The created break statement.
   */
  public static createBreakStatement(label?: string, options?: NodeFactoryOptions): BreakStatement {
    return {
      kind: 'BreakStatement',
      label,
      location: options?.location,
    };
  }

  /**
   * Creates a continue statement.
   * @param label - The optional label to continue to.
   * @param options - Optional factory options.
   * @returns The created continue statement.
   */
  public static createContinueStatement(
    label?: string,
    options?: NodeFactoryOptions
  ): ContinueStatement {
    return {
      kind: 'ContinueStatement',
      label,
      location: options?.location,
    };
  }

  /**
   * Creates a throw statement.
   * @param expression - The expression to throw.
   * @param options - Optional factory options.
   * @returns The created throw statement.
   */
  public static createThrowStatement(
    expression: Expression,
    options?: NodeFactoryOptions
  ): ThrowStatement {
    return {
      expression,
      kind: 'ThrowStatement',
      location: options?.location,
    };
  }

  /**
   * Creates a DML statement.
   * @param operation - The DML operation type.
   * @param target - The target expression.
   * @param options - Optional factory options.
   * @returns The created DML statement.
   */
  public static createDmlStatement(
    operation: 'delete' | 'insert' | 'merge' | 'undelete' | 'update' | 'upsert',
    target: Expression,
    options?: NodeFactoryOptions
  ): DmlStatement {
    return {
      kind: 'DmlStatement',
      location: options?.location,
      operation,
      target,
    };
  }
}
