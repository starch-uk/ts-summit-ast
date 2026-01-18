/**
 * @file Initializer node types.
 * AST node types for object initializers (constructor calls, array/list/map initialization).
 * In summit-ast, Initializer extends NodeWithSourceLocation, so it IS an AST node.
 */

import type { ASTNode, SourceRange } from './base.js';
import type { TypeRef } from './Type.js';
import type { Expression } from './Expression.js';

/**
 * Base type for all initializer nodes.
 * An initializer is an action that occurs after object allocation to setup its initial state.
 */
type Initializer =
  | ConstructorInitializer
  | MapInitializer
  | SizedArrayInitializer
  | ValuesInitializer;

/**
 * Object initializer via a constructor call.
 */
interface ConstructorInitializer extends ASTNode {
  readonly kind: 'ConstructorInitializer';
  readonly type: TypeRef;
  readonly args: Expression[];
  readonly location?: SourceRange;
}

/**
 * Object initializer for lists, sets, or arrays via a list of values.
 * An empty set of values may also be used to initialize maps.
 */
interface ValuesInitializer extends ASTNode {
  readonly kind: 'ValuesInitializer';
  readonly type: TypeRef;
  readonly values: Expression[];
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
  readonly pairs: { key: Expression; value: Expression }[];
  readonly location?: SourceRange;
}

export type {
  Initializer,
  ConstructorInitializer,
  ValuesInitializer,
  SizedArrayInitializer,
  MapInitializer,
};
