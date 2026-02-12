/**
 * @file Type guard functions for statement AST nodes.
 * TypeScript type guard functions for checking statement node types at runtime.
 */

import type { ASTNode } from '../ast/baseNode.js';
import type {
  Statement,
  IfStatement,
  ForLoopStatement,
  EnhancedForLoopStatement,
  WhileLoopStatement,
  DoWhileLoopStatement,
  ReturnStatement,
  CompoundStatement,
  ExpressionStatement,
  UntranslatedStatement,
  VariableDeclarationStatement,
  DmlStatement,
  BreakStatement,
  ContinueStatement,
  ThrowStatement,
  TryStatement,
  SwitchCase,
  SwitchStatement,
} from '../ast/statement.js';

/**
 * Type guard for Statement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a Statement.
 */
function isStatement(node: ASTNode): node is Statement {
  return (
    '@type' in node &&
    typeof node['@type'] === 'string' &&
    [
      'IfStatement',
      'ForLoopStatement',
      'EnhancedForLoopStatement',
      'WhileLoopStatement',
      'DoWhileLoopStatement',
      'SwitchStatement',
      'TryStatement',
      'ReturnStatement',
      'BreakStatement',
      'ContinueStatement',
      'ThrowStatement',
      'CompoundStatement',
      'ExpressionStatement',
      'VariableDeclarationStatement',
      'Insert',
      'Update',
      'Delete',
      'Upsert',
      'Merge',
      'Undelete',
      'UntranslatedStatement',
    ].includes(node['@type'])
  );
}

/**
 * Type guard for IfStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an IfStatement.
 */
function isUntranslatedStatement(node: ASTNode): node is UntranslatedStatement {
  return '@type' in node && node['@type'] === 'UntranslatedStatement';
}

function isIfStatement(node: ASTNode): node is IfStatement {
  return '@type' in node && node['@type'] === 'IfStatement';
}

/**
 * Type guard for ForLoopStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a ForLoopStatement.
 */
function isForLoopStatement(node: ASTNode): node is ForLoopStatement {
  return '@type' in node && node['@type'] === 'ForLoopStatement';
}

/**
 * Type guard for WhileLoopStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a WhileLoopStatement.
 */
function isWhileLoopStatement(node: ASTNode): node is WhileLoopStatement {
  return '@type' in node && node['@type'] === 'WhileLoopStatement';
}

/**
 * Type guard for ForStatement nodes (alias for ForLoopStatement).
 * @param node - The AST node to check.
 * @returns True if the node is a ForLoopStatement.
 * @deprecated Use isForLoopStatement instead.
 */
function isForStatement(node: ASTNode): node is ForLoopStatement {
  return isForLoopStatement(node);
}

/**
 * Type guard for WhileStatement nodes (alias for WhileLoopStatement).
 * @param node - The AST node to check.
 * @returns True if the node is a WhileLoopStatement.
 * @deprecated Use isWhileLoopStatement instead.
 */
function isWhileStatement(node: ASTNode): node is WhileLoopStatement {
  return isWhileLoopStatement(node);
}

/**
 * Type guard for SwitchStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a SwitchStatement.
 */
function isSwitchStatement(node: ASTNode): node is SwitchStatement {
  return '@type' in node && node['@type'] === 'SwitchStatement';
}

/**
 * Type guard for SwitchCase nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a SwitchCase.
 */
function isSwitchCase(node: ASTNode): node is SwitchCase {
  return '@type' in node && node['@type'] === 'SwitchCase';
}

/**
 * Type guard for ReturnStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a ReturnStatement.
 */
function isReturnStatement(node: ASTNode): node is ReturnStatement {
  return '@type' in node && node['@type'] === 'ReturnStatement';
}

/**
 * Type guard for CompoundStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a CompoundStatement.
 */
function isCompoundStatement(node: ASTNode): node is CompoundStatement {
  return '@type' in node && node['@type'] === 'CompoundStatement';
}

