/**
 * @file SoqlOrSoslBinding node type.
 * AST node type for SOQL/SOSL expression bindings.
 * In summit-ast, SoqlOrSoslBinding extends Node() (not NodeWithSourceLocation),
 * but delegates getSourceLocation() to the bound expression.
 */

import type { ASTNode, SourceRange } from './base.js';
import type { Expression } from './Expression.js';

/**
 * A SOQL or SOSL expression binding.
 * In summit-ast, this extends Node() (not NodeWithSourceLocation),
 * but the source location comes from the bound expression.
 */
export interface SoqlOrSoslBinding extends ASTNode {
  readonly kind: 'SoqlOrSoslBinding';

  /**
   * The bound expression (e.g., :variableName in SOQL).
   */
  readonly expr: Expression;

  /**
   * Optional source location (typically from the bound expression).
   */
  readonly location?: SourceRange;
}
