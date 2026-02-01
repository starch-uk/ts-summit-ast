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
} from '../ast/statement.js';
import type { Expression } from '../ast/expression.js';
import type { VariableDeclaration } from '../ast/declaration.js';
import type { Statement, SwitchCase } from '../ast/statement.js';

import type { NodeFactoryOptions } from './nodeFactory.js';

/**
 * Factory for statement nodes.
 */
export const StatementFactory = {
  /**
   * Creates a block statement.
   * @param statements - The list of statements to include in the block.
   * @param options - Optional factory options.
   * @returns The created compound statement.
   * @deprecated Use createCompoundStatement instead.
   */
  createBlock(
    statements: readonly Statement[],
    options?: Readonly<NodeFactoryOptions>
  ): CompoundStatement {
    return StatementFactory.createCompoundStatement(statements, options);
  },

  /**
   * Creates a break statement.
   * @param label - The optional label to break to.
   * @param options - Optional factory options.
   * @returns The created break statement.
   */
  createBreakStatement(label?: string, options?: Readonly<NodeFactoryOptions>): BreakStatement {
    return {
      kind: 'BreakStatement',
      label,
      location: options?.location,
    };
  },

  /**
   * Creates a compound statement (block).
   * @param statements - The list of statements to include in the block.
   * @param options - Optional factory options.
   * @returns The created compound statement.
   */
  createCompoundStatement(
    statements: readonly Statement[],
    options?: Readonly<NodeFactoryOptions>
  ): CompoundStatement {
    return {
      kind: 'CompoundStatement',
      location: options?.location,
      statements: [...statements],
    };
  },

  /**
   * Creates a continue statement.
   * @param label - The optional label to continue to.
   * @param options - Optional factory options.
   * @returns The created continue statement.
   */
  createContinueStatement(
    label?: string,
    options?: Readonly<NodeFactoryOptions>
  ): ContinueStatement {
    return {
      kind: 'ContinueStatement',
      label,
      location: options?.location,
    };
  },

  /**
   * Creates a DML statement.
   * @param operation - The DML operation type.
   * @param target - The target expression.
   * @param options - Optional factory options.
   * @returns The created DML statement.
   */
  createDmlStatement(
    operation: 'delete' | 'insert' | 'merge' | 'undelete' | 'update' | 'upsert',
    target: Expression,
    options?: Readonly<NodeFactoryOptions>
  ): DmlStatement {
    return {
      kind: 'DmlStatement',
      location: options?.location,
      operation,
      target,
    };
  },

  /**
   * Creates a do-while loop statement.
   * @param body - The statement executed before checking the condition.
   * @param condition - The boolean expression evaluated after each iteration.
   * @param options - Optional factory options.
   * @returns The created do-while loop statement.
   */
  createDoWhileLoopStatement(
    body: Statement,
    condition: Expression,
    options?: Readonly<NodeFactoryOptions>
  ): DoWhileLoopStatement {
    return {
      body,
      condition,
      kind: 'DoWhileLoopStatement',
      location: options?.location,
    };
  },

  /**
   * Creates a do-while loop statement.
   * @param body - The statement executed before checking the condition.
   * @param condition - The boolean expression evaluated after each iteration.
   * @param options - Optional factory options.
   * @returns The created do-while loop statement.
   * @deprecated Use createDoWhileLoopStatement instead.
   */
  createDoWhileStatement(
    body: Statement,
    condition: Expression,
    options?: Readonly<NodeFactoryOptions>
  ): DoWhileLoopStatement {
    return StatementFactory.createDoWhileLoopStatement(body, condition, options);
  },

  /**
   * Creates an enhanced for loop statement.
   * @param variable - The loop iteration variable declaration.
   * @param iterable - The expression producing the collection to iterate over.
   * @param body - The statement executed for each iteration.
   * @param options - Optional factory options.
   * @returns The created enhanced for loop statement.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Factory method requires 4 parameters
  createEnhancedForLoopStatement(
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
  },

  /**
   * Creates an expression statement.
   * @param expression - The expression to wrap as a statement.
   * @param options - Optional factory options.
   * @returns The created expression statement.
   */
  createExpressionStatement(
    expression: Expression,
    options?: Readonly<NodeFactoryOptions>
  ): ExpressionStatement {
    return {
      expression,
      kind: 'ExpressionStatement',
      location: options?.location,
    };
  },

  /**
   * Creates a for-each loop statement.
   * @param variable - The loop iteration variable declaration.
   * @param iterable - The expression producing the collection to iterate over.
   * @param body - The statement executed for each iteration.
   * @param options - Optional factory options.
   * @returns The created enhanced for loop statement.
   * @deprecated Use createEnhancedForLoopStatement instead.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Factory method requires 4 parameters
  createForEachStatement(
    variable: Readonly<VariableDeclaration>,
    iterable: Readonly<Expression>,
    body: Readonly<Statement>,
    options?: Readonly<NodeFactoryOptions>
  ): EnhancedForLoopStatement {
    return StatementFactory.createEnhancedForLoopStatement(variable, iterable, body, options);
  },

  /**
   * Creates a for loop statement.
   * @param body - The statement executed for each iteration.
   * @param init - The optional initialization statement.
   * @param condition - The optional loop condition expression.
   * @param update - The optional update expression executed after each iteration.
   * @param options - Optional factory options.
   * @returns The created for loop statement.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Factory method requires 5 parameters
  createForLoopStatement(
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
  },

  /**
   * Creates a for loop statement.
   * @param body - The statement executed for each iteration.
   * @param init - The optional initialization statement.
   * @param condition - The optional loop condition expression.
   * @param update - The optional update expression executed after each iteration.
   * @param options - Optional factory options.
   * @returns The created for loop statement.
   * @deprecated Use createForLoopStatement instead.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Factory method requires 5 parameters
  createForStatement(
    body: Readonly<Statement>,
    init?: Readonly<ExpressionStatement | VariableDeclarationStatement>,
    condition?: Readonly<Expression>,
    update?: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ForLoopStatement {
    return StatementFactory.createForLoopStatement(body, init, condition, update, options);
  },

  /**
   * Creates an if statement.
   * @param condition - The condition expression.
   * @param thenStatement - The statement to execute if the condition is true.
   * @param elseStatement - The statement to execute if the condition is false.
   * @param options - Optional factory options.
   * @returns The created if statement.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Factory method requires 4 parameters
  createIfStatement(
    condition: Expression,
    thenStatement: Statement,
    elseStatement?: Statement,
    options?: Readonly<NodeFactoryOptions>
  ): IfStatement {
    return {
      condition,
      elseStatement,
      kind: 'IfStatement',
      location: options?.location,
      thenStatement,
    };
  },

  /**
   * Creates a return statement.
   * @param expression - The expression to return, if any.
   * @param options - Optional factory options.
   * @returns The created return statement.
   */
  createReturnStatement(
    expression?: Expression,
    options?: Readonly<NodeFactoryOptions>
  ): ReturnStatement {
    return {
      expression,
      kind: 'ReturnStatement',
      location: options?.location,
    };
  },

  /**
   * Creates a switch statement.
   * @param expression - The expression to switch on.
   * @param cases - The list of switch cases.
   * @param defaultCase - The default case, if any.
   * @param options - Optional factory options.
   * @returns The created switch statement.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Factory method requires 4 parameters
  createSwitchStatement(
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
  },

  /**
   * Creates a throw statement.
   * @param expression - The expression value to throw.
   * @param options - Optional factory options.
   * @returns The created throw statement.
   */
  createThrowStatement(
    expression: Expression,
    options?: Readonly<NodeFactoryOptions>
  ): ThrowStatement {
    return {
      expression,
      kind: 'ThrowStatement',
      location: options?.location,
    };
  },

  /**
   * Creates a try statement.
   * @param tryBlock - The compound statement to execute in the try block.
   * @param catchClauses - The list of catch clause handlers.
   * @param finallyBlock - The compound statement to execute in the finally block, if any.
   * @param options - Optional factory options.
   * @returns The created try statement.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Factory method requires 4 parameters
  createTryStatement(
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
  },

  /**
   * Creates a variable declaration statement.
   * @param declaration - The variable declaration to wrap as a statement.
   * @param options - Optional factory options.
   * @returns The created variable declaration statement.
   */
  createVariableDeclarationStatement(
    declaration: Readonly<VariableDeclaration>,
    options?: Readonly<NodeFactoryOptions>
  ): VariableDeclarationStatement {
    return {
      declaration,
      kind: 'VariableDeclarationStatement',
      location: options?.location,
    };
  },

  /**
   * Creates a while loop statement.
   * @param condition - The boolean expression evaluated before each iteration.
   * @param body - The statement executed for each iteration.
   * @param options - Optional factory options.
   * @returns The created while loop statement.
   */
  createWhileLoopStatement(
    condition: Expression,
    body: Statement,
    options?: Readonly<NodeFactoryOptions>
  ): WhileLoopStatement {
    return {
      body,
      condition,
      kind: 'WhileLoopStatement',
      location: options?.location,
    };
  },

  /**
   * Creates a while loop statement.
   * @param condition - The boolean expression evaluated before each iteration.
   * @param body - The statement executed for each iteration.
   * @param options - Optional factory options.
   * @returns The created while loop statement.
   * @deprecated Use createWhileLoopStatement instead.
   */
  createWhileStatement(
    condition: Expression,
    body: Statement,
    options?: Readonly<NodeFactoryOptions>
  ): WhileLoopStatement {
    return StatementFactory.createWhileLoopStatement(condition, body, options);
  },
};
