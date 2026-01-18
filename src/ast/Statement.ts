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
export type Block = CompoundStatement;

/**
 * Base interface for all statement nodes.
 */
export interface Statement extends ASTNode {
  readonly kind: StatementKind;
}

/**
 * Discriminated union type for all statement kinds.
 */
export type StatementKind =
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

/**
 * If statement: if (condition) thenStatement else elseStatement.
 */
export interface IfStatement extends Statement {
  readonly kind: 'IfStatement';
  readonly condition: Expression;
  readonly thenStatement: Statement;
  readonly elseStatement?: Statement;
}

/**
 * For loop: for (init; condition; update) body.
 */
export interface ForLoopStatement extends Statement {
  readonly kind: 'ForLoopStatement';
  readonly init?: ExpressionStatement | VariableDeclarationStatement;
  readonly condition?: Expression;
  readonly update?: Expression;
  readonly body: Statement;
}

/**
 * For-each loop: for (Type variable : iterable) body.
 */
export interface EnhancedForLoopStatement extends Statement {
  readonly kind: 'EnhancedForLoopStatement';
  readonly variable: VariableDeclaration;
  readonly iterable: Expression;
  readonly body: Statement;
}

/**
 * While loop: while (condition) body.
 */
export interface WhileLoopStatement extends Statement {
  readonly kind: 'WhileLoopStatement';
  readonly condition: Expression;
  readonly body: Statement;
}

/**
 * Do-while loop: do body while (condition).
 */
export interface DoWhileLoopStatement extends Statement {
  readonly kind: 'DoWhileLoopStatement';
  readonly body: Statement;
  readonly condition: Expression;
}

/**
 * Switch statement: switch (expression) { cases }.
 */
export interface SwitchStatement extends Statement {
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
export interface SwitchCase extends ASTNode {
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
export interface TryStatement extends Statement {
  readonly kind: 'TryStatement';
  readonly tryBlock: CompoundStatement;
  readonly catchClauses: CatchClause[];
  readonly finallyBlock?: CompoundStatement;
}

/**
 * Catch clause: catch (ExceptionType variable) { statements }.
 */
export interface CatchClause extends ASTNode {
  readonly kind: 'CatchClause';
  readonly exceptionType?: Expression; /**
   * Type expression.
   */
  readonly variable?: VariableDeclaration;
  readonly block: CompoundStatement;
}

/**
 * Return statement: return expression;.
 */
export interface ReturnStatement extends Statement {
  readonly kind: 'ReturnStatement';
  readonly expression?: Expression;
}

/**
 * Break statement: break;.
 */
export interface BreakStatement extends Statement {
  readonly kind: 'BreakStatement';
  readonly label?: string;
}

/**
 * Continue statement: continue;.
 */
export interface ContinueStatement extends Statement {
  readonly kind: 'ContinueStatement';
  readonly label?: string;
}

/**
 * Throw statement: throw expression;.
 */
export interface ThrowStatement extends Statement {
  readonly kind: 'ThrowStatement';
  readonly expression: Expression;
}

/**
 * Compound statement: { statements }.
 */
export interface CompoundStatement extends Statement {
  readonly kind: 'CompoundStatement';
  readonly statements: Statement[];
}

/**
 * Expression statement: expression;.
 */
export interface ExpressionStatement extends Statement {
  readonly kind: 'ExpressionStatement';
  readonly expression: Expression;
}

/**
 * Variable declaration statement: Type variable = value;.
 */
export interface VariableDeclarationStatement extends Statement {
  readonly kind: 'VariableDeclarationStatement';
  readonly declaration: VariableDeclaration;
}

/**
 * DML statement: insert, update, delete, upsert, merge, undelete.
 */
export interface DmlStatement extends Statement {
  readonly kind: 'DmlStatement';
  readonly operation: DmlOperation;

  /**
   * The sObject or list to operate on.
   */
  readonly target: Expression;
}

/**
 * DML operations.
 */
export type DmlOperation = 'delete' | 'insert' | 'merge' | 'undelete' | 'update' | 'upsert';

/**
 * Union type for all statement node types.
 */
export type StatementNode =
  | BreakStatement
  | CompoundStatement
  | ContinueStatement
  | DmlStatement
  | DoWhileLoopStatement
  | EnhancedForLoopStatement
  | ExpressionStatement
  | ForLoopStatement
  | IfStatement
  | ReturnStatement
  | SwitchStatement
  | ThrowStatement
  | TryStatement
  | VariableDeclarationStatement
  | WhileLoopStatement;
