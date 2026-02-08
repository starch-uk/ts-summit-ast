/**
 * @file Initializer and element value node types.
 * AST node types for object initializers and annotation element values.
 */

import type { ASTNode, CanonicalSourceLocation } from './baseNode.js';
import type { TypeRef } from './baseNode.js';
import type { Expression } from './expression.js';
import type { Annotation } from './declaration.js';

/**
 * Object initializer via a constructor call.
 */
interface ConstructorInitializer extends ASTNode {
  readonly '@type': 'ConstructorInitializer';
  readonly type: TypeRef;
  readonly args: readonly Expression[];
  readonly sourceLocation?: CanonicalSourceLocation;
}

/**
 * Object initializer for lists, sets, or arrays via a list of values.
 * An empty set of values may also be used to initialize maps.
 */
interface ValuesInitializer extends ASTNode {
  readonly '@type': 'ValuesInitializer';
  readonly type: TypeRef;
  readonly values: readonly Expression[];
  readonly sourceLocation?: CanonicalSourceLocation;
}

/**
 * Object initializer for sized arrays.
 */
interface SizedArrayInitializer extends ASTNode {
  readonly '@type': 'SizedArrayInitializer';
  readonly type: TypeRef;
  readonly size: Expression;
  readonly sourceLocation?: CanonicalSourceLocation;
}

/**
 * Object initializer for maps via pairs. Uses canonical names first/second.
 */
interface MapInitializer extends ASTNode {
  readonly '@type': 'MapInitializer';
  readonly type: TypeRef;
  readonly pairs: readonly { readonly first: Expression; readonly second: Expression }[];
  readonly sourceLocation?: CanonicalSourceLocation;
}

/**
 * An element value that is an Expression.
 */
interface ExpressionElementValue extends ASTNode {
  readonly '@type': 'ExpressionElementValue';
  readonly value: Expression;
  readonly sourceLocation?: CanonicalSourceLocation;
}

/**
 * An element value that is an AnnotationModifier.
 * In summit-ast, this contains an AnnotationModifier (which extends Modifier).
 * In ts-summit-ast, we use Annotation directly.
 */
interface AnnotationElementValue extends ASTNode {
  readonly '@type': 'AnnotationElementValue';
  readonly value: Annotation;
  readonly sourceLocation?: CanonicalSourceLocation;
}

/**
 * An element value that is an array of element values.
 */
interface ArrayElementValue extends ASTNode {
  readonly '@type': 'ArrayElementValue';
  readonly values: readonly (AnnotationElementValue | ArrayElementValue | ExpressionElementValue)[];
  readonly sourceLocation?: CanonicalSourceLocation;
}

export type {
  ConstructorInitializer,
  ValuesInitializer,
  SizedArrayInitializer,
  MapInitializer,
  ExpressionElementValue,
  AnnotationElementValue,
  ArrayElementValue,
};
