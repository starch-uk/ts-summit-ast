/**
 * @file Rule matching utilities for XPath-like pattern matching.
 *
 * Note: This is a simplified implementation. A full XPath implementation
 * would require a more sophisticated parser and matcher.
 */

/* eslint-disable import/group-exports -- Inline exports are standard TypeScript practice */

import type { ASTNode, SourceRange } from '../ast/base.js';
import { walkAST, buildParentMap } from './traversal.js';
import { getSourceRange } from './source-extraction.js';

/**
 * XPath feature support information.
 */
export interface XPathFeatureSupport {
  /**
   * Whether XPath 3.1 features are supported.
   */
  readonly supportsXPath31: boolean;

  /**
   * List of supported axes.
   */
  readonly supportedAxes: string[];

  /**
   * List of supported functions.
   */
  readonly supportedFunctions: string[];

  /**
   * List of unsupported features (if any).
   */
  readonly unsupportedFeatures?: string[];
}

/**
 * Contains the result of validating an XPath expression, including whether it's valid and any errors found.
 */
export interface XPathValidationResult {
  /**
   * Whether the XPath expression is valid.
   */
  readonly valid: boolean;

  /**
   * Error message if validation failed.
   */
  readonly error?: string;

  /**
   * Supported features detected in the expression.
   */
  readonly supportedFeatures?: string[];

  /**
   * Unsupported features detected in the expression.
   */
  readonly unsupportedFeatures?: string[];
}

/**
 * Validate XPath expression syntax before evaluation.
 *
 * This function performs basic syntax validation to catch common errors
 * before attempting to evaluate the XPath expression against an AST.
 * @param xpath - The XPath expression to validate.
 * @returns Validation result indicating if the expression is valid.
 * @example
 * ```typescript
 * const validation = validateXPath('//VariableDeclaration[@name="test"]');
 * if (!validation.valid) {
 *   console.error('Invalid XPath:', validation.error);
 * }
 * ```
 */
