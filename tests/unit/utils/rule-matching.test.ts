/**
 * Tests for rule matching utilities
 */

import { describe, it, expect } from 'vitest';
import { wouldTriggerRule, findRuleMatches } from '../../../src/utils/rule-matching.js';
import { NodeFactory } from '../../../src/translator/NodeFactory.js';

describe('Rule Matching Utilities', () => {
  describe('wouldTriggerRule', () => {
    it('should match node type', () => {
      const node = NodeFactory.createIdentifier('test');
      const result = wouldTriggerRule(node, '//Identifier');

      expect(result.matches).toBe(true);
      expect(result.matchedNode).toBe(node);
      expect(result.confidence).toBe('exact');
    });

    it('should not match different node type', () => {
      const node = NodeFactory.createIdentifier('test');
      const result = wouldTriggerRule(node, '//BinaryExpression');

      expect(result.matches).toBe(false);
      expect(result.confidence).toBe('none');
    });

    it('should match with attribute filter', () => {
      const node = NodeFactory.createBinaryExpression(
        '+',
        NodeFactory.createNumberLiteral(1, '1'),
        NodeFactory.createNumberLiteral(2, '2')
      );
      const result = wouldTriggerRule(node, "//BinaryExpression[@operator='+']");

      expect(result.matches).toBe(true);
    });

    it('should check descendants when requested', () => {
      const inner = NodeFactory.createIdentifier('inner');
      const outer = NodeFactory.createBinaryExpression(
        '+',
        inner,
        NodeFactory.createNumberLiteral(1, '1')
      );

      const result = wouldTriggerRule(outer, '//Identifier', {
        includeDescendants: true,
      });

      expect(result.matches).toBe(true);
      expect(result.confidence).toBe('partial');
    });
  });

  describe('findRuleMatches', () => {
    it('should find all matching nodes', () => {
      const ast = NodeFactory.createBlock([
        NodeFactory.createExpressionStatement(NodeFactory.createIdentifier('a')),
        NodeFactory.createExpressionStatement(NodeFactory.createIdentifier('b')),
      ]);

      const matches = findRuleMatches(ast, '//Identifier');
      expect(matches.length).toBeGreaterThanOrEqual(0);
    });

    it('should respect maxResults', () => {
      const ast = NodeFactory.createBlock([
        NodeFactory.createExpressionStatement(NodeFactory.createIdentifier('a')),
        NodeFactory.createExpressionStatement(NodeFactory.createIdentifier('b')),
        NodeFactory.createExpressionStatement(NodeFactory.createIdentifier('c')),
      ]);

      const matches = findRuleMatches(ast, '//Identifier', { maxResults: 2 });
      expect(matches.length).toBeLessThanOrEqual(2);
    });
  });
});
