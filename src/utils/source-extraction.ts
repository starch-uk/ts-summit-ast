/**
 * Source code extraction utilities
 */

import type { ASTNode, SourceRange } from '../ast/base.js';

/**
 * Options for source text extraction
 */
export interface SourceTextOptions {
  readonly includeComments?: boolean; // Include associated comments
  readonly includeWhitespace?: boolean; // Include leading/trailing whitespace
  readonly trim?: boolean; // Trim whitespace from result
}

/**
 * Get the source code text for an AST node
 * 
 * This follows the original summit-ast implementation:
 * - Columns in the original are 0-based, but our TypeScript uses 1-based
 * - The range is exclusive of the character at endLine/endColumn
 * - extractFrom uses: lines.subList(startLine-1, endLine), then drops startColumn from start
 *   and (lastLine.length - endColumn) from end
 * 
 * Original Kotlin code:
 * ```kotlin
 * val lines = source.lines().subList(startLine!! - 1, endLine!!)
 * val joinedLines = lines.joinToString(separator = "\n")
 * val distanceFromStart = startColumn!!
 * val distanceFromEnd = lines.last().length - endColumn!!
 * return joinedLines.drop(distanceFromStart).dropLast(distanceFromEnd)
 * ```
 */
export function getSourceText(
  node: ASTNode,
  source: string,
  options: SourceTextOptions = {}
): string {
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
  const startLineIndex = start.line - 1; // Convert to 0-based index
  const endLineIndex = end.line; // endLine is exclusive, so slice uses endLine directly
  
  // Get the relevant lines (equivalent to subList)
  const relevantLines = lines.slice(startLineIndex, endLineIndex);
  
  if (relevantLines.length === 0) {
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
  const distanceFromStart = start.column - 1; // Convert 1-based to 0-based
  const lastLine = relevantLines[relevantLines.length - 1] || '';
  
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
  if (distanceFromStart > 0) {
    text = text.substring(distanceFromStart);
  }
  if (distanceFromEnd > 0 && text.length >= distanceFromEnd) {
    text = text.substring(0, text.length - distanceFromEnd);
  }

  return options.trim ? text.trim() : text;
}

/**
 * Get the source range for an AST node
 */
export function getSourceRange(node: ASTNode): SourceRange | null {
  return node.location || null;
}

/**
 * Source location type (local interface for this module)
 */
interface LocalSourceLocation {
  readonly line: number;
  readonly column: number;
  readonly offset?: number;
}

/**
 * Convert source location to character offset
 */
export function locationToOffset(
  location: LocalSourceLocation,
  source: string
): number {
  const lines = source.split(/\r?\n/);
  let offset = 0;

  // Add lengths of all lines before the target line
  for (let i = 0; i < location.line - 1 && i < lines.length; i++) {
    offset += lines[i].length + 1; // +1 for newline
  }

  // Add column offset
  offset += location.column - 1;

  return offset;
}

/**
 * Convert character offset to source location
 */
export function offsetToLocation(
  offset: number,
  source: string
): { line: number; column: number } {
  const lines = source.split(/\r?\n/);
  let currentOffset = 0;
  let line = 1;
  let column = 1;

  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i].length;
    const lineEnd = currentOffset + lineLength;

    if (offset <= lineEnd) {
      line = i + 1;
      column = offset - currentOffset + 1;
      break;
    }

    currentOffset = lineEnd + 1; // +1 for newline
  }

  return { line, column };
}

/**
 * UNKNOWN source location constant
 */
export const UNKNOWN_SOURCE_LOCATION: SourceRange = {
  start: { line: 0, column: 0 },
  end: { line: 0, column: 0 },
};

/**
 * Check if a source range is unknown
 */
export function isUnknownLocation(range: SourceRange): boolean {
  return (
    range.start.line === 0 &&
    range.start.column === 0 &&
    range.end.line === 0 &&
    range.end.column === 0
  );
}

/**
 * Combine multiple source ranges into a single span.
 * 
 * This function chooses the most complete location information:
 * - Prefers ranges with both line and column over those with only lines
 * - Returns a new range from the earliest start to the latest end
 * - Handles unknown locations gracefully
 * 
 * @param ranges One or more source ranges to combine
 * @returns A new SourceRange spanning all input ranges
 */
export function spanOf(...ranges: (SourceRange | null | undefined)[]): SourceRange {
  // Filter out null/undefined and unknown locations
  const validRanges = ranges.filter(
    (r): r is SourceRange => r !== null && r !== undefined && !isUnknownLocation(r)
  );

  if (validRanges.length === 0) {
    return UNKNOWN_SOURCE_LOCATION;
  }

  if (validRanges.length === 1) {
    return validRanges[0];
  }

  // Find the range with the most complete information (prefer columns)
  let bestRange = validRanges[0];
  for (const range of validRanges) {
    // Prefer ranges that have column information
    if (
      range.start.column !== undefined &&
      range.end.column !== undefined &&
      (bestRange.start.column === undefined || bestRange.end.column === undefined)
    ) {
      bestRange = range;
    }
  }

  // Find earliest start and latest end
  let earliestStart = bestRange.start;
  let latestEnd = bestRange.end;

  for (const range of validRanges) {
    // Compare start positions (line takes precedence over column)
    if (
      range.start.line < earliestStart.line ||
      (range.start.line === earliestStart.line &&
        range.start.column !== undefined &&
        earliestStart.column !== undefined &&
        range.start.column < earliestStart.column)
    ) {
      earliestStart = range.start;
    }

    // Compare end positions (line takes precedence over column)
    if (
      range.end.line > latestEnd.line ||
      (range.end.line === latestEnd.line &&
        range.end.column !== undefined &&
        latestEnd.column !== undefined &&
        range.end.column > latestEnd.column)
    ) {
      latestEnd = range.end;
    }
  }

  return {
    start: earliestStart,
    end: latestEnd,
  };
}
