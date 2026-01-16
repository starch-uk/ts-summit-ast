/**
 * Tests for source extraction utilities
 */

import { describe, it, expect } from 'vitest';
import { getSourceText, getSourceRange, locationToOffset, offsetToLocation } from '../../../src/utils/source-extraction.js';
import { NodeFactory } from '../../../src/translator/NodeFactory.js';

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
});