export function validateXPath(xpath: string): XPathValidationResult {
  const normalizedXPath = xpath.trim();
  const emptyArrayLength = 0;

  if (!normalizedXPath) {
    return {
      error: 'XPath expression cannot be empty',
      valid: false,
    };
  }

  const supportedFeatures: string[] = [];
  const unsupportedFeatures: string[] = [];

  // Check for supported basic patterns
  if (normalizedXPath.startsWith('//')) {
    supportedFeatures.push('descendant-or-self axis');
  } else if (normalizedXPath.startsWith('/')) {
    // Absolute path (root only)
    unsupportedFeatures.push('absolute path (/)');
  }

  // Check for attribute filters
  if (/\[@\w+/.test(normalizedXPath)) {
    supportedFeatures.push('attribute filters');
  }

  // Check for unsupported features
  if (normalizedXPath.includes('|')) {
    unsupportedFeatures.push('union operator (|)');
  }
  if (normalizedXPath.includes('ancestor::') || normalizedXPath.includes('ancestor-or-self::')) {
    unsupportedFeatures.push('ancestor axes');
  }
  if (normalizedXPath.includes('following::') || normalizedXPath.includes('following-sibling::')) {
    unsupportedFeatures.push('following axes');
  }
  if (normalizedXPath.includes('preceding::') || normalizedXPath.includes('preceding-sibling::')) {
    unsupportedFeatures.push('preceding axes');
  }
  if (normalizedXPath.includes('//text()')) {
    unsupportedFeatures.push('text node selection');
  }
  if (normalizedXPath.includes('//comment()')) {
    unsupportedFeatures.push('comment node selection');
  }

  // Basic syntax checks
  const bracketCount = (normalizedXPath.match(/\[/g) ?? []).length;
  const closeBracketCount = (normalizedXPath.match(/\]/g) ?? []).length;
  if (bracketCount !== closeBracketCount) {
    const bracketCountStr = String(bracketCount);
    const closeBracketCountStr = String(closeBracketCount);
    return {
      error: `Mismatched brackets: ${bracketCountStr} opening brackets, ${closeBracketCountStr} closing brackets`,
      supportedFeatures,
      unsupportedFeatures:
        unsupportedFeatures.length > emptyArrayLength ? unsupportedFeatures : undefined,
      valid: false,
    };
  }

  // Check for basic attribute filter syntax
  const attributeFilterPattern = /\[@(\w+)='([^']*)'\]/g;
  // Validate attribute filter syntax by attempting to match
  attributeFilterPattern.exec(normalizedXPath);

  // Check for invalid characters in node names
  if (/\/\/[^a-zA-Z*][^[\]]*\[/.test(normalizedXPath)) {
    return {
      error: 'Invalid node name in XPath expression',
      supportedFeatures,
      unsupportedFeatures:
        unsupportedFeatures.length > emptyArrayLength ? unsupportedFeatures : undefined,
      valid: false,
    };
  }

  const valid =
    unsupportedFeatures.length === emptyArrayLength && bracketCount === closeBracketCount;

  return {
    valid,
    ...(valid
      ? {}
      : {
          error:
            unsupportedFeatures.length > emptyArrayLength
              ? `Unsupported XPath features: ${unsupportedFeatures.join(', ')}`
              : 'Invalid XPath syntax',
        }),
    supportedFeatures: supportedFeatures.length > emptyArrayLength ? supportedFeatures : undefined,
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Check for non-empty array
    unsupportedFeatures: unsupportedFeatures.length > 0 ? unsupportedFeatures : undefined,
  };
}

/**
 * Check which XPath features are supported.
 *
 * This function returns information about which XPath features,
 * axes, and functions are supported by the current implementation.
 * @returns Feature support information.
 * @example
 * ```typescript
 * const support = getXPathFeatureSupport();
 * console.log('Supported axes:', support.supportedAxes);
 * console.log('Unsupported features:', support.unsupportedFeatures);
 * ```
 */
export function getXPathFeatureSupport(): XPathFeatureSupport {
  // This implementation supports a simplified subset of XPath
  const supportedAxes: string[] = [
    'descendant-or-self', // //
    // Other axes are not currently supported
  ];

  const supportedFunctions: string[] = [
    // Currently minimal function support
  ];

  const unsupportedFeatures: string[] = [
    'Absolute paths (/)',
    'Union operator (|)',
    'Ancestor axes',
    'Following axes',
    'Preceding axes',
    'Text node selection',
    'Comment node selection',
    'XPath 3.1 functions',
    'XPath 3.1 operators',
    'Complex predicates',
    'Function calls',
    'Variable references',
  ];

  return {
    supportedAxes,
    supportedFunctions,
    supportsXPath31: false,
    unsupportedFeatures,
  };
}

/**
 * Result of rule matching.
 */
export interface RuleMatchResult {
  readonly matches: boolean;
  readonly matchedNode?: ASTNode;
  readonly matchDetails?: {
    readonly xpathExpression: string;
    readonly matchedPattern: string;

    /**
     * Named capture groups.
     */
    readonly capturedGroups?: Record<string, ASTNode>;
  };
  readonly confidence: 'exact' | 'none' | 'partial';
}

/**
 * Options for rule matching.
 */
export interface WouldTriggerRuleOptions {
  /**
   * Require exact match.
   */
  readonly strict?: boolean;

  /**
   * Check descendant nodes.
   */
  readonly includeDescendants?: boolean;
}

/**
 * Check if an AST node matches a rule or pattern.
 *
 * This is a simplified XPath matcher. Full XPath support would require
 * a more sophisticated implementation.
 * @param node - The AST node to check.
 * @param xpathExpression - The XPath expression to match against.
 * @param options - Options for matching.
 * @returns Rule match result indicating if the node matches.
 */
export function wouldTriggerRule(
  node: ASTNode,
  xpathExpression: string,
  options: WouldTriggerRuleOptions = {}
): RuleMatchResult {
  const { strict = false, includeDescendants = false } = options;

  // Simplified XPath matching - supports basic patterns like:
  // - "//VariableDeclaration"
  // - "//CallExpression"
  // - "//BinaryExpression[@operator='+']"
  // - "//*[kind='Identifier']"

  const normalizedXPath = xpathExpression.trim();

  // Check if it's a simple node type match
  const doubleSlashLength = 2;
  const firstIndex = 0;
  if (normalizedXPath.startsWith('//')) {
    const nodeType =
      normalizedXPath.substring(doubleSlashLength).split('[')[firstIndex]?.trim() ?? '';

    if (node.kind === nodeType) {
      // Check for attribute filters like [@operator='+']
      const attributeMatch = /\[@(\w+)='([^']+)'\]/.exec(normalizedXPath);
      if (attributeMatch) {
        const [, attrName, attrValue] = attributeMatch;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unnecessary-condition -- Dynamic property access
        const nodeValue = (node as unknown as Record<string, unknown>)[attrName ?? ''];

        if (nodeValue === attrValue) {
          return {
            confidence: 'exact',
            matchDetails: {
              matchedPattern: nodeType,
              xpathExpression,
            },
            matchedNode: node,
            matches: true,
          };
        }
      } else {
        // No attribute filter, just type match
        return {
          confidence: 'exact',
          matchDetails: {
            matchedPattern: nodeType,
            xpathExpression,
          },
          matchedNode: node,
          matches: true,
        };
      }
    }
  }

  // Check descendants if requested
  if (includeDescendants) {
    let foundMatch: ASTNode | undefined = undefined;

    walkAST(node, {
      enterNode: (child): undefined => {
        if (child !== node) {
          const childResult = wouldTriggerRule(child, xpathExpression, {
            includeDescendants: false,
            strict,
          });
          if (childResult.matches && foundMatch === undefined) {
            foundMatch = child;
          }
        }
        return undefined;
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Type narrowing check
    if (foundMatch !== undefined) {
      const matchNode: ASTNode = foundMatch;
      return {
        confidence: 'partial',
        matchDetails: {
          matchedPattern: matchNode.kind,
          xpathExpression,
        },
        matchedNode: matchNode,
        matches: true,
      };
    }
  }

  return {
    confidence: 'none',
    matches: false,
  };
}

/**
 * Rule match information.
 */
export interface RuleMatch {
  readonly node: ASTNode;
  readonly xpathExpression: string;
  readonly matchDetails: {
    readonly matchedPattern: string;
    readonly capturedGroups?: Record<string, ASTNode>;

    /**
     * Reason why this node matched the XPath expression
     * (e.g., "Node type matches", "Attribute filter matches").
     */
    readonly matchReason?: string;

    /**
     * Attribute values that caused the match (for attribute filters).
     */
    readonly matchedAttributes?: Record<string, unknown>;
  };
  readonly location: SourceRange | null;

  /**
   * Parent node context (when includeContext is true).
   */
  readonly parentNode?: ASTNode;

  /**
   * Sibling nodes context (when includeContext is true).
   */
  readonly siblingNodes?: ASTNode[];
}

/**
 * Options for finding rule matches.
 */
export interface FindRuleMatchesOptions {
  readonly maxResults?: number;

  /**
   * Include nested matches.
   */
  readonly includeNested?: boolean;

  /**
   * Include context information (parent, siblings) in match results
   * Default: false.
   */
  readonly includeContext?: boolean;
}

/**
 * Find all AST nodes that match an XPath expression.
 *
 * Returns detailed match information including which nodes matched,
 * match context (parent/child relationships), and attribute values
 * that caused the match.
 * @param ast - The AST node to search in.
 * @param xpathExpression - The XPath expression to match.
 * @param options - Options for finding matches.
 * @param options.maxResults - Maximum number of matches to return.
 * @param options.includeNested - Include nested matches (default: true).
 * @param options.includeContext - Include parent/sibling context (default: false).
 * @returns Array of rule matches with detailed information.
 * @example
 * ```typescript
 * const matches = findRuleMatches(ast, "//BinaryExpression[@operator='+']", {
 *   includeContext: true
 * });
 * for (const match of matches) {
 *   console.log(`Found ${match.matchDetails.matchedPattern} at ${match.location}`);
 *   if (match.parentNode) {
 *     console.log(`  Parent: ${match.parentNode.kind}`);
 *   }
 * }
 * ```
 */
export function findRuleMatches(
  ast: ASTNode,
  xpathExpression: string,
  options: FindRuleMatchesOptions = {}
): RuleMatch[] {
  const { maxResults, includeNested = true, includeContext = false } = options;
  const matches: RuleMatch[] = [];

  // Build parent map if context is needed
  const parentMap = includeContext ? buildParentMap(ast) : undefined;

  walkAST(ast, {
    enterNode: (node): boolean | undefined => {
      const zeroMaxResults = 0;
      if (maxResults !== undefined && maxResults > zeroMaxResults && matches.length >= maxResults) {
        return false; // Stop traversing
      }

      const result = wouldTriggerRule(node, xpathExpression, {
        includeDescendants: false,
      });

      if (result.matches && result.matchedNode !== undefined) {
        const location = getSourceRange(result.matchedNode);
        const { matchedNode } = result;

        // Extract match reason
        let matchReason: string | undefined = undefined;
        const normalizedXPath = xpathExpression.trim();
        const doubleSlashLength = 2;
        const firstIndex = 0;
        if (normalizedXPath.startsWith('//')) {
          const nodeType =
            normalizedXPath.substring(doubleSlashLength).split('[')[firstIndex]?.trim() ?? '';
          const attributeMatch = /\[@(\w+)='([^']+)'\]/.exec(normalizedXPath);
          if (attributeMatch !== null) {
            matchReason = `Node type matches "${nodeType}" and attribute filter matches`;
          } else {
            matchReason = `Node type matches "${nodeType}"`;
          }
        }

        // Extract matched attributes
        const matchedAttributes: Record<string, unknown> | undefined = (():
          | Record<string, unknown>
          | undefined => {
          const attributeMatch = /\[@(\w+)='([^']+)'\]/.exec(normalizedXPath);
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Check for attribute match
          if (attributeMatch !== null && matchedNode !== undefined) {
            const [, attrName] = attributeMatch;
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Check for attrName
            if (attrName !== undefined) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Dynamic property access
              const attrValue = (matchedNode as unknown as Record<string, unknown>)[attrName];
              return attrValue !== undefined ? { [attrName]: attrValue } : undefined;
            }
          }
          return undefined;
        })();

        // Get parent and siblings if context is requested
        const parentNode =
          includeContext && parentMap ? (parentMap.get(matchedNode) ?? undefined) : undefined;

        // Build sibling nodes (children of parent, excluding self)
        const siblingNodes: ASTNode[] | undefined =
          includeContext && parentNode !== undefined
            ? ((): ASTNode[] => {
                const parentChildren = Object.values(parentNode)
                  .filter((v): v is ASTNode => v !== null && typeof v === 'object' && 'kind' in v)
                  .filter((n) => n !== matchedNode);
                // Also check common child properties
                const commonChildren: ASTNode[] = [];
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Dynamic property access
                const parentRecord = parentNode as unknown as Record<string, unknown>;
                if (Array.isArray(parentRecord.statements)) {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type assertion for array
                  commonChildren.push(...(parentRecord.statements as ASTNode[]));
                }
                if (Array.isArray(parentRecord.members)) {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type assertion for array
                  commonChildren.push(...(parentRecord.members as ASTNode[]));
                }
                if (Array.isArray(parentRecord.arguments)) {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type assertion for array
                  commonChildren.push(...(parentRecord.arguments as ASTNode[]));
                }
                return [...new Set([...parentChildren, ...commonChildren])].filter(
                  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Check for location
                  (n) => n !== matchedNode && n.location !== null && n.location !== undefined
                );
              })()
            : undefined;

        matches.push({
          location,
          matchDetails: {
            capturedGroups: result.matchDetails?.capturedGroups,
            matchReason,
            matchedAttributes,

            matchedPattern: result.matchDetails?.matchedPattern ?? matchedNode.kind,
          },
          node: matchedNode,
          xpathExpression,
          ...(parentNode ? { parentNode } : {}),
          ...(siblingNodes ? { siblingNodes } : {}),
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
