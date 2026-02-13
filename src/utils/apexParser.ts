/**
 * @file Apex code parsing utilities.
 *
 * Uses the built-in parser (parseApexSource) by default.
 * Callers may provide a parseTreeAdapter to use an external parser instead.
 */

import { readFileSync } from 'fs';
import type { ASTNode } from '../ast/baseNode.js';
import { MIN_NON_EMPTY_ARRAY_LENGTH } from '../constants.js';
import type { ParseTreeNode } from '../parser/parseTree.js';
import { ASTTranslator } from '../translator/astTranslator.js';
import { parseApexSource } from '../parser/index.js';
import { ApexLexer } from '../parser/apexLexer.js';
import { TokenType } from '../parser/tokenType.js';
import type { ExtractedComment, ExtractCommentsOptions } from './commentUtils.js';
import { extractComments } from './commentUtils.js';
import { attachDeclarationMetadata } from './declarationUtils.js';

/**
 * Exception to propagate parse/syntax errors or AST translation problems.
 * Matches summit-ast SummitAST.ParseException.
 */
class ParseException extends Error {
  public override readonly name = 'ParseException';
  public readonly cause?: Error;

  public constructor(message: string, cause?: Readonly<Error>) {
    super(message);
    this.cause = cause;
    Object.setPrototypeOf(this, ParseException.prototype);
  }
}

/**
 * The type of top-level declaration in an input.
 * Matches summit-ast SummitAST.CompilationType.
 */
enum CompilationType {
  CLASS = 'CLASS',
  TRIGGER = 'TRIGGER',
}

/**
 * Apex parse error information
 * Note: This is different from ParseError in parser/parseTree.ts
 * This one is for Apex parsing results, the other is for parse tree errors.
 */
interface ApexParseError {
  readonly message: string;
  readonly location?: {
    readonly start: { readonly line: number; readonly column: number };
    readonly end: { readonly line: number; readonly column: number };

    /**
     * Start line (for backward compatibility).
     */
    readonly startLine?: number;

    /**
     * End line (for backward compatibility).
     */
    readonly endLine?: number;
  };
  readonly severity?: 'error' | 'info' | 'warning';

  /**
   * Surrounding code snippet for context.
   */
  readonly context?: string;

  /**
   * Suggested fix for the error (if available).
   */
  readonly suggestion?: string;
}

/**
 * Options for parsing Apex code.
 */
interface ApexParseOptions {
  readonly includeComments?: boolean;
  readonly includeLocation?: boolean;

  /**
   * Include original source in result.
   */
  readonly includeSource?: boolean;
  readonly onError?: (error: ApexParseError) => void;

  /**
   * Parser adapter function - converts source code to ParseTreeNode
   * This must be provided by the consumer since we don't include a parser runtime.
   */
  readonly parseTreeAdapter?: (source: string) => ParseTreeNode | null;

  /**
   * Enable AST caching (uses source hash as key)
   * When enabled, repeated parsing of the same source will return cached results
   * Default: false.
   */
  readonly enableCache?: boolean;

  /**
   * Cache TTL in milliseconds (default: 5 minutes)
   * Only used when enableCache is true.
   */
  readonly cacheTTL?: number;

  /**
   * Explicit compilation type. When provided, the source must match this type.
   * If the source starts with class/interface/enum but TRIGGER is specified
   * (or starts with trigger but CLASS is specified), ParseException is thrown.
   */
  readonly compilationType?: CompilationType;
}

/**
 * Apex parse result
 * Note: This is different from ParseResult in parser/parseTree.ts
 * This one is for Apex parsing results, the other is for parse tree results.
 */
interface ApexParseResult {
  readonly ast?: ASTNode;
  readonly source?: string;
  readonly errors: readonly ApexParseError[];

  /**
   * Warnings that occurred during parsing (non-fatal issues)
   * Separated from errors to allow different handling strategies.
   */
  readonly warnings?: readonly ApexParseError[];

  /**
   * Indicates if parsing was partially successful
   * (e.g., AST generated but with some errors/warnings).
   */
  readonly partialSuccess?: boolean;

  /**
   * Indicates if the AST is usable despite errors/warnings
   * When true, the AST can be used for analysis even if there are issues.
   */
  readonly isUsable?: boolean;
  readonly comments?: readonly ExtractedComment[];
}

