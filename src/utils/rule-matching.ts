/**
 * Rule matching utilities for XPath-like pattern matching
 * 
 * Note: This is a simplified implementation. A full XPath implementation
 * would require a more sophisticated parser and matcher.
 */

import type { ASTNode, SourceRange } from '../ast/base.js';
import { walkAST } from './traversal.js';
import { getSourceRange } from './source-extraction.js';

/**
 * Result of rule matching
 */
export interface RuleMatchResult {
  readonly matches: boolean;
  readonly matchedNode?: ASTNode;
  readonly matchDetails?: {
    readonly xpathExpression: string;
    readonly matchedPattern: string;
    readonly capturedGroups?: Record<string, ASTNode>; // Named capture groups
  };
  readonly confidence: 'exact' | 'partial' | 'none';
}

/**
 * Options for rule matching
 */
export interface WouldTriggerRuleOptions {
  readonly strict?: boolean; // Require exact match
  readonly includeDescendants?: boolean; // Check descendant nodes
}

/**
 * Check if an AST node matches a rule or pattern.
 * 
 * This is a simplified XPath matcher. Full XPath support would require
 * a more sophisticated implementation.
 */
export function wouldTriggerRule(
  node: ASTNode,
  xpathExpression: string,
  options: WouldTriggerRuleOptions = {}
): RuleMatchResult {
  const { strict = false, includeDescendants = false } = options;

  // Simplified XPath matching - supports basic patterns like:
  // - "//VariableDeclaration"
  // - "//MethodCallExpression"
  // - "//BinaryExpression[@operator='+']"
  // - "//*[kind='Identifier']"

  const normalizedXPath = xpathExpression.trim();

  // Check if it's a simple node type match
  if (normalizedXPath.startsWith('//')) {
    const nodeType = normalizedXPath.substring(2).split('[')[0].trim();
    
    if (node.kind === nodeType) {
      // Check for attribute filters like [@operator='+']
      const attributeMatch = normalizedXPath.match(/\[@(\w+)='([^']+)'\]/);
      if (attributeMatch) {
        const attrName = attributeMatch[1];
        const attrValue = attributeMatch[2];
        const nodeValue = (node as any)[attrName];

        if (nodeValue === attrValue) {
          return {
            matches: true,
            matchedNode: node,
            matchDetails: {
              xpathExpression,
              matchedPattern: nodeType,
            },
            confidence: 'exact',
          };
        }
      } else {
        // No attribute filter, just type match
        return {
          matches: true,
          matchedNode: node,
          matchDetails: {
            xpathExpression,
            matchedPattern: nodeType,
          },
          confidence: 'exact',
        };
      }
    }
  }

  // Check descendants if requested
  if (includeDescendants) {
    let foundMatch: ASTNode | undefined;

    walkAST(node, {
      enterNode: (child) => {
        if (child !== node) {
          const childResult = wouldTriggerRule(child, xpathExpression, {
            strict,
            includeDescendants: false,
          });
          if (childResult.matches && !foundMatch) {
            foundMatch = child;
          }
        }
      },
    });

    if (foundMatch) {
      return {
        matches: true,
        matchedNode: foundMatch,
        matchDetails: {
          xpathExpression,
          matchedPattern: foundMatch.kind,
        },
        confidence: 'partial',
      };
    }
  }

  return {
    matches: false,
    confidence: 'none',
  };
}

/**
 * Rule match information
 */
export interface RuleMatch {
  readonly node: ASTNode;
  readonly xpathExpression: string;
  readonly matchDetails: {
    readonly matchedPattern: string;
    readonly capturedGroups?: Record<string, ASTNode>;
  };
  readonly location: SourceRange | null;
}

/**
 * Options for finding rule matches
 */
export interface FindRuleMatchesOptions {
  readonly maxResults?: number;
  readonly includeNested?: boolean; // Include nested matches
}

/**
 * Find all AST nodes that match an XPath expression
 */
export function findRuleMatches(
  ast: ASTNode,
  xpathExpression: string,
  options: FindRuleMatchesOptions = {}
): RuleMatch[] {
  const { maxResults, includeNested = true } = options;
  const matches: RuleMatch[] = [];

  walkAST(ast, {
    enterNode: (node) => {
      if (maxResults && matches.length >= maxResults) {
        return false; // Stop traversing
      }

      const result = wouldTriggerRule(node, xpathExpression, {
        includeDescendants: false,
      });

      if (result.matches && result.matchedNode) {
        const location = getSourceRange(result.matchedNode);

        matches.push({
          node: result.matchedNode,
          xpathExpression,
          matchDetails: {
            matchedPattern: result.matchDetails?.matchedPattern || node.kind,
            capturedGroups: result.matchDetails?.capturedGroups,
          },
          location,
        });

        // If includeNested is false, skip children of matched node
        if (!includeNested) {
          return false;
        }
      }
      return undefined;
    },
  });

  return matches;
}
