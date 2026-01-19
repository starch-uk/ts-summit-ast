/**
 * @file Factory for creating literal AST nodes.
 * Specialized factory for creating literal node types.
 */

import type {
  StringVal,
  IntegerVal,
  DoubleVal,
  LongVal,
  DecimalVal,
  BooleanVal,
  NullVal,
} from '../ast/Literal.js';
import type { NodeFactoryOptions } from './NodeFactoryOptions.js';

/**
 * Options for creating AST nodes.
 */

/**
 * Factory for literal nodes.
 */
export class LiteralFactory {
  public static createStringVal(
    value: string,
    raw?: string,
    options?: NodeFactoryOptions
  ): StringVal {
    return {
      kind: 'StringVal',
      location: options?.location,
      raw: raw ?? `"${value}"`,
      value,
    };
  }

  public static createIntegerVal(
    value: number,
    raw?: string,
    options?: NodeFactoryOptions
  ): IntegerVal {
    return {
      kind: 'IntegerVal',
      location: options?.location,
      raw: raw ?? String(value),
      value,
    };
  }

  public static createDoubleVal(
    value: number,
    raw?: string,
    options?: NodeFactoryOptions
  ): DoubleVal {
    return {
      kind: 'DoubleVal',
      location: options?.location,
      raw: raw ?? String(value),
      value,
    };
  }

  public static createLongVal(value: number, raw?: string, options?: NodeFactoryOptions): LongVal {
    return {
      kind: 'LongVal',
      location: options?.location,
      raw: raw ?? String(value),
      value,
    };
  }

  public static createDecimalVal(
    value: number,
    raw?: string,
    options?: NodeFactoryOptions
  ): DecimalVal {
    return {
      kind: 'DecimalVal',
      location: options?.location,
      raw: raw ?? String(value),
      value,
    };
  }

  public static createBooleanVal(value: boolean, options?: NodeFactoryOptions): BooleanVal {
    return {
      kind: 'BooleanVal',
      location: options?.location,
      value,
    };
  }

  public static createNullVal(options?: NodeFactoryOptions): NullVal {
    return {
      kind: 'NullVal',
      location: options?.location,
    };
  }

  /**
   * Creates a string literal node (deprecated).
   * @param value - The string content value.
   * @param raw - The raw string literal text as it appeared in source.
   * @param options - Optional factory options.
   * @returns The created string literal node.
   * @deprecated Use createStringVal instead.
   */
  public static createStringLiteral(
    value: string,
    raw?: string,
    options?: NodeFactoryOptions
  ): StringVal {
    return this.createStringVal(value, raw, options);
  }

  /**
   * Creates a numeric literal node (deprecated).
   * @param value - The numeric value.
   * @param raw - The raw numeric literal text as it appeared in source.
   * @param options - Optional factory options.
   * @returns The created numeric literal node.
   * @deprecated Use createIntegerVal, createDoubleVal, createLongVal, or createDecimalVal instead.
   */
  public static createNumberLiteral(
    value: number,
    raw?: string,
    options?: NodeFactoryOptions
  ): IntegerVal {
    return this.createIntegerVal(value, raw, options);
  }

  /**
   * Creates a boolean literal node (deprecated).
   * @param value - The boolean value (true or false).
   * @param options - Optional factory options.
   * @returns The created boolean literal node.
   * @deprecated Use createBooleanVal instead.
   */
  public static createBooleanLiteral(value: boolean, options?: NodeFactoryOptions): BooleanVal {
    return this.createBooleanVal(value, options);
  }

  /**
   * Creates a null literal node (deprecated).
   * @param options - Optional factory options.
   * @returns The created null literal node.
   * @deprecated Use createNullVal instead.
   */
  public static createNullLiteral(options?: NodeFactoryOptions): NullVal {
    return this.createNullVal(options);
  }
}
