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
export class ElementValueFactory {
  static createExpressionElementValue(
    value: Expression,
    options?: NodeFactoryOptions
  ): ExpressionElementValue {
    return {
      kind: 'ExpressionElementValue',
      location: options?.location,
      value,
    };
  }

  static createAnnotationElementValue(
    value: Annotation,
    options?: NodeFactoryOptions
  ): AnnotationElementValue {
    return {
      kind: 'AnnotationElementValue',
      location: options?.location,
      value,
    };
  }

  static createArrayElementValue(
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
