/**
 * Comment-to-node mapping utilities
 */

import type { ASTNode } from '../ast/base.js';
import type { Position } from './position.js';
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
  readonly associatedNode?: ASTNode;
  readonly nodeRelationship?: 'preceding' | 'following' | 'attached' | 'enclosing';
}

/**
 * Options for extracting comments
 */
export interface ExtractCommentsOptions {
  readonly includeBlockComments?: boolean;
  readonly includeLineComments?: boolean;
  readonly associateNodes?: boolean; // Find associated nodes for each comment
}

/**
 * Extract all comments from source code with AST node associations
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
  } = options;

  const comments: ExtractedComment[] = [];
  const lines = source.split(/\r?\n/);

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    const lineNumber = lineNum + 1;

    // Extract line comments
    if (includeLineComments) {
      const lineCommentMatch = line.match(/\/\/(.*)$/);
      if (lineCommentMatch) {
        const commentText = lineCommentMatch[1].trim();
        const commentStart = line.indexOf('//') + 1;
        const column = commentStart + 1;

        const comment: ExtractedComment = {
          line: lineNumber,
          column,
          text: commentText,
          type: 'line',
        };

        if (associateNodes) {
          const associated = findAssociatedNode(ast, comment, source);
          if (associated) {
            (comment as any).associatedNode = associated.node;
            (comment as any).nodeRelationship = associated.relationship;
          }
        }

        comments.push(comment);
      }
    }

    // Extract block comments (simplified - doesn't handle multi-line block comments fully)
    if (includeBlockComments) {
      const blockCommentMatch = line.match(/\/\*([^*]|\*(?!\/))*\*\//);
      if (blockCommentMatch) {
        const commentText = blockCommentMatch[0]
          .replace(/\/\*|\*\//g, '')
          .trim();
        const commentStart = line.indexOf('/*') + 1;
        const column = commentStart + 1;

        const comment: ExtractedComment = {
          line: lineNumber,
          column,
          text: commentText,
          type: 'block',
        };

        if (associateNodes) {
          const associated = findAssociatedNode(ast, comment, source);
          if (associated) {
            (comment as any).associatedNode = associated.node;
            (comment as any).nodeRelationship = associated.relationship;
          }
        }

        comments.push(comment);
      }
    }
  }

  return comments;
}
