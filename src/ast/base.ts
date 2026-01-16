/**
 * Base AST node interface and types
 */

/**
 * Source location information
 */
export interface SourceLocation {
  readonly line: number;
  readonly column: number;
  readonly offset?: number;
}

/**
 * Source range (start and end positions)
 */
export interface SourceRange {
  readonly start: SourceLocation;
  readonly end: SourceLocation;
}

/**
 * Base interface for all AST nodes
 */
export interface ASTNode {
  readonly kind: string;
  readonly location?: SourceRange;
}
