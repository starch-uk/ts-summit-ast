/**
 * @file Base AST node interface and types.
 * Core AST node definitions, source location types, and visitor pattern.
 */

/**
 * Source location information.
 */
export interface SourceLocation {
  readonly line: number;
  readonly column: number;
  readonly offset?: number;
}

/**
 * Source range (start and end positions).
 */
export interface SourceRange {
  readonly start: SourceLocation;
  readonly end: SourceLocation;
}

/**
 * Base interface for all AST nodes.
 */
export interface ASTNode {
  readonly kind: string;
  readonly location?: SourceRange;
}

/**
 * Visitor pattern for AST traversal.
 */

/**
 * Base visitor interface for AST nodes.
 * @template T The return type of visit methods.
 */
export interface ASTVisitor<T = void> {
  /**
   * Visit any AST node (fallback for unknown node types).
   */
  visit: (node: ASTNode) => T;

  /**
   * Visit children of a node.
   */
  visitChildren: (node: ASTNode) => T[];
}

/**
 * Base interface for nodes that accept visitors.
 */
export interface VisitableNode extends ASTNode {
  /**
   * Accept a visitor and return the result.
   */
  accept: <T>(visitor: ASTVisitor<T>) => T;
}

/**
 * Default visitor implementation that traverses the tree.
 */
export class DefaultVisitor implements ASTVisitor {
  visit(_node: ASTNode): void {
    // Default implementation does nothing
    // Override in subclasses for specific behavior
  }

  visitChildren(_node: ASTNode): void[] {
    // Default implementation returns empty array
    // Subclasses should override to visit child nodes
    return [];
  }
}
