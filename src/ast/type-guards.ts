/**
 * Type guard functions for AST nodes
 */

import type { ASTNode } from './base.js';
import type {
  Statement,
  IfStatement,
  ForStatement,
  WhileStatement,
  ReturnStatement,
  Block,
  ExpressionStatement,
  VariableDeclarationStatement,
} from './nodes/Statement.js';
import type {
  Expression,
  BinaryExpression,
  MethodCallExpression,
  Identifier,
} from './nodes/Expression.js';
import type {
  Literal,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  NullLiteral,
} from './nodes/Literal.js';
import type {
  Type,
  PrimitiveType,
  ClassType,
} from './nodes/Type.js';
import type {
  Declaration,
  ClassDeclaration,
  MethodDeclaration,
  VariableDeclaration,
} from './nodes/Declaration.js';
import type { Modifier } from './nodes/Modifier.js';

/**
 * Type guard for Statement nodes
 */
export function isStatement(node: ASTNode): node is Statement {
  return (
    'kind' in node &&
    typeof node.kind === 'string' &&
    [
      'IfStatement',
      'ForStatement',
      'ForEachStatement',
      'WhileStatement',
      'DoWhileStatement',
      'SwitchStatement',
      'TryStatement',
      'ReturnStatement',
      'BreakStatement',
      'ContinueStatement',
      'ThrowStatement',
      'Block',
      'ExpressionStatement',
      'VariableDeclarationStatement',
    ].includes(node.kind)
  );
}

/**
 * Type guard for Expression nodes
 */
export function isExpression(node: ASTNode): node is Expression {
  return (
    'kind' in node &&
    typeof node.kind === 'string' &&
    [
      'BinaryExpression',
      'UnaryExpression',
      'AssignmentExpression',
      'MethodCallExpression',
      'FieldAccessExpression',
      'ArrayAccessExpression',
      'NewExpression',
      'CastExpression',
      'InstanceOfExpression',
      'TernaryExpression',
      'LambdaExpression',
      'Identifier',
      'ThisExpression',
      'SuperExpression',
      'ParenthesizedExpression',
      'StringLiteral',
      'NumberLiteral',
      'BooleanLiteral',
      'NullLiteral',
      'CharacterLiteral',
    ].includes(node.kind)
  );
}

/**
 * Type guard for Literal nodes
 */
export function isLiteral(node: ASTNode): node is Literal {
  return (
    'kind' in node &&
    typeof node.kind === 'string' &&
    ['StringLiteral', 'NumberLiteral', 'BooleanLiteral', 'NullLiteral', 'CharacterLiteral'].includes(
      node.kind
    )
  );
}

/**
 * Type guard for Type nodes
 */
export function isType(node: ASTNode): node is Type {
  return (
    'kind' in node &&
    typeof node.kind === 'string' &&
    [
      'PrimitiveType',
      'ClassType',
      'InterfaceType',
      'ArrayType',
      'GenericType',
      'VoidType',
      'WildcardType',
    ].includes(node.kind)
  );
}

/**
 * Type guard for Declaration nodes
 */
export function isDeclaration(node: ASTNode): node is Declaration {
  return (
    'kind' in node &&
    typeof node.kind === 'string' &&
    [
      'ClassDeclaration',
      'InterfaceDeclaration',
      'MethodDeclaration',
      'ConstructorDeclaration',
      'VariableDeclaration',
      'PropertyDeclaration',
      'EnumDeclaration',
      'EnumConstantDeclaration',
      'AnnotationDeclaration',
    ].includes(node.kind)
  );
}

/**
 * Type guard for Modifier nodes
 */
export function isModifier(node: ASTNode): node is Modifier {
  return 'kind' in node && node.kind === 'Modifier';
}

// Specific statement type guards
export function isIfStatement(node: ASTNode): node is IfStatement {
  return 'kind' in node && node.kind === 'IfStatement';
}

export function isForStatement(node: ASTNode): node is ForStatement {
  return 'kind' in node && node.kind === 'ForStatement';
}

export function isWhileStatement(node: ASTNode): node is WhileStatement {
  return 'kind' in node && node.kind === 'WhileStatement';
}

export function isReturnStatement(node: ASTNode): node is ReturnStatement {
  return 'kind' in node && node.kind === 'ReturnStatement';
}

export function isBlock(node: ASTNode): node is Block {
  return 'kind' in node && node.kind === 'Block';
}

export function isExpressionStatement(node: ASTNode): node is ExpressionStatement {
  return 'kind' in node && node.kind === 'ExpressionStatement';
}

export function isVariableDeclarationStatement(node: ASTNode): node is VariableDeclarationStatement {
  return 'kind' in node && node.kind === 'VariableDeclarationStatement';
}

// Specific expression type guards
export function isBinaryExpression(node: ASTNode): node is BinaryExpression {
  return 'kind' in node && node.kind === 'BinaryExpression';
}

export function isMethodCallExpression(node: ASTNode): node is MethodCallExpression {
  return 'kind' in node && node.kind === 'MethodCallExpression';
}

export function isIdentifier(node: ASTNode): node is Identifier {
  return 'kind' in node && node.kind === 'Identifier';
}

// Specific literal type guards
export function isStringLiteral(node: ASTNode): node is StringLiteral {
  return 'kind' in node && node.kind === 'StringLiteral';
}

export function isNumberLiteral(node: ASTNode): node is NumberLiteral {
  return 'kind' in node && node.kind === 'NumberLiteral';
}

export function isBooleanLiteral(node: ASTNode): node is BooleanLiteral {
  return 'kind' in node && node.kind === 'BooleanLiteral';
}

export function isNullLiteral(node: ASTNode): node is NullLiteral {
  return 'kind' in node && node.kind === 'NullLiteral';
}

// Specific type guards
export function isClassType(node: ASTNode): node is ClassType {
  return 'kind' in node && node.kind === 'ClassType';
}

export function isPrimitiveType(node: ASTNode): node is PrimitiveType {
  return 'kind' in node && node.kind === 'PrimitiveType';
}

// Specific declaration type guards
export function isClassDeclaration(node: ASTNode): node is ClassDeclaration {
  return 'kind' in node && node.kind === 'ClassDeclaration';
}

export function isMethodDeclaration(node: ASTNode): node is MethodDeclaration {
  return 'kind' in node && node.kind === 'MethodDeclaration';
}

export function isVariableDeclaration(node: ASTNode): node is VariableDeclaration {
  return 'kind' in node && node.kind === 'VariableDeclaration';
}
