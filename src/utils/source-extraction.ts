/**
 * @file Source code extraction utilities.
 * Utilities for extracting source text, position calculations, and source range operations.
 */

import type { ASTNode, SourceRange } from '../ast/base.js';

/**
 * Constants for array indexing and offsets.
 */
const ZERO_INDEX = 0;
const OFFSET_FROM_ONE_BASED = 1;
const OFFSET_FOR_NEWLINE = 1;
const LINES_PER_COLUMN_MULTIPLIER = 100;

/**
 * Options for source text extraction.
 */
interface SourceTextOptions {
  /**
   * Include associated comments.
   */
  readonly includeComments?: boolean;

  /**
   * Include leading/trailing whitespace.
   */
  readonly includeWhitespace?: boolean;

  /**
   * Trim whitespace from result.
   */
  readonly trim?: boolean;
}

/**
 * Get the source code text for an AST node.
 *
 * This follows the original summit-ast implementation:
 * - Columns in the original are 0-based, but our TypeScript uses 1-based
 * - The range is exclusive of the character at endLine/endColumn
 * - extractFrom uses: lines.subList(startLine-1, endLine), then drops startColumn from start
 * and (lastLine.length - endColumn) from end.
 *
 * Original Kotlin code:.
 * ```kotlin
 * val lines = source.lines().subList(startLine!! - 1, endLine!!)
 * val joinedLines = lines.joinToString(separator = "\n")
 * val distanceFromStart = startColumn!!
 * val distanceFromEnd = lines.last().length - endColumn!!
 * return joinedLines.drop(distanceFromStart).dropLast(distanceFromEnd)
 * ```
 * @param node - The AST node to extract source text for.
 * @param source - The original source code string.
 * @param options - Options for extraction.
 * @returns The source text for the node.
 */
function getSourceText(node: ASTNode, source: string, options: SourceTextOptions = {}): string {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Function is defined later in file
  const range = getSourceRange(node);
  if (!range) {
    return '';
  }

  const lines = source.split(/\r?\n/);
  const { start, end } = range;

  // Original uses: source.lines().subList(startLine - 1, endLine)
  // This gets lines from index (startLine-1) to endLine (exclusive)
  // So if startLine=1, endLine=2, we get lines[0] (first line)
  // If startLine=1, endLine=3, we get lines[0] and lines[1]

  /**
   * Convert to 0-based index.
   */
  const startLineIndex = start.line - OFFSET_FROM_ONE_BASED;

  /**
   * EndLine is exclusive, so slice uses endLine directly.
   */
  const endLineIndex = end.line;

  // Get the relevant lines (equivalent to subList)
  const relevantLines = lines.slice(startLineIndex, endLineIndex);

  if (relevantLines.length === ZERO_INDEX) {
    return '';
  }

  // Join the lines with newlines
  const joinedLines = relevantLines.join('\n');

  // Original Kotlin code:
  //   val distanceFromStart = startColumn!!  // 0-based
  //   val distanceFromEnd = lines.last().length - endColumn!!  // endColumn is 0-based, exclusive
  //   return joinedLines.drop(distanceFromStart).dropLast(distanceFromEnd)
  //
  // In our system, columns are 1-based, so:
  //   distanceFromStart = start.column - 1  // Convert to 0-based
  //   distanceFromEnd = lastLine.length - (end.column - 1)  // Convert endColumn to 0-based
  //
  // But wait: if endColumn is exclusive in 1-based, endColumn=25 means "up to but not including column 25"
  // In 0-based terms: "up to but not including index 24", so we include indices 0..23
  // The original formula: distanceFromEnd = lastLine.length - endColumn (where endColumn is 0-based exclusive)
  // So if endColumn=25 (0-based exclusive), we include up to index 24, drop: lastLine.length - 25
  // In our system with endColumn=25 (1-based exclusive = 24 in 0-based exclusive):
  //   distanceFromEnd = lastLine.length - 24

  /**
   * Convert 1-based to 0-based.
   */
  const distanceFromStart = start.column - OFFSET_FROM_ONE_BASED;
  const lastLine = relevantLines[relevantLines.length - OFFSET_FROM_ONE_BASED] ?? '';

  // Original uses 0-based exclusive endColumn
  // Our system appears to use 1-based INCLUSIVE endColumn (based on test expectations)
  // If endColumn=25 (1-based inclusive), we include up to index 24 (0-based)
  // To match original's exclusive behavior: if we want to include up to index 24,
  // the original would use endColumn=25 (0-based exclusive)
  // So: endColumn (1-based inclusive) = endColumn (0-based exclusive)
  // Formula: distanceFromEnd = lastLine.length - end.column
  const distanceFromEnd = lastLine.length - end.column;

  // Extract: drop from start, then drop from end
  let text = joinedLines;
  if (distanceFromStart > ZERO_INDEX) {
    text = text.substring(distanceFromStart);
  }
  if (distanceFromEnd > ZERO_INDEX && text.length >= distanceFromEnd) {
    text = text.substring(ZERO_INDEX, text.length - distanceFromEnd);
  }

  return options.trim === true ? text.trim() : text;
}

