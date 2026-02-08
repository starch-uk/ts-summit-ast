/**
 * @file Type guard functions for literal AST nodes.
 * TypeScript type guard functions for checking literal node types at runtime.
 */

import type { ASTNode } from '../ast/baseNode.js';
import type {
  Literal,
  StringVal,
  IntegerVal,
  DoubleVal,
  LongVal,
  DecimalVal,
  BooleanVal,
  NullVal,
} from '../ast/literal.js';

/**
 * Type guard for Literal nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a Literal.
 */
function isLiteral(node: ASTNode): node is Literal {
  return (
    '@type' in node &&
    typeof node['@type'] === 'string' &&
    [
      'StringVal',
      'IntegerVal',
      'DoubleVal',
      'LongVal',
      'DecimalVal',
      'BooleanVal',
      'NullVal',
      'CharacterLiteral',
    ].includes(node['@type'])
  );
}

/**
 * Type guard for StringVal nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a StringVal.
 */
function isStringVal(node: ASTNode): node is StringVal {
  return '@type' in node && node['@type'] === 'StringVal';
}

/**
 * Type guard for StringLiteral nodes (alias for StringVal).
 * @param node - The AST node to check.
 * @returns True if the node is a StringVal.
 * @deprecated Use isStringVal instead.
 */
function isStringLiteral(node: ASTNode): node is StringVal {
  return isStringVal(node);
}

/**
 * Type guard for IntegerVal nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an IntegerVal.
 */
function isIntegerVal(node: ASTNode): node is IntegerVal {
  return '@type' in node && node['@type'] === 'IntegerVal';
}

/**
 * Type guard for IntegerVal nodes (alias for isIntegerVal).
 * @param node - The AST node to check.
 * @returns True if the node is an IntegerVal.
 * @deprecated Use isIntegerVal instead.
 */
function isIntegerLiteral(node: ASTNode): node is IntegerVal {
  return isIntegerVal(node);
}

/**
 * Type guard for DoubleVal nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a DoubleVal.
 */
function isDoubleVal(node: ASTNode): node is DoubleVal {
  return '@type' in node && node['@type'] === 'DoubleVal';
}

/**
 * Type guard for LongVal nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a LongVal.
 */
function isLongVal(node: ASTNode): node is LongVal {
  return '@type' in node && node['@type'] === 'LongVal';
}

/**
 * Type guard for LongVal nodes (alias for isLongVal).
 * @param node - The AST node to check.
 * @returns True if the node is a LongVal.
 * @deprecated Use isLongVal instead.
 */
function isLongLiteral(node: ASTNode): node is LongVal {
  return isLongVal(node);
}

/**
 * Type guard for DecimalVal nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a DecimalVal.
 */
function isDecimalVal(node: ASTNode): node is DecimalVal {
  return '@type' in node && node['@type'] === 'DecimalVal';
}

/**
 * Type guard for NumberLiteral nodes (alias - checks for any numeric literal).
 * @param node - The AST node to check.
 * @returns True if the node is a numeric literal.
 * @deprecated Use specific type guards (isIntegerVal, isDoubleVal, etc.) instead.
 */
function isNumberLiteral(node: ASTNode): node is DecimalVal | DoubleVal | IntegerVal | LongVal {
  return (
    '@type' in node &&
    (node['@type'] === 'IntegerVal' ||
      node['@type'] === 'DoubleVal' ||
      node['@type'] === 'LongVal' ||
      node['@type'] === 'DecimalVal')
  );
}

/**
 * Type guard for BooleanVal nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a BooleanVal.
 */
function isBooleanVal(node: ASTNode): node is BooleanVal {
  return '@type' in node && node['@type'] === 'BooleanVal';
}

/**
 * Type guard for BooleanLiteral nodes (alias for BooleanVal).
 * @param node - The AST node to check.
 * @returns True if the node is a BooleanVal.
 * @deprecated Use isBooleanVal instead.
 */
function isBooleanLiteral(node: ASTNode): node is BooleanVal {
  return isBooleanVal(node);
}

/**
 * Type guard for NullVal nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a NullVal.
 */
function isNullVal(node: ASTNode): node is NullVal {
  return '@type' in node && node['@type'] === 'NullVal';
}

/**
 * Type guard for NullLiteral nodes (alias for NullVal).
 * @param node - The AST node to check.
 * @returns True if the node is a NullVal.
 * @deprecated Use isNullVal instead.
 */
function isNullLiteral(node: ASTNode): node is NullVal {
  return isNullVal(node);
}

export {
  isLiteral,
  isStringVal,
  isStringLiteral,
  isIntegerVal,
  isIntegerLiteral,
  isDoubleVal,
  isLongVal,
  isLongLiteral,
  isDecimalVal,
  isNumberLiteral,
  isBooleanVal,
  isBooleanLiteral,
  isNullVal,
  isNullLiteral,
};
