/**
 * @file Simple Apex lexer/tokenizer.
 * Handles basic Apex syntax without external dependencies.
 */

import {
  DOUBLE_CHAR_OFFSET,
  INITIAL_LINE,
  INITIAL_POSITION,
  LEXER_INITIAL_COLUMN,
  QUADRUPLE_CHAR_OFFSET,
  SINGLE_CHAR_OFFSET,
  TRIPLE_CHAR_OFFSET,
} from '../constants.js';
import { TokenType, type Token } from './tokenType.js';

/**
 * Simple Apex lexer.
 */
export class ApexLexer {
  private readonly source: string;
  private readonly initialPosition = INITIAL_POSITION;
  private readonly initialLine = INITIAL_LINE;
  private readonly initialColumn = LEXER_INITIAL_COLUMN;
  private readonly singleCharOffset = SINGLE_CHAR_OFFSET;
  private readonly doubleCharOffset = DOUBLE_CHAR_OFFSET;
  private readonly tripleCharOffset = TRIPLE_CHAR_OFFSET;
  private readonly quadrupleCharOffset = QUADRUPLE_CHAR_OFFSET;
  private position = this.initialPosition;
  private line = this.initialLine;
  private column = this.initialColumn;
  private tokens: Token[] = [];

  /**
   * Keyword map (case-insensitive).
   */
  private readonly keywords = new Map<string, TokenType>([
    ['public', TokenType.PUBLIC],
    ['private', TokenType.PRIVATE],
    ['protected', TokenType.PROTECTED],
    ['global', TokenType.GLOBAL],
    ['static', TokenType.STATIC],
    ['final', TokenType.FINAL],
    ['abstract', TokenType.ABSTRACT],
    ['class', TokenType.CLASS],
    ['interface', TokenType.INTERFACE],
    ['enum', TokenType.ENUM],
    ['trigger', TokenType.TRIGGER],
    ['void', TokenType.VOID],
    ['return', TokenType.RETURN],
    ['if', TokenType.IF],
    ['else', TokenType.ELSE],
    ['for', TokenType.FOR],
    ['while', TokenType.WHILE],
    ['do', TokenType.DO],
    ['switch', TokenType.SWITCH],
    ['case', TokenType.CASE],
    ['default', TokenType.DEFAULT],
    ['break', TokenType.BREAK],
    ['continue', TokenType.CONTINUE],
    ['try', TokenType.TRY],
    ['catch', TokenType.CATCH],
    ['finally', TokenType.FINALLY],
    ['throw', TokenType.THROW],
    ['new', TokenType.NEW],
    ['this', TokenType.THIS],
    ['super', TokenType.SUPER],
    ['null', TokenType.NULL_LITERAL],
    ['true', TokenType.BOOLEAN_LITERAL],
    ['false', TokenType.BOOLEAN_LITERAL],
    ['extends', TokenType.EXTENDS],
    ['implements', TokenType.IMPLEMENTS],
    ['with', TokenType.WITH],
    ['sharing', TokenType.SHARING],
    ['without', TokenType.WITHOUT],
    ['inherited', TokenType.INHERITED],
    ['testmethod', TokenType.TESTMETHOD],
    ['webservice', TokenType.WEBSERVICE],
    ['future', TokenType.FUTURE],
    ['database', TokenType.DATABASE],
    ['override', TokenType.OVERRIDE],
    ['virtual', TokenType.VIRTUAL],
    ['transient', TokenType.TRANSIENT],
    ['integer', TokenType.INTEGER],
    ['string', TokenType.STRING],
    ['boolean', TokenType.BOOLEAN],
    ['decimal', TokenType.DECIMAL],
    ['double', TokenType.DOUBLE],
    ['long', TokenType.LONG],
    ['date', TokenType.DATE],
    ['datetime', TokenType.DATETIME],
    ['time', TokenType.TIME],
    ['id', TokenType.ID],
    ['blob', TokenType.BLOB],
    ['object', TokenType.OBJECT],
  ]);

  public constructor(source: string) {
    this.source = source;
  }

