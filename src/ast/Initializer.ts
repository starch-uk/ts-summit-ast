/**
 * @file Initializer and element value node types.
 * AST node types for object initializers and annotation element values.
 */

import type { ASTNode, SourceRange } from './baseNode.js';
import type { TypeRef } from './baseNode.js';
import type { Expression } from './expression.js';
import type { Annotation } from './declaration.js';

/**
 * Object initializer via a constructor call.
 */
interface ConstructorInitializer extends ASTNode {
  readonly kind: 'ConstructorInitializer';
  readonly type: TypeRef;
  readonly args: readonly Expression[];
  readonly location?: SourceRange;
}

/**
 * Object initializer for lists, sets, or arrays via a list of values.
 * An empty set of values may also be used to initialize maps.
 */
interface ValuesInitializer extends ASTNode {
  readonly kind: 'ValuesInitializer';
  readonly type: TypeRef;
  readonly values: readonly Expression[];
  readonly location?: SourceRange;
}

/**
 * Object initializer for sized arrays.
 */
interface SizedArrayInitializer extends ASTNode {
  readonly kind: 'SizedArrayInitializer';
  readonly type: TypeRef;
  readonly size: Expression;
  readonly location?: SourceRange;
}

/**
 * Object initializer for maps via a list of key-value pairs.
 */
interface MapInitializer extends ASTNode {
  readonly kind: 'MapInitializer';
  readonly type: TypeRef;
  readonly pairs: readonly { readonly key: Expression; readonly value: Expression }[];
  readonly location?: SourceRange;
}

/**
 * Union type for all initializer node types.
 */
/* eslint-disable @typescript-eslint/no-type-alias -- Union type alias needed for type safety and clarity */
type Initializer =
  | ConstructorInitializer
  | MapInitializer
  | SizedArrayInitializer
  | ValuesInitializer;
/* eslint-enable @typescript-eslint/no-type-alias */

/**
 * Base type for all element value nodes.
 * A value that can be assigned to an annotation element.
 */
// eslint-disable-next-line @typescript-eslint/no-type-alias -- Union type alias needed for type safety and clarity
type ElementValue = AnnotationElementValue | ArrayElementValue | ExpressionElementValue;

/**
 * An element value that is an Expression.
 */
interface ExpressionElementValue extends ASTNode {
  readonly kind: 'ExpressionElementValue';
  readonly value: Expression;
  readonly location?: SourceRange;
}

/**
 * An element value that is an AnnotationModifier.
 * In summit-ast, this contains an AnnotationModifier (which extends Modifier).
 * In ts-summit-ast, we use Annotation directly.
 */
interface AnnotationElementValue extends ASTNode {
  readonly kind: 'AnnotationElementValue';
  readonly value: Annotation;
  readonly location?: SourceRange;
}

/**
 * An element value that is an array of ElementValues.
 */
interface ArrayElementValue extends ASTNode {
  readonly kind: 'ArrayElementValue';
  readonly values: readonly ElementValue[];
  readonly location?: SourceRange;
}

export type {
  ConstructorInitializer,
  ValuesInitializer,
  SizedArrayInitializer,
  MapInitializer,
  Initializer,
  ElementValue,
  ExpressionElementValue,
  AnnotationElementValue,
  ArrayElementValue,
};
