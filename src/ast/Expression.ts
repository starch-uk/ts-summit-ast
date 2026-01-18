/**
 * @file Expression node types.
 * AST node types for expressions (binary, unary, method calls, etc.).
 */

import type { ASTNode } from './base.js';
import type { Type, TypeRef } from './Type.js';
import type { Literal } from './Literal.js';
import type { Statement } from './Statement.js';
import type { Identifier } from './Identifier.js';

/**
 * Base interface for all expression nodes.
 */
interface Expression extends ASTNode {
  readonly kind: ExpressionKind;
}

/**
 * Discriminated union type for all expression kinds
 * Note: Literal kinds are included here since literals extend Expression.
 */
// eslint-disable-next-line @typescript-eslint/no-type-alias -- Type alias needed for union type in AST structure
type ExpressionKind =
  | 'ArrayExpression'
  | 'AssignExpression'
  | 'BinaryExpression'
  | 'BooleanVal'
  | 'CallExpression'
  | 'CastExpression'
  | 'CharacterLiteral'
  | 'DecimalVal'
  | 'DoubleVal'
  | 'FieldExpression'
  | 'InstanceOfExpression'
  | 'IntegerVal'
  | 'LambdaExpression'
  | 'LongVal'
  | 'NewExpression'
  | 'NullVal'
  | 'ParenthesizedExpression'
  | 'SoqlExpression'
  | 'SoslExpression'
  | 'StringVal'
  | 'SuperExpression'
  | 'TernaryExpression'
  | 'ThisExpression'
  | 'TriggerContextVariableExpression'
  | 'UnaryExpression'
  | 'VariableExpression';
/* eslint-enable @typescript-eslint/no-type-alias */

/**
 * Binary expression: left operator right.
 */
interface BinaryExpression extends Expression {
  readonly kind: 'BinaryExpression';
  readonly operator: BinaryOperator;
  readonly left: Expression;
  readonly right: Expression;
}

/**
 * Binary operators.
 */
type BinaryOperator =
  | '-'
  | '!='
  | '!=='
  | '*'
  | '/'
  | '&'
  | '&&'
  | '%'
  | '^'
  | '+'
  | '<'
  | '<<'
  | '<='
  | '=='
  | '==='
  | '>'
  | '>='
  | '>>'
  | '>>>'
  | '|'
  | '||'
  | 'instanceof';

/**
 * Unary expression: operator operand or operand operator.
 */
interface UnaryExpression extends Expression {
  readonly kind: 'UnaryExpression';
  readonly operator: UnaryOperator;
  readonly operand: Expression;

  /**
   * True for prefix (++x), false for postfix (x++).
   */
  readonly prefix: boolean;
}

/**
 * Unary operators.
 */
type UnaryOperator = '--' | '-' | '!' | '+' | '++' | '~';

/**
 * Assignment expression: left = right.
 */
interface AssignExpression extends Expression {
  readonly kind: 'AssignExpression';
  readonly operator: AssignmentOperator;

  /**
   * Usually VariableExpression, FieldExpression, or ArrayExpression.
   */
  readonly left: Expression;
  readonly right: Expression;
}

/**
 * Assignment operators.
 */
type AssignmentOperator =
  | '-='
  | '*='
  | '/='
  | '&='
  | '%='
  | '^='
  | '+='
  | '<<='
  | '='
  | '>>='
  | '>>>='
  | '|=';

/**
 * Call expression: target.method(args).
 */
interface CallExpression extends Expression {
  readonly kind: 'CallExpression';
  readonly target?: Expression; /**
   * Undefined for static calls.
   */
  readonly methodName: string;
  readonly arguments: Expression[];

  /**
   * Generic type arguments.
   */
  readonly typeArguments?: Type[];

  /**
   * Whether this is a safe navigation call (x?.method()).
   */
  readonly isSafe?: boolean;
}

/**
 * Field access expression: target.field.
 */
interface FieldExpression extends Expression {
  readonly kind: 'FieldExpression';
  readonly target?: Expression; /**
   * Undefined for static access.
   */
  readonly fieldName: string;
  /**
   * The field identifier node.
   */
  readonly field: Identifier;

  /**
   * Whether this is a safe navigation field access (x?.field).
   */
  readonly isSafe?: boolean;
}

/**
 * Array access expression: array[index].
 */
interface ArrayExpression extends Expression {
  readonly kind: 'ArrayExpression';
  readonly array: Expression;
  readonly index: Expression;
}

/**
 * New expression: new Type(args) or new Type[]{...}.
 */