/**
 * Minimal readonly view of a parse result used by helpers like isUsableParseResult.
 * Deliberately only includes the fields those helpers actually read.
 */
interface ApexParseResultView {
  readonly ast?: ASTNode;
  readonly isUsable?: boolean;
}

const INDEX_FIRST = 0;

/**
 * Determines the CompilationType of the source by lexing until a declaration keyword.
 * If class, interface, or enum is found before the body, returns CLASS.
 * If trigger is found, returns TRIGGER.
 * Otherwise defaults to CLASS.
 * @param source - The Apex source code to inspect.
 * @returns CompilationType.CLASS or CompilationType.TRIGGER.
 */
function determineCompilationType(source: string): CompilationType {
  const lexer = new ApexLexer(source);
  const tokens = lexer.tokenize();

  for (const token of tokens) {
    if (token.type === TokenType.LEFT_BRACE || token.type === TokenType.EOF) {
      break;
    }
    /* eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- only CLASS/INTERFACE/ENUM/TRIGGER affect result; others fall through. */
    switch (token.type) {
      case TokenType.CLASS:
      case TokenType.INTERFACE:
      case TokenType.ENUM:
        return CompilationType.CLASS;
      case TokenType.TRIGGER:
        return CompilationType.TRIGGER;
      default:
        break;
    }
  }

  return CompilationType.CLASS;
}

/**
 * Type guard for usable parse results.
 *
 * When `isUsable` is true, the AST is guaranteed to be defined.
 * Use this function to safely narrow the type before accessing the AST.
 * @param result - The parse result to check.
 * @returns True if the parse result is usable and AST is defined.
 * @example
 * ```typescript
 * const result = parseApexCode('public class Test { }');
 * if (isUsableParseResult(result)) {
 *   // TypeScript now knows result.ast is defined
 *   console.log(result.ast.kind);
 * }
 * ```
 */
function isUsableParseResult(
  result: ApexParseResultView
): result is ApexParseResultView & { ast: NonNullable<ASTNode>; isUsable: true } {
  return result.isUsable === true && result.ast !== undefined;
}

/**
 * Parses Apex source code into an AST.
 *
 * This function parses Apex source code using either a provided parseTreeAdapter
 * or the built-in parser. It returns an AST along with any errors or warnings
 * that occurred during parsing.
 * @param source - The Apex source code to parse.
 * @param options - Parsing options.
 * @param options.includeComments - Whether to extract comments from the source (default: false).
 * @param options.includeLocation - Whether to include location information in nodes (default: true).
 * @param options.includeSource - Whether to include the original source in the result (default: false).
 * @param options.parseTreeAdapter - Optional function to convert source to ParseTreeNode (uses built-in parser if not provided).
 * @param options.onError - Optional callback for errors during parsing.
 * @returns Parse result containing AST, comments, etc. On parse/translation failure, throws ParseException.
 * @throws {ParseException} On parse failure or translation errors (matches upstream).
 * @example
 * ```typescript
 * const result = parseApexCode('public class Test { }');
 * if (isUsableParseResult(result)) {
 *   console.log('Parsing successful');
 *   // result.ast is guaranteed to be defined here
 * }
 * ```
 */
