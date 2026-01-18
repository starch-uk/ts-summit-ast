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
  DmlOperation,
} from '../ast/Statement.js';
import type { Expression } from '../ast/Expression.js';
import type { VariableDeclaration } from '../ast/Declaration.js';
import type { Statement } from '../ast/Statement.js';

import type { NodeFactoryOptions } from './NodeFactoryOptions.js';

/**
 * Factory for statement nodes.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Factory pattern requires class
export class StatementFactory {
  // eslint-disable-next-line @typescript-eslint/max-params -- Factory method requires 4 parameters
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

  // eslint-disable-next-line @typescript-eslint/max-params -- Factory method requires 5 parameters
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
   * @param body
   * @param init
   * @param condition
   * @param update
   * @param options
   * @deprecated Use createForLoopStatement instead.
   */
  public static createForStatement(
    body: Statement,
    init?: ExpressionStatement | VariableDeclarationStatement,
    condition?: Expression,
    update?: Expression,
    options?: NodeFactoryOptions
  ): ForLoopStatement {
    return this.createForLoopStatement(body, init, condition, update, options);
  }

  /**
   * @param condition
   * @param body
   * @param options
   * @deprecated Use createWhileLoopStatement instead.
   */
  public static createWhileStatement(
    condition: Expression,
    body: Statement,
    options?: NodeFactoryOptions
  ): WhileLoopStatement {
    return this.createWhileLoopStatement(condition, body, options);
  }

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

  public static createCompoundStatement(
    statements: Statement[],
    options?: NodeFactoryOptions
  ): CompoundStatement {
    return {
      kind: 'CompoundStatement',
      location: options?.location,
      statements,
    };
  }

  /**
   * @param statements
   * @param options
   * @deprecated Use createCompoundStatement instead.
   */
  public static createBlock(
    statements: Statement[],
    options?: NodeFactoryOptions
  ): CompoundStatement {
    return this.createCompoundStatement(statements, options);
  }

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

  public static createVariableDeclarationStatement(
    declaration: VariableDeclaration,
    options?: NodeFactoryOptions
  ): VariableDeclarationStatement {
    return {
      declaration,
      kind: 'VariableDeclarationStatement',
      location: options?.location,
    };
  }

  public static createEnhancedForLoopStatement(
    variable: VariableDeclaration,
    iterable: Expression,
    body: Statement,
    options?: NodeFactoryOptions
  ): EnhancedForLoopStatement {
    return {
      body,
      iterable,
      kind: 'EnhancedForLoopStatement',
      location: options?.location,
      variable,
    };
  }

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
   * @param variable
   * @param iterable
   * @param body
   * @param options
   * @deprecated Use createEnhancedForLoopStatement instead.
   */
  public static createForEachStatement(
    variable: VariableDeclaration,
    iterable: Expression,
    body: Statement,
    options?: NodeFactoryOptions
  ): EnhancedForLoopStatement {
    return this.createEnhancedForLoopStatement(variable, iterable, body, options);
  }

  /**
   * @param body
   * @param condition
   * @param options
   * @deprecated Use createDoWhileLoopStatement instead.
   */
  public static createDoWhileStatement(
    body: Statement,
    condition: Expression,
    options?: NodeFactoryOptions
  ): DoWhileLoopStatement {
    return this.createDoWhileLoopStatement(body, condition, options);
  }

  public static createSwitchStatement(
    expression: Expression,
    cases: any[],
    defaultCase?: any,
    options?: NodeFactoryOptions
  ): SwitchStatement {
    return {
      cases,
      defaultCase,
      expression,
      kind: 'SwitchStatement',
      location: options?.location,
    };
  }

  public static createTryStatement(
    tryBlock: CompoundStatement,
    catchClauses: any[],
    finallyBlock?: CompoundStatement,
    options?: NodeFactoryOptions
  ): TryStatement {
    return {
      catchClauses,
      finallyBlock,
      kind: 'TryStatement',
      location: options?.location,
      tryBlock,
    };
  }

  public static createBreakStatement(label?: string, options?: NodeFactoryOptions): BreakStatement {
    return {
      kind: 'BreakStatement',
      label,
      location: options?.location,
    };
  }

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

  public static createDmlStatement(
    operation: DmlOperation,
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
