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
  UntranslatedStatement,
} from '../ast/statement.js';
import type { Expression } from '../ast/expression.js';
import type { VariableDeclaration } from '../ast/declaration.js';
import type { Statement, SwitchCase, VariableDeclarationGroup } from '../ast/statement.js';

import { toCanonicalSourceLocation } from '../ast/baseNode.js';
import type { NodeFactoryOptions } from './nodeFactory.js';

/** Options for createEnhancedForLoopStatement / createForEachStatement. */
interface CreateEnhancedForLoopStatementOptions {
  readonly body: Readonly<Statement>;
  readonly iterable: Readonly<Expression>;
  readonly options?: Readonly<NodeFactoryOptions>;
  readonly variable: Readonly<VariableDeclaration>;
}

/** Options object for creating a for-loop or for-each statement (body, condition, init, update, options). */
interface CreateForLoopStatementOptions {
  readonly body: Readonly<Statement>;
  readonly condition?: Readonly<Expression>;
  readonly init?: Readonly<ExpressionStatement | VariableDeclarationStatement>;
  readonly options?: Readonly<NodeFactoryOptions>;
  readonly update?: Readonly<Expression>;
}

/** Options for createIfStatement. */
interface CreateIfStatementOptions {
  readonly condition: Readonly<Expression>;
  readonly elseStatement?: Readonly<Statement>;
  readonly options?: Readonly<NodeFactoryOptions>;
  readonly thenStatement: Readonly<Statement>;
}

/** Options for createSwitchStatement. */
interface CreateSwitchStatementOptions {
  readonly cases: readonly SwitchCase[];
  readonly defaultCase?: Readonly<SwitchCase>;
  readonly expression: Readonly<Expression>;
  readonly options?: Readonly<NodeFactoryOptions>;
}

/** Options for createTryStatement. */
interface CreateTryStatementOptions {
  readonly catchClauses: readonly CatchClause[];
  readonly finallyBlock?: Readonly<CompoundStatement>;
  readonly options?: Readonly<NodeFactoryOptions>;
  readonly tryBlock: Readonly<CompoundStatement>;
}

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
      '@type': 'BreakStatement',
      ...(label !== undefined && { label }),
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'CompoundStatement',
      statements: [...statements],
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'ContinueStatement',
      ...(label !== undefined && { label }),
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  /**
   * Creates a DML statement.
   * @param operation - The DML operation type.
   * @param value - The target expression (e.g., SObject to delete/update).
   * @param options - Optional factory options.
   * @returns The created DML statement.
   */
  createDmlStatement(
    operation: 'delete' | 'insert' | 'merge' | 'undelete' | 'update' | 'upsert',
    value: Expression,
    options?: Readonly<NodeFactoryOptions>
  ): DmlStatement {
    const DML_OP_TO_TYPE: Record<
      'delete' | 'insert' | 'merge' | 'undelete' | 'update' | 'upsert',
      DmlStatement['@type']
    > = {
      delete: 'Delete',
      insert: 'Insert',
      merge: 'Merge',
      undelete: 'Undelete',
      update: 'Update',
      upsert: 'Upsert',
    };
    const dmlType = DML_OP_TO_TYPE[operation];
    return {
      '@type': dmlType,
      value,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'DoWhileLoopStatement',
      body,
      condition,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
   * @param opts - Variable, iterable, body, options.
   * @returns The created enhanced for loop statement.
   */
  createEnhancedForLoopStatement(
    opts: Readonly<CreateEnhancedForLoopStatementOptions>
  ): EnhancedForLoopStatement {
    const { body, iterable, options, variable } = opts;
    return {
      '@type': 'EnhancedForLoopStatement',
      body,
      iterable,
      variable,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'ExpressionStatement',
      expression,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  /**
   * Creates a for-each loop statement.
   * @param opts - Variable, iterable, body, options.
   * @returns The created enhanced for loop statement.
   * @deprecated Use createEnhancedForLoopStatement instead.
   */
  createForEachStatement(
    opts: Readonly<CreateEnhancedForLoopStatementOptions>
  ): EnhancedForLoopStatement {
    return StatementFactory.createEnhancedForLoopStatement(opts);
  },

  /**
   * Creates a for loop statement.
   * @param opts - Body, init, condition, update, options.
   * @returns The created for loop statement.
   */
  createForLoopStatement(opts: Readonly<CreateForLoopStatementOptions>): ForLoopStatement {
    const { body, condition, init, options, update } = opts;
    return {
      '@type': 'ForLoopStatement',
      body,
      condition,
      init,
      update,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  /**
   * Creates a for loop statement.
   * @param opts - Body, init, condition, update, options.
   * @returns The created for loop statement.
   * @deprecated Use createForLoopStatement instead.
   */
  createForStatement(opts: Readonly<CreateForLoopStatementOptions>): ForLoopStatement {
    return StatementFactory.createForLoopStatement(opts);
  },

  /**
   * Creates an if statement.
   * @param opts - Condition, thenStatement, elseStatement, options.
   * @returns The created if statement.
   */
  createIfStatement(opts: Readonly<CreateIfStatementOptions>): IfStatement {
    const { condition, elseStatement, options, thenStatement } = opts;
    return {
      '@type': 'IfStatement',
      condition,
      thenStatement,
      ...(elseStatement !== undefined && { elseStatement }),
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  /**
   * Creates a return statement.
   * @param value - The expression to return, if any.
   * @param options - Optional factory options.
   * @returns The created return statement.
   */
  createReturnStatement(
    value?: Expression,
    options?: Readonly<NodeFactoryOptions>
  ): ReturnStatement {
    return {
      '@type': 'ReturnStatement',
      ...(value !== undefined && { value }),
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  /**
   * Creates a switch statement.
   * @param opts - Expression, cases, defaultCase, options.
   * @returns The created switch statement.
   */
  createSwitchStatement(opts: Readonly<CreateSwitchStatementOptions>): SwitchStatement {
    const { cases, defaultCase, expression, options } = opts;
    return {
      '@type': 'SwitchStatement',
      cases: [...cases],
      expression,
      ...(defaultCase !== undefined && { defaultCase }),
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'ThrowStatement',
      expression,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  /**
   * Creates a try statement.
   * @param opts - TryBlock, catchClauses, finallyBlock, options.
   * @returns The created try statement.
   */
  createTryStatement(opts: Readonly<CreateTryStatementOptions>): TryStatement {
    const { catchClauses, finallyBlock, options, tryBlock } = opts;
    return {
      '@type': 'TryStatement',
      catchClauses: [...catchClauses],
      tryBlock,
      ...(finallyBlock !== undefined && { finallyBlock }),
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  /**
   * Creates an untranslated statement placeholder (used when translation fails).
   * @param options - Optional factory options.
   * @returns The created untranslated statement.
   */
  createUntranslatedStatement(options?: Readonly<NodeFactoryOptions>): UntranslatedStatement {
    return {
      '@type': 'UntranslatedStatement',
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
    const group: VariableDeclarationGroup = {
      declarations: [
        {
          id: declaration.id,
          ...(declaration.initializer !== undefined && { initializer: declaration.initializer }),
        },
      ],
      modifiers: declaration.modifiers ?? [],
      type: declaration.type,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
    return {
      '@type': 'VariableDeclarationStatement',
      group,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'WhileLoopStatement',
      body,
      condition,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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

export type {
  CreateEnhancedForLoopStatementOptions,
  CreateForLoopStatementOptions,
  CreateIfStatementOptions,
  CreateSwitchStatementOptions,
  CreateTryStatementOptions,
};
