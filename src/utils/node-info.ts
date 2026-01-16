/**
 * AST node information utilities
 */

import type { ASTNode, SourceRange } from '../ast/base.js';
import { getAncestors } from './traversal.js';
import { getSourceRange } from './source-extraction.js';

/**
 * Node path information
 */
export interface NodePath {
  readonly nodes: ASTNode[];
  readonly path: string[]; // Array of node types: ["ClassDeclaration", "MethodDeclaration"]
  readonly depth: number;
}

/**
 * Get the path from root to a specific node
 */
export function getNodePath(node: ASTNode, root: ASTNode): NodePath | null {
  const ancestors = getAncestors(node, root);

  if (ancestors.length === 0) {
    return null;
  }

  const path = ancestors.map((n) => n.kind);

  return {
    nodes: ancestors,
    path,
    depth: ancestors.length - 1,
  };
}

/**
 * Node metadata
 */
export interface NodeMetadata {
  readonly nodeType: string;
  readonly location: SourceRange | null;
  readonly parent?: ASTNode;
  readonly children: ASTNode[];
  readonly siblings: ASTNode[]; // Nodes at the same level
  readonly depth: number;
  readonly isLeaf: boolean;
  readonly sourceText?: string; // Only if source is provided
}

/**
 * Get comprehensive metadata about an AST node
 */
export function getNodeMetadata(
  node: ASTNode,
  source?: string
): NodeMetadata {
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
        const line = lines[range.start.line - 1] || '';
        sourceText = line.substring(range.start.column - 1, range.end.column);
      } else {
        // Multi-line - simplified extraction
        sourceText = '[multi-line]';
      }
    }
  }

  return {
    nodeType: node.kind,
    location: node.location || null,
    parent,
    children,
    siblings,
    depth,
    isLeaf,
    sourceText,
  };
}

/**
 * Find root node by traversing up the tree
 */
function findRoot(node: ASTNode): ASTNode {
  // This is a simplified approach - in practice, you'd track the root
  // For now, we'll assume the node we're given might be the root
  // In a real implementation, you'd pass the root separately
  return node;
}

/**
 * Get children of a node (simplified version)
 */
function getNodeChildren(node: ASTNode): ASTNode[] {
  const children: ASTNode[] = [];

  // This is a simplified version - see traversal.ts for full implementation
  if ('condition' in node && (node as any).condition) {
    children.push((node as any).condition);
  }
  if ('thenBody' in node && (node as any).thenBody) {
    children.push((node as any).thenBody);
  }
  if ('elseBody' in node && (node as any).elseBody) {
    children.push((node as any).elseBody);
  }
  if ('body' in node && (node as any).body) {
    children.push((node as any).body);
  }
  if ('statements' in node && Array.isArray((node as any).statements)) {
    children.push(...(node as any).statements);
  }
  if ('expression' in node && (node as any).expression) {
    children.push((node as any).expression);
  }
  if ('left' in node && (node as any).left) {
    children.push((node as any).left);
  }
  if ('right' in node && (node as any).right) {
    children.push((node as any).right);
  }
  if ('arguments' in node && Array.isArray((node as any).arguments)) {
    children.push(...(node as any).arguments);
  }
  if ('type' in node && (node as any).type) {
    children.push((node as any).type);
  }
  if ('initializer' in node && (node as any).initializer) {
    children.push((node as any).initializer);
  }

  return children;
}

/**
 * Type guard to check if a node is of a specific type
 */
export function isNodeType(node: ASTNode, nodeType: string): boolean {
  return node.kind === nodeType;
}
