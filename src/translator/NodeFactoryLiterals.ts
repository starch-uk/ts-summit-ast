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
  static createStringVal(value: string, raw?: string, options?: NodeFactoryOptions): StringVal {
    return {
      kind: 'StringVal',
      location: options?.location,
      raw: raw ?? `"${value}"`,
      value,
    };
  }

  static createIntegerVal(value: number, raw?: string, options?: NodeFactoryOptions): IntegerVal {
    return {
      kind: 'IntegerVal',
      location: options?.location,
      raw: raw ?? String(value),
      value,
    };
  }

  static createDoubleVal(value: number, raw?: string, options?: NodeFactoryOptions): DoubleVal {
    return {
      kind: 'DoubleVal',
      location: options?.location,
      raw: raw ?? String(value),
      value,
    };
  }

  static createLongVal(value: number, raw?: string, options?: NodeFactoryOptions): LongVal {
    return {
      kind: 'LongVal',
      location: options?.location,
      raw: raw ?? String(value),
      value,
    };
  }

  static createDecimalVal(value: number, raw?: string, options?: NodeFactoryOptions): DecimalVal {
    return {
      kind: 'DecimalVal',
      location: options?.location,
      raw: raw ?? String(value),
      value,
    };
  }

  static createBooleanVal(value: boolean, options?: NodeFactoryOptions): BooleanVal {
    return {
      kind: 'BooleanVal',
      location: options?.location,
      value,
    };
  }

  static createNullVal(options?: NodeFactoryOptions): NullVal {
    return {
      kind: 'NullVal',
      location: options?.location,
    };
  }

  /**
   * @param value
   * @param raw
   * @param options
   * @deprecated Use createStringVal instead.
   */
  static createStringLiteral(value: string, raw?: string, options?: NodeFactoryOptions): StringVal {
    return this.createStringVal(value, raw, options);
  }

  /**
   * @param value
   * @param raw
   * @param options
   * @deprecated Use createIntegerVal, createDoubleVal, createLongVal, or createDecimalVal instead.
   */
  static createNumberLiteral(
    value: number,
    raw?: string,
    options?: NodeFactoryOptions
  ): IntegerVal {
    return this.createIntegerVal(value, raw, options);
  }

  /**
   * @param value
   * @param options
   * @deprecated Use createBooleanVal instead.
   */
  static createBooleanLiteral(value: boolean, options?: NodeFactoryOptions): BooleanVal {
    return this.createBooleanVal(value, options);
  }

  /**
   * @param options
   * @deprecated Use createNullVal instead.
   */
  static createNullLiteral(options?: NodeFactoryOptions): NullVal {
    return this.createNullVal(options);
  }
}
