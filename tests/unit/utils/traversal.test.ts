/**
 * Tests for AST traversal utilities
 */

import { describe, it, expect } from 'vitest';
import { walkAST, getAncestors, buildParentMap } from '../../../src/utils/traversal.js';
import { NodeFactory } from '../../../src/translator/NodeFactory.js';
import type { ASTVisitor } from '../../../src/utils/traversal.js';

describe('AST Traversal Utilities', () => {
  describe('walkAST', () => {
    it('should visit all nodes', () => {
      const visited: string[] = [];
      const visitor: ASTVisitor = {
        enterNode: (node) => {
          visited.push(node.kind);
        },
      };

      const ast = NodeFactory.createIfStatement(
        NodeFactory.createBooleanLiteral(true),
        NodeFactory.createReturnStatement()
      );

      walkAST(ast, visitor);
      expect(visited.length).toBeGreaterThan(0);
      expect(visited).toContain('IfStatement');
    });

    it('should call exitNode', () => {
      const entered: string[] = [];
      const exited: string[] = [];
      const visitor: ASTVisitor = {
        enterNode: (node) => {
          entered.push(node.kind);
        },
        exitNode: (node) => {
          exited.push(node.kind);
        },
      };

      const ast = NodeFactory.createIdentifier('test');
      walkAST(ast, visitor);

      expect(entered.length).toBe(exited.length);
    });

    it('should skip children when enterNode returns false', () => {
      const visited: string[] = [];
      const visitor: ASTVisitor = {
        enterNode: (node) => {
          visited.push(node.kind);
          if (node.kind === 'IfStatement') {
            return false; // Skip children
          }
        },
      };

      const ast = NodeFactory.createIfStatement(
        NodeFactory.createBooleanLiteral(true),
        NodeFactory.createReturnStatement()
      );

      walkAST(ast, visitor);
      // Should only visit IfStatement, not its children
      expect(visited).toEqual(['IfStatement']);
    });
  });

  describe('getAncestors', () => {
    it('should return ancestors from root to node', () => {
      const inner = NodeFactory.createIdentifier('inner');
      const outer = NodeFactory.createBinaryExpression(
        '+',
        inner,
        NodeFactory.createNumberLiteral(1, '1')
      );

      const ancestors = getAncestors(inner, outer);
      expect(ancestors.length).toBeGreaterThan(0);
      expect(ancestors[ancestors.length - 1]).toBe(inner);
    });
  });

  describe('buildParentMap', () => {
    it('should build parent map', () => {
      const child = NodeFactory.createIdentifier('child');
      const parent = NodeFactory.createBinaryExpression(
        '+',
        child,
        NodeFactory.createNumberLiteral(1, '1')
      );

      const parentMap = buildParentMap(parent);
      expect(parentMap.get(child)).toBe(parent);
      expect(parentMap.get(parent)).toBeNull();
    });
  });
});