/**
 * Get source code text for a specific range.
 * More efficient than getSourceText when you only need a portion of the source.
 * @param source - The original source code string.
 * @param range - The source range to extract.
 * @returns The source text within the specified range.
 * @example
 * const range = { start: { line: 1, column: 1 }, end: { line: 1, column: 10 } };
 * const text = getSourceTextForRange(sourceCode, range);
 */
function getSourceTextForRange(source: string, range: SourceRange): string {
  const lines = source.split(/\r?\n/);
  const { start, end } = range;

  if (start.line < OFFSET_FROM_ONE_BASED || end.line > lines.length) {
    return '';
  }

  if (start.line === end.line) {
    // Single line
    const line = lines[start.line - OFFSET_FROM_ONE_BASED] ?? '';
    const startCol = Math.max(ZERO_INDEX, start.column - OFFSET_FROM_ONE_BASED);
    const endCol = Math.min(line.length, end.column - OFFSET_FROM_ONE_BASED);
    return line.substring(startCol, endCol);
  }

  // Multi-line
  const resultLines: string[] = [];
  const startCol = Math.max(ZERO_INDEX, start.column - OFFSET_FROM_ONE_BASED);
  const endCol = Math.max(ZERO_INDEX, end.column - OFFSET_FROM_ONE_BASED);

  // First line
  const firstLine = lines[start.line - OFFSET_FROM_ONE_BASED] ?? '';
  resultLines.push(firstLine.substring(startCol));

  // Middle lines
  for (let i = start.line; i < end.line - OFFSET_FROM_ONE_BASED; i++) {
    resultLines.push(lines[i] ?? '');
  }

  // Last line
  const lastLine = lines[end.line - OFFSET_FROM_ONE_BASED] ?? '';
  resultLines.push(lastLine.substring(ZERO_INDEX, endCol));

  return resultLines.join('\n');
}

/**
 * Get the source range for an AST node.
 * @param node - The AST node to get the range for.
 * @returns The source range, or null if not available.
 */
function getSourceRange(node: ASTNode): SourceRange | null {
  return node.location ?? null;
}

/**
 * Source location type (local interface for this module).
 */
interface LocalSourceLocation {
  readonly line: number;
  readonly column: number;
  readonly offset?: number;
}

/**
 * Convert source location to character offset.
 * @param location - The source location to convert.
 * @param source - The source code string.
 * @returns The character offset in the source.
 */
function locationToOffset(location: LocalSourceLocation, source: string): number {
  const lines = source.split(/\r?\n/);
  let offset = 0;

  // Add lengths of all lines before the target line
  for (let i = ZERO_INDEX; i < location.line - OFFSET_FROM_ONE_BASED && i < lines.length; i++) {
    offset += lines[i].length + OFFSET_FOR_NEWLINE; // +1 for newline
  }

  // Add column offset
  offset += location.column - OFFSET_FROM_ONE_BASED;

  return offset;
}

