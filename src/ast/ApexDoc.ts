/**
 * @file ApexDoc node types.
 * ApexDoc comment parsing and AST representation.
 */

import type { ASTNode } from './base.js';

/**
 * ApexDoc comment block - represents a complete ApexDoc comment (starts with /**).
 */
interface ApexDocComment extends ASTNode {
  readonly kind: 'ApexDocComment';

  /**
   * The main description (before any tags).
   */
  readonly mainDescription: string;

  /**
   * Block tags like @param, @return, etc.
   */
  readonly blockTags: ApexDocBlockTag[];
}

/**
 * Block tag types (appear on their own line after the main description).
 */
type ApexDocBlockTag =
  | ApexDocAuthor
  | ApexDocDeprecated
  | ApexDocExample
  | ApexDocGroup
  | ApexDocParam
  | ApexDocReturn
  | ApexDocSee
  | ApexDocSince
  | ApexDocThrows
  | ApexDocVersion;

/**
 * Block tag kind discriminator.
 */
type ApexDocBlockTagKind =
  | 'ApexDocAuthor'
  | 'ApexDocDeprecated'
  | 'ApexDocExample'
  | 'ApexDocGroup'
  | 'ApexDocParam'
  | 'ApexDocReturn'
  | 'ApexDocSee'
  | 'ApexDocSince'
  | 'ApexDocThrows'
  | 'ApexDocVersion';

/**
 * Base interface for block tags.
 */
interface ApexDocBlockTagBase extends ASTNode {
  readonly kind: ApexDocBlockTagKind;

  /**
   * Description text (can contain inline tags).
   */
  readonly description: ApexDocContent[];
}

/**
 * @param paramName - Description.
 */
interface ApexDocParam extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocParam';
  readonly paramName: string;
}

/**
 * @returns Description.
 */
interface ApexDocReturn extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocReturn';
}

/**
 * @author value
 */
interface ApexDocAuthor extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocAuthor';
}

/**
 * @deprecated Description.
 */
interface ApexDocDeprecated extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocDeprecated';
}

/**
 * @example example
 */
interface ApexDocExample extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocExample';
}

/**
 * @group groupName
 */
interface ApexDocGroup extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocGroup';
  readonly groupName: string;
}

/**
 * @see reference
 */
interface ApexDocSee extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocSee';

  /**
   * Class#member, "text", or HTML link.
   */
  readonly reference?: string;
}

/**
 * @since value
 */
interface ApexDocSince extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocSince';
}

/**
 * @throws ExceptionType description.
 */
interface ApexDocThrows extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocThrows';
  readonly exceptionType?: string;
}

/**
 * @version value
 */
interface ApexDocVersion extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocVersion';
}

/**
 * Inline tag types (appear within descriptions, enclosed in {}).
 */
type ApexDocInlineTag = ApexDocCode | ApexDocHidden | ApexDocLink | ApexDocLiteral;

/**
 * Inline tag kind discriminator.
 */
type ApexDocInlineTagKind = 'ApexDocCode' | 'ApexDocHidden' | 'ApexDocLink' | 'ApexDocLiteral';

/**
 * Base interface for inline tags.
 */
interface ApexDocInlineTagBase extends ASTNode {
  readonly kind: ApexDocInlineTagKind;
}

/**
 * {@code text} - Formats text as inline code. If text contains Apex code, it's parsed as nested AST.
 */
interface ApexDocCode extends ApexDocInlineTagBase {
  readonly kind: 'ApexDocCode';
  readonly text: string; /**
   * Raw text content.
   */

  /**
   * Parsed Apex AST if the text is valid Apex code.
   */
  readonly nestedAST?: ASTNode;
}

/**
 * {@hidden text} - Prevents element from appearing in generated docs.
 */
interface ApexDocHidden extends ApexDocInlineTagBase {
  readonly kind: 'ApexDocHidden';
  readonly text: string;
}

/**
 * {@link reference} - Creates an inline link.
 */
interface ApexDocLink extends ApexDocInlineTagBase {
  readonly kind: 'ApexDocLink';
  readonly reference?: string; /**
   * Class#member, "text", or HTML link.
   */

  /**
   * Optional label for the link.
   */
  readonly label?: string;
}

/**
 * {@literal text} - Shows text literally without HTML tag interpretation.
 */
interface ApexDocLiteral extends ApexDocInlineTagBase {
  readonly kind: 'ApexDocLiteral';
  readonly text: string;
}

/**
 * Content within ApexDoc (can be plain text or inline tags).
 */
type ApexDocContent = ApexDocInlineTag | ApexDocText;

/**
 * Plain text content in ApexDoc.
 */
interface ApexDocText extends ASTNode {
  readonly kind: 'ApexDocText';
  readonly text: string;
}

export type {
  ApexDocComment,
  ApexDocBlockTag,
  ApexDocBlockTagKind,
  ApexDocBlockTagBase,
  ApexDocParam,
  ApexDocReturn,
  ApexDocAuthor,
  ApexDocDeprecated,
  ApexDocExample,
  ApexDocGroup,
  ApexDocSee,
  ApexDocSince,
  ApexDocThrows,
  ApexDocVersion,
  ApexDocInlineTag,
  ApexDocInlineTagKind,
  ApexDocInlineTagBase,
  ApexDocCode,
  ApexDocHidden,
  ApexDocLink,
  ApexDocLiteral,
  ApexDocContent,
  ApexDocText,
};
