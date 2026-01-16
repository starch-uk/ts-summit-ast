/**
 * ApexDoc node types
 */

import type { ASTNode } from '../base.js';

/**
 * ApexDoc comment block - represents a complete ApexDoc comment (starts with /**)
 */
export interface ApexDocComment extends ASTNode {
  readonly kind: 'ApexDocComment';
  readonly mainDescription: string; // The main description (before any tags)
  readonly blockTags: ApexDocBlockTag[]; // Block tags like @param, @return, etc.
}

/**
 * Block tag types (appear on their own line after the main description)
 */
export type ApexDocBlockTag =
  | ApexDocParamTag
  | ApexDocReturnTag
  | ApexDocAuthorTag
  | ApexDocDeprecatedTag
  | ApexDocExampleTag
  | ApexDocGroupTag
  | ApexDocSeeTag
  | ApexDocSinceTag
  | ApexDocThrowsTag
  | ApexDocVersionTag;

/**
 * Block tag kind discriminator
 */
export type ApexDocBlockTagKind =
  | 'ApexDocParamTag'
  | 'ApexDocReturnTag'
  | 'ApexDocAuthorTag'
  | 'ApexDocDeprecatedTag'
  | 'ApexDocExampleTag'
  | 'ApexDocGroupTag'
  | 'ApexDocSeeTag'
  | 'ApexDocSinceTag'
  | 'ApexDocThrowsTag'
  | 'ApexDocVersionTag';

/**
 * Base interface for block tags
 */
export interface ApexDocBlockTagBase extends ASTNode {
  readonly kind: ApexDocBlockTagKind;
  readonly description: ApexDocContent[]; // Description text (can contain inline tags)
}

/**
 * @param paramName description
 */
export interface ApexDocParamTag extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocParamTag';
  readonly paramName: string;
}

/**
 * @return description
 */
export interface ApexDocReturnTag extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocReturnTag';
}

/**
 * @author value
 */
export interface ApexDocAuthorTag extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocAuthorTag';
}

/**
 * @deprecated description
 */
export interface ApexDocDeprecatedTag extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocDeprecatedTag';
}

/**
 * @example example
 */
export interface ApexDocExampleTag extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocExampleTag';
}

/**
 * @group groupName
 */
export interface ApexDocGroupTag extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocGroupTag';
  readonly groupName: string;
}

/**
 * @see reference
 */
export interface ApexDocSeeTag extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocSeeTag';
  readonly reference?: string; // class#member, "text", or HTML link
}

/**
 * @since value
 */
export interface ApexDocSinceTag extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocSinceTag';
}

/**
 * @throws exceptionType description
 */
export interface ApexDocThrowsTag extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocThrowsTag';
  readonly exceptionType?: string;
}

/**
 * @version value
 */
export interface ApexDocVersionTag extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocVersionTag';
}

/**
 * Inline tag types (appear within descriptions, enclosed in {})
 */
export type ApexDocInlineTag =
  | ApexDocCodeTag
  | ApexDocHiddenTag
  | ApexDocLinkTag
  | ApexDocLiteralTag;

/**
 * Inline tag kind discriminator
 */
export type ApexDocInlineTagKind =
  | 'ApexDocCodeTag'
  | 'ApexDocHiddenTag'
  | 'ApexDocLinkTag'
  | 'ApexDocLiteralTag';

/**
 * Base interface for inline tags
 */
export interface ApexDocInlineTagBase extends ASTNode {
  readonly kind: ApexDocInlineTagKind;
}

/**
 * {@code text} - Formats text as inline code. If text contains Apex code, it's parsed as nested AST
 */
export interface ApexDocCodeTag extends ApexDocInlineTagBase {
  readonly kind: 'ApexDocCodeTag';
  readonly text: string; // Raw text content
  readonly nestedAST?: ASTNode; // Parsed Apex AST if the text is valid Apex code
}

/**
 * {@hidden text} - Prevents element from appearing in generated docs
 */
export interface ApexDocHiddenTag extends ApexDocInlineTagBase {
  readonly kind: 'ApexDocHiddenTag';
  readonly text: string;
}

/**
 * {@link reference} - Creates an inline link
 */
export interface ApexDocLinkTag extends ApexDocInlineTagBase {
  readonly kind: 'ApexDocLinkTag';
  readonly reference?: string; // class#member, "text", or HTML link
  readonly label?: string; // Optional label for the link
}

/**
 * {@literal text} - Shows text literally without HTML tag interpretation
 */
export interface ApexDocLiteralTag extends ApexDocInlineTagBase {
  readonly kind: 'ApexDocLiteralTag';
  readonly text: string;
}

/**
 * Content within ApexDoc (can be plain text or inline tags)
 */
export type ApexDocContent = ApexDocText | ApexDocInlineTag;

/**
 * Plain text content in ApexDoc
 */
export interface ApexDocText extends ASTNode {
  readonly kind: 'ApexDocText';
  readonly text: string;
}