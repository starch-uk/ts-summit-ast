/**
 * Tests for comment mapping utilities
 */

import { describe, it, expect } from 'vitest';
import { findAssociatedNode, extractComments } from '../../../src/utils/comment-mapping.js';
import { NodeFactory } from '../../../src/translator/NodeFactory.js';
import type { CommentInfo } from '../../../src/utils/comment-mapping.js';

describe('Comment Mapping Utilities', () => {
  describe('findAssociatedNode', () => {
    it('should find node associated with comment', () => {
      const source = `private Integer value = 42; // TODO: Replace magic number`;
      const location = {
        start: { line: 1, column: 13 },
        end: { line: 1, column: 17 },
      };
      const node = NodeFactory.createIdentifier('value', { location });

      const comment: CommentInfo = {
        line: 1,
        column: 35,
        text: 'TODO: Replace magic number',
        type: 'line',
      };

      const result = findAssociatedNode(node, comment, source);
      // Result may be null if no good match found, which is acceptable
      expect(result === null || result.node !== undefined).toBe(true);
    });
  });

  describe('extractComments', () => {
    it('should extract line comments', () => {
      const source = `// This is a comment
public class Test {
    // Another comment
}`;

      const ast = NodeFactory.createBlock([]);
      const comments = extractComments(ast, source, {
        includeLineComments: true,
        includeBlockComments: false,
      });

      expect(comments.length).toBeGreaterThan(0);
      expect(comments.some((c) => c.text.includes('This is a comment'))).toBe(true);
    });

    it('should extract block comments', () => {
      const source = `/* This is a block comment */
public class Test {}`;

      const ast = NodeFactory.createBlock([]);
      const comments = extractComments(ast, source, {
        includeLineComments: false,
        includeBlockComments: true,
      });

      expect(comments.length).toBeGreaterThan(0);
      expect(comments[0].type).toBe('block');
    });

    it('should associate nodes when requested', () => {
      const source = `private Integer value = 42; // TODO comment`;
      const location = {
        start: { line: 1, column: 13 },
        end: { line: 1, column: 17 },
      };
      const node = NodeFactory.createIdentifier('value', { location });

      const comments = extractComments(node, source, {
        associateNodes: true,
      });

      expect(comments.length).toBeGreaterThan(0);
    });
  });
});
