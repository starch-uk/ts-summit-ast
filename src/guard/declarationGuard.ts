/**
 * @file Type guard functions for declaration AST nodes.
 * TypeScript type guard functions for checking declaration node types at runtime.
 */

import type { ASTNode, TypeRef, Identifier } from '../ast/baseNode.js';
import type {
  Annotation,
  AnnotationArgument,
  ClassDeclaration,
  Declaration,
  EnumDeclaration,
  EnumValue,
  InterfaceDeclaration,
  MethodDeclaration,
  Modifier,
  PropertyDeclaration,
  TypeParameter,
  VariableDeclaration,
} from '../ast/declaration.js';

/**
 * Type guard for Declaration nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a Declaration.
 */
function isDeclaration(node: ASTNode): node is Declaration {
  return (
    '@type' in node &&
    typeof node['@type'] === 'string' &&
    [
      'ClassDeclaration',
      'EnumDeclaration',
      'InterfaceDeclaration',
      'MethodDeclaration',
      'PropertyDeclaration',
      'VariableDeclaration',
    ].includes(node['@type'])
  );
}

/**
 * Type guard for Modifier nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a Modifier.
 */
function isModifier(node: ASTNode): node is Modifier {
  return '@type' in node && node['@type'] === 'Modifier';
}

/**
 * Type guard for Identifier nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an Identifier.
 */
function isIdentifier(node: ASTNode): node is Identifier {
  return '@type' in node && node['@type'] === 'Identifier';
}

/**
 * Type guard for TypeRef AST nodes.
 * In summit-ast, TypeRef extends Node(), so it IS an AST node.
 * @param node - The AST node to check.
 * @returns True if the node is a TypeRef.
 */
function isTypeRef(node: ASTNode): node is TypeRef {
  return '@type' in node && node['@type'] === 'TypeRef';
}

/**
 * Type guard for type nodes (TypeRef).
 * @param node - The AST node to check.
 * @returns True if the node is a TypeRef.
 */
function isType(node: ASTNode): node is TypeRef {
  return isTypeRef(node);
}

/**
 * Type guard for ClassDeclaration nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a ClassDeclaration.
 */
function isClassDeclaration(node: ASTNode): node is ClassDeclaration {
  return '@type' in node && node['@type'] === 'ClassDeclaration';
}

/**
 * Type guard for MethodDeclaration nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a MethodDeclaration.
 */
function isMethodDeclaration(node: ASTNode): node is MethodDeclaration {
  return '@type' in node && node['@type'] === 'MethodDeclaration';
}

/**
 * Type guard for VariableDeclaration nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a VariableDeclaration.
 */
function isVariableDeclaration(node: ASTNode): node is VariableDeclaration {
  return '@type' in node && node['@type'] === 'VariableDeclaration';
}

/**
 * Type guard for EnumDeclaration nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an EnumDeclaration.
 */
function isEnumDeclaration(node: ASTNode): node is EnumDeclaration {
  return '@type' in node && node['@type'] === 'EnumDeclaration';
}

/**
 * Type guard for InterfaceDeclaration nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an InterfaceDeclaration.
 */
function isInterfaceDeclaration(node: ASTNode): node is InterfaceDeclaration {
  return '@type' in node && node['@type'] === 'InterfaceDeclaration';
}

/**
 * Type guard for PropertyDeclaration nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a PropertyDeclaration.
 */
function isPropertyDeclaration(node: ASTNode): node is PropertyDeclaration {
  return '@type' in node && node['@type'] === 'PropertyDeclaration';
}

/**
 * Type guard for EnumValue nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an EnumValue.
 */
function isEnumValue(node: ASTNode): node is EnumValue {
  return '@type' in node && node['@type'] === 'EnumValue';
}

/**
 * Type guard for Annotation nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an Annotation.
 */
function isAnnotation(node: ASTNode): node is Annotation {
  return '@type' in node && node['@type'] === 'Annotation';
}

/**
 * Type guard for AnnotationArgument nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an AnnotationArgument.
 */
function isAnnotationArgument(node: ASTNode): node is AnnotationArgument {
  return '@type' in node && node['@type'] === 'AnnotationArgument';
}

/**
 * Type guard for TypeParameter nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a TypeParameter.
 */
function isTypeParameter(node: ASTNode): node is TypeParameter {
  return '@type' in node && node['@type'] === 'TypeParameter';
}

export {
  isAnnotation,
  isDeclaration,
  isModifier,
  isIdentifier,
  isTypeRef,
  isType,
  isClassDeclaration,
  isMethodDeclaration,
  isVariableDeclaration,
  isEnumDeclaration,
  isInterfaceDeclaration,
  isPropertyDeclaration,
  isEnumValue,
  isAnnotationArgument,
  isTypeParameter,
};
