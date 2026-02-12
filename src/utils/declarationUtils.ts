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
 * @param decl - The declaration node.
 * @returns The enclosing type, or null if at top level.
 */
export function getEnclosingType(decl: Readonly<Declaration>): TypeDeclaration | null {
  return (decl as Declaration & { parent?: TypeDeclaration | null }).parent ?? null;
}

/**
 * Gets the unqualified name of a declaration.
 */
function getDeclarationName(decl: Readonly<Declaration>): string {
  if (isVariableDeclaration(decl)) {
    return decl.id?.string ?? '';
  }
  return (
    (decl as { name?: string }).name ?? (decl as { id?: { string?: string } }).id?.string ?? ''
  );
}

/**
 * Computes qualified name for a declaration (e.g. "Outer.Inner.method").
 */
export function computeQualifiedName(
  decl: Readonly<Declaration>,
  parentMap: ReadonlyMap<ASTNode, ASTNode | null>
): string {
  const enclosing = getEnclosingTypeFromMap(decl, parentMap);
  const name = getDeclarationName(decl);
  if (enclosing) {
    const enclosingName = computeQualifiedName(enclosing, parentMap);
    return enclosingName ? `${enclosingName}.${name}` : name;
  }
  return name;
}

function getEnclosingTypeFromMap(
  node: Readonly<ASTNode>,
  parentMap: ReadonlyMap<ASTNode, ASTNode | null>
): TypeDeclaration | null {
  let current: ASTNode | null | undefined = parentMap.get(node);
  while (current) {
    if (
      isClassDeclaration(current) ||
      isInterfaceDeclaration(current) ||
      isEnumDeclaration(current)
    ) {
      return current as TypeDeclaration;
    }
    current = parentMap.get(current) ?? null;
  }
  return null;
}

/**
 * Attaches parent to all AST nodes and qualifiedName to Declaration nodes.
 * Mutates nodes in place. Matches upstream: ASTNode.parent on all nodes.
 * Call after translation or when loading AST for symbol resolution.
 *
 * @param root - The root AST node (typically CompilationUnit).
 */
export function attachDeclarationMetadata(root: Readonly<ASTNode>): void {
  const parentMap = buildParentMap(root);

  walkAST(root, {
    enterNode: (node: ASTNode): boolean | undefined => {
      // Set parent on all nodes (matches upstream ASTNode.parent)
      const mutable = node as ASTNode & { parent?: ASTNode | null };
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
        const declMutable = node as Declaration & {
          parent?: TypeDeclaration | null;
          qualifiedName?: string;
        };
        declMutable.parent = getEnclosingTypeFromMap(node, parentMap) ?? null;
        declMutable.qualifiedName = computeQualifiedName(declMutable, parentMap);
      }
      return undefined;
    },
  });
}
