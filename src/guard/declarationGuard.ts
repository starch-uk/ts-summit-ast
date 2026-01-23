/**
 * @file Type guard functions for declaration AST nodes.
 * TypeScript type guard functions for checking declaration node types at runtime.
 */

import type { ASTNode, TypeRef, Identifier } from '../ast/baseNode.js';
import type {
  Declaration,
  ClassDeclaration,
  MethodDeclaration,
  VariableDeclaration,
  PropertyDeclaration,
  EnumDeclaration,
  InterfaceDeclaration,
  EnumValue,
  Modifier,
} from '../ast/declaration.js';

/**
 * Type guard for Declaration nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a Declaration.
 */
export function isDeclaration(node: ASTNode): node is Declaration {
  return (
    'kind' in node &&
    typeof node.kind === 'string' &&
    [
      'ClassDeclaration',
      'InterfaceDeclaration',
      'MethodDeclaration',
      'VariableDeclaration',
      'PropertyDeclaration',
      'EnumDeclaration',
    ].includes(node.kind)
  );
}

/**
 * Type guard for Modifier nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a Modifier.
 */
export function isModifier(node: ASTNode): node is Modifier {
  return 'kind' in node && node.kind === 'Modifier';
}

/**
 * Type guard for Identifier nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an Identifier.
 */
export function isIdentifier(node: ASTNode): node is Identifier {
  return 'kind' in node && node.kind === 'Identifier';
}

/**
 * Type guard for TypeRef AST nodes.
 * In summit-ast, TypeRef extends Node(), so it IS an AST node.
 * @param node - The AST node to check.
 * @returns True if the node is a TypeRef.
 */
export function isTypeRef(node: ASTNode): node is TypeRef {
  return 'kind' in node && node.kind === 'TypeRef';
}

/**
 * Type guard for type nodes (TypeRef).
 * @param node - The AST node to check.
 * @returns True if the node is a TypeRef.
 */
export function isType(node: ASTNode): node is TypeRef {
  return isTypeRef(node);
}

/**
 * Type guard for ClassDeclaration nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a ClassDeclaration.
 */
export function isClassDeclaration(node: ASTNode): node is ClassDeclaration {
  return 'kind' in node && node.kind === 'ClassDeclaration';
}

/**
 * Type guard for MethodDeclaration nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a MethodDeclaration.
 */
export function isMethodDeclaration(node: ASTNode): node is MethodDeclaration {
  return 'kind' in node && node.kind === 'MethodDeclaration';
}

/**
 * Type guard for VariableDeclaration nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a VariableDeclaration.
 */
export function isVariableDeclaration(node: ASTNode): node is VariableDeclaration {
  return 'kind' in node && node.kind === 'VariableDeclaration';
}

/**
 * Type guard for EnumDeclaration nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an EnumDeclaration.
 */
export function isEnumDeclaration(node: ASTNode): node is EnumDeclaration {
  return 'kind' in node && node.kind === 'EnumDeclaration';
}

/**
 * Type guard for InterfaceDeclaration nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an InterfaceDeclaration.
 */
export function isInterfaceDeclaration(node: ASTNode): node is InterfaceDeclaration {
  return 'kind' in node && node.kind === 'InterfaceDeclaration';
}

/**
 * Type guard for PropertyDeclaration nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a PropertyDeclaration.
 */
export function isPropertyDeclaration(node: ASTNode): node is PropertyDeclaration {
  return 'kind' in node && node.kind === 'PropertyDeclaration';
}

/**
 * Type guard for EnumValue nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an EnumValue.
 */
export function isEnumValue(node: ASTNode): node is EnumValue {
  return 'kind' in node && node.kind === 'EnumValue';
}
