/**
 * @file Parse tree visitor for traversing parse trees.
 * Visitor interface and implementation for parse tree traversal.
 */

import type { ParseTreeNode } from '../parser/ParseTreeTypes.js';

/**
 * Visitor interface for parse tree traversal.
 * @template T The return type of visit methods.
 */
export interface ParseTreeVisitor<T = void> {
  /**
   * Visit a parse tree node.
   */
  visit: (node: ParseTreeNode) => T;

  /**
   * Visit children of a node.
   */
  visitChildren: (node: ParseTreeNode) => T[];
}

/**
 * Base visitor implementation.
 */
export class DefaultParseTreeVisitor implements ParseTreeVisitor {
  visit(_node: ParseTreeNode): void {
    // Default implementation does nothing
  }

  visitChildren(node: ParseTreeNode): void[] {
    if (!node.children || node.children.length === 0) {
      return [];
    }

    return node.children.map((child) => {
      this.visit(child);
    });
  }
}
