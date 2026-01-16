/**
 * Tests for node information utilities
 */

import { describe, it, expect } from 'vitest';
import { getNodePath, getNodeMetadata, isNodeType } from '../../../src/utils/node-info.js';
import { NodeFactory } from '../../../src/translator/NodeFactory.js';

describe('Node Information Utilities', () => {
  describe('getNodePath', () => {
    it('should return path from root to node', () => {
      const inner = NodeFactory.createIdentifier('inner');
      const outer = NodeFactory.createBinaryExpression(
        '+',
        inner,
        NodeFactory.createNumberLiteral(1, '1')
      );

      const path = getNodePath(inner, outer);
      expect(path).not.toBeNull();
      expect(path?.path.length).toBeGreaterThan(0);
      expect(path?.depth).toBeGreaterThan(0);
    });
  });

  describe('getNodeMetadata', () => {
    it('should return metadata for node', () => {
      const node = NodeFactory.createIdentifier('test');
      const metadata = getNodeMetadata(node);

      expect(metadata.nodeType).toBe('Identifier');
      expect(metadata.isLeaf).toBe(true);
    });

    it('should include source text when provided', () => {
      const location = {
        start: { line: 1, column: 1 },
        end: { line: 1, column: 5 },
      };
      const node = NodeFactory.createIdentifier('test', { location });
      const source = 'test';

      const metadata = getNodeMetadata(node, source);
      expect(metadata.sourceText).toBeDefined();
    });

    it('should identify leaf nodes', () => {
      const leaf = NodeFactory.createIdentifier('test');
      const metadata = getNodeMetadata(leaf);
      expect(metadata.isLeaf).toBe(true);
    });

    it('should identify non-leaf nodes', () => {
      const node = NodeFactory.createBinaryExpression(
        '+',
        NodeFactory.createNumberLiteral(1, '1'),
        NodeFactory.createNumberLiteral(2, '2')
      );
      const metadata = getNodeMetadata(node);
      expect(metadata.isLeaf).toBe(false);
      expect(metadata.children.length).toBeGreaterThan(0);
    });
  });

  describe('isNodeType', () => {
    it('should return true for matching type', () => {
      const node = NodeFactory.createIdentifier('test');
      expect(isNodeType(node, 'Identifier')).toBe(true);
    });

    it('should return false for non-matching type', () => {
      const node = NodeFactory.createIdentifier('test');
      expect(isNodeType(node, 'BinaryExpression')).toBe(false);
    });
  });
});
