/**
 * @file AST node type definitions.
 * Main export file for AST node types.
 */

export * from './baseNode.js';
export type * from './statement.js';
export type * from './expression.js';
export type * from './literal.js';
export type * from './declaration.js';
export type * from './initializer.js';
export type * from './apexDoc.js';

// Re-export guards from guard module
export * from '../guard/index.js';

/**
 * Union type for all AST node types.
 */
import type { ASTNode, Identifier } from './baseNode.js';
import type {
  SwitchCase,
  CatchClause,
  IfStatement,
  ForLoopStatement,
  EnhancedForLoopStatement,
  WhileLoopStatement,
  DoWhileLoopStatement,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
  ThrowStatement,
  CompoundStatement,
  ExpressionStatement,
  VariableDeclarationStatement,
  DmlStatement,
  TryStatement,
  SwitchStatement,
} from './statement.js';
import type {
  LambdaParameter,
  BinaryExpression,
  UnaryExpression,
  AssignExpression,
  CallExpression,
  FieldExpression,
  ArrayExpression,
  NewExpression,
  CastExpression,
  InstanceOfExpression,
  TernaryExpression,
  LambdaExpression,
  VariableExpression,
  ThisExpression,
  SuperExpression,
  ParenthesizedExpression,
  SoqlExpression,
  SoslExpression,
  TriggerContextVariableExpression,
  SoqlOrSoslBinding,
} from './expression.js';
import type {
  ClassDeclaration,
  EnumDeclaration,
  InterfaceDeclaration,
  MethodDeclaration,
  PropertyDeclaration,
  VariableDeclaration,
  EnumValue,
} from './declaration.js';
import type { Modifier } from './declaration.js';
import type {
  TypeParameter,
  Parameter,
  Annotation,
  AnnotationArgument,
  AnnotationMember,
} from './declaration.js';
import type {
  ApexDocComment,
  ApexDocBlockTag,
  ApexDocInlineTag,
  ApexDocContent,
  ApexDocText,
} from './apexDoc.js';
import type { Initializer, ElementValue } from './initializer.js';
import type { Literal } from './literal.js';

export type AnyASTNode =
  | Annotation
  | AnnotationArgument
  | AnnotationMember
  | ApexDocBlockTag
  | ApexDocComment
  | ApexDocContent
  | ApexDocInlineTag
  | ApexDocText
  | ArrayExpression
  | AssignExpression
  | ASTNode
  | BinaryExpression
  | BreakStatement
  | CallExpression
  | CastExpression
  | CatchClause
  | ClassDeclaration
  | CompoundStatement
  | ContinueStatement
  | DmlStatement
  | DoWhileLoopStatement
  | ElementValue
  | EnhancedForLoopStatement
  | EnumDeclaration
  | EnumValue
  | ExpressionStatement
  | FieldExpression
  | ForLoopStatement
  | Identifier
  | IfStatement
  | Initializer
  | InstanceOfExpression
  | InterfaceDeclaration
  | LambdaExpression
  | LambdaParameter
  | Literal
  | MethodDeclaration
  | Modifier
  | NewExpression
  | Parameter
  | ParenthesizedExpression
  | PropertyDeclaration
  | ReturnStatement
  | SoqlExpression
  | SoqlOrSoslBinding
  | SoslExpression
  | SuperExpression
  | SwitchCase
  | SwitchStatement
  | TernaryExpression
  | ThisExpression
  | ThrowStatement
  | TriggerContextVariableExpression
  | TryStatement
  | TypeParameter
  | UnaryExpression
  | VariableDeclaration
  | VariableDeclarationStatement
  | VariableExpression
  | WhileLoopStatement;
