/**
 * @file Base AST node interface and types.
 * Uses Summit-AST canonical property names (`@type`, sourceLocation) so in-memory and JSON match.
 */

/**
 * Source location information (line/column).
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
 * Canonical source location: flat start/end line and column (same as JSON).
 */
interface CanonicalSourceLocation {
  readonly startLine: number;
  readonly startColumn: number;
  readonly endLine: number;
  readonly endColumn: number;
}

/**
 * Base interface for all AST nodes. Uses canonical names: `@type`, sourceLocation.
 * Parent is populated by attachParentLinks(root) for all nodes; matches upstream ASTNode.parent.
 */
interface ASTNode {
  readonly '@type': string;
  readonly sourceLocation?: CanonicalSourceLocation;

  /**
   * Parent node in the AST tree. Populated by attachParentLinks(root).
   * Matches upstream ASTNode.parent.
   */
  readonly parent?: ASTNode | null;
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
  public visit(_node: ASTNode): void {
    void this;
    // Default implementation does nothing
    // Override in subclasses for specific behavior
  }

  public visitChildren(_node: ASTNode): never[] {
    void this;
    // Default implementation returns empty array
    // Subclasses should override to visit child nodes
    return [];
  }
}

/**
 * Identifier: a name used within other AST nodes. Uses canonical name: string.
 */
interface Identifier extends ASTNode {
  readonly '@type': 'Identifier';
  readonly string: string;
}

/**
 * Type reference AST node.
 * These occur in any context where a static type appears in code.
 */
interface TypeRef extends ASTNode {
  readonly '@type': 'TypeRef';
  readonly components: readonly TypeRefComponent[];
  readonly arrayNesting: number;
  readonly sourceLocation?: CanonicalSourceLocation;
}

/**
 * A component of a type reference.
 * A sequence of Components delimited by dot constitutes a type reference.
 * An example TypeRef with multiple Components is an inner class.
 */
interface TypeRefComponent {
  /**
   * The type identifier.
   */
  readonly id: Identifier;

  /**
   * Zero or more type arguments (for generic types).
   */
  readonly args: readonly TypeRef[];
}

/**
 * Converts SourceRange to canonical sourceLocation (for AST nodes).
 * @param range - The source range to convert.
 * @returns The canonical location or undefined if range is undefined.
 */
function toCanonicalSourceLocation(
  range: SourceRange | undefined
): CanonicalSourceLocation | undefined {
  if (!range) return undefined;
  return {
    endColumn: range.end.column,
    endLine: range.end.line,
    startColumn: range.start.column,
    startLine: range.start.line,
  };
}

/**
 * Converts canonical sourceLocation to SourceRange (for utilities that use start/end).
 * @param sl - The canonical source location to convert.
 * @returns The SourceRange or undefined if sl is undefined.
 */
function toSourceRange(sl: CanonicalSourceLocation | undefined): SourceRange | undefined {
  if (!sl) return undefined;
  return {
    end: { column: sl.endColumn, line: sl.endLine },
    start: { column: sl.startColumn, line: sl.startLine },
  };
}

/**
 * Converts a TypeRef to its source-like string (e.g. "A[][]", "Map<String>").
 * Equivalent to asCodeString in Kotlin summit-ast.
 * @param typeRef - The type reference to convert to a string.
 * @returns The string representation of the type reference.
 */
function typeRefToCodeString(typeRef: TypeRef): string {
  const emptyArrayLength = 0;
  if (typeRef.components.length === emptyArrayLength) {
    return 'void';
  }
  const typeString = typeRef.components
    .map((comp: TypeRefComponent) => {
      let result = comp.id.string;
      const emptyArgsLength = 0;
      if (comp.args.length > emptyArgsLength) {
        const readonlyArgs = comp.args;
        result += `<${readonlyArgs.map((arg: TypeRef) => typeRefToCodeString(arg)).join(', ')}>`;
      }
      return result;
    })
    .join('.');
  return typeString + '[]'.repeat(typeRef.arrayNesting);
}

export type {
  SourceLocation,
  SourceRange,
  CanonicalSourceLocation,
  ASTNode,
  ASTVisitor,
  VisitableNode,
  Identifier,
  TypeRef,
  TypeRefComponent,
};
export { DefaultVisitor, toCanonicalSourceLocation, toSourceRange, typeRefToCodeString };
