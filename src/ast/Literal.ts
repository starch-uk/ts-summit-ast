/**
 * @file Literal node types.
 * AST node types for literal values (string, number, boolean, null).
 */

import type { Expression } from './expression.js';

/**
 * Base interface for all literal expressions
 * Literals are expressions, so they extend Expression.
 */
interface Literal extends Expression {
  readonly '@type':
    | 'BooleanVal'
    | 'CharacterLiteral'
    | 'DecimalVal'
    | 'DoubleVal'
    | 'IntegerVal'
    | 'LongVal'
    | 'NullVal'
    | 'StringVal';
}

/**
 * String literal: "string" or 'string'.
 */
interface StringVal extends Literal {
  readonly '@type': 'StringVal';
  readonly value: string;

  /**
   * Original string including quotes.
   */
  readonly raw: string;
}

/**
 * Integer literal: 123, 0x1F, etc.
 */
interface IntegerVal extends Literal {
  readonly '@type': 'IntegerVal';
  readonly value: number;

  /**
   * Original string representation.
   */
  readonly raw: string;
}

/**
 * Double literal: 123.45, etc.
 */
interface DoubleVal extends Literal {
  readonly '@type': 'DoubleVal';
  readonly value: number;

  /**
   * Original string representation.
   */
  readonly raw: string;
}

/**
 * Long literal: 123L, etc.
 */
interface LongVal extends Literal {
  readonly '@type': 'LongVal';
  readonly value: number;

  /**
   * Original string representation.
   */
  readonly raw: string;
}

/**
 * Decimal literal: 123.45d, etc.
 */
interface DecimalVal extends Literal {
  readonly '@type': 'DecimalVal';
  readonly value: number;

  /**
   * Original string representation.
   */
  readonly raw: string;
}

/**
 * Boolean literal: true or false.
 */
interface BooleanVal extends Literal {
  readonly '@type': 'BooleanVal';
  readonly value: boolean;
}

/**
 * Null literal: null.
 */
interface NullVal extends Literal {
  readonly '@type': 'NullVal';
}

/**
 * Character literal: 'c'.
 */
interface CharacterLiteral extends Literal {
  readonly '@type': 'CharacterLiteral';

  /**
   * Single character.
   */
  readonly value: string;

  /**
   * Original string including quotes.
   */
  readonly raw: string;
}

export type {
  Literal,
  StringVal,
  IntegerVal,
  DoubleVal,
  LongVal,
  DecimalVal,
  BooleanVal,
  NullVal,
  CharacterLiteral,
};
