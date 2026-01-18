/**
 * @file Factory for creating Initializer AST nodes.
 */

import type {
  ConstructorInitializer,
  ValuesInitializer,
  SizedArrayInitializer,
  MapInitializer,
} from '../ast/Initializer.js';
import type { TypeRef } from '../ast/Type.js';
import type { Expression } from '../ast/Expression.js';
import type { NodeFactoryOptions } from './NodeFactoryOptions.js';

/**
 * Factory for creating Initializer AST nodes.
 */
export class InitializerFactory {
  static createConstructorInitializer(
    type: TypeRef,
    args: Expression[] = [],
    options?: NodeFactoryOptions
  ): ConstructorInitializer {
    return {
      args,
      kind: 'ConstructorInitializer',
      location: options?.location,
      type,
    };
  }

  static createValuesInitializer(
    type: TypeRef,
    values: Expression[] = [],
    options?: NodeFactoryOptions
  ): ValuesInitializer {
    return {
      kind: 'ValuesInitializer',
      location: options?.location,
      type,
      values,
    };
  }

  static createSizedArrayInitializer(
    type: TypeRef,
    size: Expression,
    options?: NodeFactoryOptions
  ): SizedArrayInitializer {
    return {
      kind: 'SizedArrayInitializer',
      location: options?.location,
      size,
      type,
    };
  }

  static createMapInitializer(
    type: TypeRef,
    pairs: { key: Expression; value: Expression }[],
    options?: NodeFactoryOptions
  ): MapInitializer {
    return {
      kind: 'MapInitializer',
      location: options?.location,
      pairs,
      type,
    };
  }
}