function parseApexCode(
  source: string,
  options: Readonly<ApexParseOptions> = {} as ApexParseOptions
): ApexParseResult {
  const {
    includeComments = false,
    includeLocation = true,
    includeSource = false,
    parseTreeAdapter,
    compilationType: explicitType,
  } = options;

  // When explicit compilation type is provided, verify source matches.
  if (explicitType !== undefined) {
    const actualType = determineCompilationType(source);
    if (actualType !== explicitType) {
      throw new ParseException(
        `Compilation type mismatch: expected ${explicitType} but source is ${actualType}`
      );
    }
  }

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
    if (errors.length === INDEX_FIRST) {
      errors.push({
        message: 'Failed to parse source code',
        severity: 'error',
      });
    }
    throw new ParseException(
      errors.map((e) => e.message).join('\n'),
      errors[INDEX_FIRST]?.message ? new Error(errors[INDEX_FIRST].message) : undefined
    );
  }

  // Translate parse tree to AST
  const translator = new ASTTranslator({
    includeLocation,
  });

  const translationResult = translator.translate(parseTree);

  // Convert translation errors to parse errors, separating warnings from errors
  for (const error of translationResult.errors) {
    const parseError: ApexParseError = {
      location: error.node?.location,
      message: error.message,
      severity: error.message.toLowerCase().includes('warning') ? 'warning' : 'error',
    };

    if (parseError.severity === 'warning') {
      warnings.push(parseError);
    } else {
      errors.push(parseError);
    }
  }

  // Extract comments if requested

  let comments: ExtractedComment[] | undefined = undefined;
  if (includeComments && translationResult.ast !== undefined) {
    comments = extractComments(translationResult.ast, source, {
      associateNodes: true,
    });
  }

  // Determine if parsing was partially successful and if AST is usable
  const hasAST = translationResult.ast !== undefined;

  // Populate Declaration.qualifiedName and parent (matches upstream)
  if (translationResult.ast) {
    attachDeclarationMetadata(translationResult.ast);
  }

  const hasErrors = errors.length > INDEX_FIRST;

  if (hasErrors || !hasAST) {
    throw new ParseException(
      errors.map((e) => e.message).join('\n'),
      errors[INDEX_FIRST]?.message ? new Error(errors[INDEX_FIRST].message) : undefined
    );
  }

  return {
    ast: translationResult.ast,
    comments,
    errors,
    isUsable: true,
    partialSuccess: false,
    source: includeSource ? source : undefined,
    warnings: warnings.length > MIN_NON_EMPTY_ARRAY_LENGTH ? warnings : undefined,
  };
}

/**
 * Batch processing utilities for parsing and analyzing multiple files.
 */

/**
 * Parse multiple Apex source files efficiently.
 *
 * This function parses multiple source files in sequence and returns
 * all parse results. For better performance, consider using parallel
 * processing or a worker pool for large batches.
 * @param sources - Array of source code strings to parse.
 * @param options - Parsing options (applied to all files).
 * @returns Array of parse results, one per source file.
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
function parseMultipleFiles(
  sources: readonly string[],
  options: ApexParseOptions = {} as ApexParseOptions
): ApexParseResult[] {
  return sources.map((source) => {
    try {
      return parseApexCode(source, options);
    } catch (err) {
      return {
        errors: [
          { message: err instanceof Error ? err.message : 'Parse failed', severity: 'error' },
        ],
        isUsable: false,
        partialSuccess: false,
        source: options.includeSource === true ? source : undefined,
      };
    }
  });
}

/**
 * Extract comments from multiple ASTs efficiently.
 *
 * This function extracts comments from multiple ASTs in sequence.
 * Each AST must have a corresponding source string in the sources array.
 * @param asts - Array of AST nodes to extract comments from.
 * @param sources - Array of source code strings corresponding to each AST.
 * @param options - Extraction options (applied to all ASTs).
 * @returns Array of extracted comment arrays, one per AST.
 * @throws {Error} If the lengths of asts and sources arrays do not match.
 * @example
 * ```typescript
 * const asts = [result1.ast ?? null, result2.ast ?? null].filter((ast): ast is ASTNode => ast !== null);
 * const sources = ['public class Test1 { }', 'public class Test2 { }'];
 * const commentsArrays = extractCommentsBatch(asts, sources, {
 *   associateNodes: true,
 *   commentPatterns: [
 *     { pattern: /^\/\/\s*TODO:/i, type: 'todo' }
 *   ]
 * });
 * ```
 */
const EMPTY_EXTRACT_COMMENTS_OPTIONS: ExtractCommentsOptions = {};

/**
 * Readonly view of extract-comments options used at API boundaries.
 * Kept intentionally small and free of obviously mutable shapes.
 */
interface ExtractCommentsOptionsView {
  readonly includeBlockComments?: boolean;
  readonly includeLineComments?: boolean;
  readonly associateNodes?: boolean;
  readonly parseApexDoc?: boolean;
}