/**
 * Type guard for Block nodes (alias for CompoundStatement).
 * @param node - The AST node to check.
 * @returns True if the node is a CompoundStatement.
 * @deprecated Use isCompoundStatement instead.
 */
function isBlock(node: ASTNode): node is CompoundStatement {
  return isCompoundStatement(node);
}

/**
 * Type guard for ExpressionStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ExpressionStatement.
 */
function isExpressionStatement(node: ASTNode): node is ExpressionStatement {
  return '@type' in node && node['@type'] === 'ExpressionStatement';
}

/**
 * Type guard for VariableDeclarationStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a VariableDeclarationStatement.
 */
function isVariableDeclarationStatement(node: ASTNode): node is VariableDeclarationStatement {
  return '@type' in node && node['@type'] === 'VariableDeclarationStatement';
}

/**
 * Type guard for DmlStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a DmlStatement.
 */
function isDmlStatement(node: ASTNode): node is DmlStatement {
  return (
    '@type' in node &&
    typeof node['@type'] === 'string' &&
    ['Insert', 'Update', 'Delete', 'Upsert', 'Merge', 'Undelete'].includes(node['@type'])
  );
}

/**
 * Type guard for BreakStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a BreakStatement.
 */
function isBreakStatement(node: ASTNode): node is BreakStatement {
  return '@type' in node && node['@type'] === 'BreakStatement';
}

/**
 * Type guard for ContinueStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a ContinueStatement.
 */
function isContinueStatement(node: ASTNode): node is ContinueStatement {
  return '@type' in node && node['@type'] === 'ContinueStatement';
}

/**
 * Type guard for ThrowStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a ThrowStatement.
 */
function isThrowStatement(node: ASTNode): node is ThrowStatement {
  return '@type' in node && node['@type'] === 'ThrowStatement';
}

/**
 * Type guard for TryStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a TryStatement.
 */
function isTryStatement(node: ASTNode): node is TryStatement {
  return '@type' in node && node['@type'] === 'TryStatement';
}

/**
 * Type guard for EnhancedForLoopStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an EnhancedForLoopStatement.
 */
function isEnhancedForLoopStatement(node: ASTNode): node is EnhancedForLoopStatement {
  return '@type' in node && node['@type'] === 'EnhancedForLoopStatement';
}

/**
 * Type guard for ForEachStatement nodes (alias for EnhancedForLoopStatement).
 * @param node - The AST node to check.
 * @returns True if the node is an EnhancedForLoopStatement.
 * @deprecated Use isEnhancedForLoopStatement instead.
 */
function isForEachStatement(node: ASTNode): node is EnhancedForLoopStatement {
  return isEnhancedForLoopStatement(node);
}

/**
 * Type guard for DoWhileLoopStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a DoWhileLoopStatement.
 */
function isDoWhileLoopStatement(node: ASTNode): node is DoWhileLoopStatement {
  return '@type' in node && node['@type'] === 'DoWhileLoopStatement';
}

/**
 * Type guard for DoWhileStatement nodes (alias for DoWhileLoopStatement).
 * @param node - The AST node to check.
 * @returns True if the node is a DoWhileLoopStatement.
 * @deprecated Use isDoWhileLoopStatement instead.
 */
function isDoWhileStatement(node: ASTNode): node is DoWhileLoopStatement {
  return isDoWhileLoopStatement(node);
}

export {
  isStatement,
  isIfStatement,
  isForLoopStatement,
  isWhileLoopStatement,
  isForStatement,
  isWhileStatement,
  isSwitchCase,
  isSwitchStatement,
  isReturnStatement,
  isCompoundStatement,
  isBlock,
  isExpressionStatement,
  isVariableDeclarationStatement,
  isDmlStatement,
  isBreakStatement,
  isContinueStatement,
  isThrowStatement,
  isTryStatement,
  isEnhancedForLoopStatement,
  isForEachStatement,
  isDoWhileLoopStatement,
  isDoWhileStatement,
  isUntranslatedStatement,
};
