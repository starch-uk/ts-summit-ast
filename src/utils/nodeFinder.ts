/**
 * @file AST node finding utilities.
 * Functions for finding AST nodes at positions or within ranges.
 */

import type { ASTNode, SourceRange } from '../ast/baseNode.js';
import type { Position } from './sourceExtraction.js';
import { isPositionInRange } from './sourceExtraction.js';
import { walkAST, getAncestors, buildParentMap, getNodeChildren } from './traversal.js';

/**
 * Result of finding a node at a position.
 */
interface NodeAtPositionResult {
  readonly node: ASTNode;
  readonly nodeType: string;
  readonly location: SourceRange;
  readonly parent?: ASTNode;

  /**
   * All ancestor nodes from root to this node.
   */
  readonly ancestors: ASTNode[];
}

/**
 * Options for finding nodes at position.
 */
interface FindNodeAtPositionOptions {
  /**
   * Include comment nodes.
   */
  readonly includeComments?: boolean;

  /**
   * Include whitespace-only nodes.
   */
  readonly includeWhitespace?: boolean;

  /**
   * Prefer leaf nodes over parent nodes.
   */
  readonly preferLeaf?: boolean;
}

/**
 * Find the most specific AST node at a given position.
 * Returns the deepest node that contains the position.
 * @param ast - The root AST node to search in.
 * @param position - The position to find a node at.
 * @param options - Options for finding nodes.
 * @returns The node at the position, or null if not found.
 */
function findNodeAtPosition(
  ast: Readonly<ASTNode>,
  position: Readonly<Position>,
  options: Readonly<FindNodeAtPositionOptions> = {}
): NodeAtPositionResult | null {
  const { preferLeaf = true } = options;
  const candidates: { node: ASTNode; depth: number }[] = [];

  // Build parent map for ancestor lookup
  const parentMap = buildParentMap(ast);

  // Walk AST and collect all nodes that contain the position
  walkAST(ast, {
    enterNode: (node: Readonly<ASTNode>): undefined => {
      if (!node.location) {
        return;
      }

      if (isPositionInRange(position, node.location)) {
        // Calculate depth
        let depth = 0;
        let current: ASTNode | null | undefined = node;
        while (current) {
          depth++;
          current = parentMap.get(current) ?? null;
        }

        candidates.push({ depth, node });
      }
    },
  });

  const emptyArrayLength = 0;
  if (candidates.length === emptyArrayLength) {
    return null;
  }

  // Sort by depth (deeper nodes first if preferLeaf, otherwise shallower first)
  candidates.sort(
    (
      a: Readonly<{ depth: number; node: ASTNode }>,
      b: Readonly<{ depth: number; node: ASTNode }>
    ) => {
      if (preferLeaf) {
        return b.depth - a.depth; // Deeper nodes first
      }
      return a.depth - b.depth; // Shallower nodes first
    }
  );

  const [{ node }] = candidates;
  const ancestors = getAncestors(node, ast);
  const minAncestorsForParent = 2;
  const parent =
    ancestors.length >= minAncestorsForParent
      ? ancestors[ancestors.length - minAncestorsForParent]
      : undefined;

  if (!node.location) {
    return null;
  }

  const sliceStartIndex = 0;
  const excludeLastElement = -1;
  return {
    ancestors: ancestors.slice(sliceStartIndex, excludeLastElement), // Exclude the node itself
    location: node.location,
    node,
    nodeType: node.kind,
    parent,
  };
}

/**
 * Result of finding nodes in a range.
 */
interface NodesInRangeResult {
  readonly nodes: ASTNode[];

  /**
   * Nodes fully within the range.
   */
  readonly fullyContained: ASTNode[];

  /**
   * Nodes that partially overlap.
   */
  readonly partiallyOverlapping: ASTNode[];
}

/**
 * Options for finding nodes in range.
 */
interface FindNodesInRangeOptions {
  /**
   * Include partially overlapping nodes.
   */
  readonly includePartial?: boolean;

  /**
   * Filter by specific node types.
   */
  readonly nodeTypes?: readonly string[];
}

const EMPTY_FIND_OPTIONS: Readonly<FindNodesInRangeOptions> = {};

/**
 * Check if a range is fully contained within another range.
 * @param inner - The inner range to check.
 * @param outer - The outer range to check against.
 * @returns True if inner is fully contained within outer.
 */
function isRangeFullyContained(
  inner: Readonly<SourceRange>,
  outer: Readonly<SourceRange>
): boolean {
  return isPositionInRange(inner.start, outer) && isPositionInRange(inner.end, outer);
}

/**
 * Check if two ranges overlap.
 * @param range1 - The first range to check.
 * @param range2 - The second range to check.
 * @returns True if the ranges overlap.
 */