/**
 * Extract comments from multiple ASTs efficiently.
 *
 * This function extracts comments from multiple ASTs in sequence.
 * Each AST must have a corresponding source string in the sources array.
 * @param asts - Array of AST nodes to extract comments from.
 * @param sources - Array of source code strings corresponding to each AST.
 * @param options - Extraction options (applied to all ASTs).
 * @returns Array of extracted comment arrays, one per AST.
 * @throws {Error} If the lengths of asts and sources arrays do not match.
 */
function extractCommentsBatch(
  asts: readonly ASTNode[],
  sources: readonly string[],
  options: ExtractCommentsOptionsView = EMPTY_EXTRACT_COMMENTS_OPTIONS
): ExtractedComment[][] {
  if (asts.length !== sources.length) {
    throw new Error(
      `Mismatched array lengths: ${String(asts.length)} ASTs but ${String(sources.length)} sources`
    );
  }

  return asts.map((ast, index) => extractComments(ast, sources[index], options));
}

/** File path type for parseAndTranslate. Use when parsing from file. Matches upstream SummitAST.parseAndTranslate(path: Path). */
/* eslint-disable-next-line @typescript-eslint/no-type-alias -- public API type for path overload. */
type Path = string;

/**
 * Parses and translates Apex from a file path. Type is determined from extension.
 * Matches summit-ast SummitAST.parseAndTranslate(path: Path).
 * @param path - File path (.cls or .trigger).
 * @returns The CompilationUnit AST.
 * @throws {ParseException} On parse failure or translation failure.
 */
function parseAndTranslateFromPathInternal(path: string): ASTNode {
  const ext = path.toLowerCase().endsWith('.cls')
    ? '.cls'
    : path.toLowerCase().endsWith('.trigger')
      ? '.trigger'
      : null;
  if (!ext) {
    throw new Error(`Unexpected file type: ${path}. Expected .cls or .trigger`);
  }
  const type = ext === '.cls' ? CompilationType.CLASS : CompilationType.TRIGGER;
  const source = readFileSync(path, 'utf-8');
  /* eslint-disable-next-line @typescript-eslint/no-use-before-define -- circular with parseAndTranslate. */
  return parseAndTranslate(source, type);
}

/**
 * Parses and translates Apex from a file path. Type is determined from extension.
 * Matches summit-ast SummitAST.parseAndTranslate(path: Path).
 * @param path - File path (.cls or .trigger).
 * @returns The CompilationUnit AST.
 * @throws {ParseException} On parse failure or translation failure.
 */
function parseAndTranslate(path: Path): ASTNode;

/**
 * Parses and translates Apex source to a CompilationUnit.
 * Throws ParseException on parse/translation errors or compilation type mismatch.
 * Matches summit-ast SummitAST.parseAndTranslate(string, type?) API.
 * @param source - Apex source code.
 * @param type - Optional explicit compilation type. When provided, source must match.
 * @returns The CompilationUnit AST.
 * @throws {ParseException} On parse failure, translation failure, or type mismatch.
 */
function parseAndTranslate(source: string, type?: CompilationType | null): ASTNode;

function parseAndTranslate(pathOrSource: Path, type?: CompilationType | null): ASTNode {
  const s = pathOrSource;
  if (type === undefined || type === null) {
    if (s.toLowerCase().endsWith('.cls') || s.toLowerCase().endsWith('.trigger')) {
      return parseAndTranslateFromPathInternal(s);
    }
  }
  const result = parseApexCode(s, {
    compilationType: type ?? undefined,
    includeLocation: true,
  });
  const { ast } = result;
  if (ast === undefined) {
    throw new ParseException('Parse produced no AST');
  }
  return ast;
}

/**
 * Parses and translates Apex from a file path. Deprecated: use parseAndTranslate(path) instead.
 * @param path - File path (.cls or .trigger).
 * @returns The CompilationUnit AST.
 * @throws {ParseException} On parse failure or translation failure.
 * @deprecated Use parseAndTranslate(path) instead. Kept for backward compatibility.
 */
function parseAndTranslateFromPath(path: string): ASTNode {
  return parseAndTranslateFromPathInternal(path);
}

export type { ApexParseError, ApexParseOptions, ApexParseResult, Path };
export {
  CompilationType,
  ParseException,
  extractCommentsBatch,
  isUsableParseResult,
  parseAndTranslate,
  parseAndTranslateFromPath,
  parseApexCode,
  parseMultipleFiles,
};
