/**
 * @file Type guard functions for initializer, element value, and binding AST nodes.
 * TypeScript type guard functions for checking initializer-related node types at runtime.
 */

import type { ASTNode } from '../ast/baseNode.js';
import type {
  Initializer,
  ConstructorInitializer,
  ValuesInitializer,
  SizedArrayInitializer,
  MapInitializer,
} from '../ast/initializer.js';
import type {
  ElementValue,
  ExpressionElementValue,
  AnnotationElementValue,
  ArrayElementValue,
} from '../ast/initializer.js';
import type { SoqlOrSoslBinding } from '../ast/expression.js';

/**
 * Type guard for Initializer nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an Initializer.
 */
function isInitializer(node: ASTNode): node is Initializer {
  return (
    'kind' in node &&
    (node.kind === 'ConstructorInitializer' ||
      node.kind === 'ValuesInitializer' ||
      node.kind === 'SizedArrayInitializer' ||
      node.kind === 'MapInitializer')
  );
}

/**
 * Type guard for ConstructorInitializer nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a ConstructorInitializer.
 */
function isConstructorInitializer(node: ASTNode): node is ConstructorInitializer {
  return 'kind' in node && node.kind === 'ConstructorInitializer';
}

/**
 * Type guard for ValuesInitializer nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a ValuesInitializer.
 */
function isValuesInitializer(node: ASTNode): node is ValuesInitializer {
  return 'kind' in node && node.kind === 'ValuesInitializer';
}

/**
 * Type guard for SizedArrayInitializer nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a SizedArrayInitializer.
 */
function isSizedArrayInitializer(node: ASTNode): node is SizedArrayInitializer {
  return 'kind' in node && node.kind === 'SizedArrayInitializer';
}

/**
 * Type guard for MapInitializer nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a MapInitializer.
 */
function isMapInitializer(node: ASTNode): node is MapInitializer {
  return 'kind' in node && node.kind === 'MapInitializer';
}

/**
 * Type guard for ElementValue nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ElementValue.
 */
function isElementValue(node: ASTNode): node is ElementValue {
  return (
    'kind' in node &&
    (node.kind === 'ExpressionElementValue' ||
      node.kind === 'AnnotationElementValue' ||
      node.kind === 'ArrayElementValue')
  );
}

/**
 * Type guard for ExpressionElementValue nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ExpressionElementValue.
 */
function isExpressionElementValue(node: ASTNode): node is ExpressionElementValue {
  return 'kind' in node && node.kind === 'ExpressionElementValue';
}

/**
 * Type guard for AnnotationElementValue nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an AnnotationElementValue.
 */
function isAnnotationElementValue(node: ASTNode): node is AnnotationElementValue {
  return 'kind' in node && node.kind === 'AnnotationElementValue';
}

/**
 * Type guard for ArrayElementValue nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ArrayElementValue.
 */
function isArrayElementValue(node: ASTNode): node is ArrayElementValue {
  return 'kind' in node && node.kind === 'ArrayElementValue';
}

/**
 * Type guard for SoqlOrSoslBinding nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a SoqlOrSoslBinding.
 */
function isSoqlOrSoslBinding(node: ASTNode): node is SoqlOrSoslBinding {
  return 'kind' in node && node.kind === 'SoqlOrSoslBinding';
}

export {
  isInitializer,
  isConstructorInitializer,
  isValuesInitializer,
  isSizedArrayInitializer,
  isMapInitializer,
  isElementValue,
  isExpressionElementValue,
  isAnnotationElementValue,
  isArrayElementValue,
  isSoqlOrSoslBinding,
};
