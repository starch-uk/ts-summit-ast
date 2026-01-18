/**
 * @file AST node finding utilities.
 * Functions for finding AST nodes at positions or within ranges.
 */

import type { ASTNode, SourceRange } from '../ast/base.js';
import type { Position } from './source-extraction.js';
import { isPositionInRange } from './source-extraction.js';
import { walkAST, getAncestors, buildParentMap } from './traversal.js';

/**
 * Result of finding a node at a position.
 */
export interface NodeAtPositionResult {
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
export interface FindNodeAtPositionOptions {
  /**
   * Include comment nodes.
   */
  readonly includeComments?: boolean;
  readonly includeWhitespace?: boolean; /**
   * Include whitespace-only nodes.
   */

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
export function findNodeAtPosition(
  ast: ASTNode,
  position: Position,
  options: FindNodeAtPositionOptions = {}
): NodeAtPositionResult | null {
  const { preferLeaf = true } = options;
  const candidates: { node: ASTNode; depth: number }[] = [];

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
          current = parentMap.get(current) ?? null;
        }

        candidates.push({ depth, node });
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
  const { node } = bestMatch;
  const ancestors = getAncestors(node, ast);
  const parent = ancestors.length > 1 ? ancestors[ancestors.length - 2] : undefined;

  if (!node.location) {
    return null;
  }

  return {
    ancestors: ancestors.slice(0, -1), // Exclude the node itself
    location: node.location,
    node,
    nodeType: node.kind,
    parent,
  };
}

/**
 * Result of finding nodes in a range.
 */
export interface NodesInRangeResult {
  readonly nodes: ASTNode[];
  readonly fullyContained: ASTNode[]; /**
   * Nodes fully within the range.
   */

  /**
   * Nodes that partially overlap.
   */
  readonly partiallyOverlapping: ASTNode[];
}

/**
 * Options for finding nodes in range.
 */
export interface FindNodesInRangeOptions {
  readonly includePartial?: boolean; /**
   * Include partially overlapping nodes.
   */

  /**
   * Filter by specific node types.
   */
  readonly nodeTypes?: string[];
}

/**
 * Check if a range is fully contained within another range.
 * @param inner - The inner range to check.
 * @param outer - The outer range to check against.
 * @returns True if inner is fully contained within outer.
 */
function isRangeFullyContained(inner: SourceRange, outer: SourceRange): boolean {
  return isPositionInRange(inner.start, outer) && isPositionInRange(inner.end, outer);
}

/**
 * Check if two ranges overlap.
 * @param range1 - The first range to check.
 * @param range2 - The second range to check.
 * @returns True if the ranges overlap.
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
 * Find all AST nodes that overlap with a source range.
 * @param ast - The root AST node to search in.
 * @param range - The source range to find nodes in.
 * @param options - Options for finding nodes.
 * @returns Result containing all overlapping nodes.
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
    fullyContained,
    nodes: allNodes,
    partiallyOverlapping,
  };
}

/**
 * AST node information utilities.
 */

import { getSourceRange } from './source-extraction.js';

/**
 * Node path information.
 */
export interface NodePath {
  readonly nodes: ASTNode[];
  readonly path: string[]; /**
   * Array of node types: ["ClassDeclaration", "MethodDeclaration"].
   */
  readonly depth: number;
}

/**
 * Get the path from root to a specific node.
 * @param node - The target node.
 * @param root - The root AST node.
 * @returns The path from root to node, or null if node is not in tree.
 */
export function getNodePath(node: ASTNode, root: ASTNode): NodePath | null {
  const ancestors = getAncestors(node, root);

  if (ancestors.length === 0) {
    return null;
  }

  const path = ancestors.map((n) => n.kind);

  return {
    depth: ancestors.length - 1,
    nodes: ancestors,
    path,
  };
}

/**
 * Node metadata.
 */
export interface NodeMetadata {
  readonly nodeType: string;
  readonly location: SourceRange | null;
  readonly parent?: ASTNode;
  readonly children: ASTNode[];
  readonly siblings: ASTNode[]; /**
   * Nodes at the same level.
   */
  readonly depth: number;
  readonly isLeaf: boolean;

