/**
 * Test helpers for parsing and translating Apex code
 * Ported from com.google.summit.testing.TranslateHelpers.
 */

import { parseApexSource } from '../src/parser/index.js';
import { ASTTranslator } from '../src/translator/ASTTranslator.js';
import type { ASTNode } from '../src/ast/base.js';
import { walkAST, getNodeChildren } from '../src/utils/traversal.js';
import type { ASTWalkVisitor } from '../src/utils/traversal.js';

/**
 * Parses and translates a source code input string.
 * @param input - The source code to parse and translate.
 * @returns The translated AST node.
 */
export function parseAndTranslate(input: string): ASTNode {
  const parseTree = parseApexSource(input);
  if (!parseTree) {
    // Try to provide more helpful error message
    const preview = input.length > 100 ? input.substring(0, 100) + '...' : input;
    throw new Error(`Failed to parse input: ${preview}`);
  }

  const translator = new ASTTranslator();
  const result = translator.translate(parseTree);

  if (result.errors.length > 0) {
    const errorMessages = result.errors.map((e) => e.message).join(', ');
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
 * @param root - The AST to search.
 * @param predicate - Function to check if a node matches the desired type.
 * @returns The first instance matching the predicate or null if none.
 */
export function findFirstNodeOfType<T extends ASTNode>(
  root: ASTNode,
  predicate: (node: ASTNode) => node is T
): T | null {
  let found: T | null = null;

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
 */
export function assertNoNodeOfType(root: ASTNode, predicate: (node: ASTNode) => boolean): void {
  const found = findFirstNodeOfType(root, predicate as (node: ASTNode) => node is ASTNode);
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
export function countNodesOfType(root: ASTNode, predicate: (node: ASTNode) => boolean): number {
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
 */
export function assertFullyTranslated(root: ASTNode): void {
  // In the original, this checks for Untranslated nodes
  // We'll check for nodes with kind 'Untranslated' or similar
  const untranslatedCount = countNodesOfType(
    root,
    (node) =>
      node.kind === 'Untranslated' ||
      node.kind === 'UntranslatedStatement' ||
      node.kind === 'UntranslatedExpression'
  );

  if (untranslatedCount > 0) {
    throw new Error(`AST should have no untranslated nodes. Found ${untranslatedCount}`);
  }
}
