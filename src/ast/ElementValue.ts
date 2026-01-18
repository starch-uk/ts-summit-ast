/**
 * @file ElementValue node types.
 * AST node types for annotation element values.
 * In summit-ast, ElementValue extends NodeWithSourceLocation, so it IS an AST node.
 */

import type { ASTNode, SourceRange } from './base.js';
import type { Expression } from './Expression.js';
import type { Annotation } from './Declaration.js';

/**
 * Base type for all element value nodes.
 * A value that can be assigned to an annotation element.
 */
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
  readonly values: ElementValue[];
  readonly location?: SourceRange;
}

export type { ElementValue, ExpressionElementValue, AnnotationElementValue, ArrayElementValue };
