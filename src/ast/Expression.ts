/**
 * @file Expression node types.
 * AST node types for expressions (binary, unary, method calls, etc.) and SOQL/SOSL bindings.
 */

import type { ASTNode, CanonicalSourceLocation } from './baseNode.js';
import type { TypeRef } from './baseNode.js';
import type { Statement } from './statement.js';
import type { Identifier } from './baseNode.js';
import type {
  ConstructorInitializer,
  MapInitializer,
  SizedArrayInitializer,
  ValuesInitializer,
} from './initializer.js';

/**
 * Base interface for all expression nodes.
 */
interface Expression extends ASTNode {
  readonly '@type':
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
    | 'UntranslatedExpression'
    | 'VariableExpression';
}

/**
 * Placeholder for expressions that could not be translated.
 * Allows partial AST construction. Matches summit-ast UntranslatedExpression.
 */
interface UntranslatedExpression extends Expression {
  readonly '@type': 'UntranslatedExpression';
}

/**
 * Binary expression: left op right. Uses canonical op enum (ADDITION, etc.).
 */
interface BinaryExpression extends Expression {
  readonly '@type': 'BinaryExpression';
  readonly op: string;
  readonly left: Expression;
  readonly right: Expression;
}

/**
 * Unary expression: op value. Uses canonical op enum (NEGATION, etc.).
 */
interface UnaryExpression extends Expression {
  readonly '@type': 'UnaryExpression';
  readonly op: string;
  readonly value: Expression;

  /**
   * True for prefix (++x), false for postfix (x++).
   */
  readonly prefix: boolean;
}

/**
 * Assignment expression: target = source. Uses canonical names.
 */
interface AssignExpression extends Expression {
  readonly '@type': 'AssignExpression';
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

  readonly target: Expression;
  readonly source: Expression;
}

/**
 * Call expression: receiver.id(args). Uses canonical names.
 */
interface CallExpression extends Expression {
  readonly '@type': 'CallExpression';

  readonly receiver?: Expression;
  readonly id: Identifier;
  readonly args: readonly Expression[];

  readonly typeArguments?: readonly TypeRef[];
  readonly isSafe?: boolean;
}

/**
 * Field access expression: obj.field. Uses canonical names.
 */
interface FieldExpression extends Expression {
  readonly '@type': 'FieldExpression';

  readonly obj?: Expression;
  readonly field: Identifier;
  readonly isSafe?: boolean;
}

/**
 * Array access expression: array[index].
 */
interface ArrayExpression extends Expression {
  readonly '@type': 'ArrayExpression';
  readonly array: Expression;
  readonly index: Expression;
}

/**
 * New expression: new Type(args) or new Type[]{...}.
 */
interface NewExpression extends Expression {
  readonly '@type': 'NewExpression';
  readonly initializer:
    | ConstructorInitializer
    | MapInitializer
    | SizedArrayInitializer
    | ValuesInitializer;

  /**
   * Type from the initializer.
   */
  readonly type?: TypeRef;

  /**
   * For ConstructorInitializer.
   */
  readonly arguments?: readonly Expression[];

  /**
   * For ValuesInitializer, MapInitializer.
   */
  readonly arrayInitializer?: readonly Expression[];
}

/**
 * Cast expression: (Type) value. Uses canonical name value.
 */
interface CastExpression extends Expression {
  readonly '@type': 'CastExpression';
  readonly type: TypeRef;
  readonly value: Expression;
}

/**
 * Instance of expression: expression instanceof Type.
 */
interface InstanceOfExpression extends Expression {
  readonly '@type': 'InstanceOfExpression';
  readonly expression: Expression;
  readonly type: TypeRef;
}

/**
 * Ternary expression: condition ? ThenValue : elseValue. Uses canonical names.
 */
interface TernaryExpression extends Expression {
  readonly '@type': 'TernaryExpression';
  readonly condition: Expression;
  readonly thenValue: Expression;
  readonly elseValue: Expression;
}

/**
 * Lambda expression: (params) => body.
 */
interface LambdaExpression extends Expression {
  readonly '@type': 'LambdaExpression';
  readonly parameters: readonly LambdaParameter[];
  readonly body: Expression | Statement;
}

/**
 * Represents a lambda parameter in the AST.
 */
interface LambdaParameter extends ASTNode {
  readonly '@type': 'LambdaParameter';
  readonly name: string;
  readonly type?: TypeRef;
}

/**
 * Represents a variable expression that references a variable or parameter.
 */
interface VariableExpression extends Expression {
  readonly '@type': 'VariableExpression';
  readonly id: Identifier;
}

/**
 * Represents the 'this' expression in the AST.
 */
interface ThisExpression extends Expression {
  readonly '@type': 'ThisExpression';
}

/**
 * Represents the 'super' expression in the AST.
 */
interface SuperExpression extends Expression {
  readonly '@type': 'SuperExpression';
}

/**
 * Represents a parenthesized expression in the AST.
 */
interface ParenthesizedExpression extends Expression {
  readonly '@type': 'ParenthesizedExpression';
  readonly expression: Expression;
}

/**
 * SOQL query expression: [SELECT ... FROM ...].
 */
interface SoqlExpression extends Expression {
  readonly '@type': 'SoqlExpression';

  /**
   * The raw query text within brackets.
   */
  readonly query: string;

  /**
   * Bound expressions like :variableName.
   * In summit-ast, these are SoqlOrSoslBinding nodes.
   */
  readonly bindings: readonly SoqlOrSoslBinding[];
}

/**
 * SOSL query expression: [FIND ... IN ... RETURNING ...].
 */
interface SoslExpression extends Expression {
  readonly '@type': 'SoslExpression';

  /**
   * The raw query text within brackets.
   */
  readonly query: string;

  /**
   * Bound expressions like :variableName.
   * In summit-ast, these are SoqlOrSoslBinding nodes.
   */
  readonly bindings: readonly SoqlOrSoslBinding[];
}

/**
 * Trigger context variable expression: Trigger.new, Trigger.old, etc.
 */
interface TriggerContextVariableExpression extends Expression {
  readonly '@type': 'TriggerContextVariableExpression';

  /**
   * E.g., "new", "old", "newMap", "oldMap", etc.
   */
  readonly variableName: string;
}

/**
 * A SOQL or SOSL expression binding.
 * In summit-ast, this extends Node() (not NodeWithSourceLocation),
 * but the source location comes from the bound expression.
 */
interface SoqlOrSoslBinding extends ASTNode {
  readonly '@type': 'SoqlOrSoslBinding';

  readonly expr: Expression;
  readonly sourceLocation?: CanonicalSourceLocation;
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
  UntranslatedExpression,
  SoqlOrSoslBinding,
};
