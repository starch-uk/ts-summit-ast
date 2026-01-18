/**
 * @file Type guard functions for AST nodes.
 * TypeScript type guard functions for checking AST node types at runtime.
 */

import type { ASTNode } from './base.js';
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
  VariableDeclarationStatement,
  DmlStatement,
  BreakStatement,
  ContinueStatement,
  ThrowStatement,
  TryStatement,
  SwitchStatement,
} from './Statement.js';
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
} from './Expression.js';
import type {
  Literal,
  StringVal,
  IntegerVal,
  DoubleVal,
  LongVal,
  DecimalVal,
  BooleanVal,
  NullVal,
} from './Literal.js';
import type { Identifier } from './Identifier.js';
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
} from './Declaration.js';
import type {
  ApexDocComment,
  ApexDocBlockTag,
  ApexDocInlineTag,
  ApexDocParam,
  ApexDocReturn,
  ApexDocGroup,
  ApexDocCode,
} from './ApexDoc.js';

/**
 * Type guard for Statement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a Statement.
 */
export function isStatement(node: ASTNode): node is Statement {
  return (
    'kind' in node &&
    typeof node.kind === 'string' &&
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
      'DmlStatement',
    ].includes(node.kind)
  );
}

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
 * Type guard for TypeRef AST nodes.
 * In summit-ast, TypeRef extends Node(), so it IS an AST node.
 * @param node - The AST node to check.
 * @returns True if the node is a TypeRef.
 */
export function isTypeRef(node: ASTNode): node is import('./Type.js').TypeRef {
  return 'kind' in node && node.kind === 'TypeRef';
}

/**
 * Type guard for type nodes (TypeRef).
 * @param node - The AST node to check.
 * @returns True if the node is a TypeRef.
 */
export function isType(node: ASTNode): node is import('./Type.js').TypeRef {
  return isTypeRef(node);
}

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
 * Specific statement type guards.
 */

/**
 * Type guard for IfStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an IfStatement.
 */
export function isIfStatement(node: ASTNode): node is IfStatement {
  return 'kind' in node && node.kind === 'IfStatement';
}

/**
 * Type guard for ForLoopStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a ForLoopStatement.
 */
export function isForLoopStatement(node: ASTNode): node is ForLoopStatement {
  return 'kind' in node && node.kind === 'ForLoopStatement';
}

/**
 * Type guard for WhileLoopStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a WhileLoopStatement.
 */
export function isWhileLoopStatement(node: ASTNode): node is WhileLoopStatement {
  return 'kind' in node && node.kind === 'WhileLoopStatement';
}

/**
 * Type guard for ForStatement nodes (alias for ForLoopStatement).
 * @param node - The AST node to check.
 * @returns True if the node is a ForLoopStatement.
 * @deprecated Use isForLoopStatement instead.
 */
export function isForStatement(node: ASTNode): node is ForLoopStatement {
  return isForLoopStatement(node);
}

/**
 * Type guard for WhileStatement nodes (alias for WhileLoopStatement).
 * @param node - The AST node to check.
 * @returns True if the node is a WhileLoopStatement.
 * @deprecated Use isWhileLoopStatement instead.
 */
export function isWhileStatement(node: ASTNode): node is WhileLoopStatement {
  return isWhileLoopStatement(node);
}

/**
 * Type guard for SwitchStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a SwitchStatement.
 */
export function isSwitchStatement(node: ASTNode): node is SwitchStatement {
  return 'kind' in node && node.kind === 'SwitchStatement';
}

/**
 * Type guard for ReturnStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a ReturnStatement.
 */
export function isReturnStatement(node: ASTNode): node is ReturnStatement {
  return 'kind' in node && node.kind === 'ReturnStatement';
}

/**
 * Type guard for CompoundStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a CompoundStatement.
 */
export function isCompoundStatement(node: ASTNode): node is CompoundStatement {
  return 'kind' in node && node.kind === 'CompoundStatement';
}

/**
 * Type guard for Block nodes (alias for CompoundStatement).
 * @param node - The AST node to check.
 * @returns True if the node is a CompoundStatement.
 * @deprecated Use isCompoundStatement instead.
 */