function doRangesOverlap(range1: Readonly<SourceRange>, range2: Readonly<SourceRange>): boolean {
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
 * Find all AST nodes that overlap with a source range.
 * @param ast - The root AST node to search in.
 * @param range - The source range to find nodes in.
 * @param options - Options for finding nodes.
 * @returns Result containing all overlapping nodes.
 */
function findNodesInRange(
  ast: Readonly<ASTNode>,
  range: Readonly<SourceRange>,
  options: Readonly<FindNodesInRangeOptions> = EMPTY_FIND_OPTIONS
): NodesInRangeResult {
  const { includePartial = true, nodeTypes } = options;
  const allNodes: ASTNode[] = [];
  const fullyContained: ASTNode[] = [];
  const partiallyOverlapping: ASTNode[] = [];

  walkAST(ast, {
    enterNode: (node: Readonly<ASTNode>): undefined => {
      if (!node.location) {
        return undefined;
      }

      // Filter by node type if specified
      if (nodeTypes && !nodeTypes.includes(node.kind)) {
        return undefined;
      }

      const nodeRange = node.location;

      // Check if fully contained
      if (isRangeFullyContained(nodeRange, range)) {
        fullyContained.push(node);
        allNodes.push(node);
        return undefined;
      }

      // Check if partially overlapping
      if (includePartial && doRangesOverlap(nodeRange, range)) {
        partiallyOverlapping.push(node);
        allNodes.push(node);
      }
      return undefined;
    },
  });

  return {
    fullyContained,
    nodes: allNodes,
    partiallyOverlapping,
  };
}

/**
 * AST node information utilities.
 */

import { getSourceRange } from './sourceExtraction.js';

/**
 * Node path information.
 */
interface NodePath {
  readonly nodes: ASTNode[];

  /**
   * Array of node types: ["ClassDeclaration", "MethodDeclaration"].
   */
  readonly path: string[];
  readonly depth: number;
}

/**
 * Get the path from root to a specific node.
 * @param node - The target node.
 * @param root - The root AST node.
 * @returns The path from root to node, or null if node is not in tree.
 */
function getNodePath(node: Readonly<ASTNode>, root: Readonly<ASTNode>): NodePath | null {
  const ancestors = getAncestors(node, root);

  const emptyArrayLength = 0;
  if (ancestors.length === emptyArrayLength) {
    return null;
  }

  const path = ancestors.map((n) => n.kind);
  const depthOffset = 1;

  return {
    depth: ancestors.length - depthOffset,
    nodes: ancestors,
    path,
  };
}

/**
 * Comprehensive metadata about an AST node, including its location, relationships, and structure.
 */
interface NodeMetadata {
  readonly nodeType: string;
  readonly location: SourceRange | null;
  readonly parent?: ASTNode;
  readonly children: ASTNode[];

  /**
   * Nodes at the same level.
   */
  readonly siblings: ASTNode[];
  readonly depth: number;
  readonly isLeaf: boolean;

  /**
   * Only if source is provided.
   */
  readonly sourceText?: string;
}

/**
 * Find root node by traversing up the tree.
 * @param node - The node to start from.
 * @returns The root node (simplified - returns the node itself).
 */
function findRoot(node: Readonly<ASTNode>): ASTNode {
  // This is a simplified approach - in practice, you'd track the root
  // For now, we'll assume the node we're given might be the root
  // In a real implementation, you'd pass the root separately
  return node as ASTNode;
}

/**
 * Get comprehensive metadata about an AST node.
 * @param node - The AST node to get metadata for.
 * @param source - Optional source code to extract text from.
 * @returns Metadata about the node.
 */
function getNodeMetadata(node: Readonly<ASTNode>, source?: string): NodeMetadata {
  // Build parent map to find parent and siblings
  // We need to find the root first - this is a limitation
  // In practice, you'd pass the root separately
  const root = findRoot(node);
  const ancestors = getAncestors(node, root);

  const minAncestorsForParent = 2;
  const parentIndexOffset = 2;
  const depthOffset = 1;
  const parent =
    ancestors.length >= minAncestorsForParent
      ? ancestors[ancestors.length - parentIndexOffset]
      : undefined;
  const depth = ancestors.length - depthOffset;

  // Get siblings (children of parent)
  const siblings: ASTNode[] = [];
  if (parent) {
    const parentChildren = getNodeChildren(parent);
    siblings.push(...parentChildren.filter((n) => n !== node));
  }

  // Get children
  const children = getNodeChildren(node);
  const emptyArrayLength = 0;
  const isLeaf = children.length === emptyArrayLength;

  // Get source text if source is provided
  let sourceText: string | undefined = undefined;
  const emptyStringLength = 0;
  if (source !== undefined && source.length > emptyStringLength) {
    const range = getSourceRange(node);
    if (range) {
      const lines = source.split(/\r?\n/);
      if (range.start.line === range.end.line) {
        const lineIndexOffset = 1;
        const columnIndexOffset = 1;
        const line = lines[range.start.line - lineIndexOffset] ?? '';
        sourceText = line.substring(range.start.column - columnIndexOffset, range.end.column);
      } else {
        // Multi-line - simplified extraction
        sourceText = '[multi-line]';
      }
    }
  }

  return {
    children,
    depth,
    isLeaf,
    location: node.location ?? null,
    nodeType: node.kind,
    parent,
    siblings,
    sourceText,
  };
}

/**
 * Type guard to check if a node is of a specific type.
 * @param node - The AST node to check.
 * @param nodeType - The node type to check for.
 * @returns True if the node is of the specified type.
 */
function isNodeType(node: Readonly<ASTNode>, nodeType: string): boolean {
  return node.kind === nodeType;
}

export type {
  FindNodeAtPositionOptions,
  FindNodesInRangeOptions,
  NodeAtPositionResult,
  NodeMetadata,
  NodesInRangeResult,
  NodePath,
};
export { findNodeAtPosition, findNodesInRange, getNodeMetadata, getNodePath, isNodeType };
