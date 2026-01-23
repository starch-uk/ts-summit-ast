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
export function isLiteral(node: ASTNode): node is Literal {
  return (
    'kind' in node &&
    typeof node.kind === 'string' &&
    [
      'StringVal',
      'IntegerVal',
      'DoubleVal',
      'LongVal',
      'DecimalVal',
      'BooleanVal',
      'NullVal',
      'CharacterLiteral',
    ].includes(node.kind)
  );
}

/**
 * Type guard for StringVal nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a StringVal.
 */
export function isStringVal(node: ASTNode): node is StringVal {
  return 'kind' in node && node.kind === 'StringVal';
}

/**
 * Type guard for StringLiteral nodes (alias for StringVal).
 * @param node - The AST node to check.
 * @returns True if the node is a StringVal.
 * @deprecated Use isStringVal instead.
 */
export function isStringLiteral(node: ASTNode): node is StringVal {
  return isStringVal(node);
}

/**
 * Type guard for IntegerVal nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an IntegerVal.
 */
export function isIntegerVal(node: ASTNode): node is IntegerVal {
  return 'kind' in node && node.kind === 'IntegerVal';
}

/**
 * Type guard for IntegerVal nodes (alias for isIntegerVal).
 * @param node - The AST node to check.
 * @returns True if the node is an IntegerVal.
 * @deprecated Use isIntegerVal instead.
 */
export function isIntegerLiteral(node: ASTNode): node is IntegerVal {
  return isIntegerVal(node);
}

/**
 * Type guard for DoubleVal nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a DoubleVal.
 */
export function isDoubleVal(node: ASTNode): node is DoubleVal {
  return 'kind' in node && node.kind === 'DoubleVal';
}

/**
 * Type guard for LongVal nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a LongVal.
 */
export function isLongVal(node: ASTNode): node is LongVal {
  return 'kind' in node && node.kind === 'LongVal';
}

/**
 * Type guard for LongVal nodes (alias for isLongVal).
 * @param node - The AST node to check.
 * @returns True if the node is a LongVal.
 * @deprecated Use isLongVal instead.
 */
export function isLongLiteral(node: ASTNode): node is LongVal {
  return isLongVal(node);
}

/**
 * Type guard for DecimalVal nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a DecimalVal.
 */
export function isDecimalVal(node: ASTNode): node is DecimalVal {
  return 'kind' in node && node.kind === 'DecimalVal';
}

/**
 * Type guard for NumberLiteral nodes (alias - checks for any numeric literal).
 * @param node - The AST node to check.
 * @returns True if the node is a numeric literal.
 * @deprecated Use specific type guards (isIntegerVal, isDoubleVal, etc.) instead.
 */
export function isNumberLiteral(
  node: ASTNode
): node is DecimalVal | DoubleVal | IntegerVal | LongVal {
  return (
    'kind' in node &&
    (node.kind === 'IntegerVal' ||
      node.kind === 'DoubleVal' ||
      node.kind === 'LongVal' ||
      node.kind === 'DecimalVal')
  );
}

/**
 * Type guard for BooleanVal nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a BooleanVal.
 */
export function isBooleanVal(node: ASTNode): node is BooleanVal {
  return 'kind' in node && node.kind === 'BooleanVal';
}

/**
 * Type guard for BooleanLiteral nodes (alias for BooleanVal).
 * @param node - The AST node to check.
 * @returns True if the node is a BooleanVal.
 * @deprecated Use isBooleanVal instead.
 */
export function isBooleanLiteral(node: ASTNode): node is BooleanVal {
  return isBooleanVal(node);
}

/**
 * Type guard for NullVal nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a NullVal.
 */
export function isNullVal(node: ASTNode): node is NullVal {
  return 'kind' in node && node.kind === 'NullVal';
}

/**
 * Type guard for NullLiteral nodes (alias for NullVal).
 * @param node - The AST node to check.
 * @returns True if the node is a NullVal.
 * @deprecated Use isNullVal instead.
 */
export function isNullLiteral(node: ASTNode): node is NullVal {
  return isNullVal(node);
}
