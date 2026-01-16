/**
 * Apex code parsing utilities
 * 
 * Note: This is a placeholder that requires an external parser.
 * The actual parsing would be done by an external parser library,
 * and this module provides a convenient interface.
 */

import type { ASTNode } from '../ast/base.js';
import type { ParseTreeNode } from '../parser/ParseTreeTypes.js';
import { ASTTranslator } from '../translator/ASTTranslator.js';
import type { ExtractedComment } from './comment-mapping.js';
import { extractComments } from './comment-mapping.js';

/**
 * Apex parse error information
 * Note: This is different from ParseError in parser/ParseTreeTypes.ts
 * This one is for Apex parsing results, the other is for parse tree errors
 */
export interface ApexParseError {
  readonly message: string;
  readonly location?: {
    readonly start: { readonly line: number; readonly column: number };
    readonly end: { readonly line: number; readonly column: number };
  };
  readonly severity?: 'error' | 'warning' | 'info';
}

/**
 * Options for parsing Apex code
 */
export interface ApexParseOptions {
  readonly includeComments?: boolean;
  readonly includeLocation?: boolean;
  readonly includeSource?: boolean; // Include original source in result
  readonly onError?: (error: ApexParseError) => void;
  /**
   * Parser adapter function - converts source code to ParseTreeNode
   * This must be provided by the consumer since we don't include a parser runtime
   */
  readonly parseTreeAdapter?: (source: string) => ParseTreeNode | null;
}

/**
 * Apex parse result
 * Note: This is different from ParseResult in parser/ParseTreeTypes.ts
 * This one is for Apex parsing results, the other is for parse tree results
 */
export interface ApexParseResult {
  readonly ast?: ASTNode;
  readonly source?: string;
  readonly errors: ApexParseError[];
  readonly comments?: ExtractedComment[];
}

/**
 * Parse Apex source code into an AST.
 * 
 * Note: This requires a parseTreeAdapter function to be provided.
 * The adapter should use an external parser to convert source code to ParseTreeNode format.
 */
export function parseApexCode(
  source: string,
  options: ApexParseOptions = {}
): ApexParseResult {
  const {
    includeComments = false,
    includeLocation = true,
    includeSource = false,
    parseTreeAdapter,
  } = options;

  const errors: ApexParseError[] = [];

  // Check if adapter is provided
  if (!parseTreeAdapter) {
    errors.push({
      message: 'No parseTreeAdapter provided. Please provide a parser adapter function.',
      severity: 'error',
    });

    return {
      errors,
      source: includeSource ? source : undefined,
    };
  }

  // Parse source to parse tree
  const parseTree = parseTreeAdapter(source);
  if (!parseTree) {
    errors.push({
      message: 'Failed to parse source code',
      severity: 'error',
    });

    return {
      errors,
      source: includeSource ? source : undefined,
    };
  }

  // Translate parse tree to AST
  const translator = new ASTTranslator({
    includeLocation,
  });

  const translationResult = translator.translate(parseTree);

  // Convert translation errors to parse errors
  for (const error of translationResult.errors) {
    errors.push({
      message: error.message,
      location: error.node?.location,
      severity: 'error',
    });
  }

  // Extract comments if requested
  let comments: ExtractedComment[] | undefined;
  if (includeComments && translationResult.ast) {
    comments = extractComments(translationResult.ast, source, {
      associateNodes: true,
    });
  }

  return {
    ast: translationResult.ast,
    source: includeSource ? source : undefined,
    errors,
    comments,
  };
}
