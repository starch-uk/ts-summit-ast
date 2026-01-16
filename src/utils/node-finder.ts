/**
 * AST node finding utilities
 */

import type { ASTNode, SourceRange } from '../ast/base.js';
import type { Position } from './position.js';
import { isPositionInRange } from './position.js';
import { walkAST, getAncestors, buildParentMap } from './traversal.js';

/**
 * Result of finding a node at a position
 */
export interface NodeAtPositionResult {
  readonly node: ASTNode;
  readonly nodeType: string;
  readonly location: SourceRange;
  readonly parent?: ASTNode;
  readonly ancestors: ASTNode[]; // All ancestor nodes from root to this node
}

/**
 * Options for finding nodes at position
 */
export interface FindNodeAtPositionOptions {
  readonly includeComments?: boolean; // Include comment nodes
  readonly includeWhitespace?: boolean; // Include whitespace-only nodes
  readonly preferLeaf?: boolean; // Prefer leaf nodes over parent nodes
}

/**
 * Find the most specific AST node at a given position.
 * Returns the deepest node that contains the position.
 */
export function findNodeAtPosition(
  ast: ASTNode,
  position: Position,
  options: FindNodeAtPositionOptions = {}
): NodeAtPositionResult | null {
  const { preferLeaf = true } = options;
  const candidates: Array<{ node: ASTNode; depth: number }> = [];

  // Build parent map for ancestor lookup
  const parentMap = buildParentMap(ast);

  // Walk AST and collect all nodes that contain the position
  walkAST(ast, {
    enterNode: (node) => {
      if (!node.location) {
        return;
      }

      if (isPositionInRange(position, node.location)) {
        // Calculate depth
        let depth = 0;
        let current: ASTNode | null | undefined = node;
        while (current) {
          depth++;
          current = parentMap.get(current) || null;
        }

        candidates.push({ node, depth });
      }
    },
  });

  if (candidates.length === 0) {
    return null;
  }

  // Sort by depth (deeper nodes first if preferLeaf, otherwise shallower first)
  candidates.sort((a, b) => {
    if (preferLeaf) {
      return b.depth - a.depth; // Deeper nodes first
    }
    return a.depth - b.depth; // Shallower nodes first
  });

  const bestMatch = candidates[0];
  const node = bestMatch.node;
  const ancestors = getAncestors(node, ast);
  const parent = ancestors.length > 1 ? ancestors[ancestors.length - 2] : undefined;

  if (!node.location) {
    return null;
  }

  return {
    node,
    nodeType: node.kind,
    location: node.location,
    parent,
    ancestors: ancestors.slice(0, -1), // Exclude the node itself
  };
}

/**
 * Result of finding nodes in a range
 */
export interface NodesInRangeResult {
  readonly nodes: ASTNode[];
  readonly fullyContained: ASTNode[]; // Nodes fully within the range
  readonly partiallyOverlapping: ASTNode[]; // Nodes that partially overlap
}

/**
 * Options for finding nodes in range
 */
export interface FindNodesInRangeOptions {
  readonly includePartial?: boolean; // Include partially overlapping nodes
  readonly nodeTypes?: string[]; // Filter by specific node types
}

/**
 * Check if a range is fully contained within another range
 */
function isRangeFullyContained(inner: SourceRange, outer: SourceRange): boolean {
  return (
    isPositionInRange(inner.start, outer) &&
    isPositionInRange(inner.end, outer)
  );
}

/**
 * Check if two ranges overlap
 */
function doRangesOverlap(range1: SourceRange, range2: SourceRange): boolean {
  // Check if ranges don't overlap
  if (
    range1.end.line < range2.start.line ||
    (range1.end.line === range2.start.line && range1.end.column < range2.start.column)
  ) {
    return false;
  }
  if (
    range2.end.line < range1.start.line ||
    (range2.end.line === range1.start.line && range2.end.column < range1.start.column)
  ) {
    return false;
  }
  return true;
}

/**
 * Find all AST nodes that overlap with a source range
 */
export function findNodesInRange(
  ast: ASTNode,
  range: SourceRange,
  options: FindNodesInRangeOptions = {}
): NodesInRangeResult {
  const { includePartial = true, nodeTypes } = options;
  const allNodes: ASTNode[] = [];
  const fullyContained: ASTNode[] = [];
  const partiallyOverlapping: ASTNode[] = [];

  walkAST(ast, {
    enterNode: (node) => {
      if (!node.location) {
        return;
      }

      // Filter by node type if specified
      if (nodeTypes && !nodeTypes.includes(node.kind)) {
        return;
      }

      const nodeRange = node.location;

      // Check if fully contained
      if (isRangeFullyContained(nodeRange, range)) {
        fullyContained.push(node);
        allNodes.push(node);
        return;
      }

      // Check if partially overlapping
      if (includePartial && doRangesOverlap(nodeRange, range)) {
        partiallyOverlapping.push(node);
        allNodes.push(node);
      }
    },
  });

  return {
    nodes: allNodes,
    fullyContained,
    partiallyOverlapping,
  };
}
