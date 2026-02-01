/**
 * @file Simple Apex parser - refactored to delegate to helper modules.
 * Parses Apex source code into a parse tree structure.
 */

import type { SourceRange, SourceLocation } from '../ast/baseNode.js';
import {
  DOUBLE_CHAR_OFFSET,
  INITIAL_COUNTER,
  INITIAL_INDEX,
  LAST_ELEMENT_OFFSET,
  PREVIOUS_POSITION_OFFSET,
  SINGLE_CHAR_OFFSET,
} from '../constants.js';
import { ApexLexer } from './apexLexer.js';
import { TokenType, type Token } from './tokenType.js';
import type { ParseTreeNode } from './parseTree.js';

// Import helper modules
import { parseCompilationUnit } from './declarationParser.js';
import { parseDeclaration } from './declarationParser.js';
import { parseClassMember } from './declarationParser.js';
import { parseParameter } from './declarationParser.js';
import {
  parseAnnotation,
  parseAnnotationArgument,
  parseEnumConstant,
} from './declarationParser.js';
import {
  parseTypeParameters,
  parseTypeParameter,
  parseType,
  checkType,
} from './declarationParser.js';
import { parseBlock } from './statementParser.js';
import {
  parseExpression,
  parsePrimary,
  parseLambdaParameter,
  parseSoqlSoslQuery,
  parseNewExpression,
} from './expressionParser.js';
import { parseStatement, parseVariableDeclaration } from './statementParser.js';

/**
 * Parser context interface that provides parsing methods and token utilities.
 * Mutable state is accessed via getters/setters so the type is readonly for callers.
 */
interface ParserContext {
  readonly tokens: readonly Token[];
  readonly source: string;
  readonly getCurrent: () => number;
  readonly setCurrent: (index: number) => void;
  readonly getPendingGreaterThan: () => number;
  readonly setPendingGreaterThan: (value: number) => void;

  readonly parseDeclaration: () => ParseTreeNode | null;
  readonly parseClassMember: () => ParseTreeNode | null;
  readonly parseParameter: () => ParseTreeNode | null;
  readonly parseAnnotation: () => ParseTreeNode | null;
  readonly parseAnnotationArgument: () => ParseTreeNode | null;
  readonly parseEnumConstant: () => ParseTreeNode | null;
  readonly parseTypeParameters: () => readonly ParseTreeNode[];
  readonly parseTypeParameter: () => ParseTreeNode | null;
  readonly parseType: () => ParseTreeNode | null;
  readonly checkType: () => boolean;
  readonly parseBlock: (isClassBody?: boolean) => ParseTreeNode;
  readonly parseStatement: () => ParseTreeNode | null;
  readonly parseExpression: () => ParseTreeNode | null;
  readonly parseVariableDeclaration: () => ParseTreeNode | null;
  readonly parseSoqlSoslQuery: () => ParseTreeNode;
  readonly parseNewExpression: () => ParseTreeNode;
  readonly parseLambdaParameter: () => ParseTreeNode | null;
  readonly parsePrimary: () => ParseTreeNode | null;
  readonly match: (...types: readonly TokenType[]) => boolean;
  readonly check: (type: TokenType, ...types: readonly TokenType[]) => boolean;
  readonly advance: () => Token;
  readonly isAtEnd: () => boolean;
  readonly peek: (offset?: number) => Token;
  readonly previous: () => Token;
  readonly consume: (type: TokenType, message: string) => Token;
  readonly skipWhitespaceAndComments: () => void;
  readonly getLocation: (start: number, end: number) => SourceRange;
  readonly locationToRange: (location: SourceLocation) => SourceRange;
  readonly combineLocations: (loc1: SourceRange, loc2: SourceRange) => SourceRange;
}

/**
 * Simple recursive descent parser for Apex.
 * Implements ParserContext and delegates parsing to helper modules.
 * @throws {Error} If parsing fails due to malformed input or unexpected tokens.
 */
class ApexParser implements ParserContext {
  public readonly tokens: Token[] = [];
  public readonly source: string = '';
  private currentIndex = INITIAL_INDEX;
  private pendingGreaterThanValue = INITIAL_COUNTER;
  private readonly singleIndexOffset = SINGLE_CHAR_OFFSET;
  private readonly zeroIndex = INITIAL_INDEX;

