/**
 * @file Type guard functions for expression AST nodes.
 * TypeScript type guard functions for checking expression node types at runtime.
 */

import type { ASTNode } from '../ast/baseNode.js';
import type {
  Expression,
  AssignExpression,
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
  UntranslatedExpression,
} from '../ast/expression.js';

/**
 * Type guard for Expression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an Expression.
 */
function isExpression(node: ASTNode): node is Expression {
  return (
    '@type' in node &&
    typeof node['@type'] === 'string' &&
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
      'UntranslatedExpression',
    ].includes(node['@type'])
  );
}

/**
 * Type guard for BinaryExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a BinaryExpression.
 */
function isUntranslatedExpression(node: ASTNode): node is UntranslatedExpression {
  return '@type' in node && node['@type'] === 'UntranslatedExpression';
}

function isAssignExpression(node: ASTNode): node is AssignExpression {
  return '@type' in node && node['@type'] === 'AssignExpression';
}

/**
 * Type guard for BinaryExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a BinaryExpression.
 */
function isBinaryExpression(node: ASTNode): node is BinaryExpression {
  return '@type' in node && node['@type'] === 'BinaryExpression';
}

/**
 * Type guard for UnaryExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a UnaryExpression.
 */
function isUnaryExpression(node: ASTNode): node is UnaryExpression {
  return '@type' in node && node['@type'] === 'UnaryExpression';
}

/**
 * Type guard for CallExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a CallExpression.
 */
function isCallExpression(node: ASTNode): node is CallExpression {
  return '@type' in node && node['@type'] === 'CallExpression';
}

/**
 * Type guard for MethodCallExpression nodes (alias for CallExpression).
 * @param node - The AST node to check.
 * @returns True if the node is a CallExpression.
 * @deprecated Use isCallExpression instead.
 */
function isMethodCallExpression(node: ASTNode): node is CallExpression {
  return isCallExpression(node);
}

/**
 * Type guard for VariableExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a VariableExpression.
 */
function isVariableExpression(node: ASTNode): node is VariableExpression {
  return '@type' in node && node['@type'] === 'VariableExpression';
}

/**
 * Type guard for FieldExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a FieldExpression.
 */
function isFieldExpression(node: ASTNode): node is FieldExpression {
  return '@type' in node && node['@type'] === 'FieldExpression';
}

/**
 * Type guard for FieldAccessExpression nodes (alias for FieldExpression).
 * @param node - The AST node to check.
 * @returns True if the node is a FieldExpression.
 * @deprecated Use isFieldExpression instead.
 */
function isFieldAccessExpression(node: ASTNode): node is FieldExpression {
  return isFieldExpression(node);
}

/**
 * Type guard for ArrayExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ArrayExpression.
 */
function isArrayExpression(node: ASTNode): node is ArrayExpression {
  return '@type' in node && node['@type'] === 'ArrayExpression';
}

/**
 * Type guard for ArrayAccessExpression nodes (alias for ArrayExpression).
 * @param node - The AST node to check.
 * @returns True if the node is an ArrayExpression.
 * @deprecated Use isArrayExpression instead.
 */
function isArrayAccessExpression(node: ASTNode): node is ArrayExpression {
  return isArrayExpression(node);
}

/**
 * Type guard for NewExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a NewExpression.
 */
function isNewExpression(node: ASTNode): node is NewExpression {
  return '@type' in node && node['@type'] === 'NewExpression';
}

/**
 * Type guard for CastExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a CastExpression.
 */
function isCastExpression(node: ASTNode): node is CastExpression {
  return '@type' in node && node['@type'] === 'CastExpression';
}

/**
 * Type guard for TernaryExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a TernaryExpression.
 */
function isTernaryExpression(node: ASTNode): node is TernaryExpression {
  return '@type' in node && node['@type'] === 'TernaryExpression';
}

/**
 * Type guard for ParenthesizedExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a ParenthesizedExpression.
 */
function isParenthesizedExpression(node: ASTNode): node is ParenthesizedExpression {
  return '@type' in node && node['@type'] === 'ParenthesizedExpression';
}

/**
 * Type guard for SoqlExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a SoqlExpression.
 */
function isSoqlExpression(node: ASTNode): node is SoqlExpression {
  return '@type' in node && node['@type'] === 'SoqlExpression';
}

/**
 * Type guard for SoqlQueryExpression nodes (alias for SoqlExpression).
 * @param node - The AST node to check.
 * @returns True if the node is a SoqlExpression.
 * @deprecated Use isSoqlExpression instead.
 */
function isSoqlQueryExpression(node: ASTNode): node is SoqlExpression {
  return isSoqlExpression(node);
}

/**
 * Type guard for SoslExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a SoslExpression.
 */
function isSoslExpression(node: ASTNode): node is SoslExpression {
  return '@type' in node && node['@type'] === 'SoslExpression';
}

/**
 * Type guard for SoslQueryExpression nodes (alias for SoslExpression).
 * @param node - The AST node to check.
 * @returns True if the node is a SoslExpression.
 * @deprecated Use isSoslExpression instead.
 */
function isSoslQueryExpression(node: ASTNode): node is SoslExpression {
  return isSoslExpression(node);
}

/**
 * Type guard for TriggerContextVariableExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a TriggerContextVariableExpression.
 */
function isTriggerContextVariableExpression(
  node: ASTNode
): node is TriggerContextVariableExpression {
  return '@type' in node && node['@type'] === 'TriggerContextVariableExpression';
}

/**
 * Type guard for ThisExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a ThisExpression.
 */
function isThisExpression(node: ASTNode): node is ThisExpression {
  return '@type' in node && node['@type'] === 'ThisExpression';
}

/**
 * Type guard for SuperExpression nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a SuperExpression.
 */
function isSuperExpression(node: ASTNode): node is SuperExpression {
  return '@type' in node && node['@type'] === 'SuperExpression';
}

export {
  isExpression,
  isAssignExpression,
  isBinaryExpression,
  isUnaryExpression,
  isCallExpression,
  isMethodCallExpression,
  isVariableExpression,
  isFieldExpression,
  isFieldAccessExpression,
  isArrayExpression,
  isArrayAccessExpression,
  isNewExpression,
  isCastExpression,
  isTernaryExpression,
  isParenthesizedExpression,
  isSoqlExpression,
  isSoqlQueryExpression,
  isSoslExpression,
  isSoslQueryExpression,
  isTriggerContextVariableExpression,
  isThisExpression,
  isSuperExpression,
  isUntranslatedExpression,
};
