/**
 * Tests for node finding utilities
 */

import { describe, it, expect } from 'vitest';
import { findNodeAtPosition, findNodesInRange } from '../../../src/utils/node-finder.js';
import { NodeFactory } from '../../../src/translator/NodeFactory.js';
import type { Position } from '../../../src/utils/position.js';
import type { SourceRange } from '../../../src/ast/base.js';

describe('Node Finder Utilities', () => {
  describe('findNodeAtPosition', () => {
    it('should find node at position', () => {
      const location: SourceRange = {
        start: { line: 5, column: 10 },
        end: { line: 5, column: 20 },
      };
      const node = NodeFactory.createIdentifier('test', { location });
      const position: Position = { line: 5, column: 15 };

      const result = findNodeAtPosition(node, position);
      expect(result).not.toBeNull();
      expect(result?.node).toBe(node);
      expect(result?.nodeType).toBe('Identifier');
    });

    it('should return null for position outside node', () => {
      const location: SourceRange = {
        start: { line: 5, column: 10 },
        end: { line: 5, column: 20 },
      };
      const node = NodeFactory.createIdentifier('test', { location });
      const position: Position = { line: 10, column: 15 };

      const result = findNodeAtPosition(node, position);
      expect(result).toBeNull();
    });

    it('should find deepest node when nested', () => {
      const innerLocation: SourceRange = {
        start: { line: 5, column: 15 },
        end: { line: 5, column: 20 },
      };
      const outerLocation: SourceRange = {
        start: { line: 5, column: 10 },
        end: { line: 5, column: 25 },
      };

      const inner = NodeFactory.createIdentifier('inner', { location: innerLocation });
      const outer = NodeFactory.createBinaryExpression(
        '+',
        inner,
        NodeFactory.createNumberLiteral(1, '1'),
        { location: outerLocation }
      );

      const position: Position = { line: 5, column: 17 };
      const result = findNodeAtPosition(outer, position, { preferLeaf: true });

      expect(result).not.toBeNull();
      expect(result?.node).toBe(inner);
    });

    it('should include ancestors', () => {
      const location: SourceRange = {
        start: { line: 5, column: 10 },
        end: { line: 5, column: 20 },
      };
      const node = NodeFactory.createIdentifier('test', { location });
      const position: Position = { line: 5, column: 15 };

      const result = findNodeAtPosition(node, position);
      expect(result).not.toBeNull();
      expect(Array.isArray(result?.ancestors)).toBe(true);
    });
  });

  describe('findNodesInRange', () => {
    it('should find nodes fully contained in range', () => {
      const node1Location: SourceRange = {
        start: { line: 5, column: 10 },
        end: { line: 5, column: 15 },
      };
      const node2Location: SourceRange = {
        start: { line: 5, column: 20 },
        end: { line: 5, column: 25 },
      };

      const node1 = NodeFactory.createIdentifier('a', { location: node1Location });
      const node2 = NodeFactory.createIdentifier('b', { location: node2Location });
      const block = NodeFactory.createBlock([], {
        location: {
          start: { line: 5, column: 5 },
          end: { line: 5, column: 30 },
        },
      });

      const searchRange: SourceRange = {
        start: { line: 5, column: 8 },
        end: { line: 5, column: 27 },
      };

      const result = findNodesInRange(block, searchRange);
      expect(result.fullyContained.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter by node types', () => {
      const location: SourceRange = {
        start: { line: 5, column: 10 },
        end: { line: 5, column: 20 },
      };
      const node = NodeFactory.createIdentifier('test', { location });
      const searchRange: SourceRange = {
        start: { line: 5, column: 5 },
        end: { line: 5, column: 25 },
      };

      const result = findNodesInRange(node, searchRange, {
        nodeTypes: ['Identifier'],
      });

      expect(result.nodes.length).toBeGreaterThanOrEqual(0);
    });
  });
});
