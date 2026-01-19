/**
 * @file Comment-to-node association utilities.
 * Functions for finding AST nodes associated with comments and extracting comments from source code.
 */

/* eslint-disable import/group-exports -- Inline exports are standard TypeScript practice */

import type { ApexDocComment } from '../ast/ApexDoc.js';
import type { ASTNode, SourceRange } from '../ast/base.js';
import type { ApexDocParseOptions } from './apexdoc-parser.js';
import { findNodeAtPosition } from './node-finder.js';
import { getDistanceToRange, getSourceRange } from './source-extraction.js';
import type { Position } from './source-extraction.js';
import {
  isApexDocCommentString as isApexDocComment,
  parseApexDocComment,
} from './apexdoc-parser.js';

/**
 * Comment information.
 */
export interface CommentInfo {
  readonly line: number;

  /**
   * Column where comment starts.
   */
  readonly column: number;

  /**
   * Comment text (without comment markers).
   */
  readonly text: string;

  /**
   * Comment type.
   */
  readonly type: 'block' | 'line';
}

/**
 * Result of finding an associated node.
 */
export interface AssociatedNodeResult {
  readonly node: ASTNode;
  readonly relationship: 'attached' | 'enclosing' | 'following' | 'preceding';

  /**
   * Character distance from node to comment.
   */
  readonly distance: number;
}

/**
 * Options for finding associated node.
 */
export interface FindAssociatedNodeOptions {
  /**
   * Maximum character distance to search.
   */
  readonly maxDistance?: number;

  /**
   * Prefer preceding node over following.
   */
  readonly preferPreceding?: boolean;
}

/**
 * Find a node preceding the comment position.
 * @param ast - The root AST node to search in.
 * @param position - The comment position.
 * @param _source - The source code string (unused).
 * @param maxDistance - Maximum character distance to search.
 * @returns The preceding node result, or null if not found.
 */
