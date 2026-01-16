/**
 * AST node type exports
 */

export * from './Statement.js';
export * from './Expression.js';
export * from './Literal.js';
export * from './Type.js';
export * from './Declaration.js';
export * from './Modifier.js';
export * from './Block.js';
export * from './ApexDoc.js';

/**
 * Union type for all AST node types
 */
import type { ASTNode } from '../base.js';
import type { StatementNode, SwitchCase, CatchClause } from './Statement.js';
import type { ExpressionNode, LambdaParameter } from './Expression.js';
import type { DeclarationNode } from './Declaration.js';
import type { TypeNode } from './Type.js';
import type { Modifier } from './Modifier.js';
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

export type AnyASTNode =
  | ASTNode
  | StatementNode
  | ExpressionNode
  | DeclarationNode
  | TypeNode
  | Modifier
  | SwitchCase
  | CatchClause
  | LambdaParameter
  | TypeParameter
  | Parameter
  | Annotation
  | AnnotationArgument
  | AnnotationMember
  | ApexDocComment
  | ApexDocBlockTag
  | ApexDocInlineTag
  | ApexDocContent
  | ApexDocText;