/**
 * Convert character offset to source location.
 * @param offset - The character offset to convert.
 * @param source - The source code string.
 * @returns The source location (line and column).
 */
function offsetToLocation(offset: number, source: string): { line: number; column: number } {
  const lines = source.split(/\r?\n/);
  let currentOffset = ZERO_INDEX;
  let line = OFFSET_FROM_ONE_BASED;
  let column = OFFSET_FROM_ONE_BASED;

  for (let i = ZERO_INDEX; i < lines.length; i++) {
    const lineLength = lines[i].length;
    const lineEnd = currentOffset + lineLength;

    if (offset <= lineEnd) {
      line = i + OFFSET_FROM_ONE_BASED;
      column = offset - currentOffset + OFFSET_FROM_ONE_BASED;
      break;
    }

    currentOffset = lineEnd + OFFSET_FOR_NEWLINE; // +1 for newline
  }

  return { column, line };
}

/**
 * UNKNOWN source location constant.
 */
const UNKNOWN_SOURCE_LOCATION: SourceRange = {
  end: { column: ZERO_INDEX, line: ZERO_INDEX },
  start: { column: ZERO_INDEX, line: ZERO_INDEX },
};

/**
 * Check if a source range is unknown.
 * @param range - The source range to check.
 * @returns True if the range is unknown (all zeros).
 */
function isUnknownLocation(range: SourceRange): boolean {
  return (
    range.start.line === ZERO_INDEX &&
    range.start.column === ZERO_INDEX &&
    range.end.line === ZERO_INDEX &&
    range.end.column === ZERO_INDEX
  );
}

/**
 * Combine multiple source ranges into a single span.
 *
 * This function chooses the most complete location information:
 * - Prefers ranges with both line and column over those with only lines
 * - Returns a new range from the earliest start to the latest end
 * - Handles unknown locations gracefully.
 * @param ranges - One or more source ranges to combine.
 * @returns A new SourceRange spanning all input ranges.
 */
function spanOf(...ranges: readonly (SourceRange | null | undefined)[]): SourceRange {
  // Filter out null/undefined and unknown locations
  const validRanges = ranges.filter(
    (r): r is SourceRange => r !== null && r !== undefined && !isUnknownLocation(r)
  );

  if (validRanges.length === ZERO_INDEX) {
    return UNKNOWN_SOURCE_LOCATION;
  }

  if (validRanges.length === OFFSET_FROM_ONE_BASED) {
    return validRanges[ZERO_INDEX];
  }

  // Find the range with the most complete information (prefer columns)
  let bestRange = validRanges[ZERO_INDEX];
  // All SourceRange objects have column information, so bestRange is already the first valid range

  // Find earliest start and latest end
  let earliestStart = bestRange.start;
  let latestEnd = bestRange.end;

  for (const range of validRanges) {
    // Compare start positions (line takes precedence over column)
    // When lines are equal, prefer position with defined column, or earlier column if both defined
    // Runtime check needed: test passes undefined via 'as any'
    const earliestStartHasColumn = typeof earliestStart.column !== 'undefined';
    const rangeStartHasColumn = typeof range.start.column !== 'undefined';
    const shouldUpdateStart =
      range.start.line < earliestStart.line ||
      (range.start.line === earliestStart.line &&
        ((!earliestStartHasColumn && rangeStartHasColumn) ||
          (earliestStartHasColumn &&
            rangeStartHasColumn &&
            range.start.column < earliestStart.column)));
    if (shouldUpdateStart) {
      earliestStart = range.start;
    }

    // Compare end positions (line takes precedence over column)
    // When lines are equal, prefer position with defined column, or later column if both defined
    // Runtime check needed: test passes undefined via 'as any'
    const latestEndHasColumn = typeof latestEnd.column !== 'undefined';
    const rangeEndHasColumn = typeof range.end.column !== 'undefined';
    const shouldUpdateEnd =
      range.end.line > latestEnd.line ||
      (range.end.line === latestEnd.line &&
        ((!latestEndHasColumn && rangeEndHasColumn) ||
          (latestEndHasColumn && rangeEndHasColumn && range.end.column > latestEnd.column)));
    if (shouldUpdateEnd) {
      latestEnd = range.end;
    }
  }

  return {
    end: latestEnd,
    start: earliestStart,
  };
}

