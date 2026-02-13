/**
 * @file Declaration utilities - qualifiedName, getEnclosingType, attachDeclarationMetadata.
 * Matches upstream Declaration.qualifiedName and getEnclosingType().
 */

import type { ASTNode } from '../ast/baseNode.js';
import type { Declaration, TypeDeclaration } from '../ast/declaration.js';
import {
  isClassDeclaration,
  isInterfaceDeclaration,
  isEnumDeclaration,
  isMethodDeclaration,
  isPropertyDeclaration,
  isTriggerDeclaration,
  isVariableDeclaration,
} from '../guard/declarationGuard.js';
import { buildParentMap, walkAST } from './traversal.js';

/**
 * Returns the enclosing type declaration for a node (ClassDeclaration, InterfaceDeclaration, or EnumDeclaration).
 * @param decl - The declaration node whose enclosing type to return.
 * @returns The enclosing type, or null if at top level.
 */
function getEnclosingType(decl: Declaration): TypeDeclaration | null {
  return decl.parent ?? null;
}

/**
 * Gets the unqualified name of a declaration.
 * @param decl - The declaration node whose name to return.
 * @returns The unqualified name or empty string.
 */
function getDeclarationName(decl: Declaration): string {
  if (isVariableDeclaration(decl)) {
    return decl.id.string;
  }
  if (isTriggerDeclaration(decl)) {
    return decl.id.string;
  }
  if (
    isClassDeclaration(decl) ||
    isInterfaceDeclaration(decl) ||
    isEnumDeclaration(decl) ||
    isMethodDeclaration(decl) ||
    isPropertyDeclaration(decl)
  ) {
    return decl.name;
  }
  return '';
}

/**
 * Walks parent map to find the enclosing type declaration.
 * @param node - The AST node to start from.
 * @param parentMap - Map from child to parent, from buildParentMap.
 * @returns The enclosing ClassDeclaration, InterfaceDeclaration, or EnumDeclaration, or null.
 */
function getEnclosingTypeFromMap(
  node: ASTNode,
  /* eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- ReadonlyMap is immutable. */
  parentMap: ReadonlyMap<ASTNode, ASTNode | null>
): TypeDeclaration | null {
  let current: ASTNode | null | undefined = parentMap.get(node);
  while (current) {
    if (isClassDeclaration(current)) return current;
    if (isInterfaceDeclaration(current)) return current;
    if (isEnumDeclaration(current)) return current;
    current = parentMap.get(current) ?? null;
  }
  return null;
}

/**
 * Computes qualified name for a declaration (e.g. "Outer.Inner.method").
 * @param decl - The declaration whose qualified name to compute.
 * @param parentMap - Map from child to parent, from buildParentMap.
 * @returns The fully qualified name.
 */
function computeQualifiedName(
  decl: Declaration,
  /* eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- ReadonlyMap is immutable. */
  parentMap: ReadonlyMap<ASTNode, ASTNode | null>
): string {
  const enclosing = getEnclosingTypeFromMap(decl, parentMap);
  const name = getDeclarationName(decl);
  if (enclosing !== null) {
    const enclosingName = computeQualifiedName(enclosing, parentMap);
    return enclosingName !== '' ? `${enclosingName}.${name}` : name;
  }
  return name;
}

/**
 * Attaches parent to all AST nodes and qualifiedName to Declaration nodes.
 * Mutates nodes in place. Matches upstream: ASTNode.parent on all nodes.
 * Call after translation or when loading AST for symbol resolution.
 * @param root - The root AST node (typically CompilationUnit).
 */
function attachDeclarationMetadata(root: ASTNode): void {
  const parentMap = buildParentMap(root);

  walkAST(root, {
    enterNode: (node: ASTNode): boolean | undefined => {
      const mutable = node as { parent?: ASTNode | null };
      mutable.parent = parentMap.get(node) ?? null;

      if (
        isClassDeclaration(node) ||
        isInterfaceDeclaration(node) ||
        isEnumDeclaration(node) ||
        isMethodDeclaration(node) ||
        isPropertyDeclaration(node) ||
        isTriggerDeclaration(node) ||
        isVariableDeclaration(node)
      ) {
        const declMutable = node as { parent?: TypeDeclaration | null; qualifiedName?: string };
        declMutable.parent = getEnclosingTypeFromMap(node, parentMap) ?? null;
        declMutable.qualifiedName = computeQualifiedName(node, parentMap);
      }
      return undefined;
    },
  });
}

export { attachDeclarationMetadata, computeQualifiedName, getEnclosingType };
