/**
 * @file Statement node types.
 * AST node types for statements (if, for, while, return, etc.).
 */

import type { ASTNode, CanonicalSourceLocation } from './baseNode.js';
import type { Expression } from './expression.js';
import type { VariableDeclaration } from './declaration.js';
import type { Identifier, TypeRef } from './baseNode.js';
import type { Modifier } from './declaration.js';

/** Single variable in a VariableDeclarationStatement group (canonical: id, initializer, sourceLocation). */
interface VariableDeclarationInGroup {
  readonly id: Identifier;
  readonly initializer?: Expression;
  readonly sourceLocation?: CanonicalSourceLocation;
}

/** Group for VariableDeclarationStatement (canonical: type, declarations[], modifiers). */
interface VariableDeclarationGroup {
  readonly type: TypeRef;
  readonly declarations: readonly VariableDeclarationInGroup[];
  readonly modifiers: readonly Modifier[];
  readonly sourceLocation?: CanonicalSourceLocation;
}

/**
 * Base interface for all statement nodes.
 */
interface Statement extends ASTNode {
  readonly '@type':
    | 'BreakStatement'
    | 'CompoundStatement'
    | 'ContinueStatement'
    | 'Delete'
    | 'DoWhileLoopStatement'
    | 'EnhancedForLoopStatement'
    | 'ExpressionStatement'
    | 'ForLoopStatement'
    | 'IfStatement'
    | 'Insert'
    | 'Merge'
    | 'ReturnStatement'
    | 'SwitchStatement'
    | 'ThrowStatement'
    | 'TryStatement'
    | 'Undelete'
    | 'Update'
    | 'Upsert'
    | 'VariableDeclarationStatement'
    | 'WhileLoopStatement';
}

/**
 * If statement: if (condition) thenStatement else elseStatement.
 */
interface IfStatement extends Statement {
  readonly '@type': 'IfStatement';
  readonly condition: Expression;
  readonly thenStatement: Statement;
  readonly elseStatement?: Statement;
}

/**
 * For loop: for (init; condition; update) body.
 */
interface ForLoopStatement extends Statement {
  readonly '@type': 'ForLoopStatement';
  readonly init?: ExpressionStatement | VariableDeclarationStatement;
  readonly condition?: Expression;
  readonly update?: Expression;
  readonly body: Statement;
}

/**
 * For-each loop: for (Type variable : iterable) body.
 */
interface EnhancedForLoopStatement extends Statement {
  readonly '@type': 'EnhancedForLoopStatement';
  readonly variable: VariableDeclaration;
  readonly iterable: Expression;
  readonly body: Statement;
}

/**
 * While loop: while (condition) body.
 */
interface WhileLoopStatement extends Statement {
  readonly '@type': 'WhileLoopStatement';
  readonly condition: Expression;
  readonly body: Statement;
}

/**
 * Do-while loop: do body while (condition).
 */
interface DoWhileLoopStatement extends Statement {
  readonly '@type': 'DoWhileLoopStatement';
  readonly body: Statement;
  readonly condition: Expression;
}

/**
 * Switch statement: switch (expression) { cases }.
 */
interface SwitchStatement extends Statement {
  readonly '@type': 'SwitchStatement';
  readonly expression: Expression;
  readonly cases: readonly SwitchCase[];
  readonly defaultCase?: SwitchCase;
}

/**
 * Switch case: case value: statements or default: statements.
 * In summit-ast, When extends Node() (not NodeWithSourceLocation).
 * This is simplified from summit-ast's When structure which has WhenValue, WhenType, and WhenElse subtypes.
 */
interface SwitchCase extends ASTNode {
  readonly '@type': 'SwitchCase';

  /**
   * Undefined for default case.
   */
  readonly value?: Expression;

  /**
   * Present for Apex `when a, b, c { ... }` (multi-value when clause).
   * This corresponds to summit-ast's WhenValue `values`.
   *
   * Note: for single-value cases, `value` may be used instead.
   */
  readonly values?: readonly Expression[];

  /**
   * Present for Apex `when <Type> <variable>` (type match / downcast) cases.
   * This corresponds to summit-ast's WhenType `type`.
   */
  readonly matchType?: TypeRef;

  /**
   * Present for Apex `when <Type> <variable>` (type match / downcast) cases.
   * This corresponds to summit-ast's WhenType `downcast.declarations`.
   */
  readonly downcastDeclarations?: readonly VariableDeclaration[];
  readonly statements: readonly Statement[];
}

/**
 * Try-catch-finally statement.
 */
interface TryStatement extends Statement {
  readonly '@type': 'TryStatement';
  readonly tryBlock: CompoundStatement;
  readonly catchClauses: readonly CatchClause[];
  readonly finallyBlock?: CompoundStatement;
}

/**
 * Catch clause: catch (ExceptionType variable) { statements }.
 */
interface CatchClause extends ASTNode {
  readonly '@type': 'CatchClause';

  /**
   * Type expression.
   */
  readonly exceptionType?: Expression;
  readonly variable?: VariableDeclaration;
  readonly block: CompoundStatement;
}

/**
 * Return statement: return value;. Uses canonical name value.
 */
interface ReturnStatement extends Statement {
  readonly '@type': 'ReturnStatement';
  readonly value?: Expression;
}

/**
 * Represents a break statement in the AST.
 */
interface BreakStatement extends Statement {
  readonly '@type': 'BreakStatement';
  readonly label?: string;
}

/**
 * Represents a continue statement in the AST.
 */
interface ContinueStatement extends Statement {
  readonly '@type': 'ContinueStatement';
  readonly label?: string;
}

/**
 * Throw statement: throw expression;.
 */
interface ThrowStatement extends Statement {
  readonly '@type': 'ThrowStatement';
  readonly expression: Expression;
}

/**
 * Compound statement: { statements }.
 */
interface CompoundStatement extends Statement {
  readonly '@type': 'CompoundStatement';
  readonly statements: readonly Statement[];
}

/**
 * Represents an expression statement in the AST.
 */
interface ExpressionStatement extends Statement {
  readonly '@type': 'ExpressionStatement';
  readonly expression: Expression;
}

/**
 * Variable declaration statement. Uses canonical name group.
 */
interface VariableDeclarationStatement extends Statement {
  readonly '@type': 'VariableDeclarationStatement';
  readonly group: VariableDeclarationGroup;
}

/**
 * DML statement. Uses canonical `@type` (Insert, Update, etc.) and value.
 */
interface DmlStatement extends Statement {
  readonly '@type': 'Delete' | 'Insert' | 'Merge' | 'Undelete' | 'Update' | 'Upsert';
  readonly value: Expression;
}

/**
 * DML operations.
 */

export type {
  Statement,
  VariableDeclarationInGroup,
  VariableDeclarationGroup,
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
