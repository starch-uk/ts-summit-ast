/**
 * Tests for ApexDoc parser utilities
 */

import { describe, it, expect } from 'vitest';
import {
  parseApexDocComment,
  isApexDocCommentString,
  type ApexDocParseOptions,
} from '../../../src/utils/apexdoc-parser.js';
import type { ApexDocComment } from '../../../src/ast/nodes/ApexDoc.js';

describe('ApexDoc Parser', () => {
  describe('isApexDocCommentString', () => {
    it('should identify ApexDoc comments starting with /**', () => {
      expect(isApexDocCommentString('/** Test */')).toBe(true);
      expect(isApexDocCommentString('  /** Test */')).toBe(true);
      expect(isApexDocCommentString('/**')).toBe(true);
      expect(isApexDocCommentString('/**\n * Test\n */')).toBe(true);
    });

    it('should not identify regular block comments', () => {
      expect(isApexDocCommentString('/* Test */')).toBe(false);
      expect(isApexDocCommentString('// Test')).toBe(false);
      expect(isApexDocCommentString('Regular text')).toBe(false);
    });
  });

  describe('parseApexDocComment', () => {
    it('should parse basic ApexDoc comment with only main description', () => {
      const comment = '/** This is a simple description. */';
      const result = parseApexDocComment(comment);

      expect(result).not.toBeNull();
      expect(result!.kind).toBe('ApexDocComment');
      expect(result!.mainDescription).toBe('This is a simple description.');
      expect(result!.blockTags).toHaveLength(0);
    });

    it('should parse multi-line ApexDoc comment', () => {
      const comment = `/**
 * This is a multi-line description.
 * It has multiple lines of text.
 */`;
      const result = parseApexDocComment(comment);

      expect(result).not.toBeNull();
      expect(result!.mainDescription).toContain('multi-line description');
      expect(result!.blockTags).toHaveLength(0);
    });

    it('should parse ApexDoc comment with @param tag', () => {
      const comment = `/**
 * Method description.
 * @param name The parameter name
 */`;
      const result = parseApexDocComment(comment);

      expect(result).not.toBeNull();
      expect(result!.blockTags).toHaveLength(1);
      expect(result!.blockTags[0].kind).toBe('ApexDocParamTag');
      expect((result!.blockTags[0] as any).paramName).toBe('name');
    });

    it('should parse ApexDoc comment with multiple @param tags', () => {
      const comment = `/**
 * Method description.
 * @param x The first parameter
 * @param y The second parameter
 */`;
      const result = parseApexDocComment(comment);

      expect(result).not.toBeNull();
      expect(result!.blockTags).toHaveLength(2);
      expect(result!.blockTags[0].kind).toBe('ApexDocParamTag');
      expect((result!.blockTags[0] as any).paramName).toBe('x');
      expect(result!.blockTags[1].kind).toBe('ApexDocParamTag');
      expect((result!.blockTags[1] as any).paramName).toBe('y');
    });

    it('should parse @return tag', () => {
      const comment = `/**
 * Method description.
 * @return The return value
 */`;
      const result = parseApexDocComment(comment);

      expect(result).not.toBeNull();
      expect(result!.blockTags).toHaveLength(1);
      expect(result!.blockTags[0].kind).toBe('ApexDocReturnTag');
    });

    it('should parse @author tag', () => {
      const comment = `/**
 * Class description.
 * @author John Doe
 */`;
      const result = parseApexDocComment(comment);

      expect(result).not.toBeNull();
      expect(result!.blockTags).toHaveLength(1);
      expect(result!.blockTags[0].kind).toBe('ApexDocAuthorTag');
    });

    it('should parse @deprecated tag', () => {
      const comment = `/**
 * Deprecated method.
 * @deprecated Use newMethod() instead
 */`;
      const result = parseApexDocComment(comment);

      expect(result).not.toBeNull();
      expect(result!.blockTags).toHaveLength(1);
      expect(result!.blockTags[0].kind).toBe('ApexDocDeprecatedTag');
    });

    it('should parse @example tag', () => {
      const comment = `/**
 * Example method.
 * @example This is an example
 */`;
      const result = parseApexDocComment(comment);

      expect(result).not.toBeNull();
      expect(result!.blockTags).toHaveLength(1);
      expect(result!.blockTags[0].kind).toBe('ApexDocExampleTag');
    });

    it('should parse @group tag', () => {
      const comment = `/**
 * Grouped method.
 * @group Utilities
 */`;
      const result = parseApexDocComment(comment);

      expect(result).not.toBeNull();
      expect(result!.blockTags).toHaveLength(1);
      expect(result!.blockTags[0].kind).toBe('ApexDocGroupTag');
      expect((result!.blockTags[0] as any).groupName).toBe('Utilities');
    });

    it('should parse @group tag with description', () => {
      const comment = `/**
 * Grouped method.
 * @group Utilities Helper methods
 */`;
      const result = parseApexDocComment(comment);

      expect(result).not.toBeNull();
      expect(result!.blockTags[0].kind).toBe('ApexDocGroupTag');
      expect((result!.blockTags[0] as any).groupName).toBe('Utilities');
    });

    it('should parse @see tag', () => {
      const comment = `/**
 * Method description.
 * @see OtherClass#otherMethod()
 */`;
      const result = parseApexDocComment(comment);

      expect(result).not.toBeNull();
      expect(result!.blockTags).toHaveLength(1);
      expect(result!.blockTags[0].kind).toBe('ApexDocSeeTag');
    });

    it('should parse @since tag', () => {
      const comment = `/**
 * Method description.
 * @since 1.0.0
 */`;
      const result = parseApexDocComment(comment);

      expect(result).not.toBeNull();
      expect(result!.blockTags).toHaveLength(1);
      expect(result!.blockTags[0].kind).toBe('ApexDocSinceTag');
    });

    it('should parse @throws tag with exception type', () => {
      const comment = `/**
 * Method description.
 * @throws IllegalArgumentException If invalid argument
 */`;
      const result = parseApexDocComment(comment);

      expect(result).not.toBeNull();
      expect(result!.blockTags).toHaveLength(1);
      expect(result!.blockTags[0].kind).toBe('ApexDocThrowsTag');
      expect((result!.blockTags[0] as any).exceptionType).toBe('IllegalArgumentException');
    });

    it('should parse @throws tag without exception type', () => {
      const comment = `/**
 * Method description.
 * @throws Throws an exception
 */`;
      const result = parseApexDocComment(comment);

      expect(result).not.toBeNull();
      expect(result!.blockTags[0].kind).toBe('ApexDocThrowsTag');
    });

    it('should parse @version tag', () => {
      const comment = `/**
 * Class description.
 * @version 2.0.0
 */`;
      const result = parseApexDocComment(comment);

      expect(result).not.toBeNull();
      expect(result!.blockTags).toHaveLength(1);
      expect(result!.blockTags[0].kind).toBe('ApexDocVersionTag');
    });

    it('should parse comment with all block tags', () => {
      const comment = `/**
 * Complete method documentation.
 * @param x First parameter
 * @param y Second parameter
 * @return The result
 * @throws Exception If error occurs
 * @since 1.0.0
 * @author Developer
 * @see RelatedClass#method()
 */`;
      const result = parseApexDocComment(comment);

      expect(result).not.toBeNull();
      expect(result!.blockTags.length).toBeGreaterThan(5);
    });

    describe('Inline Tags', () => {
      it('should parse {@code} tag in description', () => {
        const comment = `/**
 * Use {@code String} for text values.
 */`;
        const result = parseApexDocComment(comment);

        expect(result).not.toBeNull();
        expect(result!.mainDescription).toContain('String');
      });

      it('should parse {@link} tag', () => {
        const comment = `/**
 * See {@link OtherClass} for more info.
 */`;
        const result = parseApexDocComment(comment);

        expect(result).not.toBeNull();
        expect(result!.mainDescription).toContain('OtherClass');
      });

      it('should parse {@literal} tag', () => {
        const comment = `/**
 * Use {@literal <code>} to show code.
 */`;
        const result = parseApexDocComment(comment);

        expect(result).not.toBeNull();
        expect(result!.mainDescription).toContain('<code>');
      });

      it('should parse {@hidden} tag', () => {
        const comment = `/**
 * Method with hidden text {@hidden internal}.
 */`;
        const result = parseApexDocComment(comment);

        expect(result).not.toBeNull();
        expect(result!.mainDescription).toContain('internal');
      });

      it('should parse multiple inline tags', () => {
        const comment = `/**
 * Use {@code String} and {@code Integer} types.
 * See {@link OtherClass} for details.
 */`;
        const result = parseApexDocComment(comment);

        expect(result).not.toBeNull();
        expect(result!.mainDescription).toContain('String');
        expect(result!.mainDescription).toContain('Integer');
      });

      it('should parse inline tags in block tag descriptions', () => {
        const comment = `/**
 * Method description.
 * @param name Use {@code String} type
 */`;
        const result = parseApexDocComment(comment);

        expect(result).not.toBeNull();
        expect(result!.blockTags[0].description.length).toBeGreaterThan(0);
      });
    });

    describe('{@code} with nested AST', () => {
      it('should parse Apex code in {@code} tag when enabled', () => {
        const comment = `/**
 * Example: {@code Integer x = 42;}
 */`;
        const options: ApexDocParseOptions = {
          parseCodeInCodeTag: true,
        };
        const result = parseApexDocComment(comment, undefined, options);

        expect(result).not.toBeNull();
      });

      it('should not parse code when parseCodeInCodeTag is false', () => {
        const comment = `/**
 * Example: {@code Integer x = 42;}
 */`;
        const options: ApexDocParseOptions = {
          parseCodeInCodeTag: false,
        };
        const result = parseApexDocComment(comment, undefined, options);

        expect(result).not.toBeNull();
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty ApexDoc comment', () => {
        const comment = '/** */';
        const result = parseApexDocComment(comment);

        expect(result).not.toBeNull();
        expect(result!.mainDescription).toBe('');
        expect(result!.blockTags).toHaveLength(0);
      });

      it('should handle comment with only tags', () => {
        const comment = `/**
 * @param x Parameter
 */`;
        const result = parseApexDocComment(comment);

        expect(result).not.toBeNull();
        expect(result!.mainDescription).toBe('');
        expect(result!.blockTags).toHaveLength(1);
      });

      it('should handle malformed @param tag', () => {
        const comment = `/**
 * @param Invalid param tag
 */`;
        const result = parseApexDocComment(comment);

        // Should not crash, but may not parse the param correctly
        expect(result).not.toBeNull();
      });

      it('should handle comment with location', () => {
        const comment = '/** Test */';
        const location = {
          start: { line: 1, column: 1 },
          end: { line: 1, column: 12 },
        };
        const result = parseApexDocComment(comment, location);

        expect(result).not.toBeNull();
        expect(result!.location).toEqual(location);
      });

      it('should handle comment without location when includeLocation is false', () => {
        const comment = '/** Test */';
        const location = {
          start: { line: 1, column: 1 },
          end: { line: 1, column: 12 },
        };
        const options: ApexDocParseOptions = {
          includeLocation: false,
        };
        const result = parseApexDocComment(comment, location, options);

        expect(result).not.toBeNull();
        expect(result!.location).toBeUndefined();
      });

      it('should handle multi-line block tags', () => {
        const comment = `/**
 * Method description.
 * @param name
 *        This is a multi-line parameter description
 *        that continues on the next line
 */`;
        const result = parseApexDocComment(comment);

        expect(result).not.toBeNull();
        expect(result!.blockTags).toHaveLength(1);
      });

      it('should handle comments with extra whitespace', () => {
        const comment = `/**
 *    Description with extra spaces.
 *    
 *    @param   x   Parameter   with   spaces
 */`;
        const result = parseApexDocComment(comment);

        expect(result).not.toBeNull();
        expect(result!.mainDescription).toContain('Description');
      });
    });

    describe('Complex Examples', () => {
      it('should parse complete method documentation', () => {
        const comment = `/**
 * Calculates the sum of two integers.
 * 
 * This method performs addition of two integer values and returns
 * the result. It handles overflow cases by throwing an exception.
 * 
 * @param a The first integer to add
 * @param b The second integer to add
 * @return The sum of a and b
 * @throws ArithmeticException If the result overflows
 * @since 1.0.0
 * @author John Doe
 * @see Math#add(int, int)
 * @example {@code Integer result = add(5, 3); // returns 8}
 */`;
        const result = parseApexDocComment(comment);

        expect(result).not.toBeNull();
        expect(result!.mainDescription).toContain('Calculates');
        expect(result!.blockTags.length).toBeGreaterThanOrEqual(6);
      });

      it('should parse class documentation with group', () => {
        const comment = `/**
 * Utility class for string operations.
 * 
 * This class provides various helper methods for working with strings.
 * All methods are static and thread-safe.
 * 
 * @group Utilities
 * @author Jane Smith
 * @version 2.1.0
 * @since 1.5.0
 */`;
        const result = parseApexDocComment(comment);

        expect(result).not.toBeNull();
        expect(result!.blockTags.some((tag) => tag.kind === 'ApexDocGroupTag')).toBe(true);
        expect(result!.blockTags.some((tag) => tag.kind === 'ApexDocAuthorTag')).toBe(true);
        expect(result!.blockTags.some((tag) => tag.kind === 'ApexDocVersionTag')).toBe(true);
      });
    });
  });
});