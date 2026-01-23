/**
 * @file Parser-agnostic parse tree interface and utilities.
 * Main export file for parser components.
 */

export type * from './parseTree.js';
export type { Token } from './tokenType.js';
export { ApexLexer } from './apexLexer.js';
export { TokenType } from './tokenType.js';
export { ApexParser, type ParserContext, parseApex as parseApexSource } from './apexParser.js';
