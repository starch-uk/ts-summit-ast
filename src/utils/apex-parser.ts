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
import { parseApexSource } from '../parser/apex/index.js';

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
    /**
     * Start line (for backward compatibility)
     */
    readonly startLine?: number;
    /**
     * End line (for backward compatibility)
     */
    readonly endLine?: number;
  };
  readonly severity?: 'error' | 'warning' | 'info';
  /**
   * Surrounding code snippet for context
   */
  readonly context?: string;
  /**
   * Suggested fix for the error (if available)
   */
  readonly suggestion?: string;
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
  /**
   * Enable AST caching (uses source hash as key)
   * When enabled, repeated parsing of the same source will return cached results
   * Default: false
   */
  readonly enableCache?: boolean;
  /**
   * Cache TTL in milliseconds (default: 5 minutes)
   * Only used when enableCache is true
   */
  readonly cacheTTL?: number;
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
  /**
   * Warnings that occurred during parsing (non-fatal issues)
   * Separated from errors to allow different handling strategies
   */
  readonly warnings?: ApexParseError[];
  /**
   * Indicates if parsing was partially successful
   * (e.g., AST generated but with some errors/warnings)
   */
  readonly partialSuccess?: boolean;
  /**
   * Indicates if the AST is usable despite errors/warnings
   * When true, the AST can be used for analysis even if there are issues
   */
  readonly isUsable?: boolean;
  readonly comments?: ExtractedComment[];
}

/**
 * Type guard for usable parse results.
 * 
 * When `isUsable` is true, the AST is guaranteed to be defined.
 * Use this function to safely narrow the type before accessing the AST.
 *
 * @param result - The parse result to check
 * @returns True if the parse result is usable and AST is defined
 *
 * @example
 * ```typescript
 * const result = parseApexCode('public class Test { }');
 * if (isUsableParseResult(result)) {
 *   // TypeScript now knows result.ast is defined
 *   console.log(result.ast.kind);
 * }
 * ```
 */
export function isUsableParseResult(
  result: ApexParseResult
): result is ApexParseResult & { ast: NonNullable<ASTNode>; isUsable: true } {
  return result.isUsable === true && result.ast !== undefined;
}

/**
 * Parses Apex source code into an AST.
 *
 * This function parses Apex source code using either a provided parseTreeAdapter
 * or the built-in parser. It returns an AST along with any errors or warnings
 * that occurred during parsing.
 *
 * @param source - The Apex source code to parse
 * @param options - Parsing options
 * @param options.includeComments - Whether to extract comments from the source (default: false)
 * @param options.includeLocation - Whether to include location information in nodes (default: true)
 * @param options.includeSource - Whether to include the original source in the result (default: false)
 * @param options.parseTreeAdapter - Optional function to convert source to ParseTreeNode (uses built-in parser if not provided)
 * @param options.onError - Optional callback for errors during parsing
 * @returns Parse result containing AST, errors, warnings, and optionally comments
 *
 * @example
 * ```typescript
 * const result = parseApexCode('public class Test { }');
 * if (isUsableParseResult(result)) {
 *   console.log('Parsing successful');
 *   // result.ast is guaranteed to be defined here
 * }
 * ```
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
  const warnings: ApexParseError[] = [];

  // Use provided adapter or default parser
  let parseTree: ParseTreeNode | null = null;

  if (parseTreeAdapter) {
    parseTree = parseTreeAdapter(source);
  } else {
    // Use built-in parser
    try {
      parseTree = parseApexSource(source);
    } catch (error) {
      errors.push({
        message: error instanceof Error ? error.message : 'Failed to parse source code',
        severity: 'error',
      });
    }
  }

  if (!parseTree) {
    if (errors.length === 0) {
      errors.push({
        message: 'Failed to parse source code',
        severity: 'error',
      });
    }

    return {
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      partialSuccess: false,
      isUsable: false,
      source: includeSource ? source : undefined,
    };
  }

  // Translate parse tree to AST
  const translator = new ASTTranslator({
    includeLocation,
  });

  const translationResult = translator.translate(parseTree);

  // Convert translation errors to parse errors, separating warnings from errors
  for (const error of translationResult.errors) {
    const parseError: ApexParseError = {
      message: error.message,
      location: error.node?.location,
      severity: error.message.toLowerCase().includes('warning') ? 'warning' : 'error',
    };

    if (parseError.severity === 'warning') {
      warnings.push(parseError);
    } else {
      errors.push(parseError);
    }
  }

  // Extract comments if requested
  let comments: ExtractedComment[] | undefined;
  if (includeComments && translationResult.ast) {
    comments = extractComments(translationResult.ast, source, {
      associateNodes: true,
    });
  }

  // Determine if parsing was partially successful and if AST is usable
  const hasAST = translationResult.ast !== undefined;
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const partialSuccess = hasAST && (hasErrors || hasWarnings);
  const isUsable = hasAST && !hasErrors; // Usable if we have AST and no fatal errors

  return {
    ast: translationResult.ast,
    source: includeSource ? source : undefined,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
    partialSuccess,
    isUsable,
    comments,
  };
}
