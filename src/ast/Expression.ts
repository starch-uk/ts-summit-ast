/**
 * @file Expression node types.
 * AST node types for expressions (binary, unary, method calls, etc.).
 */

import type { ASTNode } from './base.js';
import type { TypeRef } from './Type.js';
import type { Statement } from './Statement.js';
import type { Identifier } from './Identifier.js';
import type { Initializer } from './Initializer.js';
import type { SoqlOrSoslBinding } from './SoqlOrSoslBinding.js';

/**
 * Base interface for all expression nodes.
 */
interface Expression extends ASTNode {
  readonly kind:
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
}

/**
 * Binary expression: left operator right.
 */
interface BinaryExpression extends Expression {
  readonly kind: 'BinaryExpression';
  readonly operator:
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
  readonly left: Expression;
  readonly right: Expression;
}

/**
 * Binary operators.
 */

/**
 * Unary expression: operator operand or operand operator.
 */
interface UnaryExpression extends Expression {
  readonly kind: 'UnaryExpression';
  readonly operator: '--' | '-' | '!' | '+' | '++' | '~';
  readonly operand: Expression;

  /**
   * True for prefix (++x), false for postfix (x++).
   */
  readonly prefix: boolean;
}

/**
 * Unary operators.
 */

/**
 * Assignment expression: left = right.
 */
interface AssignExpression extends Expression {
  readonly kind: 'AssignExpression';
  readonly operator:
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
   * Usually VariableExpression, FieldExpression, or ArrayExpression.
   */
  readonly left: Expression;
  readonly right: Expression;
}

/**
 * Assignment operators.
 */

/**
 * Call expression: target.method(args).
 */
interface CallExpression extends Expression {
  readonly kind: 'CallExpression';

  /**
   * Undefined for static calls.
   */
  readonly target?: Expression;
  readonly methodName: string;
  readonly arguments: Expression[];

  /**
   * Generic type arguments.
   */
  readonly typeArguments?: TypeRef[];

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

  /**
   * Undefined for static access.
   */
  readonly target?: Expression;
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
  readonly initializer: Initializer;

  /**
   * Convenience properties for accessing initializer data.
   */

  /**
   * Type from the initializer.
   */
  readonly type?: TypeRef;

  /**
   * For ConstructorInitializer.
   */
  readonly arguments?: Expression[];

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
  readonly type: TypeRef;
  readonly expression: Expression;
}

/**
 * Instance of expression: expression instanceof Type.
 */
interface InstanceOfExpression extends Expression {
  readonly kind: 'InstanceOfExpression';
  readonly expression: Expression;
  readonly type: TypeRef;
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
 * Represents a lambda parameter in the AST.
 */
interface LambdaParameter extends ASTNode {
  readonly kind: 'LambdaParameter';
  readonly name: string;
  readonly type?: TypeRef;
}

/**
 * Represents a variable expression that references a variable or parameter.
 */
interface VariableExpression extends Expression {
  readonly kind: 'VariableExpression';
  readonly id: Identifier;
}

/**
 * Represents the 'this' expression in the AST.
 */
interface ThisExpression extends Expression {
  readonly kind: 'ThisExpression';
}

/**
 * Represents the 'super' expression in the AST.
 */
interface SuperExpression extends Expression {
  readonly kind: 'SuperExpression';
}

/**
 * Represents a parenthesized expression in the AST.
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

  /**
   * The raw query text within brackets.
   */
  readonly query: string;

  /**
   * Bound expressions like :variableName.
   * In summit-ast, these are SoqlOrSoslBinding nodes.
   */
  readonly bindings: SoqlOrSoslBinding[];
}

/**
 * SOSL query expression: [FIND ... IN ... RETURNING ...].
 */
interface SoslExpression extends Expression {
  readonly kind: 'SoslExpression';

  /**
   * The raw query text within brackets.
   */
  readonly query: string;

  /**
   * Bound expressions like :variableName.
   * In summit-ast, these are SoqlOrSoslBinding nodes.
   */
  readonly bindings: SoqlOrSoslBinding[];
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

export type {
  Expression,
  BinaryExpression,
  UnaryExpression,
  AssignExpression,
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
};
