/**
 * Expression node types
 */

import type { ASTNode } from '../base.js';
import type { Type } from './Type.js';
import type { Literal } from './Literal.js';
import type { Statement } from './Statement.js';

/**
 * Base interface for all expression nodes
 */
export interface Expression extends ASTNode {
  readonly kind: ExpressionKind;
}

/**
 * Discriminated union type for all expression kinds
 * Note: Literal kinds are included here since literals extend Expression
 */
export type ExpressionKind =
  | 'BinaryExpression'
  | 'UnaryExpression'
  | 'AssignmentExpression'
  | 'MethodCallExpression'
  | 'FieldAccessExpression'
  | 'ArrayAccessExpression'
  | 'NewExpression'
  | 'CastExpression'
  | 'InstanceOfExpression'
  | 'TernaryExpression'
  | 'LambdaExpression'
  | 'Identifier'
  | 'StringLiteral'
  | 'NumberLiteral'
  | 'BooleanLiteral'
  | 'NullLiteral'
  | 'CharacterLiteral'
  | 'ThisExpression'
  | 'SuperExpression'
  | 'ParenthesizedExpression'
  | 'SoqlQueryExpression'
  | 'SoslQueryExpression'
  | 'TriggerContextVariableExpression';

/**
 * Binary expression: left operator right
 */
export interface BinaryExpression extends Expression {
  readonly kind: 'BinaryExpression';
  readonly operator: BinaryOperator;
  readonly left: Expression;
  readonly right: Expression;
}

/**
 * Binary operators
 */
export type BinaryOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '=='
  | '!='
  | '==='
  | '!=='
  | '<'
  | '<='
  | '>'
  | '>='
  | '&&'
  | '||'
  | '<<'
  | '>>'
  | '>>>'
  | '&'
  | '|'
  | '^'
  | 'instanceof';

/**
 * Unary expression: operator operand or operand operator
 */
export interface UnaryExpression extends Expression {
  readonly kind: 'UnaryExpression';
  readonly operator: UnaryOperator;
  readonly operand: Expression;
  readonly prefix: boolean; // true for prefix (++x), false for postfix (x++)
}

/**
 * Unary operators
 */
export type UnaryOperator = '+' | '-' | '!' | '~' | '++' | '--';

/**
 * Assignment expression: left = right
 */
export interface AssignmentExpression extends Expression {
  readonly kind: 'AssignmentExpression';
  readonly operator: AssignmentOperator;
  readonly left: Expression; // Usually Identifier, FieldAccess, or ArrayAccess
  readonly right: Expression;
}

/**
 * Assignment operators
 */
export type AssignmentOperator =
  | '='
  | '+='
  | '-='
  | '*='
  | '/='
  | '%='
  | '<<='
  | '>>='
  | '>>>='
  | '&='
  | '|='
  | '^=';

/**
 * Method call expression: target.method(args)
 */
export interface MethodCallExpression extends Expression {
  readonly kind: 'MethodCallExpression';
  readonly target?: Expression; // undefined for static calls
  readonly methodName: string;
  readonly arguments: Expression[];
  readonly typeArguments?: Type[]; // Generic type arguments
}

/**
 * Field access expression: target.field
 */
export interface FieldAccessExpression extends Expression {
  readonly kind: 'FieldAccessExpression';
  readonly target?: Expression; // undefined for static access
  readonly fieldName: string;
}

/**
 * Array access expression: array[index]
 */
export interface ArrayAccessExpression extends Expression {
  readonly kind: 'ArrayAccessExpression';
  readonly array: Expression;
  readonly index: Expression;
}

/**
 * New expression: new Type(args) or new Type[]{...}
 */
export interface NewExpression extends Expression {
  readonly kind: 'NewExpression';
  readonly type: Type;
  readonly arguments?: Expression[];
  readonly arrayInitializer?: Expression[]; // For array initialization
}

/**
 * Cast expression: (Type) expression
 */
export interface CastExpression extends Expression {
  readonly kind: 'CastExpression';
  readonly type: Type;
  readonly expression: Expression;
}

/**
 * Instance of expression: expression instanceof Type
 */
export interface InstanceOfExpression extends Expression {
  readonly kind: 'InstanceOfExpression';
  readonly expression: Expression;
  readonly type: Type;
}

/**
 * Ternary expression: condition ? thenExpr : elseExpr
 */
export interface TernaryExpression extends Expression {
  readonly kind: 'TernaryExpression';
  readonly condition: Expression;
  readonly thenExpression: Expression;
  readonly elseExpression: Expression;
}

/**
 * Lambda expression: (params) => body
 */
export interface LambdaExpression extends Expression {
  readonly kind: 'LambdaExpression';
  readonly parameters: LambdaParameter[];
  readonly body: Expression | Statement;
}

/**
 * Lambda parameter
 */
export interface LambdaParameter extends ASTNode {
  readonly kind: 'LambdaParameter';
  readonly name: string;
  readonly type?: Type;
}

/**
 * Identifier: variable or type name
 */
export interface Identifier extends Expression {
  readonly kind: 'Identifier';
  readonly name: string;
}

/**
 * This expression: this
 */
export interface ThisExpression extends Expression {
  readonly kind: 'ThisExpression';
}

/**
 * Super expression: super
 */
export interface SuperExpression extends Expression {
  readonly kind: 'SuperExpression';
}

/**
 * Parenthesized expression: (expression)
 */
export interface ParenthesizedExpression extends Expression {
  readonly kind: 'ParenthesizedExpression';
  readonly expression: Expression;
}

/**
 * SOQL query expression: [SELECT ... FROM ...]
 */
export interface SoqlQueryExpression extends Expression {
  readonly kind: 'SoqlQueryExpression';
  readonly query: string; // The raw query text within brackets
  readonly boundExpressions?: Expression[]; // Bound expressions like :variableName
}

/**
 * SOSL query expression: [FIND ... IN ... RETURNING ...]
 */
export interface SoslQueryExpression extends Expression {
  readonly kind: 'SoslQueryExpression';
  readonly query: string; // The raw query text within brackets
  readonly boundExpressions?: Expression[]; // Bound expressions like :variableName
}

/**
 * Trigger context variable expression: Trigger.new, Trigger.old, etc.
 */
export interface TriggerContextVariableExpression extends Expression {
  readonly kind: 'TriggerContextVariableExpression';
  readonly variableName: string; // e.g., "new", "old", "newMap", "oldMap", etc.
}

/**
 * Union type for all expression node types
 */
export type ExpressionNode =
  | BinaryExpression
  | UnaryExpression
  | AssignmentExpression
  | MethodCallExpression
  | FieldAccessExpression
  | ArrayAccessExpression
  | NewExpression
  | CastExpression
  | InstanceOfExpression
  | TernaryExpression
  | LambdaExpression
  | Identifier
  | Literal
  | ThisExpression
  | SuperExpression
  | ParenthesizedExpression
  | SoqlQueryExpression
  | SoslQueryExpression
  | TriggerContextVariableExpression;
