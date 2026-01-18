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
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Visitor pattern may need mutable node
  visit: (node: ParseTreeNode) => T;

  /**
   * Visit children of a node.
   */
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Visitor pattern may need mutable node
  visitChildren: (node: Readonly<ParseTreeNode>) => T[];
}

/**
 * Base visitor implementation.
 */
export class DefaultParseTreeVisitor implements ParseTreeVisitor {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Default visitor implementation
  public visit(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Visitor pattern may need mutable node
    _node: Readonly<ParseTreeNode>
  ): void {
    // Default implementation does nothing
  }

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- Interface requires void[] return type
  public visitChildren(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Visitor pattern may need mutable node
    node: Readonly<ParseTreeNode>
  ): void[] {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Check for empty array
    const emptyArrayLength = 0;
    if (!node.children || node.children.length === emptyArrayLength) {
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array method callback parameter
    return node.children.map((child) => {
      this.visit(child);
    });
  }
}
