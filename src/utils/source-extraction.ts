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

  // Handle single line
  if (start.line === end.line) {
    const line = lines[start.line - 1] || '';
    const text = line.substring(start.column - 1, end.column);
    return options.trim ? text.trim() : text;
  }

  // Handle multi-line
  const result: string[] = [];

  // First line
  const firstLine = lines[start.line - 1] || '';
  result.push(firstLine.substring(start.column - 1));

  // Middle lines
  for (let i = start.line; i < end.line - 1; i++) {
    result.push(lines[i] || '');
  }

  // Last line
  const lastLine = lines[end.line - 1] || '';
  result.push(lastLine.substring(0, end.column));

  const text = result.join('\n');
  return options.trim ? text.trim() : text;
}

/**
 * Get the source range for an AST node
 */
export function getSourceRange(node: ASTNode): SourceRange | null {
  return node.location || null;
}

/**
 * Source location type
 */
interface SourceLocation {
  readonly line: number;
  readonly column: number;
  readonly offset?: number;
}

/**
 * Convert source location to character offset
 */
export function locationToOffset(
  location: SourceLocation,
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