  /**
   * Creates a new apexParser instance.
   * @param _source - The Apex source code to parse.
   * @throws {Error} If tokenization fails.
   */
  public constructor(_source: string) {
    this.source = _source;
    const lexer = new ApexLexer(_source);
    this.tokens = lexer.tokenize();
  }

  public getCurrent(): number {
    return this.currentIndex;
  }

  public setCurrent(index: number): void {
    this.currentIndex = index;
  }

  public getPendingGreaterThan(): number {
    return this.pendingGreaterThanValue;
  }

  public setPendingGreaterThan(value: number): void {
    this.pendingGreaterThanValue = value;
  }

  /**
   * Parse the source code into a parse tree.
   * @returns The parse tree, or null if parsing fails.
   */
  public parse(): ParseTreeNode | null {
    try {
      // Reset pendingGreaterThan at the start of parsing
      this.setPendingGreaterThan(this.zeroIndex);
      return parseCompilationUnit(this);
    } catch {
      // Silently return null on parse errors
      // Error logging can be enabled for debugging if needed
      return null;
    }
  }

  // ============================================================================
  // ParserContext implementation - parsing methods that delegate to helpers
  // ============================================================================

  public parseDeclaration(): ParseTreeNode | null {
    return parseDeclaration(this);
  }

  public parseClassMember(): ParseTreeNode | null {
    return parseClassMember(this);
  }

  public parseParameter(): ParseTreeNode | null {
    return parseParameter(this);
  }

  public parseAnnotation(): ParseTreeNode | null {
    return parseAnnotation(this);
  }

  public parseAnnotationArgument(): ParseTreeNode | null {
    return parseAnnotationArgument(this);
  }

  public parseEnumConstant(): ParseTreeNode | null {
    return parseEnumConstant(this);
  }

  public parseTypeParameters(): readonly ParseTreeNode[] {
    return parseTypeParameters(this);
  }

  public parseTypeParameter(): ParseTreeNode | null {
    return parseTypeParameter(this);
  }

  public parseType(): ParseTreeNode | null {
    return parseType(this);
  }

  public checkType(): boolean {
    return checkType(this);
  }

  public parseBlock(isClassBody = false): ParseTreeNode {
    return parseBlock(this, isClassBody);
  }

  public parseStatement(): ParseTreeNode | null {
    return parseStatement(this);
  }

  public parseExpression(): ParseTreeNode | null {
    return parseExpression(this);
  }

  public parseVariableDeclaration(): ParseTreeNode | null {
    return parseVariableDeclaration(this);
  }

  public parseSoqlSoslQuery(): ParseTreeNode {
    return parseSoqlSoslQuery(this);
  }

  public parseNewExpression(): ParseTreeNode {
    return parseNewExpression(this);
  }

  public parseLambdaParameter(): ParseTreeNode | null {
    return parseLambdaParameter(this);
  }

  public parsePrimary(): ParseTreeNode | null {
    return parsePrimary(this);
  }

  // ============================================================================
  // ParserContext implementation - primitive token helpers
  // ============================================================================