/**
 * Merge multiple source ranges into one.
 *
 * This is an alias for `spanOf` for API consistency.
 * @param ranges - One or more source ranges to merge.
 * @returns A new SourceRange spanning all input ranges, or null if no valid ranges.
 * @example
 * ```typescript
 * const range1 = { start: { line: 1, column: 1 }, end: { line: 1, column: 10 } };
 * const range2 = { start: { line: 2, column: 1 }, end: { line: 2, column: 10 } };
 * const merged = mergeSourceRanges(range1, range2);
 * // Returns: { start: { line: 1, column: 1 }, end: { line: 2, column: 10 } }
 * ```
 */
function mergeSourceRanges(
  ...ranges: readonly (SourceRange | null | undefined)[]
): SourceRange | null {
  const merged = spanOf(...ranges);
  return isUnknownLocation(merged) ? null : merged;
}

/**
 * Source position utilities.
 */

/**
 * Position in source code (1-based).
 */
interface Position {
  /**
   * 1-based line number.
   */
  readonly line: number;

  /**
   * 1-based column number.
   */
  readonly column: number;
}

/**
 * Check if a position is within a source range.
 * @param position - The position to check.
 * @param range - The source range to check against.
 * @returns True if the position is within the range.
 */
function isPositionInRange(position: Readonly<Position>, range: Readonly<SourceRange>): boolean {
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
 * Check if position is before a range.
 * @param position - The position to check.
 * @param range - The source range to check against.
 * @returns True if the position is before the range.
 */
function isPositionBefore(position: Readonly<Position>, range: Readonly<SourceRange>): boolean {
  if (position.line < range.start.line) {
    return true;
  }
  if (position.line === range.start.line && position.column < range.start.column) {
    return true;
  }
  return false;
}

/**
 * Check if position is after a range.
 * @param position - The position to check.
 * @param range - The source range to check against.
 * @returns True if the position is after the range.
 */
function isPositionAfter(position: Readonly<Position>, range: Readonly<SourceRange>): boolean {
  if (position.line > range.end.line) {
    return true;
  }
  if (position.line === range.end.line && position.column > range.end.column) {
    return true;
  }
  return false;
}

/**
 * Calculate character distance between position and range.
 * @param position - The position to calculate distance from.
 * @param range - The source range to calculate distance to.
 * @returns The distance in characters (0 if within range).
 */
function getDistanceToRange(position: Readonly<Position>, range: Readonly<SourceRange>): number {
  if (isPositionInRange(position, range)) {
    return ZERO_INDEX;
  }

  if (isPositionBefore(position, range)) {
    // Distance to start
    if (position.line === range.start.line) {
      return range.start.column - position.column;
    }
    // Approximate: lines difference + column difference
    return (
      (range.start.line - position.line) * LINES_PER_COLUMN_MULTIPLIER +
      (range.start.column - position.column)
    );
  }

  // Position is after range
  if (position.line === range.end.line) {
    return position.column - range.end.column;
  }
  return (
    (position.line - range.end.line) * LINES_PER_COLUMN_MULTIPLIER +
    (position.column - range.end.column)
  );
}

export type { SourceTextOptions, Position };
export {
  getSourceText,
  getSourceTextForRange,
  getSourceRange,
  locationToOffset,
  offsetToLocation,
  UNKNOWN_SOURCE_LOCATION,
  isUnknownLocation,
  spanOf,
  mergeSourceRanges,
  isPositionInRange,
  isPositionBefore,
  isPositionAfter,
  getDistanceToRange,
};
