/**
 * @file Base AST node interface and types.
 * Core AST node definitions, source location types, visitor pattern, identifier, and type reference.
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
 * Identifier: a name used within other AST nodes.
 * This is a helper node, not an expression type.
 * For variable references in expressions, use VariableExpression.
 */
interface Identifier extends ASTNode {
  readonly kind: 'Identifier';
  readonly name: string;
}

/**
 * Type reference AST node.
 * These occur in any context where a static type appears in code.
 *
 * In summit-ast, TypeRef extends Node(), so it IS an AST node.
 */
interface TypeRef extends ASTNode {
  readonly kind: 'TypeRef';

  /**
   * The sequence of one or more identifiers (with optional type arguments).
   * Multiple components represent inner classes (e.g., "Outer.Inner").
   */
  readonly components: readonly TypeRefComponent[];

  /**
   * The number of levels of array nesting for this type.
   * For example, "int[][]" has arrayNesting = 2.
   */
  readonly arrayNesting: number;

  /**
   * Optional source location.
   */
  readonly location?: SourceRange;
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
 * Type alias for backward compatibility during migration.
 * @deprecated Use TypeRef instead.
 */
type Type = TypeRef;

/**
 * Converts a TypeRef to its source-like string (e.g. "A[][]", "Map<String>").
 * Equivalent to asCodeString in Kotlin summit-ast.
 * @param typeRef - The type reference to convert to a string.
 * @returns The string representation of the type reference.
 */
function typeRefToCodeString(typeRef: Readonly<TypeRef>): string {
  const emptyArrayLength = 0;
  if (typeRef.components.length === emptyArrayLength) {
    return 'void';
  }
  const typeString = typeRef.components
    .map((comp: Readonly<TypeRefComponent>) => {
      let result = comp.id.name;
      const emptyArgsLength = 0;
      if (comp.args.length > emptyArgsLength) {
        const readonlyArgs = comp.args;
        result += `<${readonlyArgs.map((arg: Readonly<TypeRef>) => typeRefToCodeString(arg)).join(', ')}>`;
      }
      return result;
    })
    .join('.');
  return typeString + '[]'.repeat(typeRef.arrayNesting);
}

export type {
  SourceLocation,
  SourceRange,
  ASTNode,
  ASTVisitor,
  VisitableNode,
  Identifier,
  TypeRef,
  TypeRefComponent,
  Type,
};
export { DefaultVisitor, typeRefToCodeString };
