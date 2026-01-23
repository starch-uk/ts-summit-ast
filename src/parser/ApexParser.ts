/**
 * @file Simple Apex parser - refactored to delegate to helper modules.
 * Parses Apex source code into a parse tree structure.
 */

import type { SourceRange, SourceLocation } from './tree/baseNode.js';
import { ApexLexer } from './apexLexer.js';
import { TokenType, type Token } from './tokenType.js';
import type { ParseTreeNode } from './parseTree.js';
import type { ParserContext } from './ParserContext.js';

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
 * Simple recursive descent parser for Apex.
 * Implements ParserContext and delegates parsing to helper modules.
 * @throws {Error} If parsing fails due to malformed input or unexpected tokens.
 */
export class ApexParser implements ParserContext {
  public readonly tokens: Token[] = [];
  public readonly source: string = '';
  public current = 0;
  public pendingGreaterThan = 0;

  // Constants for array indices and offsets
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Array index constant
  private readonly singleIndexOffset = 1;
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Array index constant
  private readonly zeroIndex = 0;

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

  /**
   * Parse the source code into a parse tree.
   * @returns The parse tree, or null if parsing fails.
   */
  public parse(): ParseTreeNode | null {
    try {
      // Reset pendingGreaterThan at the start of parsing
      this.pendingGreaterThan = 0;
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

  public parseTypeParameters(): ParseTreeNode[] {
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

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Rest parameter array
  public match(...types: TokenType[]): boolean {
    this.skipWhitespaceAndComments();
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Rest parameter array
  public check(type: TokenType, ...types: TokenType[]): boolean {
    // If we have pending > tokens from RIGHT_SHIFT, and we're checking for GREATER_THAN, return true
    const zeroPending = 0;
    if (type === TokenType.GREATER_THAN && this.pendingGreaterThan > zeroPending) {
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
      this.current++;
    }
    return this.previous();
  }

  public isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Default offset
  public peek(offset = 0): Token {
    const pos = this.current + offset;
    const lastElementOffset = 1;
    return this.tokens[pos] ?? this.tokens[this.tokens.length - lastElementOffset];
  }

  public previous(): Token {
    return this.tokens[this.current - this.singleIndexOffset] ?? this.tokens[this.zeroIndex];
  }

  public consume(type: TokenType, message: string): Token {
    // If we have pending > tokens from RIGHT_SHIFT, use one of them
    const zeroPending = 0;
    if (type === TokenType.GREATER_THAN && this.pendingGreaterThan > zeroPending) {
      this.pendingGreaterThan--;
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
      this.pendingGreaterThan++; // Mark that we have one more > available
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
    const lastElementOffset = 1;
    const startToken = this.tokens[Math.min(start, this.tokens.length - lastElementOffset)];

    const previousPositionOffset = 1;
    let endToken =
      this.tokens[Math.min(end - previousPositionOffset, this.tokens.length - lastElementOffset)];

    // endToken is always defined because we use Math.min to ensure valid array access
    let endLocation = endToken.location;

    // If we're at EOF, check if source has trailing newline/whitespace
    const lastTokenIndex = 1;
    if (end >= this.tokens.length - lastTokenIndex && endToken.type === TokenType.EOF) {
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
        const lastLineIndex = 1;
        const lastLine = lines[lastLineNum - lastLineIndex] || '';

        const columnOffset = 1;
        endLocation = {
          column: lastLine.length + columnOffset,
          line: lastLineNum,
        };
      } else {
        // Use the last non-EOF token's location and extend to end of that token
        const secondToLastTokenIndex = 2;
        const lastNonEofToken = this.tokens[this.tokens.length - secondToLastTokenIndex];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- lastNonEofToken can be undefined
        if (lastNonEofToken !== null && lastNonEofToken !== undefined) {
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

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Utility method that may be used as instance method
  public locationToRange(location: SourceLocation): SourceRange {
    return {
      end: location,
      start: location,
    };
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Utility method that may be used as instance method
  public combineLocations(loc1: SourceRange, loc2: SourceRange): SourceRange {
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
export function parseApex(source: string): ParseTreeNode | null {
  const parser = new ApexParser(source);
  return parser.parse();
}