export function isBlock(node: ASTNode): node is CompoundStatement {
  return isCompoundStatement(node);
}

/**
 * Type guard for ExpressionStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ExpressionStatement.
 */
export function isExpressionStatement(node: ASTNode): node is ExpressionStatement {
  return 'kind' in node && node.kind === 'ExpressionStatement';
}

/**
 * Type guard for VariableDeclarationStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a VariableDeclarationStatement.
 */
export function isVariableDeclarationStatement(
  node: ASTNode
): node is VariableDeclarationStatement {
  return 'kind' in node && node.kind === 'VariableDeclarationStatement';
}

/**
 * Specific expression type guards.
 */

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
 * Type guard for Identifier nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an Identifier.
 */
export function isIdentifier(node: ASTNode): node is Identifier {
  return 'kind' in node && node.kind === 'Identifier';
}

/**
 * Specific literal type guards.
 */

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
 * @param node
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
 * @param node
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
 * @param node
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
 * @param node
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
 * @param node
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
 * @param node
 * @deprecated Use isNullVal instead.
 */
export function isNullLiteral(node: ASTNode): node is NullVal {
  return isNullVal(node);
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
 * Specific declaration type guards.
 */

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
 * Type guard for DmlStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a DmlStatement.
 */
export function isDmlStatement(node: ASTNode): node is DmlStatement {
  return 'kind' in node && node.kind === 'DmlStatement';
}

/**
 * Type guard for BreakStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a BreakStatement.
 */
export function isBreakStatement(node: ASTNode): node is BreakStatement {
  return 'kind' in node && node.kind === 'BreakStatement';
}

/**
 * Type guard for ContinueStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a ContinueStatement.
 */
export function isContinueStatement(node: ASTNode): node is ContinueStatement {
  return 'kind' in node && node.kind === 'ContinueStatement';
}

/**
 * Type guard for ThrowStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a ThrowStatement.
 */
export function isThrowStatement(node: ASTNode): node is ThrowStatement {
  return 'kind' in node && node.kind === 'ThrowStatement';
}

/**
 * Type guard for TryStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a TryStatement.
 */
export function isTryStatement(node: ASTNode): node is TryStatement {
  return 'kind' in node && node.kind === 'TryStatement';
}

/**
 * Type guard for EnhancedForLoopStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an EnhancedForLoopStatement.
 */
export function isEnhancedForLoopStatement(node: ASTNode): node is EnhancedForLoopStatement {
  return 'kind' in node && node.kind === 'EnhancedForLoopStatement';
}

/**
 * Type guard for ForEachStatement nodes (alias for EnhancedForLoopStatement).
 * @param node
 * @deprecated Use isEnhancedForLoopStatement instead.
 */
export function isForEachStatement(node: ASTNode): node is EnhancedForLoopStatement {
  return isEnhancedForLoopStatement(node);
}

/**
 * Type guard for DoWhileLoopStatement nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a DoWhileLoopStatement.
 */
export function isDoWhileLoopStatement(node: ASTNode): node is DoWhileLoopStatement {
  return 'kind' in node && node.kind === 'DoWhileLoopStatement';
}

/**
 * Type guard for DoWhileStatement nodes (alias for DoWhileLoopStatement).
 * @param node
 * @deprecated Use isDoWhileLoopStatement instead.
 */
export function isDoWhileStatement(node: ASTNode): node is DoWhileLoopStatement {
  return isDoWhileLoopStatement(node);
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
 * @param node
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
 * @param node
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
 * @param node
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
 * @param node
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
 * ApexDoc type guards.
 */

/**
 * Type guard for ApexDocComment nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocComment.
 */
export function isApexDocComment(node: ASTNode): node is ApexDocComment {
  return 'kind' in node && node.kind === 'ApexDocComment';
}

/**
 * Type guard for ApexDocBlockTag nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocBlockTag.
 */
export function isApexDocBlockTag(node: ASTNode): node is ApexDocBlockTag {
  return (
    'kind' in node &&
    typeof node.kind === 'string' &&
    [
      'ApexDocParam',
      'ApexDocReturn',
      'ApexDocAuthor',
      'ApexDocDeprecated',
      'ApexDocExample',
      'ApexDocGroup',
      'ApexDocSee',
      'ApexDocSince',
      'ApexDocThrows',
      'ApexDocVersion',
    ].includes(node.kind)
  );
}

/**
 * Type guard for ApexDocInlineTag nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocInlineTag.
 */
export function isApexDocInlineTag(node: ASTNode): node is ApexDocInlineTag {
  return (
    'kind' in node &&
    typeof node.kind === 'string' &&
    ['ApexDocCode', 'ApexDocHidden', 'ApexDocLink', 'ApexDocLiteral'].includes(node.kind)
  );
}

/**
 * Type guard for ApexDocParam nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocParam.
 */
export function isApexDocParam(node: ASTNode): node is ApexDocParam {
  return 'kind' in node && node.kind === 'ApexDocParam';
}

/**
 * Type guard for ApexDocReturn nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocReturn.
 */
export function isApexDocReturn(node: ASTNode): node is ApexDocReturn {
  return 'kind' in node && node.kind === 'ApexDocReturn';
}

/**
 * Type guard for ApexDocGroup nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocGroup.
 */
export function isApexDocGroup(node: ASTNode): node is ApexDocGroup {
  return 'kind' in node && node.kind === 'ApexDocGroup';
}

/**
 * Type guard for ApexDocCode nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocCode.
 */
export function isApexDocCode(node: ASTNode): node is ApexDocCode {
  return 'kind' in node && node.kind === 'ApexDocCode';
}

/**
 * Type guard for EnumValue nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an EnumValue.
 */
export function isEnumValue(node: ASTNode): node is EnumValue {
  return 'kind' in node && node.kind === 'EnumValue';
}

/**
 * Type guard for Initializer nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an Initializer.
 */
export function isInitializer(node: ASTNode): node is import('./Initializer.js').Initializer {
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
export function isConstructorInitializer(
  node: ASTNode
): node is import('./Initializer.js').ConstructorInitializer {
  return 'kind' in node && node.kind === 'ConstructorInitializer';
}

/**
 * Type guard for ValuesInitializer nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a ValuesInitializer.
 */
export function isValuesInitializer(
  node: ASTNode
): node is import('./Initializer.js').ValuesInitializer {
  return 'kind' in node && node.kind === 'ValuesInitializer';
}

/**
 * Type guard for SizedArrayInitializer nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a SizedArrayInitializer.
 */
export function isSizedArrayInitializer(
  node: ASTNode
): node is import('./Initializer.js').SizedArrayInitializer {
  return 'kind' in node && node.kind === 'SizedArrayInitializer';
}

/**
 * Type guard for MapInitializer nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a MapInitializer.
 */
export function isMapInitializer(node: ASTNode): node is import('./Initializer.js').MapInitializer {
  return 'kind' in node && node.kind === 'MapInitializer';
}

/**
 * Type guard for ElementValue nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ElementValue.
 */
export function isElementValue(node: ASTNode): node is import('./ElementValue.js').ElementValue {
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
export function isExpressionElementValue(
  node: ASTNode
): node is import('./ElementValue.js').ExpressionElementValue {
  return 'kind' in node && node.kind === 'ExpressionElementValue';
}

/**
 * Type guard for AnnotationElementValue nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an AnnotationElementValue.
 */
export function isAnnotationElementValue(
  node: ASTNode
): node is import('./ElementValue.js').AnnotationElementValue {
  return 'kind' in node && node.kind === 'AnnotationElementValue';
}

/**
 * Type guard for ArrayElementValue nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ArrayElementValue.
 */
export function isArrayElementValue(
  node: ASTNode
): node is import('./ElementValue.js').ArrayElementValue {
  return 'kind' in node && node.kind === 'ArrayElementValue';
}

/**
 * Type guard for SoqlOrSoslBinding nodes.
 * @param node - The AST node to check.
 * @returns True if the node is a SoqlOrSoslBinding.
 */
export function isSoqlOrSoslBinding(
  node: ASTNode
): node is import('./SoqlOrSoslBinding.js').SoqlOrSoslBinding {
  return 'kind' in node && node.kind === 'SoqlOrSoslBinding';
}
