/**
 * @file Convenience function to parse Apex source code.
 * High-level parsing function that wraps ApexParser.
 */

import { ApexParser } from './ApexParser.js';
import type { ParseTreeNode } from './ParseTreeTypes.js';

/**
 * Parse Apex source code into a parse tree.
 * @param source - The Apex source code to parse.
 * @returns The parse tree node, or null if parsing fails.
 */
export function parseApex(source: string): ParseTreeNode | null {
  const parser = new ApexParser(source);
  return parser.parse();
}
