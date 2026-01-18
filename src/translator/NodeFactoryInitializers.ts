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
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Factory pattern requires class
export class InitializerFactory {
  public static createConstructorInitializer(
    type: Readonly<TypeRef>,
    args: readonly Readonly<Expression>[] = [],
    options?: Readonly<NodeFactoryOptions>
  ): ConstructorInitializer {
    return {
      args: [...args],
      kind: 'ConstructorInitializer',
      location: options?.location,
      type,
    };
  }

  public static createValuesInitializer(
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

  public static createSizedArrayInitializer(
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

  public static createMapInitializer(
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
