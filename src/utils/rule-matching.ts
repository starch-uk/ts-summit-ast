/**
 * Rule matching utilities for XPath-like pattern matching
 * 
 * Note: This is a simplified implementation. A full XPath implementation
 * would require a more sophisticated parser and matcher.
 */

import type { ASTNode, SourceRange } from '../ast/base.js';
import { walkAST, buildParentMap } from './traversal.js';
import { getSourceRange } from './source-extraction.js';

/**
 * XPath feature support information
 */
export interface XPathFeatureSupport {
  /**
   * Whether XPath 3.1 features are supported
   */
  readonly supportsXPath31: boolean;
  /**
   * List of supported axes
   */
  readonly supportedAxes: string[];
  /**
   * List of supported functions
   */
  readonly supportedFunctions: string[];
  /**
   * List of unsupported features (if any)
   */
  readonly unsupportedFeatures?: string[];
}

/**
 * Result of XPath validation
 */
export interface XPathValidationResult {
  /**
   * Whether the XPath expression is valid
   */
  readonly valid: boolean;
  /**
   * Error message if validation failed
   */
  readonly error?: string;
  /**
   * Supported features detected in the expression
   */
  readonly supportedFeatures?: string[];
  /**
   * Unsupported features detected in the expression
   */
  readonly unsupportedFeatures?: string[];
}

/**
 * Validate XPath expression syntax before evaluation.
 *
 * This function performs basic syntax validation to catch common errors
 * before attempting to evaluate the XPath expression against an AST.
 *
 * @param xpath - The XPath expression to validate
 * @returns Validation result indicating if the expression is valid
 *
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

  if (!normalizedXPath) {
    return {
      valid: false,
      error: 'XPath expression cannot be empty',
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
  const bracketCount = (normalizedXPath.match(/\[/g) || []).length;
  const closeBracketCount = (normalizedXPath.match(/\]/g) || []).length;
  if (bracketCount !== closeBracketCount) {
    return {
      valid: false,
      error: `Mismatched brackets: ${bracketCount} opening brackets, ${closeBracketCount} closing brackets`,
      supportedFeatures,
      unsupportedFeatures: unsupportedFeatures.length > 0 ? unsupportedFeatures : undefined,
    };
  }

  // Check for basic attribute filter syntax
  const attributeFilterPattern = /\[@(\w+)='([^']*)'\]/g;
  // Validate attribute filter syntax by attempting to match
  attributeFilterPattern.exec(normalizedXPath);

  // Check for invalid characters in node names
  if (/\/\/[^a-zA-Z*][^[\]]*\[/.test(normalizedXPath)) {
    return {
      valid: false,
      error: 'Invalid node name in XPath expression',
      supportedFeatures,
      unsupportedFeatures: unsupportedFeatures.length > 0 ? unsupportedFeatures : undefined,
    };
  }

  const valid = unsupportedFeatures.length === 0 && bracketCount === closeBracketCount;

  return {
    valid,
    ...(valid
      ? {}
      : {
          error: unsupportedFeatures.length > 0
            ? `Unsupported XPath features: ${unsupportedFeatures.join(', ')}`
            : 'Invalid XPath syntax',
        }),
    supportedFeatures: supportedFeatures.length > 0 ? supportedFeatures : undefined,
    unsupportedFeatures: unsupportedFeatures.length > 0 ? unsupportedFeatures : undefined,
  };
}

/**
 * Check which XPath features are supported.
 *
 * This function returns information about which XPath features,
 * axes, and functions are supported by the current implementation.
 *
 * @returns Feature support information
 *
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
    supportsXPath31: false,
    supportedAxes,
    supportedFunctions,
    unsupportedFeatures,
  };
}

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
    /**
     * Reason why this node matched the XPath expression
     * (e.g., "Node type matches", "Attribute filter matches")
     */
    readonly matchReason?: string;
    /**
     * Attribute values that caused the match (for attribute filters)
     */
    readonly matchedAttributes?: Record<string, unknown>;
  };
  readonly location: SourceRange | null;
  /**
   * Parent node context (when includeContext is true)
   */
  readonly parentNode?: ASTNode;
  /**
   * Sibling nodes context (when includeContext is true)
   */
  readonly siblingNodes?: ASTNode[];
}

