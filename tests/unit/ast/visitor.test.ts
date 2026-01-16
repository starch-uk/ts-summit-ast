/**
 * Tests for visitor pattern
 */

import { describe, it, expect } from 'vitest';
import { DefaultVisitor, ASTVisitor } from '../../../src/ast/visitor.js';
import { NodeFactory } from '../../../src/translator/NodeFactory.js';
import type { ASTNode } from '../../../src/ast/base.js';

describe('Visitor Pattern', () => {
  describe('DefaultVisitor', () => {
    it('should visit nodes', () => {
      const visitor = new DefaultVisitor();
      const node: ASTNode = {
        kind: 'Identifier',
        name: 'test',
      };

      // Should not throw
      expect(() => visitor.visit(node)).not.toThrow();
    });

    it('should visit children', () => {
      const visitor = new DefaultVisitor();
      const node: ASTNode = {
        kind: 'Block',
        statements: [
          NodeFactory.createReturnStatement(),
          NodeFactory.createReturnStatement(),
        ],
      };

      const result = visitor.visitChildren(node);
      expect(result).toEqual([]);
    });

    it('should handle nodes without children', () => {
      const visitor = new DefaultVisitor();
      const node: ASTNode = {
        kind: 'Identifier',
        name: 'test',
      };

      const result = visitor.visitChildren(node);
      expect(result).toEqual([]);
    });
  });

  describe('Custom Visitor', () => {
    it('should allow custom visit logic', () => {
      const visitedKinds: string[] = [];

      class CustomVisitor extends DefaultVisitor {
        override visit(node: ASTNode): void {
          visitedKinds.push(node.kind);
          super.visit(node);
        }
      }

      const visitor = new CustomVisitor();
      const ifStmt = NodeFactory.createIfStatement(
        NodeFactory.createBooleanLiteral(true),
        NodeFactory.createReturnStatement()
      );

      visitor.visit(ifStmt);
      expect(visitedKinds).toContain('IfStatement');
    });

    it('should traverse nested structures', () => {
      const visitedKinds: string[] = [];

      class CountingVisitor extends DefaultVisitor {
        override visit(node: ASTNode): void {
          visitedKinds.push(node.kind);
          // Visit children after recording this node
          this.visitChildren(node);
        }

        override visitChildren(node: ASTNode): void[] {
          if ('condition' in node && node.condition) {
            this.visit(node.condition as ASTNode);
          }
          if ('thenBody' in node && node.thenBody) {
            this.visit(node.thenBody as ASTNode);
          }
          if ('elseBody' in node && node.elseBody) {
            this.visit(node.elseBody as ASTNode);
          }
          if ('expression' in node && node.expression) {
            this.visit(node.expression as ASTNode);
          }
          return [];
        }
      }

      const visitor = new CountingVisitor();
      const ifStmt = NodeFactory.createIfStatement(
        NodeFactory.createBooleanLiteral(true),
        NodeFactory.createReturnStatement(
          NodeFactory.createStringLiteral('result', '"result"')
        )
      );

      visitor.visit(ifStmt);
      expect(visitedKinds.length).toBeGreaterThan(1);
      expect(visitedKinds).toContain('IfStatement');
      expect(visitedKinds).toContain('BooleanLiteral');
      expect(visitedKinds).toContain('ReturnStatement');
    });
  });

  describe('Visitor Interface', () => {
    it('should implement ASTVisitor interface', () => {
      const visitor: ASTVisitor<string> = {
        visit: (node: ASTNode) => node.kind,
        visitChildren: (node: ASTNode) => {
          return [];
        },
      };

      const node = NodeFactory.createIdentifier('test');
      const result = visitor.visit(node);
      expect(result).toBe('Identifier');
    });
  });
});