  /**
   * Tokenize the source code.
   * @returns Array of tokens.
   */
  public tokenize(): Token[] {
    this.tokens = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;

    while (this.position < this.source.length) {
      const token = this.nextToken();
      if (token) {
        this.tokens.push(token);
      }
    }

    // Add EOF token
    this.tokens.push({
      location: { column: this.column, line: this.line },
      text: '',
      type: TokenType.EOF,
    });

    return this.tokens;
  }

  /**
   * Get next token.
   * @returns The next token, or null if at end of source.
   */
  private nextToken(): Token | null {
    if (this.position >= this.source.length) {
      return null;
    }

    const startLine = this.line;
    const startCol = this.column;
    const char = this.source[this.position];

    // Skip whitespace
    if (this.isWhitespace(char)) {
      return this.skipWhitespace();
    }

    // Line comment
    if (char === '/' && this.peek(this.singleCharOffset) === '/') {
      return this.readLineComment();
    }

    // Block comment
    if (char === '/' && this.peek(this.singleCharOffset) === '*') {
      return this.readBlockComment();
    }

    // String literal
    if (char === '"' || char === "'") {
      return this.readStringLiteral(char);
    }

    // Number literal
    if (this.isDigit(char)) {
      return this.readNumberLiteral();
    }

    // Identifier or keyword
    if (this.isIdentifierStart(char)) {
      return this.readIdentifier();
    }

    // Operators and punctuation
    if (char === '+') {
      if (this.peek(this.singleCharOffset) === '+') {
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.INCREMENT, '++', startLine, startCol);
      }
      if (this.peek(this.singleCharOffset) === '=') {
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.PLUS_ASSIGN, '+=', startLine, startCol);
      }
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.PLUS, '+', startLine, startCol);
    }

    if (char === '-') {
      if (this.peek(this.singleCharOffset) === '-') {
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.DECREMENT, '--', startLine, startCol);
      }
      if (this.peek(this.singleCharOffset) === '=') {
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.MINUS_ASSIGN, '-=', startLine, startCol);
      }
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.MINUS, '-', startLine, startCol);
    }

    if (char === '*') {
      if (this.peek(this.singleCharOffset) === '=') {
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.MULTIPLY_ASSIGN, '*=', startLine, startCol);
      }
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.MULTIPLY, '*', startLine, startCol);
    }

    if (char === '/') {
      if (this.peek(this.singleCharOffset) === '=') {
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.DIVIDE_ASSIGN, '/=', startLine, startCol);
      }
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.DIVIDE, '/', startLine, startCol);
    }

    if (char === '%') {
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.MODULO, '%', startLine, startCol);
    }

    if (char === '=') {
      if (this.peek(this.singleCharOffset) === '=') {
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.EQUALS, '==', startLine, startCol);
      }
      if (this.peek(this.singleCharOffset) === '>') {
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.ARROW, '=>', startLine, startCol);
      }
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.ASSIGN, '=', startLine, startCol);
    }

    if (char === '!') {
      if (this.peek(this.singleCharOffset) === '=') {
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.NOT_EQUALS, '!=', startLine, startCol);
      }
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.NOT, '!', startLine, startCol);
    }

    if (char === '<') {
      if (this.peek(this.singleCharOffset) === '<') {
        // Check for << or <<=
        if (this.peek(this.doubleCharOffset) === '=') {
          this.advance(this.tripleCharOffset);
          return this.createToken(TokenType.LEFT_SHIFT_ASSIGN, '<<=', startLine, startCol);
        }
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.LEFT_SHIFT, '<<', startLine, startCol);
      }
      if (this.peek(this.singleCharOffset) === '=') {
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.LESS_EQUAL, '<=', startLine, startCol);
      }
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.LESS_THAN, '<', startLine, startCol);
    }

    if (char === '>') {
      if (this.peek(this.singleCharOffset) === '>') {
        // Check for >>, >>>, >>=, or >>>=
        if (this.peek(this.doubleCharOffset) === '>') {
          // >>> or >>>=
          if (this.peek(this.tripleCharOffset) === '=') {
            this.advance(this.quadrupleCharOffset);
            return this.createToken(
              TokenType.RIGHT_SHIFT_UNSIGNED_ASSIGN,
              '>>>=',
              startLine,
              startCol
            );
          }
          this.advance(this.tripleCharOffset);
          return this.createToken(TokenType.RIGHT_SHIFT_UNSIGNED, '>>>', startLine, startCol);
        }
        if (this.peek(this.doubleCharOffset) === '=') {
          this.advance(this.tripleCharOffset);
          return this.createToken(TokenType.RIGHT_SHIFT_ASSIGN, '>>=', startLine, startCol);
        }
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.RIGHT_SHIFT, '>>', startLine, startCol);
      }
      if (this.peek(this.singleCharOffset) === '=') {
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.GREATER_EQUAL, '>=', startLine, startCol);
      }
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.GREATER_THAN, '>', startLine, startCol);
    }

    if (char === '&') {
      if (this.peek(this.singleCharOffset) === '&') {
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.AND, '&&', startLine, startCol);
      }
      if (this.peek(this.singleCharOffset) === '=') {
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.AND_ASSIGN, '&=', startLine, startCol);
      }
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.BITWISE_AND, '&', startLine, startCol);
    }

    if (char === '|') {
      if (this.peek(this.singleCharOffset) === '|') {
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.OR, '||', startLine, startCol);
      }
      if (this.peek(this.singleCharOffset) === '=') {
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.OR_ASSIGN, '|=', startLine, startCol);
      }
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.BITWISE_OR, '|', startLine, startCol);
    }

    if (char === '^') {
      if (this.peek(this.singleCharOffset) === '=') {
        this.advance(this.doubleCharOffset);
        return this.createToken(TokenType.XOR_ASSIGN, '^=', startLine, startCol);
      }
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.BITWISE_XOR, '^', startLine, startCol);
    }

    if (char === '?' && this.peek(this.singleCharOffset) === '?') {
      this.advance(this.doubleCharOffset);
      return this.createToken(TokenType.NULL_COALESCING, '??', startLine, startCol);
    }

    // Punctuation
    if (char === ';') {
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.SEMICOLON, ';', startLine, startCol);
    }
    if (char === ',') {
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.COMMA, ',', startLine, startCol);
    }
    if (char === '.') {
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.DOT, '.', startLine, startCol);
    }
    if (char === ':') {
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.COLON, ':', startLine, startCol);
    }
    if (char === '?') {
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.QUESTION, '?', startLine, startCol);
    }
    if (char === '(') {
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.LEFT_PAREN, '(', startLine, startCol);
    }
    if (char === ')') {
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.RIGHT_PAREN, ')', startLine, startCol);
    }
    if (char === '{') {
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.LEFT_BRACE, '{', startLine, startCol);
    }
    if (char === '}') {
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.RIGHT_BRACE, '}', startLine, startCol);
    }
    if (char === '[') {
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.LEFT_BRACKET, '[', startLine, startCol);
    }
    if (char === ']') {
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.RIGHT_BRACKET, ']', startLine, startCol);
    }
    if (char === '@') {
      this.advance(this.singleCharOffset);
      return this.createToken(TokenType.AT, '@', startLine, startCol);
    }

    // Unknown character
    this.advance(this.singleCharOffset);
    return this.createToken(TokenType.ERROR, char, startLine, startCol);
  }

  private skipWhitespace(): Token | null {
    const startLine = this.line;
    const startCol = this.column;
    let text = '';

    while (this.position < this.source.length && this.isWhitespace(this.source[this.position])) {
      const char = this.source[this.position];
      text += char;
      if (char === '\n' || char === '\r') {
        this.line++;
        this.column = 1;
        if (char === '\r' && this.peek(this.singleCharOffset) === '\n') {
          this.advance(this.singleCharOffset);
        }
      } else {
        this.column++;
      }
      this.position++;
    }

    return this.createToken(TokenType.WHITESPACE, text, startLine, startCol);
  }

  private readLineComment(): Token {
    const startLine = this.line;
    const startCol = this.column;
    let text = '//';

    this.advance(this.doubleCharOffset);

    while (
      this.position < this.source.length &&
      this.source[this.position] !== '\n' &&
      this.source[this.position] !== '\r'
    ) {
      text += this.source[this.position];
      this.advance(this.singleCharOffset);
    }

    return this.createToken(TokenType.LINE_COMMENT, text, startLine, startCol);
  }

  private readBlockComment(): Token {
    const startLine = this.line;
    const startCol = this.column;
    let text = '/*';

    this.advance(this.doubleCharOffset);

    while (this.position < this.source.length) {
      if (this.source[this.position] === '*' && this.peek(this.singleCharOffset) === '/') {
        text += '*/';
        this.advance(this.doubleCharOffset);
        break;
      }
      if (this.source[this.position] === '\n' || this.source[this.position] === '\r') {
        this.line++;
        this.column = 1;
        if (this.source[this.position] === '\r' && this.peek(this.singleCharOffset) === '\n') {
          this.advance(this.singleCharOffset);
        }
      } else {
        this.column++;
      }
      text += this.source[this.position];
      this.advance(this.singleCharOffset);
    }

    return this.createToken(TokenType.BLOCK_COMMENT, text, startLine, startCol);
  }

  private readStringLiteral(quote: string): Token {
    const startLine = this.line;
    const startCol = this.column;
    let text = quote;

    this.advance(this.singleCharOffset);

    while (this.position < this.source.length) {
      const char = this.source[this.position];
      text += char;

      const previousCharOffset = 1;
      if (char === quote && this.source[this.position - previousCharOffset] !== '\\') {
        this.advance(this.singleCharOffset);
        break;
      }

      if (char === '\n' || char === '\r') {
        this.line++;
        this.column = 1;
        if (char === '\r' && this.peek(this.singleCharOffset) === '\n') {
          this.advance(this.singleCharOffset);
        }
      } else {
        this.column++;
      }

      this.advance(this.singleCharOffset);
    }

    return this.createToken(TokenType.STRING_LITERAL, text, startLine, startCol);
  }

  private readNumberLiteral(): Token {
    const startLine = this.line;
    const startCol = this.column;
    let text = '';

    // Read digits and decimal point
    while (
      this.position < this.source.length &&
      (this.isDigit(this.source[this.position]) || this.source[this.position] === '.')
    ) {
      text += this.source[this.position];
      this.advance(this.singleCharOffset);
    }

    // Read suffix (L for long, D for double) - case insensitive
    if (this.position < this.source.length) {
      const suffix = this.source[this.position].toUpperCase();
      if (suffix === 'L' || suffix === 'D') {
        text += this.source[this.position];
        this.advance(this.singleCharOffset);
      }
    }

    return this.createToken(TokenType.NUMBER_LITERAL, text, startLine, startCol);
  }

  private readIdentifier(): Token {
    const startLine = this.line;
    const startCol = this.column;
    let text = '';

    while (
      this.position < this.source.length &&
      this.isIdentifierChar(this.source[this.position])
    ) {
      text += this.source[this.position];
      this.advance(this.singleCharOffset);
    }

    // Check if it's a keyword (case-insensitive)
    const lowerText = text.toLowerCase();
    const keywordType = this.keywords.get(lowerText);
    const tokenType = keywordType ?? TokenType.IDENTIFIER;

    return this.createToken(tokenType, text, startLine, startCol);
  }

  private createToken(type: TokenType, text: string, line: number, column: number): Token {
    void this;
    return {
      location: { column, line },
      text,
      type,
    };
  }

  private isWhitespace(char: string): boolean {
    void this;
    return char === ' ' || char === '\t' || char === '\n' || char === '\r';
  }

  private isDigit(char: string): boolean {
    void this;
    return char >= '0' && char <= '9';
  }

  private isIdentifierStart(char: string): boolean {
    void this;
    return (
      (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_' || char === '$'
    );
  }

  private isIdentifierChar(char: string): boolean {
    return this.isIdentifierStart(char) || this.isDigit(char);
  }

  private peek(offset: number): string {
    const pos = this.position + offset;
    return pos < this.source.length ? this.source[pos] : '\0';
  }

  private advance(count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.position < this.source.length) {
        this.column++;
        this.position++;
      }
    }
  }
}
