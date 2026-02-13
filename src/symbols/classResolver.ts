/**
 * @file ClassResolver - Resolves class and method symbols in Apex ASTs.
 * Port of com.google.summit.symbols.ClassResolver.
 */

import type { ASTNode } from '../ast/baseNode.js';
import type { ClassDeclaration, MethodDeclaration } from '../ast/declaration.js';
import {
  isClassDeclaration,
  isEnumDeclaration,
  isInterfaceDeclaration,
  isMethodDeclaration,
  isPropertyDeclaration,
  isVariableDeclaration,
} from '../guard/declarationGuard.js';
import { walkAST, buildParentMap } from '../utils/traversal.js';
import type { CompilationUnit } from '../ast/declaration.js';

/** A ClassDeclaration with its resolved method symbols. */
export interface ClassSymbol {
  readonly classDeclaration: ClassDeclaration;
  readonly methodDeclarations: readonly MethodDeclaration[];
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
 * Extracts the unqualified name from a node (for declarations: .name or .id.string).
 * @param node - AST node that may have a name or id.
 * @returns The name string or empty string.
 */
function getDeclarationNameFromNode(node: ASTNode): string {
  if (isVariableDeclaration(node)) return node.id.string;
  if (
    isClassDeclaration(node) ||
    isInterfaceDeclaration(node) ||
    isEnumDeclaration(node) ||
    isMethodDeclaration(node) ||
    isPropertyDeclaration(node)
  ) {
    return node.name;
  }
  return '';
}

/**
 * Gets the enclosing type declaration (ClassDeclaration, InterfaceDeclaration, or EnumDeclaration)
 * for a node by walking up the parent chain.
 * @param node - The AST node whose enclosing type declaration should be resolved.
 * @param parentMap - A map from child nodes to their parent nodes, as produced by {@link buildParentMap}.
 * @returns The enclosing type declaration for the node, or null if none exists.
 */
function getEnclosingTypeDeclaration(
  node: ASTNode,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- ReadonlyMap is immutable; rule does not recognize it.
  parentMap: ReadonlyMap<ASTNode, ASTNode | null>
): ClassDeclaration | EnumDeclaration | InterfaceDeclaration | null {
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
 * Gets the qualified name of a declaration (e.g. Outer.Inner for nested classes).
 * @param node - The declaration or member node whose qualified name should be computed.
 * @param parentMap - A map from child nodes to their parent nodes, as produced by {@link buildParentMap}.
 * @returns The fully qualified name for the node. Returns an empty string if no name can be derived.
 */
function getQualifiedName(
  node: ASTNode,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- ReadonlyMap is immutable; rule does not recognize it.
  parentMap: ReadonlyMap<ASTNode, ASTNode | null>
): string {
  const enclosing = getEnclosingTypeDeclaration(node, parentMap);
  const name = getDeclarationNameFromNode(node);

  if (enclosing !== null) {
    const enclosingName = getQualifiedName(enclosing, parentMap);
    return enclosingName !== '' ? `${enclosingName}.${name}` : name;
  }
  return name;
}

/**
 * Collects {@link MethodDeclaration} nodes from a class subtree.
 * @param classNode - The root {@link ClassDeclaration} whose methods should be collected.
 * @returns An array of all method declarations found within the class subtree.
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
 * @param allAsts - A readonly array of {@link CompilationUnit} ASTs to analyze.
 * @returns A map from qualified class name to {@link ClassSymbol}, one entry per class.
 * @throws {Error} If duplicate class definitions are found for the same qualified name.
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
