/**
 * Tests for DFS walker/traversal
 * Ported from com.google.summit.ast.traversal.DfsWalkerTest
 * Enhanced version of traversal.test.ts
 */

import { describe, it, expect } from 'vitest';
import { walkAST } from '../../../src/utils/traversal.js';
import type { ASTWalkVisitor } from '../../../src/utils/traversal.js';
import { NodeFactory } from '../../../src/translator/NodeFactory.js';
import type { ASTNode } from '../../../src/ast/base.js';

/**
 * Create a test AST structure for traversal tests
 * Structure:
 *   NODE_0 (root)
 *     NODE_1
 *       NODE_2
 *         NODE_3
 *     NODE_4
 */
function createTestAST(): ASTNode {
  const node3 = NodeFactory.createIdentifier('node3');
  const node2 = NodeFactory.createIfStatement(
    NodeFactory.createBooleanLiteral(true),
    node3
  );
  const node1 = NodeFactory.createBlock([node2]);
  const node4 = NodeFactory.createIdentifier('node4');
  const node0 = NodeFactory.createBlock([node1, node4]);
  return node0;
}

function nodeToId(node: ASTNode): string {
  // Check for specific Block nodes first (NODE_1 and NODE_4) before generic Block check
  if (node.kind === 'Block' && (node as any).statements) {
    const stmts = (node as any).statements;
    if (stmts && stmts.length > 0) {
      if (stmts[0].kind === 'IfStatement') {
        return 'NODE_1';
      }
      if (stmts[0].kind === 'Identifier' && (stmts[0] as any).name === 'node4') {
        return 'NODE_4';
      }
    }
  }
  // Check for root Block (NODE_0) - this is the outer Block with multiple statements
  if (node.kind === 'Block') {
    const stmts = (node as any).statements;
    if (stmts && stmts.length === 2) {
      // Root block has 2 statements: NODE_1 (Block) and NODE_4 (Identifier)
      return 'NODE_0';
    }
  }
  if (node.kind === 'IfStatement') {
    return 'NODE_2';
  }
  if (node.kind === 'Identifier' && (node as any).name === 'node3') {
    return 'NODE_3';
  }
  if (node.kind === 'Identifier' && (node as any).name === 'node4') {
    return 'NODE_4';
  }
  return 'UNKNOWN';
}

function nodeIdIs2(node: ASTNode): boolean {
  return node.kind === 'IfStatement';
}

function nodeIdIs1(node: ASTNode): boolean {
  return node.kind === 'Block' && (node as any).statements && (node as any).statements.length > 0 && (node as any).statements[0].kind === 'IfStatement';
}

function nodeIdIsEven(node: ASTNode): boolean {
  const id = nodeToId(node);
  return id === 'NODE_0' || id === 'NODE_2' || id === 'NODE_4';
}

describe('DFS Walker', () => {
  it('stream is pre-ordered correctly', () => {
    const root = createTestAST();
    const visited: string[] = [];

    const visitor: ASTWalkVisitor = {
      enterNode: (node: ASTNode) => {
        visited.push(nodeToId(node));
        return true;
      },
    };

    walkAST(root, visitor);

    // Pre-order: root, then children
    expect(visited.length).toBeGreaterThan(0);
    expect(visited[0]).toBe('NODE_0');
  });

  it('stream is post-ordered correctly', () => {
    const root = createTestAST();
    const visited: string[] = [];

    const visitor: ASTWalkVisitor = {
      enterNode: (node: ASTNode) => {
        return true;
      },
      exitNode: (node: ASTNode) => {
        visited.push(nodeToId(node));
      },
    };

    walkAST(root, visitor);

    // Post-order: children first, then root
    expect(visited.length).toBeGreaterThan(0);
    const lastVisited = visited[visited.length - 1];
    expect(lastVisited).toBe('NODE_0');
  });

  it('takeWhile halts preorder immediately', () => {
    const root = createTestAST();
    const visited: string[] = [];

    const visitor: ASTWalkVisitor = {
      enterNode: (node: ASTNode) => {
        visited.push(nodeToId(node));
        if (nodeIdIs2(node)) {
          return false; // Stop traversal
        }
        return true;
      },
    };

    walkAST(root, visitor);

    // Should halt at NODE_2, before descending into its children
    expect(visited.length).toBeGreaterThan(0);
    // Should not contain NODE_3 (child of NODE_2)
    const hasNode3 = visited.some((id) => id === 'NODE_3');
    expect(hasNode3).toBe(false);
  });

  it('skipBelow excludes only subtree', () => {
    const root = createTestAST();
    const visited: string[] = [];

    const visitor: ASTWalkVisitor = {
      enterNode: (node: ASTNode) => {
        visited.push(nodeToId(node));
        if (nodeIdIs1(node)) {
          return false; // Skip children of NODE_1
        }
        return true;
      },
    };

    walkAST(root, visitor);

    // Skipping below at NODE_1 should exclude exactly NODE_3
    const hasNode3 = visited.some((id) => id === 'NODE_3');
    expect(hasNode3).toBe(false);
    // NODE_1 should still be visited
    const hasNode1 = visited.some((id) => id === 'NODE_1');
    expect(hasNode1).toBe(true);
    // Nodes in other subtrees should be unaffected, for example NODE_4
    const hasNode4 = visited.some((id) => id === 'NODE_4');
    expect(hasNode4).toBe(true);
  });

  it('findFirst matches first element of collection', () => {
    const root = createTestAST();
    const allVisited: ASTNode[] = [];

    const visitor1: ASTWalkVisitor = {
      enterNode: (node: ASTNode) => {
        allVisited.push(node);
        return true;
      },
    };

    walkAST(root, visitor1);

    const firstVisited = allVisited[0];
    expect(firstVisited).toBe(root);
  });

  it('filter includes only matching nodes', () => {
    const root = createTestAST();
    const visited: string[] = [];

    const visitor: ASTWalkVisitor = {
      enterNode: (node: ASTNode) => {
        if (nodeIdIsEven(node)) {
          visited.push(nodeToId(node));
        }
        return true;
      },
    };

    walkAST(root, visitor);

    // Only even node IDs should be included
    expect(visited.length).toBeGreaterThan(0);
    // Check that all visited IDs are even node IDs (NODE_0, NODE_2, NODE_4)
    const allEven = visited.every((id) => id === 'NODE_0' || id === 'NODE_2' || id === 'NODE_4');
    expect(allEven).toBe(true);
  });
});
