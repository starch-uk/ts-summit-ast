/**
 * Type guard functions for AST nodes
 */

import type { ASTNode } from './base.js';
import type {
  Statement,
  IfStatement,
  ForStatement,
  ForEachStatement,
  WhileStatement,
  DoWhileStatement,
  ReturnStatement,
  Block,
  ExpressionStatement,
  VariableDeclarationStatement,
  DmlStatement,
  BreakStatement,
  ContinueStatement,
  ThrowStatement,
  TryStatement,
} from './nodes/Statement.js';
import type {
  Expression,
  BinaryExpression,
  MethodCallExpression,
  Identifier,
  SoqlQueryExpression,
  SoslQueryExpression,
  TriggerContextVariableExpression,
  ThisExpression,
  SuperExpression,
  FieldAccessExpression,
  ArrayAccessExpression,
  NewExpression,
  CastExpression,
  TernaryExpression,
  ParenthesizedExpression,
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
  EnumDeclaration,
  InterfaceDeclaration,
} from './nodes/Declaration.js';
import type { Modifier } from './nodes/Modifier.js';
import type {
  ApexDocComment,
  ApexDocBlockTag,
  ApexDocInlineTag,
  ApexDocParamTag,
  ApexDocReturnTag,
  ApexDocGroupTag,
  ApexDocCodeTag,
} from './nodes/ApexDoc.js';

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
      'DmlStatement',
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

export function isEnumDeclaration(node: ASTNode): node is EnumDeclaration {
  return 'kind' in node && node.kind === 'EnumDeclaration';
}

export function isInterfaceDeclaration(node: ASTNode): node is InterfaceDeclaration {
  return 'kind' in node && node.kind === 'InterfaceDeclaration';
}

export function isDmlStatement(node: ASTNode): node is DmlStatement {
  return 'kind' in node && node.kind === 'DmlStatement';
}

export function isBreakStatement(node: ASTNode): node is BreakStatement {
  return 'kind' in node && node.kind === 'BreakStatement';
}

export function isContinueStatement(node: ASTNode): node is ContinueStatement {
  return 'kind' in node && node.kind === 'ContinueStatement';
}

export function isThrowStatement(node: ASTNode): node is ThrowStatement {
  return 'kind' in node && node.kind === 'ThrowStatement';
}

export function isTryStatement(node: ASTNode): node is TryStatement {
  return 'kind' in node && node.kind === 'TryStatement';
}

export function isForEachStatement(node: ASTNode): node is ForEachStatement {
  return 'kind' in node && node.kind === 'ForEachStatement';
}

export function isDoWhileStatement(node: ASTNode): node is DoWhileStatement {
  return 'kind' in node && node.kind === 'DoWhileStatement';
}

export function isSoqlQueryExpression(node: ASTNode): node is SoqlQueryExpression {
  return 'kind' in node && node.kind === 'SoqlQueryExpression';
}

export function isSoslQueryExpression(node: ASTNode): node is SoslQueryExpression {
  return 'kind' in node && node.kind === 'SoslQueryExpression';
}

export function isTriggerContextVariableExpression(node: ASTNode): node is TriggerContextVariableExpression {
  return 'kind' in node && node.kind === 'TriggerContextVariableExpression';
}

export function isThisExpression(node: ASTNode): node is ThisExpression {
  return 'kind' in node && node.kind === 'ThisExpression';
}

export function isSuperExpression(node: ASTNode): node is SuperExpression {
  return 'kind' in node && node.kind === 'SuperExpression';
}

export function isFieldAccessExpression(node: ASTNode): node is FieldAccessExpression {
  return 'kind' in node && node.kind === 'FieldAccessExpression';
}

export function isArrayAccessExpression(node: ASTNode): node is ArrayAccessExpression {
  return 'kind' in node && node.kind === 'ArrayAccessExpression';
}

export function isNewExpression(node: ASTNode): node is NewExpression {
  return 'kind' in node && node.kind === 'NewExpression';
}

export function isCastExpression(node: ASTNode): node is CastExpression {
  return 'kind' in node && node.kind === 'CastExpression';
}

export function isTernaryExpression(node: ASTNode): node is TernaryExpression {
  return 'kind' in node && node.kind === 'TernaryExpression';
}

export function isParenthesizedExpression(node: ASTNode): node is ParenthesizedExpression {
  return 'kind' in node && node.kind === 'ParenthesizedExpression';
}

// ApexDoc type guards
export function isApexDocComment(node: ASTNode): node is ApexDocComment {
  return 'kind' in node && node.kind === 'ApexDocComment';
}

export function isApexDocBlockTag(node: ASTNode): node is ApexDocBlockTag {
  return (
    'kind' in node &&
    typeof node.kind === 'string' &&
    [
      'ApexDocParamTag',
      'ApexDocReturnTag',
      'ApexDocAuthorTag',
      'ApexDocDeprecatedTag',
      'ApexDocExampleTag',
      'ApexDocGroupTag',
      'ApexDocSeeTag',
      'ApexDocSinceTag',
      'ApexDocThrowsTag',
      'ApexDocVersionTag',
    ].includes(node.kind)
  );
}

export function isApexDocInlineTag(node: ASTNode): node is ApexDocInlineTag {
  return (
    'kind' in node &&
    typeof node.kind === 'string' &&
    ['ApexDocCodeTag', 'ApexDocHiddenTag', 'ApexDocLinkTag', 'ApexDocLiteralTag'].includes(
      node.kind
    )
  );
}

export function isApexDocParamTag(node: ASTNode): node is ApexDocParamTag {
  return 'kind' in node && node.kind === 'ApexDocParamTag';
}

export function isApexDocReturnTag(node: ASTNode): node is ApexDocReturnTag {
  return 'kind' in node && node.kind === 'ApexDocReturnTag';
}

export function isApexDocGroupTag(node: ASTNode): node is ApexDocGroupTag {
  return 'kind' in node && node.kind === 'ApexDocGroupTag';
}

export function isApexDocCodeTag(node: ASTNode): node is ApexDocCodeTag {
  return 'kind' in node && node.kind === 'ApexDocCodeTag';
}
