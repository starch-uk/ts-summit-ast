/**
 * Comment-to-node mapping utilities
 */

import type { ASTNode } from '../ast/base.js';
import type { SourceRange } from '../ast/base.js';
import type { Position } from './position.js';
import type { ApexDocComment } from '../ast/nodes/ApexDoc.js';
import type { ApexDocParseOptions } from './apexdoc-parser.js';
import { parseApexDocComment, isApexDocCommentString as isApexDocComment } from './apexdoc-parser.js';
import { findNodeAtPosition } from './node-finder.js';
import { getDistanceToRange } from './position.js';
import { getSourceRange } from './source-extraction.js';

/**
 * Comment information
 */
export interface CommentInfo {
  readonly line: number;
  readonly column: number; // Column where comment starts
  readonly text: string; // Comment text (without // or /* */)
  readonly type: 'line' | 'block'; // Comment type
}

/**
 * Result of finding an associated node
 */
export interface AssociatedNodeResult {
  readonly node: ASTNode;
  readonly relationship: 'preceding' | 'following' | 'attached' | 'enclosing';
  readonly distance: number; // Character distance from node to comment
}

/**
 * Options for finding associated node
 */
export interface FindAssociatedNodeOptions {
  readonly maxDistance?: number; // Maximum character distance to search
  readonly preferPreceding?: boolean; // Prefer preceding node over following
}

/**
 * Find the AST node associated with a comment
 */
