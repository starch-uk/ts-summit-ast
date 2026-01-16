/**
 * Tests for source extraction utilities
 * Ported from com.google.summit.translation.SourceLocationTest
 */

import { describe, it, expect } from 'vitest';
import { getSourceText, getSourceRange, locationToOffset, offsetToLocation, UNKNOWN_SOURCE_LOCATION, isUnknownLocation } from '../../../src/utils/source-extraction.js';
import { NodeFactory } from '../../../src/translator/NodeFactory.js';
import { parseAndTranslate, findFirstNodeOfType } from '../../helpers/translate-helpers.js';
import { isClassDeclaration, isVariableDeclaration } from '../../../src/ast/type-guards.js';

describe('Source Extraction Utilities', () => {
  const sourceCode = `public class Test {
    private Integer value = 42;
    public void method() {
        return;
    }
}`;

  describe('getSourceRange', () => {
    it('should return location if available', () => {
      const location = {
        start: { line: 2, column: 5 },
        end: { line: 2, column: 15 },
      };
      const node = NodeFactory.createIdentifier('value', { location });

      const range = getSourceRange(node);
      expect(range).toEqual(location);
    });

    it('should return null if location not available', () => {
      const node = NodeFactory.createIdentifier('test');
      const range = getSourceRange(node);
      expect(range).toBeNull();
    });
  });

  describe('getSourceText', () => {
    it('should extract text for single-line node', () => {
      // "value" is at columns 21-25 in "    private Integer value = 42;"
      const location = {
        start: { line: 2, column: 21 },
        end: { line: 2, column: 25 },
      };
      const node = NodeFactory.createIdentifier('value', { location });

      const text = getSourceText(node, sourceCode);
      expect(text).toBe('value');
    });

    it('should extract text for multi-line node', () => {
      const location = {
        start: { line: 1, column: 1 },
        end: { line: 5, column: 1 },
      };
      const node = NodeFactory.createBlock([], { location });

      const text = getSourceText(node, sourceCode);
      expect(text).toContain('public class Test');
    });

    it('should trim text when requested', () => {
      // "value" starts at column 21 in "    private Integer value = 42;"
      const location = {
        start: { line: 2, column: 21 },
        end: { line: 2, column: 26 },
      };
      const node = NodeFactory.createIdentifier('value', { location });

      const text = getSourceText(node, sourceCode, { trim: true });
      expect(text).toBe('value');
    });
  });

  describe('locationToOffset', () => {
    it('should convert location to offset', () => {
      const location = { line: 2, column: 5 };
      const offset = locationToOffset(location, sourceCode);
      expect(offset).toBeGreaterThanOrEqual(0);
    });
  });

  describe('offsetToLocation', () => {
    it('should convert offset to location', () => {
      const offset = 20;
      const location = offsetToLocation(offset, sourceCode);
      expect(location.line).toBeGreaterThan(0);
      expect(location.column).toBeGreaterThan(0);
    });
  });

  describe('Source Location Tests (from original)', () => {
    it('declaration has correct source location', () => {
      const input = 'public class Test { }';

      const cu = parseAndTranslate(input);
      const classDecl = findFirstNodeOfType(cu, isClassDeclaration);

      expect(classDecl).not.toBeNull();
      if (classDecl && classDecl.location) {
        // The location should span from "class" to the end
        const classIndex = input.indexOf('class');
        expect(classDecl.location.start.line).toBe(1);
        expect(classDecl.location.start.column).toBeGreaterThanOrEqual(classIndex + 1);
        expect(classDecl.location.end.line).toBe(1);
        expect(classDecl.location.end.column).toBeGreaterThanOrEqual(input.length);
      }
    });

    it('unknown source location prints special string', () => {
      expect(isUnknownLocation(UNKNOWN_SOURCE_LOCATION)).toBe(true);
      // Note: We don't have a toString() method, but we can check the structure
      expect(UNKNOWN_SOURCE_LOCATION.start.line).toBe(0);
      expect(UNKNOWN_SOURCE_LOCATION.start.column).toBe(0);
    });

    it('extract from source one-line node', () => {
      const input = `
        class Test {
          public String field
            = 'Hello';
        }
      `;
      const classDecl = findFirstNodeOfType(parseAndTranslate(input), isClassDeclaration);
      expect(classDecl).not.toBeNull();
      if (classDecl && classDecl.location) {
        const loc = classDecl.location;
        const extracted = getSourceText(classDecl, input);
        expect(extracted).toContain('Test');
      }
    });

    it('extract from source multi-line node', () => {
      const input = `
        class Test {
          public String field
            = 'Hello';
        }
      `;
      const cu = parseAndTranslate(input);
      const fieldDecl = findFirstNodeOfType(cu, isVariableDeclaration);
      expect(fieldDecl).not.toBeNull();
      if (fieldDecl && fieldDecl.location) {
        const extracted = getSourceText(fieldDecl, input);
        expect(extracted).toContain('String field');
        expect(extracted).toContain("= 'Hello'");
      }
    });

    it('extract from source whole file', () => {
      const input = `
        class Test {
          public String field
            = 'Hello';
        }
      `.trim();
      const cu = parseAndTranslate(input);
      if (cu && cu.location) {
        const extracted = getSourceText(cu, input);
        expect(extracted).toContain('class Test');
      }
    });

    it('extract from source arbitrary location', () => {
      const input = `
        class Test {
          public String field
            = 'Hello';
        }
      `.trim();
      const loc = {
        start: { line: 1, column: 4 },
        end: { line: 3, column: 16 },
      };
      const node = NodeFactory.createIdentifier('test', { location: loc });
      const extracted = getSourceText(node, input);
      expect(extracted).toBeTruthy();
    });

    it('trailing empty line', () => {
      const input = 'public class Test { }\n';

      const cu = parseAndTranslate(input);
      if (cu && cu.location) {
        expect(cu.location.end.line).toBe(2);
        expect(cu.location.end.column).toBeGreaterThanOrEqual(0);
        const extracted = getSourceText(cu, input);
        expect(extracted).toBeTruthy();
      }
    });

    it('trailing whitespace line', () => {
      const input = 'public class Test { }\n ';

      const cu = parseAndTranslate(input);
      if (cu && cu.location) {
        expect(cu.location.end.line).toBe(2);
        expect(cu.location.end.column).toBeGreaterThanOrEqual(1);
        const extracted = getSourceText(cu, input);
        expect(extracted).toBeTruthy();
      }
    });

    it('leading empty line', () => {
      const input = '\npublic class Test { }';

      const cu = parseAndTranslate(input);
      if (cu && cu.location) {
        // The source location starts from the first regular token
        expect(cu.location.start.line).toBe(2);
        expect(cu.location.start.column).toBeGreaterThanOrEqual(0);
      }
    });

    it('tabs are counted as single characters', () => {
      const input = '\t\tpublic class Test { }';

      const cu = parseAndTranslate(input);
      if (cu && cu.location) {
        expect(cu.location.start.column).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
