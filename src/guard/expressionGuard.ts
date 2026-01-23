/**
 * @file Type guard functions for expression AST nodes.
 * TypeScript type guard functions for checking expression node types at runtime.
 */

import type { ASTNode } from '../ast/baseNode.js';
import type {
  Expression,
  BinaryExpression,
  UnaryExpression,
  CallExpression,
  VariableExpression,
  SoqlExpression,
  SoslExpression,
  TriggerContextVariableExpression,
  ThisExpression,
  SuperExpression,
  FieldExpression,
  ArrayExpression,
  NewExpression,
  CastExpression,
  TernaryExpression,
  ParenthesizedExpression,
} from '../ast/expression.js';

/**
 * Type guard for Expression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an Expression.
 */
export function isExpression(node: ASTNode): node is Expression {
  return (
    'kind' in node &&
    typeof node.kind === 'string' &&
    [
      'BinaryExpression',
      'UnaryExpression',
      'AssignExpression',
      'CallExpression',
      'FieldExpression',
      'ArrayExpression',
      'NewExpression',
      'CastExpression',
      'InstanceOfExpression',
      'TernaryExpression',
      'LambdaExpression',
      'VariableExpression',
      'ThisExpression',
      'SuperExpression',
      'ParenthesizedExpression',
      'StringVal',
      'IntegerVal',
      'DoubleVal',
      'LongVal',
      'DecimalVal',
      'BooleanVal',
      'NullVal',
      'CharacterLiteral',
      'SoqlExpression',
      'SoslExpression',
      'TriggerContextVariableExpression',
    ].includes(node.kind)
  );
}

/**
 * Type guard for BinaryExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a BinaryExpression.
 */
export function isBinaryExpression(node: ASTNode): node is BinaryExpression {
  return 'kind' in node && node.kind === 'BinaryExpression';
}

/**
 * Type guard for UnaryExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a UnaryExpression.
 */
export function isUnaryExpression(node: ASTNode): node is UnaryExpression {
  return 'kind' in node && node.kind === 'UnaryExpression';
}

/**
 * Type guard for CallExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a CallExpression.
 */
export function isCallExpression(node: ASTNode): node is CallExpression {
  return 'kind' in node && node.kind === 'CallExpression';
}

/**
 * Type guard for MethodCallExpression nodes (alias for CallExpression).
 * @param node - The AST node to check.
 * @returns True if the node is a CallExpression.
 * @deprecated Use isCallExpression instead.
 */
export function isMethodCallExpression(node: ASTNode): node is CallExpression {
  return isCallExpression(node);
}

/**
 * Type guard for VariableExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a VariableExpression.
 */
export function isVariableExpression(node: ASTNode): node is VariableExpression {
  return 'kind' in node && node.kind === 'VariableExpression';
}

/**
 * Type guard for FieldExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a FieldExpression.
 */
export function isFieldExpression(node: ASTNode): node is FieldExpression {
  return 'kind' in node && node.kind === 'FieldExpression';
}

/**
 * Type guard for FieldAccessExpression nodes (alias for FieldExpression).
 * @param node - The AST node to check.
 * @returns True if the node is a FieldExpression.
 * @deprecated Use isFieldExpression instead.
 */
export function isFieldAccessExpression(node: ASTNode): node is FieldExpression {
  return isFieldExpression(node);
}

/**
 * Type guard for ArrayExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ArrayExpression.
 */
export function isArrayExpression(node: ASTNode): node is ArrayExpression {
  return 'kind' in node && node.kind === 'ArrayExpression';
}

/**
 * Type guard for ArrayAccessExpression nodes (alias for ArrayExpression).
 * @param node - The AST node to check.
 * @returns True if the node is an ArrayExpression.
 * @deprecated Use isArrayExpression instead.
 */
export function isArrayAccessExpression(node: ASTNode): node is ArrayExpression {
  return isArrayExpression(node);
}

/**
 * Type guard for NewExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a NewExpression.
 */
export function isNewExpression(node: ASTNode): node is NewExpression {
  return 'kind' in node && node.kind === 'NewExpression';
}

/**
 * Type guard for CastExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a CastExpression.
 */
export function isCastExpression(node: ASTNode): node is CastExpression {
  return 'kind' in node && node.kind === 'CastExpression';
}

/**
 * Type guard for TernaryExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a TernaryExpression.
 */
export function isTernaryExpression(node: ASTNode): node is TernaryExpression {
  return 'kind' in node && node.kind === 'TernaryExpression';
}

/**
 * Type guard for ParenthesizedExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a ParenthesizedExpression.
 */
export function isParenthesizedExpression(node: ASTNode): node is ParenthesizedExpression {
  return 'kind' in node && node.kind === 'ParenthesizedExpression';
}

/**
 * Type guard for SoqlExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a SoqlExpression.
 */
export function isSoqlExpression(node: ASTNode): node is SoqlExpression {
  return 'kind' in node && node.kind === 'SoqlExpression';
}

/**
 * Type guard for SoqlQueryExpression nodes (alias for SoqlExpression).
 * @param node - The AST node to check.
 * @returns True if the node is a SoqlExpression.
 * @deprecated Use isSoqlExpression instead.
 */
export function isSoqlQueryExpression(node: ASTNode): node is SoqlExpression {
  return isSoqlExpression(node);
}

/**
 * Type guard for SoslExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a SoslExpression.
 */
export function isSoslExpression(node: ASTNode): node is SoslExpression {
  return 'kind' in node && node.kind === 'SoslExpression';
}

/**
 * Type guard for SoslQueryExpression nodes (alias for SoslExpression).
 * @param node - The AST node to check.
 * @returns True if the node is a SoslExpression.
 * @deprecated Use isSoslExpression instead.
 */
export function isSoslQueryExpression(node: ASTNode): node is SoslExpression {
  return isSoslExpression(node);
}

/**
 * Type guard for TriggerContextVariableExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a TriggerContextVariableExpression.
 */
export function isTriggerContextVariableExpression(
  node: ASTNode
): node is TriggerContextVariableExpression {
  return 'kind' in node && node.kind === 'TriggerContextVariableExpression';
}

/**
 * Type guard for ThisExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a ThisExpression.
 */
export function isThisExpression(node: ASTNode): node is ThisExpression {
  return 'kind' in node && node.kind === 'ThisExpression';
}

/**
 * Type guard for SuperExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a SuperExpression.
 */
export function isSuperExpression(node: ASTNode): node is SuperExpression {
  return 'kind' in node && node.kind === 'SuperExpression';
}
