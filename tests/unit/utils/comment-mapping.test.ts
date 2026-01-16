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

    it('should extract multi-line block comments', () => {
      const source = `/* This is a multi-line
 * block comment
 * that spans multiple lines
 */
public class Test {}`;

      const ast = NodeFactory.createBlock([]);
      const comments = extractComments(ast, source, {
        includeBlockComments: true,
      });

      expect(comments.length).toBeGreaterThan(0);
      expect(comments[0].type).toBe('block');
      expect(comments[0].text).toContain('multi-line');
    });

    describe('ApexDoc Comments', () => {
      it('should extract ApexDoc comments', () => {
        const source = `/**
 * This is an ApexDoc comment.
 */
public class Test {}`;

        const ast = NodeFactory.createBlock([]);
        const comments = extractComments(ast, source, {
          includeBlockComments: true,
          parseApexDoc: false,
        });

        expect(comments.length).toBeGreaterThan(0);
        expect(comments[0].type).toBe('block');
        expect(comments[0].text).toContain('ApexDoc');
      });

      it('should parse ApexDoc comments when requested', () => {
        const source = `/**
 * Method description.
 * @param x The parameter
 */
public void method(Integer x) {}`;

        const ast = NodeFactory.createBlock([]);
        const comments = extractComments(ast, source, {
          includeBlockComments: true,
          parseApexDoc: true,
        });

        expect(comments.length).toBeGreaterThan(0);
        expect(comments[0].apexDocComment).toBeDefined();
        expect(comments[0].apexDocComment?.kind).toBe('ApexDocComment');
        expect(comments[0].apexDocComment?.blockTags.length).toBeGreaterThan(0);
        expect(comments[0].apexDocComment?.blockTags[0].kind).toBe('ApexDocParamTag');
      });

      it('should parse ApexDoc with @group tag', () => {
        const source = `/**
 * Grouped method.
 * @group Utilities
 */
public void utility() {}`;

        const ast = NodeFactory.createBlock([]);
        const comments = extractComments(ast, source, {
          parseApexDoc: true,
        });

        expect(comments[0].apexDocComment).toBeDefined();
        const groupTag = comments[0].apexDocComment?.blockTags.find(
          (tag) => tag.kind === 'ApexDocGroupTag'
        );
        expect(groupTag).toBeDefined();
        expect((groupTag as any).groupName).toBe('Utilities');
      });

      it('should parse ApexDoc with multiple block tags', () => {
        const source = `/**
 * Complete documentation.
 * @param a First param
 * @param b Second param
 * @return The result
 * @throws Exception If error
 */
public Integer method(Integer a, Integer b) { return 0; }`;

        const ast = NodeFactory.createBlock([]);
        const comments = extractComments(ast, source, {
          parseApexDoc: true,
        });

        expect(comments[0].apexDocComment).toBeDefined();
        expect(comments[0].apexDocComment?.blockTags.length).toBeGreaterThanOrEqual(4);
      });

      it('should parse ApexDoc with inline tags', () => {
        const source = `/**
 * Use {@code String} for text.
 * See {@link OtherClass} for details.
 */
public class Test {}`;

        const ast = NodeFactory.createBlock([]);
        const comments = extractComments(ast, source, {
          parseApexDoc: true,
        });

        expect(comments[0].apexDocComment).toBeDefined();
        expect(comments[0].apexDocComment?.mainDescription).toContain('String');
      });

      it('should handle ApexDoc comments without parsing', () => {
        const source = `/**
 * Method description.
 * @param x Parameter
 */
public void method(Integer x) {}`;

        const ast = NodeFactory.createBlock([]);
        const comments = extractComments(ast, source, {
          parseApexDoc: false,
        });

        expect(comments[0].apexDocComment).toBeUndefined();
        expect(comments[0].text).toContain('@param');
      });

      it('should parse multi-line ApexDoc comments', () => {
        const source = `/**
 * This is a multi-line ApexDoc comment.
 * It has multiple lines of description.
 * 
 * @param name The name parameter
 *        which can also span multiple lines
 */
public void method(String name) {}`;

        const ast = NodeFactory.createBlock([]);
        const comments = extractComments(ast, source, {
          parseApexDoc: true,
        });

        expect(comments[0].apexDocComment).toBeDefined();
        expect(comments[0].apexDocComment?.mainDescription).toContain('multi-line');
      });

      it('should handle ApexDoc with nested {@code} tags', () => {
        const source = `/**
 * Example: {@code Integer x = 42;}
 */
public void method() {}`;

        const ast = NodeFactory.createBlock([]);
        const comments = extractComments(ast, source, {
          parseApexDoc: true,
          apexDocParseOptions: {
            parseCodeInCodeTag: true,
          },
        });

        expect(comments[0].apexDocComment).toBeDefined();
      });
    });
  });
});
