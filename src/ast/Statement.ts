/**
 * @file Statement node types.
 * AST node types for statements (if, for, while, return, etc.).
 */

import type { ASTNode } from './base.js';
import type { Expression } from './Expression.js';
import type { VariableDeclaration } from './Declaration.js';

/**
 * Alias for backward compatibility during migration.
 * @deprecated Use CompoundStatement instead.
 */
type Block = CompoundStatement;

/**
 * Base interface for all statement nodes.
 */
interface Statement extends ASTNode {
  readonly kind:
    | 'BreakStatement'
    | 'CompoundStatement'
    | 'ContinueStatement'
    | 'DmlStatement'
    | 'DoWhileLoopStatement'
    | 'EnhancedForLoopStatement'
    | 'ExpressionStatement'
    | 'ForLoopStatement'
    | 'IfStatement'
    | 'ReturnStatement'
    | 'SwitchStatement'
    | 'ThrowStatement'
    | 'TryStatement'
    | 'VariableDeclarationStatement'
    | 'WhileLoopStatement';
}

/**
 * If statement: if (condition) thenStatement else elseStatement.
 */
interface IfStatement extends Statement {
  readonly kind: 'IfStatement';
  readonly condition: Expression;
  readonly thenStatement: Statement;
  readonly elseStatement?: Statement;
}

/**
 * For loop: for (init; condition; update) body.
 */
interface ForLoopStatement extends Statement {
  readonly kind: 'ForLoopStatement';
  readonly init?: ExpressionStatement | VariableDeclarationStatement;
  readonly condition?: Expression;
  readonly update?: Expression;
  readonly body: Statement;
}

/**
 * For-each loop: for (Type variable : iterable) body.
 */
interface EnhancedForLoopStatement extends Statement {
  readonly kind: 'EnhancedForLoopStatement';
  readonly variable: VariableDeclaration;
  readonly iterable: Expression;
  readonly body: Statement;
}

/**
 * While loop: while (condition) body.
 */
interface WhileLoopStatement extends Statement {
  readonly kind: 'WhileLoopStatement';
  readonly condition: Expression;
  readonly body: Statement;
}

/**
 * Do-while loop: do body while (condition).
 */
interface DoWhileLoopStatement extends Statement {
  readonly kind: 'DoWhileLoopStatement';
  readonly body: Statement;
  readonly condition: Expression;
}

/**
 * Switch statement: switch (expression) { cases }.
 */
interface SwitchStatement extends Statement {
  readonly kind: 'SwitchStatement';
  readonly expression: Expression;
  readonly cases: SwitchCase[];
  readonly defaultCase?: SwitchCase;
}

/**
 * Switch case: case value: statements or default: statements.
 * In summit-ast, When extends Node() (not NodeWithSourceLocation).
 * This is simplified from summit-ast's When structure which has WhenValue, WhenType, and WhenElse subtypes.
 */
interface SwitchCase extends ASTNode {
  readonly kind: 'SwitchCase';

  /**
   * Undefined for default case.
   */
  readonly value?: Expression;
  readonly statements: Statement[];
}

/**
 * Try-catch-finally statement.
 */
interface TryStatement extends Statement {
  readonly kind: 'TryStatement';
  readonly tryBlock: CompoundStatement;
  readonly catchClauses: CatchClause[];
  readonly finallyBlock?: CompoundStatement;
}

/**
 * Catch clause: catch (ExceptionType variable) { statements }.
 */
interface CatchClause extends ASTNode {
  readonly kind: 'CatchClause';

  /**
   * Type expression.
   */
  readonly exceptionType?: Expression;
  readonly variable?: VariableDeclaration;
  readonly block: CompoundStatement;
}

/**
 * Return statement: return expression;.
 */
interface ReturnStatement extends Statement {
  readonly kind: 'ReturnStatement';
  readonly expression?: Expression;
}

/**
 * Break statement: break;.
 */
interface BreakStatement extends Statement {
  readonly kind: 'BreakStatement';
  readonly label?: string;
}

/**
 * Continue statement: continue;.
 */
interface ContinueStatement extends Statement {
  readonly kind: 'ContinueStatement';
  readonly label?: string;
}

/**
 * Throw statement: throw expression;.
 */
interface ThrowStatement extends Statement {
  readonly kind: 'ThrowStatement';
  readonly expression: Expression;
}

/**
 * Compound statement: { statements }.
 */
interface CompoundStatement extends Statement {
  readonly kind: 'CompoundStatement';
  readonly statements: Statement[];
}

/**
 * Expression statement: expression;.
 */
interface ExpressionStatement extends Statement {
  readonly kind: 'ExpressionStatement';
  readonly expression: Expression;
}

/**
 * Variable declaration statement: Type variable = value;.
 */
interface VariableDeclarationStatement extends Statement {
  readonly kind: 'VariableDeclarationStatement';
  readonly declaration: VariableDeclaration;
}

/**
 * DML statement: insert, update, delete, upsert, merge, undelete.
 */
interface DmlStatement extends Statement {
  readonly kind: 'DmlStatement';
  readonly operation: 'delete' | 'insert' | 'merge' | 'undelete' | 'update' | 'upsert';

  /**
   * The sObject or list to operate on.
   */
  readonly target: Expression;
}

/**
 * DML operations.
 */

export type {
  Block,
  Statement,
  IfStatement,
  ForLoopStatement,
  EnhancedForLoopStatement,
  WhileLoopStatement,
  DoWhileLoopStatement,
  SwitchStatement,
  SwitchCase,
  TryStatement,
  CatchClause,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
  ThrowStatement,
  CompoundStatement,
  ExpressionStatement,
  VariableDeclarationStatement,
  DmlStatement,
};
