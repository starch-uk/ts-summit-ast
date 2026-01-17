/**
 * Batch processing utilities for parsing and analyzing multiple files
 */

import type { ASTNode } from '../ast/base.js';
import type { ApexParseOptions, ApexParseResult } from './apex-parser.js';
import { parseApexCode } from './apex-parser.js';
import type { ExtractCommentsOptions, ExtractedComment } from './comment-mapping.js';
import { extractComments } from './comment-mapping.js';

/**
 * Parse multiple Apex source files efficiently.
 *
 * This function parses multiple source files in sequence and returns
 * all parse results. For better performance, consider using parallel
 * processing or a worker pool for large batches.
 *
 * @param sources - Array of source code strings to parse
 * @param options - Parsing options (applied to all files)
 * @returns Array of parse results, one per source file
 *
 * @example
 * ```typescript
 * const sources = [
 *   'public class Test1 { }',
 *   'public class Test2 { }'
 * ];
 * const results = parseMultipleFiles(sources, { includeComments: true });
 * for (const result of results) {
 *   if (result.isUsable && result.ast) {
 *     console.log(`Parsed: ${result.ast.kind}`);
 *   }
 * }
 * ```
 */
export function parseMultipleFiles(
  sources: string[],
  options: ApexParseOptions = {}
): ApexParseResult[] {
  return sources.map((source) => parseApexCode(source, options));
}

/**
 * Extract comments from multiple ASTs efficiently.
 *
 * This function extracts comments from multiple ASTs in sequence.
 * Each AST must have a corresponding source string in the sources array.
 *
 * @param asts - Array of AST nodes to extract comments from
 * @param sources - Array of source code strings corresponding to each AST
 * @param options - Extraction options (applied to all ASTs)
 * @returns Array of extracted comment arrays, one per AST
 *
 * @example
 * ```typescript
 * const asts = [result1.ast!, result2.ast!];
 * const sources = ['public class Test1 { }', 'public class Test2 { }'];
 * const commentsArrays = extractCommentsBatch(asts, sources, {
 *   associateNodes: true,
 *   commentPatterns: [
 *     { pattern: /^\/\/\s*TODO:/i, type: 'todo' }
 *   ]
 * });
 * ```
 */
export function extractCommentsBatch(
  asts: ASTNode[],
  sources: string[],
  options: ExtractCommentsOptions = {}
): ExtractedComment[][] {
  if (asts.length !== sources.length) {
    throw new Error(
      `Mismatched array lengths: ${asts.length} ASTs but ${sources.length} sources`
    );
  }

  return asts.map((ast, index) => extractComments(ast, sources[index]!, options));
}
