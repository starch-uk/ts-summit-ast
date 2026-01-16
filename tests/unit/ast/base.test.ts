/**
 * Tests for base AST types
 */

import { describe, it, expect } from 'vitest';
import type { ASTNode, SourceLocation, SourceRange } from '../../../src/ast/base.js';

describe('AST Base Types', () => {
  describe('SourceLocation', () => {
    it('should have line and column properties', () => {
      const location: SourceLocation = {
        line: 10,
        column: 5,
      };

      expect(location.line).toBe(10);
      expect(location.column).toBe(5);
    });

    it('should optionally have offset', () => {
      const location: SourceLocation = {
        line: 10,
        column: 5,
        offset: 150,
      };

      expect(location.offset).toBe(150);
    });
  });

  describe('SourceRange', () => {
    it('should have start and end locations', () => {
      const range: SourceRange = {
        start: { line: 1, column: 1 },
        end: { line: 1, column: 10 },
      };

      expect(range.start.line).toBe(1);
      expect(range.end.line).toBe(1);
    });
  });

  describe('ASTNode', () => {
    it('should have a kind property', () => {
      const node: ASTNode = {
        kind: 'TestNode',
      };

      expect(node.kind).toBe('TestNode');
    });

    it('should optionally have location', () => {
      const node: ASTNode = {
        kind: 'TestNode',
        location: {
          start: { line: 1, column: 1 },
          end: { line: 1, column: 10 },
        },
      };

      expect(node.location).toBeDefined();
      expect(node.location?.start.line).toBe(1);
    });
  });
});