// eslint-disable-next-line @typescript-eslint/max-params -- Function requires 4 parameters for clarity
function findPrecedingNode(
  ast: ASTNode,
  position: Position,
  _source: string,
  maxDistance: number
): AssociatedNodeResult | null {
  // Search backwards on the same line
  let bestMatch: AssociatedNodeResult | null = null;
  let bestDistance = Infinity;

  // Try positions before the comment on the same line
  const columnDecrement = 1;
  const minColumn = 1;
  for (let col = position.column - columnDecrement; col >= minColumn; col--) {
    const testPosition: Position = { column: col, line: position.line };
    const result = findNodeAtPosition(ast, testPosition, { preferLeaf: false });

    if (result) {
      const nodeRange = getSourceRange(result.node);
      if (nodeRange?.end.line === position.line && nodeRange.end.column < position.column) {
        const distance = position.column - nodeRange.end.column;
        if (distance < bestDistance && distance <= maxDistance) {
          bestDistance = distance;
          bestMatch = {
            distance,
            node: result.node,
            relationship: 'preceding',
          };
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Find a node following the comment position.
 * @param ast - The root AST node to search in.
 * @param position - The comment position.
 * @param source - The source code string.
 * @param maxDistance - Maximum character distance to search.
 * @returns The following node result, or null if not found.
 */
// eslint-disable-next-line @typescript-eslint/max-params -- Function requires 4 parameters for clarity
function findFollowingNode(
  ast: ASTNode,
  position: Position,
  source: string,
  maxDistance: number
): AssociatedNodeResult | null {
  const lines = source.split(/\r?\n/);
  const lineIndexOffset = 1;
  const lineLength = (lines[position.line - lineIndexOffset] ?? '').length;

  // Try positions after the comment on the same line
  const columnIncrement = 1;
  for (let col = position.column + columnIncrement; col <= lineLength + columnIncrement; col++) {
    const testPosition: Position = { column: col, line: position.line };
    const result = findNodeAtPosition(ast, testPosition, { preferLeaf: false });

    if (result) {
      const nodeRange = getSourceRange(result.node);
      if (nodeRange?.start.line === position.line && nodeRange.start.column > position.column) {
        const distance = nodeRange.start.column - position.column;
        if (distance <= maxDistance) {
          return {
            distance,
            node: result.node,
            relationship: 'following',
          };
        }
      }
    }
  }

  // Try next line
  if (position.line < lines.length) {
    const firstColumn = 1;
    const lineIncrement = 1;
    const nextLinePosition: Position = { column: firstColumn, line: position.line + lineIncrement };
    const result = findNodeAtPosition(ast, nextLinePosition, { preferLeaf: false });

    if (result) {
      const nodeRange = getSourceRange(result.node);
      if (nodeRange) {
        const distance = getDistanceToRange(position, nodeRange);
        if (distance <= maxDistance) {
          return {
            distance,
            node: result.node,
            relationship: 'following',
          };
        }
      }
    }
  }

  return null;
}

/**
 * Find the AST node associated with a comment.
 * @param ast - The root AST node to search in.
 * @param comment - The comment information.
 * @param source - The source code string.
 * @param options - Options for finding the associated node.
 * @returns The associated node result, or null if not found.
 */
// eslint-disable-next-line @typescript-eslint/max-params -- Function requires 4 parameters for clarity
export function findAssociatedNode(
  ast: ASTNode,
  comment: CommentInfo,
  source: string,
  options: FindAssociatedNodeOptions = {}
): AssociatedNodeResult | null {
  const defaultMaxDistance = 100;
  const { maxDistance = defaultMaxDistance, preferPreceding = true } = options;
  const position: Position = { column: comment.column, line: comment.line };

  // First, try to find a node at the comment position (for inline comments)
  const nodeAtPosition = findNodeAtPosition(ast, position, { preferLeaf: true });
  if (nodeAtPosition) {
    const nodeRange = getSourceRange(nodeAtPosition.node);
    if (nodeRange) {
      const distance = getDistanceToRange(position, nodeRange);
      return {
        distance,
        node: nodeAtPosition.node,
        relationship: 'enclosing',
      };
    }
  }

  // Try to find preceding node (on same line, before comment)
  if (preferPreceding) {
    const precedingNode = findPrecedingNode(ast, position, source, maxDistance);
    if (precedingNode) {
      return precedingNode;
    }
  }

  // Try to find following node (on same line or next line, after comment)
  const followingNode = findFollowingNode(ast, position, source, maxDistance);
  if (followingNode) {
    return followingNode;
  }

  // If preferPreceding was false and we didn't find following, try preceding
  if (!preferPreceding) {
    const precedingNode = findPrecedingNode(ast, position, source, maxDistance);
    if (precedingNode) {
      return precedingNode;
    }
  }

  return null;
}

/**
 * Comment extraction utilities
 * Functions for extracting comments from source code.
 */

/**
 * Comment pattern configuration for recognizing special comment types.
 */
export interface CommentPattern {
  /**
   * Pattern to match comments (e.g., /^\/\/\s*(TODO|FIXME):\s*(.+)$/i).
   */
  readonly pattern: RegExp;

  /**
   * Category/type identifier for matched comments.
   */
  readonly type: string;

  /**
   * Extract description from pattern match (which capture group)
   * Default: first capture group.
   */
  readonly descriptionGroup?: number;
}

/**
 * Extracted comment with node association.
 */
export interface ExtractedComment extends CommentInfo {
  /**
   * Full comment text including any description after the marker
   * Example: "// ❌ Invalid field access" instead of just "// ❌"
   * Always provided when comment is extracted.
   */
  readonly fullText: string;

  /**
   * Just the marker portion (e.g., "// ❌" or "// ✅" or "/**")
   * For line comments: "//"
   * For block comments: "/*" or "/**"
   * Always provided when comment is extracted.
   */
  readonly marker: string;

  /**
   * Description text after the marker (if any)
   * Example: "Invalid field access" from "// ❌ Invalid field access"
   * Always provided when comment is extracted (may be empty string).
   */
  readonly description: string;

  /**
   * The most specific AST node this comment applies to
   * (e.g., the variable declaration, not the containing method)
   * Only provided when associateNodes is true and a node is found.
   */
  readonly associatedNode?: ASTNode;

  /**
   * Relationship type indicating how the comment relates to the associated node
   * - 'preceding': Comment appears before the node on the same line
   * - 'following': Comment appears after the node on the same line or next line
   * - 'attached': Comment is directly attached to a node (like ApexDoc)
   * - 'enclosing': Comment encloses the node position
   * - 'annotated': Comment directly annotates a node (most specific association)
   * Always provided when associateNodes is true and a node is found.
   */
  readonly nodeRelationship?: 'annotated' | 'attached' | 'enclosing' | 'following' | 'preceding';

  /**
   * Confidence score (0-1) indicating how certain the association is
   * Higher values indicate more confident associations
   * Always provided when associateNodes is true and a node is found.
   */
  readonly associationConfidence?: number;

  /**
   * Parsed ApexDoc comment if this is an ApexDoc comment (starts with /**).
   */
  readonly apexDocComment?: ApexDocComment;

  /**
   * Comment type/category if matched by a pattern
   * Set when comment matches one of the provided commentPatterns.
   */
  readonly commentType?: string;

  /**
   * Extracted metadata from pattern match
   * Set when comment matches one of the provided commentPatterns.
   */
  readonly patternMetadata?: {
    readonly type: string;
    readonly matches: RegExpMatchArray;
  };
}

/**
 * Options for extracting comments.
 */
export interface ExtractCommentsOptions {
  readonly includeBlockComments?: boolean;
  readonly includeLineComments?: boolean;

  /**
   * Find associated nodes for each comment.
   */
  readonly associateNodes?: boolean;

  /**
   * Parse ApexDoc comments into AST.
   */
  readonly parseApexDoc?: boolean;

  /**
   * Options for parsing ApexDoc comments.
   */
  readonly apexDocParseOptions?: ApexDocParseOptions;

  /**
   * Patterns to recognize special comment types
   * When provided, comments matching these patterns are categorized accordingly
   * Example: [{ pattern: /^\/\/\s*(TODO|FIXME):\s*(.+)$/i, type: 'todo' }].
   */
  readonly commentPatterns?: CommentPattern[];
}

/**
 * Match a comment against provided patterns.
 * @param commentText - The comment text to match.
 * @param patterns - The patterns to match against.
 * @returns The match result, or null if no match.
 */

/**
 * Matches a comment against a set of patterns.
 * @param commentText - The comment text to match.
 * @param patterns - The patterns to match against.
 * @returns The match result if a pattern matches, or null if no match.
 */
function matchCommentPattern(
  commentText: Readonly<string>,
  patterns?: readonly Readonly<CommentPattern>[]
): { type: string; matches: RegExpMatchArray } | null {
  const emptyArrayLength = 0;
  if (!patterns || patterns.length === emptyArrayLength) {
    return null;
  }

  for (const patternConfig of patterns) {
    const match = commentText.match(patternConfig.pattern);
    if (match) {
      return {
        matches: match,
        type: patternConfig.type,
      };
    }
  }

  return null;
}

/**
 * Extracts all comments from Apex source code with AST node associations.
 *
 * This function extracts both line comments and block comments (including ApexDoc),
 * and can optionally parse ApexDoc comments into structured AST nodes.
 * @param ast - The parsed AST node (typically CompilationUnit or ApexFile).
 * @param source - The original source code string.
 * @param options - Extraction options.
 * @param options.includeLineComments - Whether to include line style comments (default: true).
 * @param options.includeBlockComments - Whether to include block style comments (default: true).
 * @param options.associateNodes - Whether to find associated AST nodes for each comment (default: false).
 * @param options.parseApexDoc - Whether to parse ApexDoc comments into AST (default: false).
 * @param options.apexDocParseOptions - Options for parsing ApexDoc comments.
 * @param options.commentPatterns - Patterns to recognize special comment types.
 * @returns Array of extracted comments with node associations.
 * @example
 * ```typescript
 * const result = parseApexCode('public class Test { // comment }');
 * const comments = extractComments(result.ast ?? null, 'public class Test { // comment }', {
 *   associateNodes: true,
 *   includeLineComments: true,
 *   commentPatterns: [
 *     { pattern: /^\/\/\s*(TODO|FIXME):\s*(.+)$/i, type: 'todo' }
 *   ]
 * });
 * ```
 */
export function extractComments(
  ast: Readonly<ASTNode>,
  source: Readonly<string>,
  options: Readonly<ExtractCommentsOptions> = {}
): ExtractedComment[] {
  const {
    includeBlockComments = true,
    includeLineComments = true,
    associateNodes = false,
    parseApexDoc = false,
    apexDocParseOptions,
    commentPatterns,
  } = options;

  const comments: ExtractedComment[] = [];
  const lines = source.split(/\r?\n/);

  // Track multi-line block comments
  let inBlockComment = false;
  let blockCommentStartLine = 0;
  let blockCommentStartColumn = 0;
  let blockCommentLines: string[] = [];
  let blockCommentRawText = '';

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];

    const lineNumberOffset = 1;
    const lineNumber = lineNum + lineNumberOffset;

    // Extract line comments
    if (includeLineComments && !inBlockComment) {
      const lineCommentMatch = /\/\/(.*)$/.exec(line);
      if (lineCommentMatch) {
        /**
         * Full "// comment text".
         */

        const fullMatchIndex = 0;
        const firstCaptureGroup = 1;
        const fullCommentText = lineCommentMatch[fullMatchIndex];
        const commentText = lineCommentMatch[firstCaptureGroup].trim();
        const commentStart = line.indexOf('//');

        const columnOffset = 1;
        const column = commentStart + columnOffset;

        // Extract marker and description
        const marker = '//';
        const description = commentText;

        // Match comment against patterns
        const patternMatch = matchCommentPattern(commentText, commentPatterns);

        const comment: ExtractedComment = {
          column,
          description,
          fullText: fullCommentText,
          line: lineNumber,
          marker,
          text: commentText,
          type: 'line',
          ...(patternMatch
            ? {
                commentType: patternMatch.type,
                patternMetadata: {
                  matches: patternMatch.matches,
                  type: patternMatch.type,
                },
              }
            : {}),
        };

        if (associateNodes) {
          const associated = findAssociatedNode(ast, comment, source);
          if (associated) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type assertion for dynamic property assignment
            const commentWithAssociation = comment as ExtractedComment & Record<string, unknown>;

            (commentWithAssociation as Record<string, unknown>).associatedNode = associated.node;

            (commentWithAssociation as Record<string, unknown>).nodeRelationship =
              associated.relationship;
            // Calculate confidence based on distance (closer = more confident)

            const distanceThreshold = 10;
            const maxConfidence = 1.0;
            const minConfidence = 0.1;
            const confidenceDivisor = 100;
            const confidence =
              associated.distance <= distanceThreshold
                ? maxConfidence
                : Math.max(minConfidence, maxConfidence - associated.distance / confidenceDivisor);

            (commentWithAssociation as Record<string, unknown>).associationConfidence = confidence;
          }
        }

        comments.push(comment);
      }
    }

    // Handle block comments (including multi-line)
    if (includeBlockComments) {
      // Check for start of block comment

      /**
       * ApexDoc comment.
       */
      const blockStartMatch = /\/\*\*/.exec(line);

      /**
       * Regular block comment.
       */
      const blockStartMatch2 = /\/\*/.exec(line);
      const blockEndMatch = /\*\//.exec(line);

      if (!inBlockComment && (blockStartMatch || blockStartMatch2)) {
        // Start of a block comment
        inBlockComment = true;
        blockCommentStartLine = lineNumber;

        const columnOffset = 1;

        const defaultIndex = 0;
        blockCommentStartColumn =
          (blockStartMatch?.index ?? blockStartMatch2?.index ?? defaultIndex) + columnOffset;
        blockCommentLines = [line];
        blockCommentRawText = line;

        // Check if it ends on the same line
        if (blockEndMatch) {
          // Single-line block comment
          inBlockComment = false;
          const commentText = blockCommentRawText.replace(/\/\*|\*\//g, '').trim();
          const fullCommentText = blockCommentRawText;
          const marker = blockStartMatch ? '/**' : '/*';
          const description = commentText;

          // Match comment against patterns
          const patternMatch = matchCommentPattern(commentText, commentPatterns);

          // Parse ApexDoc if requested

          let apexDocComment: ApexDocComment | undefined = undefined;
          if (parseApexDoc && isApexDocComment(fullCommentText)) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Function is defined later in file
            const location = calculateCommentLocation(
              source,
              blockCommentStartLine,
              blockCommentStartColumn,
              fullCommentText
            );
            apexDocComment =
              parseApexDocComment(fullCommentText, location, apexDocParseOptions) ?? undefined;
          }

          const comment: ExtractedComment = {
            column: blockCommentStartColumn,
            description,
            fullText: fullCommentText,
            line: blockCommentStartLine,
            marker,
            text: commentText,
            type: 'block',
            ...(apexDocComment ? { apexDocComment } : {}),
            ...(patternMatch
              ? {
                  commentType: patternMatch.type,
                  patternMetadata: {
                    matches: patternMatch.matches,
                    type: patternMatch.type,
                  },
                }
              : {}),
          };

          if (associateNodes) {
            const associated = findAssociatedNode(ast, comment, source);
            if (associated) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type assertion for dynamic property assignment
              const commentWithAssociation = comment as ExtractedComment & Record<string, unknown>;

              (commentWithAssociation as Record<string, unknown>).associatedNode = associated.node;

              (commentWithAssociation as Record<string, unknown>).nodeRelationship =
                associated.relationship;

              const maxDistanceForFullConfidence = 10;
              const fullConfidence = 1.0;
              const minConfidence = 0.1;
              const confidenceDivisor = 100;
              const confidence =
                associated.distance <= maxDistanceForFullConfidence
                  ? fullConfidence
                  : Math.max(
                      minConfidence,
                      fullConfidence - associated.distance / confidenceDivisor
                    );

              (commentWithAssociation as Record<string, unknown>).associationConfidence =
                confidence;
            }
          }

          comments.push(comment);
          blockCommentLines = [];
          blockCommentRawText = '';
        }
      } else if (inBlockComment) {
        // Continue block comment
        blockCommentLines.push(line);
        blockCommentRawText += '\n' + line;

        // Check if comment ends on this line
        if (blockEndMatch) {
          // End of block comment
          inBlockComment = false;
          const commentText = blockCommentRawText
            .replace(/\/\*\*?/, '')
            .replace(/\*\//, '')
            .replace(/^\s*\*\s?/gm, '') // Remove leading asterisks
            .trim();
          const fullCommentText = blockCommentRawText;
          const marker = blockCommentRawText.trimStart().startsWith('/**') ? '/**' : '/*';
          const description = commentText;

          // Match comment against patterns
          const patternMatch = matchCommentPattern(commentText, commentPatterns);

          // Parse ApexDoc if requested

          let apexDocComment: ApexDocComment | undefined = undefined;
          if (parseApexDoc && isApexDocComment(fullCommentText)) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Function is defined later in file
            const location = calculateCommentLocation(
              source,
              blockCommentStartLine,
              blockCommentStartColumn,
              fullCommentText
            );
            apexDocComment =
              parseApexDocComment(fullCommentText, location, apexDocParseOptions) ?? undefined;
          }

          const comment: ExtractedComment = {
            column: blockCommentStartColumn,
            description,
            fullText: fullCommentText,
            line: blockCommentStartLine,
            marker,
            text: commentText,
            type: 'block',
            ...(apexDocComment ? { apexDocComment } : {}),
            ...(patternMatch
              ? {
                  commentType: patternMatch.type,
                  patternMetadata: {
                    matches: patternMatch.matches,
                    type: patternMatch.type,
                  },
                }
              : {}),
          };

          if (associateNodes) {
            const associated = findAssociatedNode(ast, comment, source);
            if (associated) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type assertion for dynamic property assignment
              const commentWithAssociation = comment as ExtractedComment & Record<string, unknown>;

              (commentWithAssociation as Record<string, unknown>).associatedNode = associated.node;

              (commentWithAssociation as Record<string, unknown>).nodeRelationship =
                associated.relationship;

              const maxDistanceForFullConfidence = 10;
              const fullConfidence = 1.0;
              const minConfidence = 0.1;
              const confidenceDivisor = 100;
              const confidence =
                associated.distance <= maxDistanceForFullConfidence
                  ? fullConfidence
                  : Math.max(
                      minConfidence,
                      fullConfidence - associated.distance / confidenceDivisor
                    );

              (commentWithAssociation as Record<string, unknown>).associationConfidence =
                confidence;
            }
          }

          comments.push(comment);
          blockCommentLines = [];
          blockCommentRawText = '';
        }
      }
    }
  }

  return comments;
}

/**
 * Calculate location for a comment block.
 * @param _source - The source code string (unused).
 * @param startLine - The starting line number.
 * @param startColumn - The starting column number.
 * @param commentText - The comment text.
 * @returns The source range for the comment.
 */
function calculateCommentLocation(
  _source: string,
  startLine: number,
  startColumn: number,
  commentText: string
): SourceRange {
  const commentLines = commentText.split(/\r?\n/);
  const endLine = startLine + commentLines.length - 1;
  const endLineText = commentLines[commentLines.length - 1] ?? '';
  const endColumn = startColumn + endLineText.length;

  return {
    end: {
      column: endColumn,
      line: endLine,
    },
    start: {
      column: startColumn,
      line: startLine,
    },
  };
}
