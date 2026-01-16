/**
 * Visitor pattern for AST traversal
 */

import type { ASTNode } from './base.js';

/**
 * Base visitor interface for AST nodes
 * @template T The return type of visit methods
 */
export interface ASTVisitor<T = void> {
  /**
   * Visit any AST node (fallback for unknown node types)
   */
  visit(node: ASTNode): T;

  /**
   * Visit children of a node
   */
  visitChildren(node: ASTNode): T[];
}

/**
 * Base interface for nodes that accept visitors
 */
export interface VisitableNode extends ASTNode {
  /**
   * Accept a visitor and return the result
   */
  accept<T>(visitor: ASTVisitor<T>): T;
}

/**
 * Default visitor implementation that traverses the tree
 */
export class DefaultVisitor implements ASTVisitor<void> {
  visit(_node: ASTNode): void {
    // Default implementation does nothing
    // Override in subclasses for specific behavior
  }

  visitChildren(_node: ASTNode): void[] {
    // Default implementation returns empty array
    // Subclasses should override to visit child nodes
    return [];
  }
}
