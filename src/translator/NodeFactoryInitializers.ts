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
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
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
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    type: Readonly<TypeRef>,

    values: readonly Expression[] = [],

    options?: Readonly<NodeFactoryOptions>
  ): ValuesInitializer {
    return {
      kind: 'ValuesInitializer',
      location: options?.location,
      type,
      values: [...values],
    };
  }

  public static createSizedArrayInitializer(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    type: Readonly<TypeRef>,

    size: Readonly<Expression>,

    options?: Readonly<NodeFactoryOptions>
  ): SizedArrayInitializer {
    return {
      kind: 'SizedArrayInitializer',
      location: options?.location,
      size,
      type,
    };
  }

  public static createMapInitializer(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    type: Readonly<TypeRef>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    pairs: readonly { key: Expression; value: Expression }[],

    options?: Readonly<NodeFactoryOptions>
  ): MapInitializer {
    return {
      kind: 'MapInitializer',
      location: options?.location,
      pairs: [...pairs],
      type,
    };
  }
}
