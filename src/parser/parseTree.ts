/**
 * @file Parser-agnostic parse tree interface.
 *
 * This defines a minimal interface that any parse tree structure can implement.
 * The translator will work with any parse tree that conforms to this interface.
 */

import type { SourceRange } from '../ast/baseNode.js';

/**
 * Base interface for parse tree nodes
 * This is intentionally minimal to support various parser outputs.
 */
interface ParseTreeNode {
  /**
   * Additional properties that parsers may include
   * This allows for parser-specific data while maintaining compatibility.
   */
  readonly [key: string]: unknown;

  /**
   * Node type/kind identifier (e.g., "if_statement", "method_call", etc.)
   * The exact values depend on the parser, but should be consistent.
   */
  readonly type: string;

  /**
   * Child nodes (if any)
   * Different parsers may structure children differently.
   */
  readonly children?: ParseTreeNode[];

  /**
   * Optional source location information.
   */
  readonly location?: SourceRange;

  /**
   * Optional text content of this node.
   */
  readonly text?: string;
}

/**
 * Parse tree with named children (for parsers that use property-based children).
 */
type NamedChildrenParseTree = ParseTreeNode &
  Record<string, ParseTreeNode | ParseTreeNode[] | unknown>;

/**
 * Parse tree with positional children.
 */
interface PositionalChildrenParseTree extends ParseTreeNode {
  /**
   * Array of child nodes in order.
   */
  readonly children: ParseTreeNode[];
}

/**
 * Token information (for parsers that provide token-level details).
 */
interface Token {
  readonly type: string;
  readonly text: string;
  readonly location?: SourceRange;
}

/**
 * Parse tree with token information.
 */
interface TokenizedParseTree extends ParseTreeNode {
  readonly tokens?: Token[];
}

/**
 * Error information from parsing.
 */
interface ParseError {
  readonly message: string;
  readonly location?: SourceRange;
  readonly severity?: 'error' | 'info' | 'warning';
}

/**
 * Complete parse result.
 */
interface ParseResult {
  readonly tree?: ParseTreeNode;
  readonly errors?: ParseError[];

  /**
   * Original source code.
   */
  readonly source?: string;
}

/**
 * Adapter interface for converting parser-specific trees to our parse tree format.
 * @template T The type of the parser-specific tree.
 */
interface ParseTreeAdapter<T = unknown> {
  /**
   * Convert a parser-specific tree to our ParseTreeNode format.
   */
  adapt: (node: T) => ParseTreeNode;

  /**
   * Extract source location from parser-specific node.
   */
  getLocation?: (node: T) => SourceRange | undefined;

  /**
   * Extract text content from parser-specific node.
   */
  getText?: (node: T) => string | undefined;
}

export type {
  ParseTreeNode,
  NamedChildrenParseTree,
  PositionalChildrenParseTree,
  Token,
  TokenizedParseTree,
  ParseError,
  ParseResult,
  ParseTreeAdapter,
};
