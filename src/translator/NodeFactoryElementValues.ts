/**
 * @file Factory for creating ElementValue AST nodes.
 */

import type {
  ExpressionElementValue,
  AnnotationElementValue,
  ArrayElementValue,
} from '../ast/ElementValue.js';
import type { Expression } from '../ast/Expression.js';
import type { Annotation } from '../ast/Declaration.js';
import type { ElementValue } from '../ast/ElementValue.js';
import type { NodeFactoryOptions } from './NodeFactoryOptions.js';

/**
 * Factory for creating ElementValue AST nodes.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Factory pattern requires class
export class ElementValueFactory {
  public static createExpressionElementValue(
    value: Readonly<Expression>,

    options?: Readonly<NodeFactoryOptions>
  ): ExpressionElementValue {
    return {
      kind: 'ExpressionElementValue',
      location: options?.location,
      value,
    };
  }

  public static createAnnotationElementValue(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    value: Readonly<Annotation>,
    options?: Readonly<NodeFactoryOptions>
  ): AnnotationElementValue {
    return {
      kind: 'AnnotationElementValue',
      location: options?.location,
      value,
    };
  }

  public static createArrayElementValue(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    values: readonly ElementValue[],

    options?: Readonly<NodeFactoryOptions>
  ): ArrayElementValue {
    return {
      kind: 'ArrayElementValue',
      location: options?.location,
      values: [...values],
    };
  }
}
