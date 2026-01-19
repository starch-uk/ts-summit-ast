/**
 * @file Base AST node interface and types.
 * Core AST node definitions, source location types, and visitor pattern.
 */

/**
 * Source location information.
 */
interface SourceLocation {
  readonly line: number;
  readonly column: number;
  readonly offset?: number;
}

/**
 * Source range (start and end positions).
 */
interface SourceRange {
  readonly start: SourceLocation;
  readonly end: SourceLocation;
}

/**
 * Base interface for all AST nodes.
 */
interface ASTNode {
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
interface ASTVisitor<T = void> {
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
interface VisitableNode extends ASTNode {
  /**
   * Accept a visitor and return the result.
   */
  accept: <T>(visitor: Readonly<ASTVisitor<T>>) => T;
}

/**
 * Default visitor implementation that traverses the tree.
 */
class DefaultVisitor implements ASTVisitor {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Default implementation intentionally does nothing
  public visit(_node: ASTNode): void {
    // Default implementation does nothing
    // Override in subclasses for specific behavior
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Default implementation intentionally does nothing
  public visitChildren(_node: ASTNode): never[] {
    // Default implementation returns empty array
    // Subclasses should override to visit child nodes
    return [];
  }
}

export type { SourceLocation, SourceRange, ASTNode, ASTVisitor, VisitableNode };
export { DefaultVisitor };
