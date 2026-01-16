/**
 * Simple Apex lexer/tokenizer
 * Handles basic Apex syntax without external dependencies
 */

import type { SourceLocation } from '../../ast/base.js';

/**
 * Token types
 */
export enum TokenType {
  // Keywords
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  PROTECTED = 'PROTECTED',
  GLOBAL = 'GLOBAL',
  STATIC = 'STATIC',
  FINAL = 'FINAL',
  ABSTRACT = 'ABSTRACT',
  CLASS = 'CLASS',
  INTERFACE = 'INTERFACE',
  ENUM = 'ENUM',
  TRIGGER = 'TRIGGER',
  VOID = 'VOID',
  RETURN = 'RETURN',
  IF = 'IF',
  ELSE = 'ELSE',
  FOR = 'FOR',
  WHILE = 'WHILE',
  DO = 'DO',
  SWITCH = 'SWITCH',
  CASE = 'CASE',
  DEFAULT = 'DEFAULT',
  BREAK = 'BREAK',
  CONTINUE = 'CONTINUE',
  TRY = 'TRY',
  CATCH = 'CATCH',
  FINALLY = 'FINALLY',
  THROW = 'THROW',
  NEW = 'NEW',
  THIS = 'THIS',
  SUPER = 'SUPER',
  NULL = 'NULL',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  EXTENDS = 'EXTENDS',
  IMPLEMENTS = 'IMPLEMENTS',
  WITH = 'WITH',
  SHARING = 'SHARING',
  WITHOUT = 'WITHOUT',
  INHERITED = 'INHERITED',
  TESTMETHOD = 'TESTMETHOD',
  WEBSERVICE = 'WEBSERVICE',
  FUTURE = 'FUTURE',
  DATABASE = 'DATABASE',
  OVERRIDE = 'OVERRIDE',
  VIRTUAL = 'VIRTUAL',

  // Types
  INTEGER = 'INTEGER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  DECIMAL = 'DECIMAL',
  DOUBLE = 'DOUBLE',
  LONG = 'LONG',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  TIME = 'TIME',
  ID = 'ID',
  BLOB = 'BLOB',
  OBJECT = 'OBJECT',

  // Literals
  IDENTIFIER = 'IDENTIFIER',
  STRING_LITERAL = 'STRING_LITERAL',
  NUMBER_LITERAL = 'NUMBER_LITERAL',
  BOOLEAN_LITERAL = 'BOOLEAN_LITERAL',
  NULL_LITERAL = 'NULL_LITERAL',

  // Operators
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  MODULO = 'MODULO',
  ASSIGN = 'ASSIGN',
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  LESS_THAN = 'LESS_THAN',
  LESS_EQUAL = 'LESS_EQUAL',
  GREATER_THAN = 'GREATER_THAN',
  GREATER_EQUAL = 'GREATER_EQUAL',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  INCREMENT = 'INCREMENT',
  DECREMENT = 'DECREMENT',
  PLUS_ASSIGN = 'PLUS_ASSIGN',
  MINUS_ASSIGN = 'MINUS_ASSIGN',
  MULTIPLY_ASSIGN = 'MULTIPLY_ASSIGN',
  DIVIDE_ASSIGN = 'DIVIDE_ASSIGN',
  NULL_COALESCING = 'NULL_COALESCING',
  LEFT_SHIFT = 'LEFT_SHIFT',
  RIGHT_SHIFT = 'RIGHT_SHIFT',
  RIGHT_SHIFT_UNSIGNED = 'RIGHT_SHIFT_UNSIGNED',

  // Punctuation
  SEMICOLON = 'SEMICOLON',
  COMMA = 'COMMA',
  DOT = 'DOT',
  COLON = 'COLON',
  QUESTION = 'QUESTION',
  ARROW = 'ARROW', // => for Map initializers
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  LEFT_BRACE = 'LEFT_BRACE',
  RIGHT_BRACE = 'RIGHT_BRACE',
  LEFT_BRACKET = 'LEFT_BRACKET',
  RIGHT_BRACKET = 'RIGHT_BRACKET',
  AT = 'AT',

  // Comments
  LINE_COMMENT = 'LINE_COMMENT',
  BLOCK_COMMENT = 'BLOCK_COMMENT',

  // Other
  WHITESPACE = 'WHITESPACE',
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
  ERROR = 'ERROR',
}

/**
 * Token representation
 */
export interface Token {
  readonly type: TokenType;
  readonly text: string;
  readonly location: SourceLocation;
}

/**
 * Simple Apex lexer
 */
