/**
 * Tests for position utilities
 */

import { describe, it, expect } from 'vitest';
import {
  isPositionInRange,
  isPositionBefore,
  isPositionAfter,
  getDistanceToRange,
} from '../../../src/utils/position.js';
import type { Position } from '../../../src/utils/position.js';
import type { SourceRange } from '../../../src/ast/base.js';

describe('Position Utilities', () => {
  const range: SourceRange = {
    start: { line: 5, column: 10 },
    end: { line: 7, column: 20 },
  };

  describe('isPositionInRange', () => {
    it('should return true for position inside range', () => {
      const position: Position = { line: 6, column: 15 };
      expect(isPositionInRange(position, range)).toBe(true);
    });

    it('should return true for position at start', () => {
      const position: Position = { line: 5, column: 10 };
      expect(isPositionInRange(position, range)).toBe(true);
    });

    it('should return true for position at end', () => {
      const position: Position = { line: 7, column: 20 };
      expect(isPositionInRange(position, range)).toBe(true);
    });

    it('should return false for position before range', () => {
      const position: Position = { line: 4, column: 15 };
      expect(isPositionInRange(position, range)).toBe(false);
    });

    it('should return false for position after range', () => {
      const position: Position = { line: 8, column: 15 };
      expect(isPositionInRange(position, range)).toBe(false);
    });

    it('should handle single-line range', () => {
      const singleLineRange: SourceRange = {
        start: { line: 5, column: 10 },
        end: { line: 5, column: 20 },
      };
      const position: Position = { line: 5, column: 15 };
      expect(isPositionInRange(position, singleLineRange)).toBe(true);
    });
  });

  describe('isPositionBefore', () => {
    it('should return true for position before range', () => {
      const position: Position = { line: 4, column: 15 };
      expect(isPositionBefore(position, range)).toBe(true);
    });

    it('should return false for position in range', () => {
      const position: Position = { line: 6, column: 15 };
      expect(isPositionBefore(position, range)).toBe(false);
    });
  });

  describe('isPositionAfter', () => {
    it('should return true for position after range', () => {
      const position: Position = { line: 8, column: 15 };
      expect(isPositionAfter(position, range)).toBe(true);
    });

    it('should return false for position in range', () => {
      const position: Position = { line: 6, column: 15 };
      expect(isPositionAfter(position, range)).toBe(false);
    });
  });

  describe('getDistanceToRange', () => {
    it('should return 0 for position in range', () => {
      const position: Position = { line: 6, column: 15 };
      expect(getDistanceToRange(position, range)).toBe(0);
    });

    it('should calculate distance for position before range', () => {
      const position: Position = { line: 5, column: 5 };
      const distance = getDistanceToRange(position, range);
      expect(distance).toBeGreaterThan(0);
    });
  });
});
