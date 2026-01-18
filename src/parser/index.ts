/**
 * @file Parser-agnostic parse tree interface and utilities.
 * Main export file for parser components.
 */

export type * from './ParseTreeTypes.js';
export { ApexLexer } from './ApexLexer.js';
export { TokenType } from './TokenTypes.js';
export type { Token } from './TokenTypes.js';
export { ApexParser } from './ApexParser.js';
export { parseApex as parseApexSource } from './parseApex.js';
