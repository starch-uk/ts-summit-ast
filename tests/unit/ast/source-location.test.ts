/**
 * Tests for source location utilities
 * Ported from com.google.summit.ast.SourceLocationTest
 */

import { describe, it, expect } from 'vitest';
import { spanOf, UNKNOWN_SOURCE_LOCATION, isUnknownLocation } from '../../../src/utils/source-extraction.js';
import type { SourceRange } from '../../../src/ast/base.js';

describe('Source Location Utilities', () => {
  describe('spanOf', () => {
    it('should choose non-null values', () => {
      const unknown = UNKNOWN_SOURCE_LOCATION;
      const withLinesOnly: SourceRange = {
        start: { line: 1, column: undefined as any },
        end: { line: 3, column: undefined as any },
      };
      const withLinesAndColumns: SourceRange = {
        start: { line: 1, column: 10 },
        end: { line: 3, column: 10 },
      };

      expect(spanOf(unknown, unknown)).toEqual(unknown);
      expect(spanOf(withLinesOnly, unknown)).toEqual(withLinesOnly);
      expect(spanOf(unknown, withLinesOnly)).toEqual(withLinesOnly);
      expect(spanOf(withLinesOnly, withLinesAndColumns)).toEqual(withLinesAndColumns);
      expect(spanOf(withLinesAndColumns, withLinesOnly)).toEqual(withLinesAndColumns);
    });

    it('should return new range spanning all inputs', () => {
      const lower: SourceRange = {
        start: { line: 1, column: 1 },
        end: { line: 2, column: 2 },
      };
      const upper: SourceRange = {
        start: { line: 2, column: 2 },
        end: { line: 3, column: 3 },
      };

      const expected: SourceRange = {
        start: { line: 1, column: 1 },
        end: { line: 3, column: 3 },
      };
      expect(spanOf(lower, upper)).toEqual(expected);
      expect(spanOf(upper, lower)).toEqual(expected);
    });

    it('should be idempotent', () => {
      const loc: SourceRange = {
        start: { line: 1, column: 3 },
        end: { line: 4, column: 2 },
      };

      expect(spanOf(loc)).toEqual(loc);
      expect(spanOf(loc, loc, loc)).toEqual(loc);
      expect(spanOf(loc, spanOf(loc, loc))).toEqual(loc);
    });

    it('should rank line over column', () => {
      const widerLines: SourceRange = {
        start: { line: 1, column: 6 },
        end: { line: 10, column: 5 },
      };
      const widerColumns: SourceRange = {
        start: { line: 5, column: 1 },
        end: { line: 6, column: 10 },
      };

      expect(spanOf(widerLines, widerColumns)).toEqual(widerLines);
      expect(spanOf(widerColumns, widerLines)).toEqual(widerLines);
    });
  });
});
