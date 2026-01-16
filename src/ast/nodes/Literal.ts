/**
 * Literal node types
 */

import type { Expression } from './Expression.js';

/**
 * Base interface for all literal expressions
 * Literals are expressions, so they extend Expression
 */
export interface Literal extends Expression {
  readonly kind: LiteralKind;
}

/**
 * Discriminated union type for all literal kinds
 */
export type LiteralKind =
  | 'StringLiteral'
  | 'NumberLiteral'
  | 'BooleanLiteral'
  | 'NullLiteral'
  | 'CharacterLiteral';

/**
 * String literal: "string" or 'string'
 */
export interface StringLiteral extends Literal {
  readonly kind: 'StringLiteral';
  readonly value: string;
  readonly raw: string; // Original string including quotes
}

/**
 * Number literal: 123, 123.45, 0x1F, etc.
 */
export interface NumberLiteral extends Literal {
  readonly kind: 'NumberLiteral';
  readonly value: number;
  readonly raw: string; // Original string representation
}

/**
 * Boolean literal: true or false
 */
export interface BooleanLiteral extends Literal {
  readonly kind: 'BooleanLiteral';
  readonly value: boolean;
}

/**
 * Null literal: null
 */
export interface NullLiteral extends Literal {
  readonly kind: 'NullLiteral';
}

/**
 * Character literal: 'c'
 */
export interface CharacterLiteral extends Literal {
  readonly kind: 'CharacterLiteral';
  readonly value: string; // Single character
  readonly raw: string; // Original string including quotes
}

/**
 * Union type for all literal node types
 */
export type LiteralNode =
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral
  | NullLiteral
  | CharacterLiteral;
