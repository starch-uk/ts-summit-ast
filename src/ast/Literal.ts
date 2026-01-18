/**
 * @file Literal node types.
 * AST node types for literal values (string, number, boolean, null).
 */

import type { Expression } from './Expression.js';

/**
 * Base interface for all literal expressions
 * Literals are expressions, so they extend Expression.
 */
export interface Literal extends Expression {
  readonly kind: LiteralKind;
}

/**
 * Discriminated union type for all literal kinds.
 */
export type LiteralKind =
  | 'BooleanVal'
  | 'CharacterLiteral'
  | 'DecimalVal'
  | 'DoubleVal'
  | 'IntegerVal'
  | 'LongVal'
  | 'NullVal'
  | 'StringVal';

/**
 * String literal: "string" or 'string'.
 */
export interface StringVal extends Literal {
  readonly kind: 'StringVal';
  readonly value: string;

  /**
   * Original string including quotes.
   */
  readonly raw: string;
}

/**
 * Integer literal: 123, 0x1F, etc.
 */
export interface IntegerVal extends Literal {
  readonly kind: 'IntegerVal';
  readonly value: number;

  /**
   * Original string representation.
   */
  readonly raw: string;
}

/**
 * Double literal: 123.45, etc.
 */
export interface DoubleVal extends Literal {
  readonly kind: 'DoubleVal';
  readonly value: number;

  /**
   * Original string representation.
   */
  readonly raw: string;
}

/**
 * Long literal: 123L, etc.
 */
export interface LongVal extends Literal {
  readonly kind: 'LongVal';
  readonly value: number;

  /**
   * Original string representation.
   */
  readonly raw: string;
}

/**
 * Decimal literal: 123.45d, etc.
 */
export interface DecimalVal extends Literal {
  readonly kind: 'DecimalVal';
  readonly value: number;

  /**
   * Original string representation.
   */
  readonly raw: string;
}

/**
 * Boolean literal: true or false.
 */
export interface BooleanVal extends Literal {
  readonly kind: 'BooleanVal';
  readonly value: boolean;
}

/**
 * Null literal: null.
 */
export interface NullVal extends Literal {
  readonly kind: 'NullVal';
}

/**
 * Character literal: 'c'.
 */
export interface CharacterLiteral extends Literal {
  readonly kind: 'CharacterLiteral';

  /**
   * Single character.
   */
  readonly value: string;

  /**
   * Original string including quotes.
   */
  readonly raw: string;
}

/**
 * Union type for all literal node types.
 */
export type LiteralNode =
  | BooleanVal
  | CharacterLiteral
  | DecimalVal
  | DoubleVal
  | IntegerVal
  | LongVal
  | NullVal
  | StringVal;
