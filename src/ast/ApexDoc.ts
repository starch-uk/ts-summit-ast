/**
 * @file ApexDoc node types.
 * ApexDoc comment parsing and AST representation.
 */

import type { ASTNode } from './baseNode.js';

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
   * Block tags like `@param`, `@return`, etc.
   */
  readonly blockTags: (
    | ApexDocAuthor
    | ApexDocDeprecated
    | ApexDocExample
    | ApexDocGroup
    | ApexDocParam
    | ApexDocReturn
    | ApexDocSee
    | ApexDocSince
    | ApexDocThrows
    | ApexDocVersion
  )[];
}

/**
 * Base interface for block tags.
 */
interface ApexDocBlockTagBase extends ASTNode {
  readonly kind:
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
   * Description text (can contain inline tags).
   */
  readonly description: (
    | ApexDocCode
    | ApexDocHidden
    | ApexDocLink
    | ApexDocLiteral
    | ApexDocText
  )[];
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
 * Example code snippet or usage.
 */
interface ApexDocExample extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocExample';
}

/**
 * Groups related members together in documentation (groupName).
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
 * Specifies when this feature was introduced.
 * @since 1.0.0
 */
interface ApexDocSince extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocSince';
}

/**
 * @throws {string} ExceptionType - Description of when this exception is thrown.
 */
interface ApexDocThrows extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocThrows';
  readonly exceptionType?: string;
}

/**
 * Specifies the version of this feature.
 * @version 1.0.0
 */
interface ApexDocVersion extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocVersion';
}

/**
 * Base interface for inline tags.
 */
interface ApexDocInlineTagBase extends ASTNode {
  readonly kind: 'ApexDocCode' | 'ApexDocHidden' | 'ApexDocLink' | 'ApexDocLiteral';
}

/**
 * Inline code: formats text as code. If text contains Apex code, it's parsed as nested AST.
 */
interface ApexDocCode extends ApexDocInlineTagBase {
  readonly kind: 'ApexDocCode';

  /**
   * Raw text content.
   */
  readonly text: string;

  /**
   * Parsed Apex AST if the text is valid Apex code.
   */
  readonly nestedAST?: ASTNode;
}

/**
 * Hidden content: prevents element from appearing in generated docs.
 */
interface ApexDocHidden extends ApexDocInlineTagBase {
  readonly kind: 'ApexDocHidden';
  readonly text: string;
}

/**
 * Inline link: target is Class#member, quoted text, or HTML URL.
 */
interface ApexDocLink extends ApexDocInlineTagBase {
  readonly kind: 'ApexDocLink';

  /**
   * Link target: Class#member, quoted text, or HTML URL.
   */
  readonly reference?: string;

  /**
   * Optional label for the link.
   */
  readonly label?: string;
}

/**
 * Literal text: shown without HTML tag interpretation.
 */
interface ApexDocLiteral extends ApexDocInlineTagBase {
  readonly kind: 'ApexDocLiteral';
  readonly text: string;
}

/**
 * Plain text content in ApexDoc.
 */
interface ApexDocText extends ASTNode {
  readonly kind: 'ApexDocText';
  readonly text: string;
}

export type {
  ApexDocComment,
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
  ApexDocInlineTagBase,
  ApexDocCode,
  ApexDocHidden,
  ApexDocLink,
  ApexDocLiteral,
  ApexDocText,
};
