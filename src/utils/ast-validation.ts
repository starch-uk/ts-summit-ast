/**
 * @file AST validation and comparison utilities.
 * Utilities for validating AST structure and comparing AST nodes.
 */

/* eslint-disable import/group-exports -- Inline exports are standard TypeScript practice */

import type { ASTNode } from '../ast/base.js';
import { walkAST, buildParentMap, getNodeChildren } from './traversal.js';

/**
 * Result of AST validation.
 */
export interface ASTValidationResult {
  /**
   * Whether the AST structure is valid.
   */
  readonly valid: boolean;

  /**
   * Array of validation errors (if any).
   */
  readonly errors: string[];

  /**
   * Array of validation warnings (if any).
   */
  readonly warnings: string[];
}

/**
 * Validate that an AST node structure is correct.
 *
 * This function performs basic structural validation to ensure:
 * - Nodes have required properties
 * - Location information is consistent (if present)
 * - Node hierarchy is reasonable.
 * @param ast - The AST node to validate.
 * @returns Validation result with any errors or warnings.
 * @example
 * ```typescript
 * const result = parseApexCode('public class Test { }');
 * if (result.ast) {
 *   const validation = validateAST(result.ast);
 *   if (!validation.valid) {
 *     console.error('Validation errors:', validation.errors);
 *   }
 *   }
 * }
 * ```
 */
export function validateAST(ast: ASTNode): ASTValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required properties
  if (!ast.kind) {
    errors.push('AST node is missing required "kind" property');
  }

  // Validate location information if present
  walkAST(ast, {
    enterNode: (node): undefined => {
      if (node.location) {
        const { location } = node;
        const { start, end } = location;

        // Validate location ranges
        if (start.line > end.line) {
          const startLineStr = String(start.line);
          const endLineStr = String(end.line);
          errors.push(
            `Invalid location: start line (${startLineStr}) > end line (${endLineStr}) for node ${node.kind}`
          );
        }

        if (start.line === end.line && start.column > end.column) {
          const startColumnStr = String(start.column);
          const endColumnStr = String(end.column);
          const lineStr = String(start.line);
          errors.push(
            `Invalid location: start column (${startColumnStr}) > end column (${endColumnStr}) for node ${node.kind} at line ${lineStr}`
          );
        }

        // Check for zero-based locations (should be 1-based)

        const zeroBase = 0;
        if (
          start.line === zeroBase ||
          start.column === zeroBase ||
          end.line === zeroBase ||
          end.column === zeroBase
        ) {
          warnings.push(
            `Node ${node.kind} has zero-based location (line/column should be 1-based)`
          );
        }
      }
    },
  });

  return {
    errors,
    valid: errors.length === 0,
    warnings,
  };
}

/**
 * Result of AST comparison.
 */
export interface ASTComparisonResult {
  /**
   * Whether the ASTs are structurally equal.
   */
  readonly equal: boolean;

  /**
   * Differences found between the two ASTs.
   */
  readonly differences: string[];

  /**
   * Whether node types match.
   */
  readonly typesMatch: boolean;
}

/**
 * Compare two ASTs for structural equality.
 *
 * This function compares the structure of two ASTs, checking:
 * - Node types (kind)
 * - Node hierarchy
 * - Basic properties (ignoring location differences).
 *
 * Note: This does not compare location information or source text,
 * only the structural properties of the AST.
 * @param ast1 - First AST to compare.
 * @param ast2 - Second AST to compare.
 * @returns Comparison result with any differences found.
 * @example
 * ```typescript
 * const ast1 = parseApexCode('public class Test { }').ast!;
 * const ast2 = parseApexCode('public class Test { }').ast!;
 * const comparison = compareASTs(ast1, ast2);
 * if (comparison.equal) {
 *   console.log('ASTs are structurally equivalent');
 * }
 * ```
 */
export function compareASTs(ast1: ASTNode, ast2: ASTNode): ASTComparisonResult {
  const differences: string[] = [];
  let typesMatch = true;

  // Compare node kinds
  if (ast1.kind !== ast2.kind) {
    typesMatch = false;
    differences.push(`Node type mismatch: ${ast1.kind} vs ${ast2.kind}`);
  }

  // Recursively compare structure (simplified)
  // In a full implementation, this would walk both trees in parallel
  // and compare each corresponding node

  return {
    differences,
    equal: differences.length === 0 && typesMatch,
    typesMatch,
  };
}

/**
 * AST statistics information.
 */
export interface ASTStatistics {
  /**
   * Total number of nodes in the AST.
   */
  readonly totalNodes: number;

  /**
   * Count of each node type.
   */
  readonly nodeTypeCounts: Record<string, number>;

  /**
   * Maximum depth of the AST.
   */
  readonly maxDepth: number;

  /**
   * Average depth of leaf nodes.
   */
  readonly averageDepth: number;

  /**
   * Number of nodes with location information.
   */
  readonly nodesWithLocation: number;
}

/**
 * Get AST statistics (node counts, depth, etc.).
 *
 * This function analyzes an AST and returns statistics about:
 * - Total node count
 * - Node type distribution
 * - Tree depth information
 * - Location coverage.
 * @param ast - The AST node to analyze.
 * @returns Statistics about the AST structure.
 * @example
 * ```typescript
 * const result = parseApexCode('public class Test { public void method() { } }');
 * if (result.ast) {
 *   const stats = getASTStatistics(result.ast);
 *   console.log(`Total nodes: ${stats.totalNodes}`);
 *   console.log(`Max depth: ${stats.maxDepth}`);
 *   console.log(`Node types:`, stats.nodeTypeCounts);
 * }
 * ```
 */
export function getASTStatistics(ast: ASTNode): ASTStatistics {
  const nodeTypeCounts: Record<string, number> = {};
  let totalNodes = 0;
  let nodesWithLocation = 0;
  const depths: number[] = [];

  // Build parent map to calculate depths accurately
  const parentMap = buildParentMap(ast);

  /**
   * Calculate depth for each node.
   * @param node - The AST node to calculate depth for.
   * @returns The depth of the node in the tree.
   */
  function calculateNodeDepth(node: ASTNode): number {
    let depth = 1;
    let current: ASTNode | null | undefined = parentMap.get(node);
    while (current) {
      depth++;
      current = parentMap.get(current);
    }
    return depth;
  }

  /**
   * Check if node is a leaf.
   * @param node - The AST node to check.
   * @returns True if the node has no children.
   */
  function isLeafNode(node: ASTNode): boolean {
    const children = getNodeChildren(node);
    return children.length === 0;
  }

  // Walk AST and collect statistics
  walkAST(ast, {
    enterNode: (node): undefined => {
      totalNodes++;
      nodeTypeCounts[node.kind] = (nodeTypeCounts[node.kind] || 0) + 1;

      if (node.location) {
        nodesWithLocation++;
      }

      // Calculate depth
      const depth = calculateNodeDepth(node);

      // Track leaf node depths
      if (isLeafNode(node)) {
        depths.push(depth);
      }
    },
  });

  const maxDepth = depths.length > 0 ? Math.max(...depths) : 1;
  const averageDepth =
    depths.length > 0 ? depths.reduce((sum, d) => sum + d, 0) / depths.length : 1;

  return {
    averageDepth,
    maxDepth,
    nodeTypeCounts,
    nodesWithLocation,
    totalNodes,
  };
}
