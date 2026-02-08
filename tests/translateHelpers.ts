/**
 * @file Test helpers for parsing and translating Apex code.
 * Ported from com.google.summit.testing.TranslateHelpers.
 */

import { parseApexSource } from '../src/parser/index.js';
import { ASTTranslator } from '../src/translator/astTranslator.js';
import type { ASTNode } from '../src/ast/baseNode.js';
import { walkAST } from '../src/utils/traversal.js';
import type { ASTWalkVisitor } from '../src/utils/traversal.js';

/**
 * Parses and translates a source code input string.
 * @param input - The source code to parse and translate.
 * @returns The translated AST node.
 * @throws {Error} If parsing fails or translation returns errors or no AST.
 */
function parseAndTranslate(input: string): ASTNode {
  const parseTree = parseApexSource(input);
  if (!parseTree) {
    // Try to provide more helpful error message
    const preview = input.length > 100 ? input.substring(0, 100) + '...' : input;
    throw new Error(`Failed to parse input: ${preview}`);
  }

  const translator = new ASTTranslator();
  const result = translator.translate(parseTree);

  if (result.errors.length > 0) {
    const errorMessages = result.errors.map((e: Readonly<Error>) => e.message).join(', ');
    const preview = input.length > 100 ? input.substring(0, 100) + '...' : input;
    throw new Error(`Translation failed for "${preview}": ${errorMessages}`);
  }

  if (!result.ast) {
    const preview = input.length > 100 ? input.substring(0, 100) + '...' : input;
    throw new Error(`Translation returned no AST for input: ${preview}`);
  }

  return result.ast;
}

/**
 * Finds and returns the first AST node of a type in the given AST.
 * The AST is searched in depth-first pre-order.
 * @template T - The desired AST node type.
 * @param root - The AST to search.
 * @param predicate - Type guard function to check if a node matches the desired type.
 * @returns The first instance matching the predicate or null if none.
 */
function findFirstNodeOfType<T extends ASTNode>(
  root: ASTNode,
  predicate: (node: ASTNode) => node is T
): T | null;

/**
 * Finds and returns the first AST node matching a boolean predicate.
 * @param root - The AST to search.
 * @param predicate - Boolean predicate to check if a node matches.
 * @returns The first matching node or null if none.
 */
function findFirstNodeOfType(root: ASTNode, predicate: (node: ASTNode) => boolean): ASTNode | null;
function findFirstNodeOfType(root: ASTNode, predicate: (node: ASTNode) => boolean): ASTNode | null {
  let found: ASTNode | null = null;

  const visitor: ASTWalkVisitor = {
    enterNode: (node: ASTNode) => {
      if (!found && predicate(node)) {
        found = node;
        return false; // Stop traversal
      }
      return true; // Continue traversal
    },
  };

  walkAST(root, visitor);
  return found;
}

/**
 * Asserts that the AST has no node matching the predicate.
 * @param root - The AST to search.
 * @param predicate - Function to check if a node matches the type to assert non-presence.
 * @throws {Error} If a matching node is found.
 */
function assertNoNodeOfType(root: ASTNode, predicate: (node: ASTNode) => boolean): void {
  const found = findFirstNodeOfType(root, predicate);
  if (found) {
    throw new Error(
      `AST should have no node of this type. Found one at location: ${JSON.stringify(found.location)}`
    );
  }
}

/**
 * Counts the number of nodes matching a predicate in the AST.
 * @param root - The AST to search.
 * @param predicate - Function to check if a node matches.
 * @returns The count of matching nodes.
 */
function countNodesOfType(root: ASTNode, predicate: (node: ASTNode) => boolean): number {
  let count = 0;

  const visitor: ASTWalkVisitor = {
    enterNode: (node: ASTNode) => {
      if (predicate(node)) {
        count++;
      }
      return true; // Continue traversal
    },
  };

  walkAST(root, visitor);
  return count;
}

/**
 * Asserts that the AST has no untranslated nodes.
 * Note: This assumes untranslated nodes have a specific kind or property.
 * @param root - The AST to search.
 * @throws {Error} If any untranslated nodes are found.
 */
function assertFullyTranslated(root: ASTNode): void {
  // In the original, this checks for Untranslated nodes
  // We'll check for nodes with kind 'Untranslated' or similar
  const untranslatedCount = countNodesOfType(
    root,
    (node) =>
      node['@type'] === 'Untranslated' ||
      node['@type'] === 'UntranslatedStatement' ||
      node['@type'] === 'UntranslatedExpression'
  );

  if (untranslatedCount > 0) {
    throw new Error(`AST should have no untranslated nodes. Found ${String(untranslatedCount)}`);
  }
}

export {
  parseAndTranslate,
  findFirstNodeOfType,
  assertNoNodeOfType,
  countNodesOfType,
  assertFullyTranslated,
};
