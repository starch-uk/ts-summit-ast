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
    value: Expression,
    options?: NodeFactoryOptions
  ): ExpressionElementValue {
    return {
      kind: 'ExpressionElementValue',
      location: options?.location,
      value,
    };
  }

  public static createAnnotationElementValue(
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
    values: ElementValue[],
    options?: NodeFactoryOptions
  ): ArrayElementValue {
    return {
      kind: 'ArrayElementValue',
      location: options?.location,
      values,
    };
  }
}
