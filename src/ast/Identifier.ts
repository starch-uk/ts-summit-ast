/**
 * @file Identifier helper node type.
 * Identifier is a helper node used within other nodes (e.g., method names, class names).
 * It is NOT an expression type - use VariableExpression for variable references in expressions.
 */

import type { ASTNode } from './base.js';

/**
 * Identifier: a name used within other AST nodes.
 * This is a helper node, not an expression type.
 * For variable references in expressions, use VariableExpression.
 */
export interface Identifier extends ASTNode {
  readonly kind: 'Identifier';
  readonly name: string;
}