export function findAssociatedNode(
  ast: ASTNode,
  comment: CommentInfo,
  source: string,
  options: FindAssociatedNodeOptions = {}
): AssociatedNodeResult | null {
  const { maxDistance = 100, preferPreceding = true } = options;
  const position: Position = { line: comment.line, column: comment.column };

  // First, try to find a node at the comment position (for inline comments)
  const nodeAtPosition = findNodeAtPosition(ast, position, { preferLeaf: true });
  if (nodeAtPosition) {
    const nodeRange = getSourceRange(nodeAtPosition.node);
    if (nodeRange) {
      const distance = getDistanceToRange(position, nodeRange);
      return {
        node: nodeAtPosition.node,
        relationship: 'enclosing',
        distance,
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
 * Find a node preceding the comment position
 */
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
  for (let col = position.column - 1; col >= 1; col--) {
    const testPosition: Position = { line: position.line, column: col };
    const result = findNodeAtPosition(ast, testPosition, { preferLeaf: false });

    if (result) {
      const nodeRange = getSourceRange(result.node);
      if (nodeRange && nodeRange.end.line === position.line && nodeRange.end.column < position.column) {
        const distance = position.column - nodeRange.end.column;
        if (distance < bestDistance && distance <= maxDistance) {
          bestDistance = distance;
          bestMatch = {
            node: result.node,
            relationship: 'preceding',
            distance,
          };
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Find a node following the comment position
 */
function findFollowingNode(
  ast: ASTNode,
  position: Position,
  source: string,
  maxDistance: number
): AssociatedNodeResult | null {
  const lines = source.split(/\r?\n/);
  const lineLength = (lines[position.line - 1] || '').length;

  // Try positions after the comment on the same line
  for (let col = position.column + 1; col <= lineLength + 1; col++) {
    const testPosition: Position = { line: position.line, column: col };
    const result = findNodeAtPosition(ast, testPosition, { preferLeaf: false });

    if (result) {
      const nodeRange = getSourceRange(result.node);
      if (nodeRange && nodeRange.start.line === position.line && nodeRange.start.column > position.column) {
        const distance = nodeRange.start.column - position.column;
        if (distance <= maxDistance) {
          return {
            node: result.node,
            relationship: 'following',
            distance,
          };
        }
      }
    }
  }

  // Try next line
  if (position.line < lines.length) {
    const nextLinePosition: Position = { line: position.line + 1, column: 1 };
    const result = findNodeAtPosition(ast, nextLinePosition, { preferLeaf: false });

    if (result) {
      const nodeRange = getSourceRange(result.node);
      if (nodeRange) {
        const distance = getDistanceToRange(position, nodeRange);
        if (distance <= maxDistance) {
          return {
            node: result.node,
            relationship: 'following',
            distance,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Extracted comment with node association
 */
export interface ExtractedComment extends CommentInfo {
  /**
   * Full comment text including any description after the marker
   * Example: "// ❌ Invalid field access" instead of just "// ❌"
   */
  readonly fullText?: string;

  /**
   * Just the marker portion (e.g., "// ❌" or "// ✅" or "/**")
   * For line comments: "//"
   * For block comments: "/*" or "/**"
   */
  readonly marker?: string;

  /**
   * Description text after the marker (if any)
   * Example: "Invalid field access" from "// ❌ Invalid field access"
   */
  readonly description?: string;

  /**
   * The most specific AST node this comment applies to
   * (e.g., the variable declaration, not the containing method)
   */
  readonly associatedNode?: ASTNode;

  /**
   * Relationship type indicating how the comment relates to the associated node
   * - 'preceding': Comment appears before the node on the same line
   * - 'following': Comment appears after the node on the same line or next line
   * - 'attached': Comment is directly attached to a node (like ApexDoc)
   * - 'enclosing': Comment encloses the node position
   * - 'annotated': Comment directly annotates a node (most specific association)
   */
  readonly nodeRelationship?: 'preceding' | 'following' | 'attached' | 'enclosing' | 'annotated';

  /**
   * Confidence score (0-1) indicating how certain the association is
   * Higher values indicate more confident associations
   */
  readonly associationConfidence?: number;

  /**
   * Parsed ApexDoc comment if this is an ApexDoc comment (starts with /**)
   */
  readonly apexDocComment?: ApexDocComment;
}

/**
 * Options for extracting comments
 */
export interface ExtractCommentsOptions {
  readonly includeBlockComments?: boolean;
  readonly includeLineComments?: boolean;
  readonly associateNodes?: boolean; // Find associated nodes for each comment
  readonly parseApexDoc?: boolean; // Parse ApexDoc comments into AST
  readonly apexDocParseOptions?: ApexDocParseOptions; // Options for parsing ApexDoc comments
}

/**
 * Extracts all comments from Apex source code with AST node associations.
 *
 * This function extracts both line comments and block comments (including ApexDoc),
 * and can optionally parse ApexDoc comments into structured AST nodes.
 *
 * @param ast - The parsed AST node (typically CompilationUnit or ApexFile)
 * @param source - The original source code string
 * @param options - Extraction options
 * @param options.includeLineComments - Whether to include line style comments (default: true)
 * @param options.includeBlockComments - Whether to include block style comments (default: true)
 * @param options.associateNodes - Whether to find associated AST nodes for each comment (default: false)
 * @param options.parseApexDoc - Whether to parse ApexDoc comments into AST (default: false)
 * @param options.apexDocParseOptions - Options for parsing ApexDoc comments
 * @returns Array of extracted comments with node associations
 *
 * @example
 * const result = parseApexCode('public class Test { // comment }');
 * const comments = extractComments(result.ast!, 'public class Test { // comment }', {
 *   associateNodes: true,
 *   parseApexDoc: true
 * });
 */
export function extractComments(
  ast: ASTNode,
  source: string,
  options: ExtractCommentsOptions = {}
): ExtractedComment[] {
  const {
    includeBlockComments = true,
    includeLineComments = true,
    associateNodes = false,
    parseApexDoc = false,
    apexDocParseOptions,
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
    const lineNumber = lineNum + 1;

    // Extract line comments
    if (includeLineComments && !inBlockComment) {
      const lineCommentMatch = line.match(/\/\/(.*)$/);
      if (lineCommentMatch) {
        const fullCommentText = lineCommentMatch[0]; // Full "// comment text"
        const commentText = lineCommentMatch[1].trim();
        const commentStart = line.indexOf('//');
        const column = commentStart + 1;

        // Extract marker and description
        const marker = '//';
        const description = commentText;

        const comment: ExtractedComment = {
          line: lineNumber,
          column,
          text: commentText,
          fullText: fullCommentText,
          marker,
          description,
          type: 'line',
        };

        if (associateNodes) {
          const associated = findAssociatedNode(ast, comment, source);
          if (associated) {
            (comment as any).associatedNode = associated.node;
            (comment as any).nodeRelationship = associated.relationship;
            // Calculate confidence based on distance (closer = more confident)
            const confidence = associated.distance <= 10 ? 1.0 : Math.max(0.1, 1.0 - associated.distance / 100);
            (comment as any).associationConfidence = confidence;
          }
        }

        comments.push(comment);
      }
    }

    // Handle block comments (including multi-line)
    if (includeBlockComments) {
      // Check for start of block comment
      const blockStartMatch = line.match(/\/\*\*/); // ApexDoc comment
      const blockStartMatch2 = line.match(/\/\*/); // Regular block comment
      const blockEndMatch = line.match(/\*\//);

      if (!inBlockComment && (blockStartMatch || blockStartMatch2)) {
        // Start of a block comment
        inBlockComment = true;
        blockCommentStartLine = lineNumber;
        blockCommentStartColumn = (blockStartMatch?.index ?? blockStartMatch2?.index ?? 0) + 1;
        blockCommentLines = [line];
        blockCommentRawText = line;

        // Check if it ends on the same line
        if (blockEndMatch) {
          // Single-line block comment
          inBlockComment = false;
          const commentText = blockCommentRawText
            .replace(/\/\*|\*\//g, '')
            .trim();
          const fullCommentText = blockCommentRawText;
          const marker = blockStartMatch ? '/**' : '/*';
          const description = commentText;

          // Parse ApexDoc if requested
          let apexDocComment: ApexDocComment | undefined;
          if (parseApexDoc && isApexDocComment(fullCommentText)) {
            const location = calculateCommentLocation(
              source,
              blockCommentStartLine,
              blockCommentStartColumn,
              fullCommentText
            );
            apexDocComment = parseApexDocComment(
              fullCommentText,
              location,
              apexDocParseOptions
            ) || undefined;
          }

          const comment: ExtractedComment = {
            line: blockCommentStartLine,
            column: blockCommentStartColumn,
            text: commentText,
            fullText: fullCommentText,
            marker,
            description,
            type: 'block',
            ...(apexDocComment ? { apexDocComment } : {}),
          };

          if (associateNodes) {
            const associated = findAssociatedNode(ast, comment, source);
            if (associated) {
              (comment as any).associatedNode = associated.node;
              (comment as any).nodeRelationship = associated.relationship;
              const confidence = associated.distance <= 10 ? 1.0 : Math.max(0.1, 1.0 - associated.distance / 100);
              (comment as any).associationConfidence = confidence;
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

          // Parse ApexDoc if requested
          let apexDocComment: ApexDocComment | undefined;
          if (parseApexDoc && isApexDocComment(fullCommentText)) {
            const location = calculateCommentLocation(
              source,
              blockCommentStartLine,
              blockCommentStartColumn,
              fullCommentText
            );
            apexDocComment = parseApexDocComment(
              fullCommentText,
              location,
              apexDocParseOptions
            ) || undefined;
          }

          const comment: ExtractedComment = {
            line: blockCommentStartLine,
            column: blockCommentStartColumn,
            text: commentText,
            fullText: fullCommentText,
            marker,
            description,
            type: 'block',
            ...(apexDocComment ? { apexDocComment } : {}),
          };

          if (associateNodes) {
            const associated = findAssociatedNode(ast, comment, source);
            if (associated) {
              (comment as any).associatedNode = associated.node;
              (comment as any).nodeRelationship = associated.relationship;
              const confidence = associated.distance <= 10 ? 1.0 : Math.max(0.1, 1.0 - associated.distance / 100);
              (comment as any).associationConfidence = confidence;
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
 * Calculate location for a comment block
 */
function calculateCommentLocation(
  _source: string,
  startLine: number,
  startColumn: number,
  commentText: string
): SourceRange {
  const commentLines = commentText.split(/\r?\n/);
  const endLine = startLine + commentLines.length - 1;
  const endLineText = commentLines[commentLines.length - 1] || '';
  const endColumn = startColumn + endLineText.length;

  return {
    start: {
      line: startLine,
      column: startColumn,
    },
    end: {
      line: endLine,
      column: endColumn,
    },
  };
}