/**
 * Options for finding rule matches
 */
export interface FindRuleMatchesOptions {
  readonly maxResults?: number;
  readonly includeNested?: boolean; // Include nested matches
  /**
   * Include context information (parent, siblings) in match results
   * Default: false
   */
  readonly includeContext?: boolean;
}

/**
 * Find all AST nodes that match an XPath expression.
 *
 * Returns detailed match information including which nodes matched,
 * match context (parent/child relationships), and attribute values
 * that caused the match.
 *
 * @param ast - The AST node to search in
 * @param xpathExpression - The XPath expression to match
 * @param options - Options for finding matches
 * @param options.maxResults - Maximum number of matches to return
 * @param options.includeNested - Include nested matches (default: true)
 * @param options.includeContext - Include parent/sibling context (default: false)
 * @returns Array of rule matches with detailed information
 *
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
    enterNode: (node) => {
      if (maxResults && matches.length >= maxResults) {
        return false; // Stop traversing
      }

      const result = wouldTriggerRule(node, xpathExpression, {
        includeDescendants: false,
      });

      if (result.matches && result.matchedNode) {
        const location = getSourceRange(result.matchedNode);
        const matchedNode = result.matchedNode;

        // Extract match reason
        let matchReason: string | undefined;
        const normalizedXPath = xpathExpression.trim();
        if (normalizedXPath.startsWith('//')) {
          const nodeType = normalizedXPath.substring(2).split('[')[0].trim();
          const attributeMatch = normalizedXPath.match(/\[@(\w+)='([^']+)'\]/);
          if (attributeMatch) {
            matchReason = `Node type matches "${nodeType}" and attribute filter matches`;
          } else {
            matchReason = `Node type matches "${nodeType}"`;
          }
        }

        // Extract matched attributes
        const matchedAttributes: Record<string, unknown> | undefined = (() => {
          const attributeMatch = normalizedXPath.match(/\[@(\w+)='([^']+)'\]/);
          if (attributeMatch && matchedNode) {
            const attrName = attributeMatch[1];
            const attrValue = (matchedNode as any)[attrName];
            return attrValue !== undefined ? { [attrName]: attrValue } : undefined;
          }
          return undefined;
        })();

        // Get parent and siblings if context is requested
        const parentNode = includeContext && parentMap
          ? (parentMap.get(matchedNode) ?? undefined)
          : undefined;

        // Build sibling nodes (children of parent, excluding self)
        const siblingNodes: ASTNode[] | undefined = includeContext && parentNode
          ? (() => {
              const parentChildren = Object.values(parentNode)
                .filter((v): v is ASTNode => v !== null && typeof v === 'object' && 'kind' in v)
                .filter((n) => n !== matchedNode);
              // Also check common child properties
              const commonChildren: ASTNode[] = [];
              if ((parentNode as any).statements) {
                commonChildren.push(...((parentNode as any).statements as ASTNode[]));
              }
              if ((parentNode as any).members) {
                commonChildren.push(...((parentNode as any).members as ASTNode[]));
              }
              if ((parentNode as any).arguments) {
                commonChildren.push(...((parentNode as any).arguments as ASTNode[]));
              }
              return [...new Set([...parentChildren, ...commonChildren])].filter(
                (n) => n !== matchedNode && n.location
              );
            })()
          : undefined;

        matches.push({
          node: matchedNode,
          xpathExpression,
          matchDetails: {
            matchedPattern: result.matchDetails?.matchedPattern || matchedNode.kind,
            capturedGroups: result.matchDetails?.capturedGroups,
            matchReason,
            matchedAttributes,
          },
          location,
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
