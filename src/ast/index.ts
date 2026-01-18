/**
 * @file AST node type definitions.
 * Main export file for AST node types.
 */

export * from './base.js';
export * from './type-guards.js';
export type * from './Identifier.js';
export type * from './Statement.js';
export type * from './Expression.js';
export type * from './Literal.js';
export type * from './Type.js';
export type * from './Declaration.js';
export type * from './Initializer.js';
export type * from './ElementValue.js';
export type * from './SoqlOrSoslBinding.js';
export type * from './ApexDoc.js';

/**
 * Union type for all AST node types.
 */
import type { ASTNode } from './base.js';
import type { StatementNode, SwitchCase, CatchClause } from './Statement.js';
import type { ExpressionNode, LambdaParameter } from './Expression.js';
import type { DeclarationNode, EnumValue } from './Declaration.js';
import type { Modifier } from './Declaration.js';
import type {
  TypeParameter,
  Parameter,
  Annotation,
  AnnotationArgument,
  AnnotationMember,
} from './Declaration.js';
import type {
  ApexDocComment,
  ApexDocBlockTag,
  ApexDocInlineTag,
  ApexDocContent,
  ApexDocText,
} from './ApexDoc.js';
import type { Identifier } from './Identifier.js';
import type { Initializer } from './Initializer.js';
import type { ElementValue } from './ElementValue.js';
import type { SoqlOrSoslBinding } from './SoqlOrSoslBinding.js';

/* eslint-disable @typescript-eslint/no-type-alias -- Type alias needed for union type in AST structure */
export type AnyASTNode =
  | Annotation
  | AnnotationArgument
  | AnnotationMember
  | ApexDocBlockTag
  | ApexDocComment
  | ApexDocContent
  | ApexDocInlineTag
  | ApexDocText
  | ASTNode
  | CatchClause
  | DeclarationNode
  | ElementValue
  | EnumValue
  | ExpressionNode
  | Identifier
  | Initializer
  | LambdaParameter
  | Modifier
  | Parameter
  | SoqlOrSoslBinding
  | StatementNode
  | SwitchCase
  | TypeParameter;
/* eslint-enable @typescript-eslint/no-type-alias */
