/**
 * @file TypeScript port of Summit-AST.
 * Abstract Syntax Tree for Salesforce Apex source code.
 */

export * from './ast/index.js';
export * from './parser/index.js';
export * from './translator/index.js';
export * from './serialization/index.js';
export * from './tool/index.js';
export * from './utils/index.js';

// Apex parser exports (re-exported with specific names to avoid conflicts)
export {
  ApexLexer as apexLexer,
  ApexParser as apexParser,
  TokenType,
  parseApexSource,
} from './parser/index.js';
export type { Token as ApexToken } from './parser/index.js';