export class ApexLexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  // Keyword map (case-insensitive)
  private readonly keywords: Map<string, TokenType> = new Map([
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

  constructor(source: string) {
    this.source = source;
  }

  /**
   * Tokenize the source code
   */
  tokenize(): Token[] {
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
      type: TokenType.EOF,
      text: '',
      location: { line: this.line, column: this.column },
    });

    return this.tokens;
  }

  /**
   * Get next token
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
    if (char === '/' && this.peek(1) === '/') {
      return this.readLineComment();
    }

    // Block comment
    if (char === '/' && this.peek(1) === '*') {
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
      if (this.peek(1) === '+') {
        this.advance(2);
        return this.createToken(TokenType.INCREMENT, '++', startLine, startCol);
      }
      if (this.peek(1) === '=') {
        this.advance(2);
        return this.createToken(TokenType.PLUS_ASSIGN, '+=', startLine, startCol);
      }
      this.advance(1);
      return this.createToken(TokenType.PLUS, '+', startLine, startCol);
    }

    if (char === '-') {
      if (this.peek(1) === '-') {
        this.advance(2);
        return this.createToken(TokenType.DECREMENT, '--', startLine, startCol);
      }
      if (this.peek(1) === '=') {
        this.advance(2);
        return this.createToken(TokenType.MINUS_ASSIGN, '-=', startLine, startCol);
      }
      this.advance(1);
      return this.createToken(TokenType.MINUS, '-', startLine, startCol);
    }

    if (char === '*') {
      if (this.peek(1) === '=') {
        this.advance(2);
        return this.createToken(TokenType.MULTIPLY_ASSIGN, '*=', startLine, startCol);
      }
      this.advance(1);
      return this.createToken(TokenType.MULTIPLY, '*', startLine, startCol);
    }

    if (char === '/') {
      if (this.peek(1) === '=') {
        this.advance(2);
        return this.createToken(TokenType.DIVIDE_ASSIGN, '/=', startLine, startCol);
      }
      this.advance(1);
      return this.createToken(TokenType.DIVIDE, '/', startLine, startCol);
    }

    if (char === '%') {
      this.advance(1);
      return this.createToken(TokenType.MODULO, '%', startLine, startCol);
    }

    if (char === '=') {
      if (this.peek(1) === '=') {
        this.advance(2);
        return this.createToken(TokenType.EQUALS, '==', startLine, startCol);
      }
      if (this.peek(1) === '>') {
        this.advance(2);
        return this.createToken(TokenType.ARROW, '=>', startLine, startCol);
      }
      this.advance(1);
      return this.createToken(TokenType.ASSIGN, '=', startLine, startCol);
    }

    if (char === '!') {
      if (this.peek(1) === '=') {
        this.advance(2);
        return this.createToken(TokenType.NOT_EQUALS, '!=', startLine, startCol);
      }
      this.advance(1);
      return this.createToken(TokenType.NOT, '!', startLine, startCol);
    }

    if (char === '<') {
      if (this.peek(1) === '=') {
        this.advance(2);
        return this.createToken(TokenType.LESS_EQUAL, '<=', startLine, startCol);
      }
      this.advance(1);
      return this.createToken(TokenType.LESS_THAN, '<', startLine, startCol);
    }

    if (char === '>') {
      if (this.peek(1) === '=') {
        this.advance(2);
        return this.createToken(TokenType.GREATER_EQUAL, '>=', startLine, startCol);
      }
      if (this.peek(1) === '>') {
        // Check for >> or >>>
        if (this.peek(2) === '>') {
          this.advance(3);
          return this.createToken(TokenType.RIGHT_SHIFT_UNSIGNED, '>>>', startLine, startCol);
        }
        this.advance(2);
        return this.createToken(TokenType.RIGHT_SHIFT, '>>', startLine, startCol);
      }
      this.advance(1);
      return this.createToken(TokenType.GREATER_THAN, '>', startLine, startCol);
    }

    if (char === '&' && this.peek(1) === '&') {
      this.advance(2);
      return this.createToken(TokenType.AND, '&&', startLine, startCol);
    }

    if (char === '|' && this.peek(1) === '|') {
      this.advance(2);
      return this.createToken(TokenType.OR, '||', startLine, startCol);
    }

    if (char === '?' && this.peek(1) === '?') {
      this.advance(2);
      return this.createToken(TokenType.NULL_COALESCING, '??', startLine, startCol);
    }

    // Punctuation
    if (char === ';') {
      this.advance(1);
      return this.createToken(TokenType.SEMICOLON, ';', startLine, startCol);
    }
    if (char === ',') {
      this.advance(1);
      return this.createToken(TokenType.COMMA, ',', startLine, startCol);
    }
    if (char === '.') {
      this.advance(1);
      return this.createToken(TokenType.DOT, '.', startLine, startCol);
    }
    if (char === ':') {
      this.advance(1);
      return this.createToken(TokenType.COLON, ':', startLine, startCol);
    }
    if (char === '?') {
      this.advance(1);
      return this.createToken(TokenType.QUESTION, '?', startLine, startCol);
    }
    if (char === '(') {
      this.advance(1);
      return this.createToken(TokenType.LEFT_PAREN, '(', startLine, startCol);
    }
    if (char === ')') {
      this.advance(1);
      return this.createToken(TokenType.RIGHT_PAREN, ')', startLine, startCol);
    }
    if (char === '{') {
      this.advance(1);
      return this.createToken(TokenType.LEFT_BRACE, '{', startLine, startCol);
    }
    if (char === '}') {
      this.advance(1);
      return this.createToken(TokenType.RIGHT_BRACE, '}', startLine, startCol);
    }
    if (char === '[') {
      this.advance(1);
      return this.createToken(TokenType.LEFT_BRACKET, '[', startLine, startCol);
    }
    if (char === ']') {
      this.advance(1);
      return this.createToken(TokenType.RIGHT_BRACKET, ']', startLine, startCol);
    }
    if (char === '@') {
      this.advance(1);
      return this.createToken(TokenType.AT, '@', startLine, startCol);
    }

    // Unknown character
    this.advance(1);
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
        if (char === '\r' && this.peek(1) === '\n') {
          this.advance(1);
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

    this.advance(2);

    while (this.position < this.source.length && this.source[this.position] !== '\n' && this.source[this.position] !== '\r') {
      text += this.source[this.position];
      this.advance(1);
    }

    return this.createToken(TokenType.LINE_COMMENT, text, startLine, startCol);
  }

  private readBlockComment(): Token {
    const startLine = this.line;
    const startCol = this.column;
    let text = '/*';

    this.advance(2);

    while (this.position < this.source.length) {
      if (this.source[this.position] === '*' && this.peek(1) === '/') {
        text += '*/';
        this.advance(2);
        break;
      }
      if (this.source[this.position] === '\n' || this.source[this.position] === '\r') {
        this.line++;
        this.column = 1;
        if (this.source[this.position] === '\r' && this.peek(1) === '\n') {
          this.advance(1);
        }
      } else {
        this.column++;
      }
      text += this.source[this.position];
      this.advance(1);
    }

    return this.createToken(TokenType.BLOCK_COMMENT, text, startLine, startCol);
  }

  private readStringLiteral(quote: string): Token {
    const startLine = this.line;
    const startCol = this.column;
    let text = quote;

    this.advance(1);

    while (this.position < this.source.length) {
      const char = this.source[this.position];
      text += char;

      if (char === quote && this.source[this.position - 1] !== '\\') {
        this.advance(1);
        break;
      }

      if (char === '\n' || char === '\r') {
        this.line++;
        this.column = 1;
        if (char === '\r' && this.peek(1) === '\n') {
          this.advance(1);
        }
      } else {
        this.column++;
      }

      this.advance(1);
    }

    return this.createToken(TokenType.STRING_LITERAL, text, startLine, startCol);
  }

  private readNumberLiteral(): Token {
    const startLine = this.line;
    const startCol = this.column;
    let text = '';

    // Read digits and decimal point
    while (this.position < this.source.length && (this.isDigit(this.source[this.position]) || this.source[this.position] === '.')) {
      text += this.source[this.position];
      this.advance(1);
    }

    // Read suffix (L for long, D for double) - case insensitive
    if (this.position < this.source.length) {
      const suffix = this.source[this.position].toUpperCase();
      if (suffix === 'L' || suffix === 'D') {
        text += this.source[this.position];
        this.advance(1);
      }
    }

    return this.createToken(TokenType.NUMBER_LITERAL, text, startLine, startCol);
  }

  private readIdentifier(): Token {
    const startLine = this.line;
    const startCol = this.column;
    let text = '';

    while (this.position < this.source.length && this.isIdentifierChar(this.source[this.position])) {
      text += this.source[this.position];
      this.advance(1);
    }

    // Check if it's a keyword (case-insensitive)
    const lowerText = text.toLowerCase();
    const keywordType = this.keywords.get(lowerText);
    const tokenType = keywordType || TokenType.IDENTIFIER;

    return this.createToken(tokenType, text, startLine, startCol);
  }

  private createToken(type: TokenType, text: string, line: number, column: number): Token {
    return {
      type,
      text,
      location: { line, column },
    };
  }

  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r';
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isIdentifierStart(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_' || char === '$';
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
