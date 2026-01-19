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
   * @param node - The parse tree node to visit.
   * @returns The result of visiting the node.
   */
  visit: (node: Readonly<ParseTreeNode>) => T;

  /**
   * Visit children of a node.
   * @param node - The parse tree node whose children to visit.
   * @returns An array of results from visiting each child.
   */
  visitChildren: (node: Readonly<ParseTreeNode>) => T[];
}

/**
 * Base visitor implementation.
 */
export class DefaultParseTreeVisitor implements ParseTreeVisitor {
  /**
   * Visit a parse tree node.
   * @param _node - The parse tree node to visit.
   */
  public visit(_node: Readonly<ParseTreeNode>): void {
    // Default implementation does nothing
  }

  public visitChildren(node: Readonly<ParseTreeNode>): void[] {
    const emptyArrayLength = 0;
    if (!node.children || node.children.length === emptyArrayLength) {
      return [];
    }

    return node.children.map((child) => {
      this.visit(child);
      return undefined;
    });
  }
}
