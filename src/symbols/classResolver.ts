/**
 * @file ClassResolver - Resolves class and method symbols in Apex ASTs.
 * Port of com.google.summit.symbols.ClassResolver.
 */

import type { ASTNode } from '../ast/baseNode.js';
import type { ClassDeclaration, MethodDeclaration } from '../ast/declaration.js';
import { isClassDeclaration, isMethodDeclaration } from '../guard/declarationGuard.js';
import { walkAST, buildParentMap } from '../utils/traversal.js';
import type { CompilationUnit } from '../ast/declaration.js';

/** A ClassDeclaration with its resolved method symbols. */
export interface ClassSymbol {
  readonly classDeclaration: ClassDeclaration;
  readonly methodDeclarations: readonly MethodDeclaration[];
}

/**
 * Gets the enclosing type declaration (ClassDeclaration, InterfaceDeclaration, or EnumDeclaration)
 * for a node by walking up the parent chain.
 */
function getEnclosingTypeDeclaration(
  node: Readonly<ASTNode>,
  parentMap: ReadonlyMap<ASTNode, ASTNode | null>
): ClassDeclaration | InterfaceDeclaration | EnumDeclaration | null {
  let current: ASTNode | null | undefined = parentMap.get(node);
  while (current) {
    if (
      current['@type'] === 'ClassDeclaration' ||
      current['@type'] === 'InterfaceDeclaration' ||
      current['@type'] === 'EnumDeclaration'
    ) {
      return current as ClassDeclaration | InterfaceDeclaration | EnumDeclaration;
    }
    current = parentMap.get(current) ?? null;
  }
  return null;
}

/** Interface/Enum placeholders for getEnclosingTypeDeclaration (we only need ClassDeclaration for ClassSymbol). */
interface InterfaceDeclaration {
  readonly '@type': 'InterfaceDeclaration';
  readonly name: string;
}
interface EnumDeclaration {
  readonly '@type': 'EnumDeclaration';
  readonly name: string;
}

/**
 * Gets the qualified name of a declaration (e.g. "Outer.Inner" for nested classes).
 */
function getQualifiedName(
  node: Readonly<ASTNode>,
  parentMap: ReadonlyMap<ASTNode, ASTNode | null>
): string {
  const enclosing = getEnclosingTypeDeclaration(node, parentMap);
  const name =
    (node as { name?: string }).name ?? (node as { id?: { string?: string } }).id?.string ?? '';

  if (enclosing) {
    const enclosingName = getQualifiedName(enclosing, parentMap);
    return enclosingName ? `${enclosingName}.${name}` : name;
  }
  return name;
}

/**
 * Collects MethodDeclaration nodes from a class subtree.
 */
function collectMethods(classNode: ClassDeclaration): MethodDeclaration[] {
  const methods: MethodDeclaration[] = [];
  walkAST(classNode, {
    enterNode: (n: ASTNode): boolean | undefined => {
      if (isMethodDeclaration(n)) {
        methods.push(n);
      }
      return undefined;
    },
  });
  return methods;
}

/**
 * Resolves all class and method symbols from a list of compilation units.
 * @param allAsts - List of CompilationUnit ASTs.
 * @returns Map from qualified class name to ClassSymbol.
 * @throws {Error} If duplicate class definitions are found.
 */
export function resolveClassesAndMethods(
  allAsts: readonly CompilationUnit[]
): Map<string, ClassSymbol> {
  const classMap = new Map<string, ClassSymbol>();

  for (const ast of allAsts) {
    const root = ast;
    const parentMap = buildParentMap(root);

    walkAST(root, {
      enterNode: (node: ASTNode): boolean | undefined => {
        if (isClassDeclaration(node)) {
          const qualifiedName = getQualifiedName(node, parentMap);
          const methods = collectMethods(node);

          const existing = classMap.get(qualifiedName);
          if (existing) {
            throw new Error(
              `Found (at least) two class definitions for ${qualifiedName} -- duplicate definitions.`
            );
          }

          classMap.set(qualifiedName, {
            classDeclaration: node,
            methodDeclarations: methods,
          });
        }
        return undefined;
      },
    });
  }

  return classMap;
}
