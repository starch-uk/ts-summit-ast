/**
 * Source position utilities
 */

import type { SourceRange } from '../ast/base.js';

/**
 * Position in source code (1-based)
 */
export interface Position {
  readonly line: number; // 1-based line number
  readonly column: number; // 1-based column number
}

/**
 * Check if a position is within a source range
 */
export function isPositionInRange(
  position: Position,
  range: SourceRange
): boolean {
  const { line, column } = position;
  const { start, end } = range;

  // Check if line is within range
  if (line < start.line || line > end.line) {
    return false;
  }

  // If on start line, check column
  if (line === start.line && column < start.column) {
    return false;
  }

  // If on end line, check column
  if (line === end.line && column > end.column) {
    return false;
  }

  return true;
}

/**
 * Check if position is before a range
 */
export function isPositionBefore(position: Position, range: SourceRange): boolean {
  if (position.line < range.start.line) {
    return true;
  }
  if (position.line === range.start.line && position.column < range.start.column) {
    return true;
  }
  return false;
}

/**
 * Check if position is after a range
 */
export function isPositionAfter(position: Position, range: SourceRange): boolean {
  if (position.line > range.end.line) {
    return true;
  }
  if (position.line === range.end.line && position.column > range.end.column) {
    return true;
  }
  return false;
}

/**
 * Calculate character distance between position and range
 */
export function getDistanceToRange(
  position: Position,
  range: SourceRange
): number {
  if (isPositionInRange(position, range)) {
    return 0;
  }

  if (isPositionBefore(position, range)) {
    // Distance to start
    if (position.line === range.start.line) {
      return range.start.column - position.column;
    }
    // Approximate: lines difference + column difference
    return (range.start.line - position.line) * 100 + (range.start.column - position.column);
  }

  // Position is after range
  if (position.line === range.end.line) {
    return position.column - range.end.column;
  }
  return (position.line - range.end.line) * 100 + (position.column - range.end.column);
}