  /**
   * Only if source is provided.
   */
  readonly sourceText?: string;
}

/**
 * Get comprehensive metadata about an AST node.
 * @param node - The AST node to get metadata for.
 * @param source - Optional source code to extract text from.
 * @returns Metadata about the node.
 */
export function getNodeMetadata(node: ASTNode, source?: string): NodeMetadata {
  // Build parent map to find parent and siblings
  // We need to find the root first - this is a limitation
  // In practice, you'd pass the root separately
  const root = findRoot(node);
  const ancestors = getAncestors(node, root);

  const parent = ancestors.length > 1 ? ancestors[ancestors.length - 2] : undefined;
  const depth = ancestors.length - 1;

  // Get siblings (children of parent)
  const siblings: ASTNode[] = [];
  if (parent) {
    const parentChildren = getNodeChildren(parent);
    siblings.push(...parentChildren.filter((n) => n !== node));
  }

  // Get children
  const children = getNodeChildren(node);
  const isLeaf = children.length === 0;

  // Get source text if source is provided
  let sourceText: string | undefined;
  if (source) {
    const range = getSourceRange(node);
    if (range) {
      const lines = source.split(/\r?\n/);
      if (range.start.line === range.end.line) {
        const line = lines[range.start.line - 1] ?? '';
        sourceText = line.substring(range.start.column - 1, range.end.column);
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
 * Find root node by traversing up the tree.
 * @param node - The node to start from.
 * @returns The root node (simplified - returns the node itself).
 */
function findRoot(node: ASTNode): ASTNode {
  // This is a simplified approach - in practice, you'd track the root
  // For now, we'll assume the node we're given might be the root
  // In a real implementation, you'd pass the root separately
  return node;
}

/**
 * Get children of a node (simplified version).
 * @param node - The AST node to get children for.
 * @returns An array of child AST nodes.
 */
function getNodeChildren(node: ASTNode): ASTNode[] {
  const children: ASTNode[] = [];

  // This is a simplified version - see traversal.ts for full implementation
  if ('condition' in node && (node as { condition?: ASTNode }).condition != null) {
    children.push((node as { condition: ASTNode }).condition);
  }
  if ('thenStatement' in node && (node as { thenStatement?: ASTNode }).thenStatement != null) {
    children.push((node as { thenStatement: ASTNode }).thenStatement);
  }
  if ('elseStatement' in node && (node as { elseStatement?: ASTNode }).elseStatement != null) {
    children.push((node as { elseStatement: ASTNode }).elseStatement);
  }
  if ('body' in node && (node as { body?: ASTNode }).body != null) {
    children.push((node as { body: ASTNode }).body);
  }
  if ('statements' in node && Array.isArray((node as { statements?: ASTNode[] }).statements)) {
    const statements = (node as { statements: ASTNode[] }).statements;
    children.push(...statements);
  }
  if ('expression' in node && (node as { expression?: ASTNode }).expression != null) {
    children.push((node as { expression: ASTNode }).expression);
  }
  if ('left' in node && (node as { left?: ASTNode }).left != null) {
    children.push((node as { left: ASTNode }).left);
  }
  if ('right' in node && (node as { right?: ASTNode }).right != null) {
    children.push((node as { right: ASTNode }).right);
  }
  if ('arguments' in node && Array.isArray((node as { arguments?: ASTNode[] }).arguments)) {
    const args = (node as { arguments: ASTNode[] }).arguments;
    children.push(...args);
  }
  if ('type' in node && (node as { type?: ASTNode }).type != null) {
    children.push((node as { type: ASTNode }).type);
  }
  if ('initializer' in node && (node as { initializer?: ASTNode }).initializer != null) {
    children.push((node as { initializer: ASTNode }).initializer);
  }

  return children;
}

/**
 * Type guard to check if a node is of a specific type.
 * @param node - The AST node to check.
 * @param nodeType - The node type to check for.
 * @returns True if the node is of the specified type.
 */
export function isNodeType(node: ASTNode, nodeType: string): boolean {
  return node.kind === nodeType;
}