  public match(...types: readonly TokenType[]): boolean {
    this.skipWhitespaceAndComments();
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  public check(type: TokenType, ...types: readonly TokenType[]): boolean {
    // If we have pending > tokens from RIGHT_SHIFT, and we're checking for GREATER_THAN, return true
    const zeroPending = 0;
    if (type === TokenType.GREATER_THAN && this.getPendingGreaterThan() > zeroPending) {
      return true;
    }
    if (this.isAtEnd()) {
      return false;
    }
    if (this.peek().type === type) {
      return true;
    }
    // Also check for RIGHT_SHIFT if we're looking for GREATER_THAN
    if (type === TokenType.GREATER_THAN && this.peek().type === TokenType.RIGHT_SHIFT) {
      return true;
    }
    for (const t of types) {
      if (this.peek().type === t) {
        return true;
      }
      // Also check for RIGHT_SHIFT if we're looking for GREATER_THAN
      if (t === TokenType.GREATER_THAN && this.peek().type === TokenType.RIGHT_SHIFT) {
        return true;
      }
    }
    return false;
  }

  public advance(): Token {
    if (!this.isAtEnd()) {
      this.setCurrent(this.getCurrent() + this.singleIndexOffset);
    }
    return this.previous();
  }

  public isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  public peek(offset = INITIAL_INDEX): Token {
    const pos = this.getCurrent() + offset;
    return this.tokens[pos] ?? this.tokens[this.tokens.length - LAST_ELEMENT_OFFSET];
  }

  public previous(): Token {
    return this.tokens[this.getCurrent() - this.singleIndexOffset] ?? this.tokens[this.zeroIndex];
  }

  public consume(type: TokenType, message: string): Token {
    // If we have pending > tokens from RIGHT_SHIFT, use one of them
    const zeroPending = 0;
    if (type === TokenType.GREATER_THAN && this.getPendingGreaterThan() > zeroPending) {
      this.setPendingGreaterThan(this.getPendingGreaterThan() - this.singleIndexOffset);
      // Return a synthetic GREATER_THAN token
      const currentToken = this.peek();
      return {
        location: currentToken.location,
        text: '>',
        type: TokenType.GREATER_THAN,
      };
    }

    // If we're consuming GREATER_THAN but encounter RIGHT_SHIFT, split it
    if (
      type === TokenType.GREATER_THAN &&
      !this.isAtEnd() &&
      this.peek().type === TokenType.RIGHT_SHIFT
    ) {
      this.advance(); // Consume the RIGHT_SHIFT
      this.setPendingGreaterThan(this.getPendingGreaterThan() + this.singleIndexOffset); // Mark that we have one more > available
      // Return a synthetic GREATER_THAN token
      const consumedToken = this.previous();
      return {
        location: consumedToken.location,
        text: '>',
        type: TokenType.GREATER_THAN,
      };
    }

    if (this.check(type)) {
      return this.advance();
    }
    throw new Error(message);
  }

  public skipWhitespaceAndComments(): void {
    while (
      !this.isAtEnd() &&
      (this.peek().type === TokenType.WHITESPACE ||
        this.peek().type === TokenType.LINE_COMMENT ||
        this.peek().type === TokenType.BLOCK_COMMENT ||
        this.peek().type === TokenType.NEWLINE)
    ) {
      this.advance();
    }
  }

  public getLocation(start: number, end: number): SourceRange {
    const startToken = this.tokens[Math.min(start, this.tokens.length - LAST_ELEMENT_OFFSET)];
    let endToken =
      this.tokens[
        Math.min(end - PREVIOUS_POSITION_OFFSET, this.tokens.length - LAST_ELEMENT_OFFSET)
      ];

    // endToken is always defined because we use Math.min to ensure valid array access
    let endLocation = endToken.location;

    // If we're at EOF, check if source has trailing newline/whitespace
    if (end >= this.tokens.length - LAST_ELEMENT_OFFSET && endToken.type === TokenType.EOF) {
      // Count lines in source
      const lines = this.source.split(/\r?\n/);
      const lastLineNum = lines.length;

      // Check if source ends with newline
      if (this.source.endsWith('\n') || this.source.endsWith('\r\n')) {
        // If source ends with newline, the split creates an empty line at the end
        // So lines.length already includes that empty line
        // The end location should be on that last line (which is empty), column 0 (1-based)
        endLocation = {
          column: 0,
          line: lastLineNum,
        };
      } else if (this.source.endsWith(' ') || this.source.endsWith('\t')) {
        // Source ends with whitespace (but not newline)
        const lastLine = lines[lastLineNum - LAST_ELEMENT_OFFSET] || '';

        endLocation = {
          column: lastLine.length + SINGLE_CHAR_OFFSET,
          line: lastLineNum,
        };
      } else {
        // Use the last non-EOF token's location and extend to end of that token
        const lastNonEofToken = this.tokens[this.tokens.length - DOUBLE_CHAR_OFFSET];
        if (lastNonEofToken != null) {
          endLocation = {
            column: lastNonEofToken.location.column + lastNonEofToken.text.length,
            line: lastNonEofToken.location.line,
          };
        }
      }
    }

    return {
      end: endLocation,
      // startToken is always defined because we use Math.min to ensure valid array access
      start: startToken.location,
    };
  }

  public locationToRange(location: SourceLocation): SourceRange {
    void this;
    return {
      end: location,
      start: location,
    };
  }

  public combineLocations(loc1: SourceRange, loc2: SourceRange): SourceRange {
    void this;
    return {
      end: loc2.end,
      start: loc1.start,
    };
  }
}

/**
 * Convenience function to parse Apex source code.
 * High-level parsing function that wraps ApexParser.
 * @param source - The Apex source code to parse.
 * @returns The parse tree node, or null if parsing fails.
 */
function parseApex(source: string): ParseTreeNode | null {
  const parser = new ApexParser(source);
  return parser.parse();
}

export type { ParserContext };
export { ApexParser, parseApex };