interface NewExpression extends Expression {
  readonly kind: 'NewExpression';
  readonly initializer: import('./Initializer.js').Initializer;

  /**
   * Convenience properties for accessing initializer data.
   */
  readonly type?: TypeRef; /**
   * Type from the initializer.
   */
  readonly arguments?: Expression[]; /**
   * For ConstructorInitializer.
   */

  /**
   * For ValuesInitializer, MapInitializer.
   */
  readonly arrayInitializer?: Expression[];
}

/**
 * Cast expression: (Type) expression.
 */
interface CastExpression extends Expression {
  readonly kind: 'CastExpression';
  readonly type: Type;
  readonly expression: Expression;
}

/**
 * Instance of expression: expression instanceof Type.
 */
interface InstanceOfExpression extends Expression {
  readonly kind: 'InstanceOfExpression';
  readonly expression: Expression;
  readonly type: Type;
}

/**
 * Ternary expression: condition ? ThenExpr : elseExpr.
 */
interface TernaryExpression extends Expression {
  readonly kind: 'TernaryExpression';
  readonly condition: Expression;
  readonly thenExpression: Expression;
  readonly elseExpression: Expression;
}

/**
 * Lambda expression: (params) => body.
 */
interface LambdaExpression extends Expression {
  readonly kind: 'LambdaExpression';
  readonly parameters: LambdaParameter[];
  readonly body: Expression | Statement;
}

/**
 * Lambda parameter.
 */
interface LambdaParameter extends ASTNode {
  readonly kind: 'LambdaParameter';
  readonly name: string;
  readonly type?: Type;
}

/**
 * Variable expression: a reference to a variable or parameter.
 */
interface VariableExpression extends Expression {
  readonly kind: 'VariableExpression';
  readonly id: Identifier;
}

/**
 * This expression: this.
 */
interface ThisExpression extends Expression {
  readonly kind: 'ThisExpression';
}

/**
 * Super expression: super.
 */
interface SuperExpression extends Expression {
  readonly kind: 'SuperExpression';
}

/**
 * Parenthesized expression: (expression).
 */
interface ParenthesizedExpression extends Expression {
  readonly kind: 'ParenthesizedExpression';
  readonly expression: Expression;
}

/**
 * SOQL query expression: [SELECT ... FROM ...].
 */
interface SoqlExpression extends Expression {
  readonly kind: 'SoqlExpression';
  readonly query: string; /**
   * The raw query text within brackets.
   */

  /**
   * Bound expressions like :variableName.
   * In summit-ast, these are SoqlOrSoslBinding nodes.
   */
  readonly bindings: import('./SoqlOrSoslBinding.js').SoqlOrSoslBinding[];
}

/**
 * SOSL query expression: [FIND ... IN ... RETURNING ...].
 */
interface SoslExpression extends Expression {
  readonly kind: 'SoslExpression';
  readonly query: string; /**
   * The raw query text within brackets.
   */

  /**
   * Bound expressions like :variableName.
   * In summit-ast, these are SoqlOrSoslBinding nodes.
   */
  readonly bindings: import('./SoqlOrSoslBinding.js').SoqlOrSoslBinding[];
}

/**
 * Trigger context variable expression: Trigger.new, Trigger.old, etc.
 */
interface TriggerContextVariableExpression extends Expression {
  readonly kind: 'TriggerContextVariableExpression';

  /**
   * E.g., "new", "old", "newMap", "oldMap", etc.
   */
  readonly variableName: string;
}

/**
 * Union type for all expression node types.
 */
type ExpressionNode =
  | ArrayExpression
  | AssignExpression
  | BinaryExpression
  | CallExpression
  | CastExpression
  | FieldExpression
  | InstanceOfExpression
  | LambdaExpression
  | Literal
  | NewExpression
  | ParenthesizedExpression
  | SoqlExpression
  | SoslExpression
  | SuperExpression
  | TernaryExpression
  | ThisExpression
  | TriggerContextVariableExpression
  | UnaryExpression
  | VariableExpression;

export type {
  Expression,
  ExpressionKind,
  BinaryExpression,
  BinaryOperator,
  UnaryExpression,
  UnaryOperator,
  AssignExpression,
  AssignmentOperator,
  CallExpression,
  FieldExpression,
  ArrayExpression,
  NewExpression,
  CastExpression,
  InstanceOfExpression,
  TernaryExpression,
  LambdaExpression,
  LambdaParameter,
  VariableExpression,
  ThisExpression,
  SuperExpression,
  ParenthesizedExpression,
  SoqlExpression,
  SoslExpression,
  TriggerContextVariableExpression,
  ExpressionNode,
};
