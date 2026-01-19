/**
 * @file Type reference AST node.
 * TypeRef is an AST node used to represent type references.
 * It matches summit-ast's TypeRef structure exactly.
 */

import type { ASTNode, SourceRange } from './base.js';
import type { Identifier } from './Identifier.js';

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
// eslint-disable-next-line @typescript-eslint/no-type-alias -- Type alias needed for backward compatibility
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

export type { TypeRef, TypeRefComponent, Type };
export { typeRefToCodeString };
