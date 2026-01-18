/**
 * @file Parser context interface - provides access to parser state and methods.
 * Used by extracted parser modules.
 */

import type { SourceRange, SourceLocation } from '../ast/base.js';
import type { Token } from './TokenTypes.js';
import type { ParseTreeNode } from './ParseTreeTypes.js';
import type { TokenType } from './TokenTypes.js';

/**
 * Interface that provides parser state and helper methods
 * Allows extracted parser modules to work with the parser.
 */
export interface ParserContext {
  readonly tokens: Token[];
  readonly source: string;
  current: number;
  pendingGreaterThan: number;

  /**
   * Helper methods.
   */
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Rest parameters cannot be readonly
  match: (...types: TokenType[]) => boolean;
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Rest parameters cannot be readonly
  check: (type: TokenType, ...types: TokenType[]) => boolean;
  advance: () => Token;
  isAtEnd: () => boolean;
  peek: (offset?: number) => Token;
  previous: () => Token;
  consume: (type: TokenType, message: string) => Token;
  skipWhitespaceAndComments: () => void;
  getLocation: (start: number, end: number) => SourceRange;
  locationToRange: (location: SourceLocation) => SourceRange;
  combineLocations: (loc1: SourceRange, loc2: SourceRange) => SourceRange;

  /**
   * Parsing methods (will be provided by parser).
   */
  parseType: () => ParseTreeNode | null;
  parseTypeParameters: () => ParseTreeNode[];
  parseTypeParameter: () => ParseTreeNode | null;
  checkType: () => boolean;
  parseExpression: () => ParseTreeNode | null;
  parseBlock: (isClassBody?: boolean) => ParseTreeNode;
  parseStatement: () => ParseTreeNode | null;
  parseClassMember: () => ParseTreeNode | null;
  parseParameter: () => ParseTreeNode | null;
  parseAnnotation: () => ParseTreeNode | null;
  parseEnumConstant: () => ParseTreeNode | null;
  parseAnnotationArgument: () => ParseTreeNode | null;
  parseSoqlSoslQuery: () => ParseTreeNode;
  parseNewExpression: () => ParseTreeNode;
  parseVariableDeclaration: () => ParseTreeNode | null;
  parseLambdaParameter: () => ParseTreeNode | null;
}
