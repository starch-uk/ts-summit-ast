/**
 * Statement node types
 */

import type { ASTNode } from '../base.js';
import type { Expression } from './Expression.js';
import type { VariableDeclaration } from './Declaration.js';

/**
 * Base interface for all statement nodes
 */
export interface Statement extends ASTNode {
  readonly kind: StatementKind;
}

/**
 * Discriminated union type for all statement kinds
 */
export type StatementKind =
  | 'IfStatement'
  | 'ForStatement'
  | 'ForEachStatement'
  | 'WhileStatement'
  | 'DoWhileStatement'
  | 'SwitchStatement'
  | 'TryStatement'
  | 'ReturnStatement'
  | 'BreakStatement'
  | 'ContinueStatement'
  | 'ThrowStatement'
  | 'Block'
  | 'ExpressionStatement'
  | 'VariableDeclarationStatement'
  | 'DmlStatement';

/**
 * If statement: if (condition) thenStatement else elseStatement
 */
export interface IfStatement extends Statement {
  readonly kind: 'IfStatement';
  readonly condition: Expression;
  readonly thenStatement: Statement;
  readonly elseStatement?: Statement;
}

/**
 * For loop: for (init; condition; update) body
 */
export interface ForStatement extends Statement {
  readonly kind: 'ForStatement';
  readonly init?: VariableDeclarationStatement | ExpressionStatement;
  readonly condition?: Expression;
  readonly update?: Expression;
  readonly body: Statement;
}

/**
 * For-each loop: for (Type variable : iterable) body
 */
export interface ForEachStatement extends Statement {
  readonly kind: 'ForEachStatement';
  readonly variable: VariableDeclaration;
  readonly iterable: Expression;
  readonly body: Statement;
}

/**
 * While loop: while (condition) body
 */
export interface WhileStatement extends Statement {
  readonly kind: 'WhileStatement';
  readonly condition: Expression;
  readonly body: Statement;
}

/**
 * Do-while loop: do body while (condition)
 */
export interface DoWhileStatement extends Statement {
  readonly kind: 'DoWhileStatement';
  readonly body: Statement;
  readonly condition: Expression;
}

/**
 * Switch statement: switch (expression) { cases }
 */
export interface SwitchStatement extends Statement {
  readonly kind: 'SwitchStatement';
  readonly expression: Expression;
  readonly cases: SwitchCase[];
  readonly defaultCase?: SwitchCase;
}

/**
 * Switch case: case value: statements or default: statements
 */
export interface SwitchCase extends ASTNode {
  readonly kind: 'SwitchCase';
  readonly value?: Expression; // undefined for default case
  readonly statements: Statement[];
}

/**
 * Try-catch-finally statement
 */
export interface TryStatement extends Statement {
  readonly kind: 'TryStatement';
  readonly tryBlock: Block;
  readonly catchClauses: CatchClause[];
  readonly finallyBlock?: Block;
}

/**
 * Catch clause: catch (ExceptionType variable) { statements }
 */
export interface CatchClause extends ASTNode {
  readonly kind: 'CatchClause';
  readonly exceptionType?: Expression; // Type expression
  readonly variable?: VariableDeclaration;
  readonly block: Block;
}

/**
 * Return statement: return expression;
 */
export interface ReturnStatement extends Statement {
  readonly kind: 'ReturnStatement';
  readonly expression?: Expression;
}

/**
 * Break statement: break;
 */
export interface BreakStatement extends Statement {
  readonly kind: 'BreakStatement';
  readonly label?: string;
}

/**
 * Continue statement: continue;
 */
export interface ContinueStatement extends Statement {
  readonly kind: 'ContinueStatement';
  readonly label?: string;
}

/**
 * Throw statement: throw expression;
 */
export interface ThrowStatement extends Statement {
  readonly kind: 'ThrowStatement';
  readonly expression: Expression;
}

/**
 * Block statement: { statements }
 */
export interface Block extends Statement {
  readonly kind: 'Block';
  readonly statements: Statement[];
}

/**
 * Expression statement: expression;
 */
export interface ExpressionStatement extends Statement {
  readonly kind: 'ExpressionStatement';
  readonly expression: Expression;
}

/**
 * Variable declaration statement: Type variable = value;
 */
export interface VariableDeclarationStatement extends Statement {
  readonly kind: 'VariableDeclarationStatement';
  readonly declaration: VariableDeclaration;
}

/**
 * DML statement: insert, update, delete, upsert, merge, undelete
 */
export interface DmlStatement extends Statement {
  readonly kind: 'DmlStatement';
  readonly operation: DmlOperation;
  readonly target: Expression; // The sObject or list to operate on
}

/**
 * DML operations
 */
export type DmlOperation = 'insert' | 'update' | 'delete' | 'upsert' | 'merge' | 'undelete';

/**
 * Union type for all statement node types
 */
export type StatementNode =
  | IfStatement
  | ForStatement
  | ForEachStatement
  | WhileStatement
  | DoWhileStatement
  | SwitchStatement
  | TryStatement
  | ReturnStatement
  | BreakStatement
  | ContinueStatement
  | ThrowStatement
  | Block
  | ExpressionStatement
  | VariableDeclarationStatement
  | DmlStatement;
