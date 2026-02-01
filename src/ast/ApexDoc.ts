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
  readonly blockTags: ApexDocBlockTag[];
}

/**
 * Block tag types (appear on their own line after the main description).
 */
/* eslint-disable @typescript-eslint/no-type-alias -- Type alias needed for union type in AST structure */
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
/* eslint-enable @typescript-eslint/no-type-alias */

/**
 * Block tag kind discriminator.
 */
/* eslint-disable @typescript-eslint/no-type-alias -- Type alias needed for union type in AST structure */
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
/* eslint-enable @typescript-eslint/no-type-alias */

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
 * Example code snippet or usage.
 */
interface ApexDocExample extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocExample';
}

/* eslint-disable jsdoc/check-tag-names -- @group is a valid ApexDoc tag */

/**
 * @group groupName - Groups related members together in documentation.
 */
interface ApexDocGroup extends ApexDocBlockTagBase {
  /* eslint-enable jsdoc/check-tag-names */
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

/* eslint-disable jsdoc/check-values -- @since value is valid in ApexDoc */

/**
 * @since version - Specifies when this feature was introduced.
 */
interface ApexDocSince extends ApexDocBlockTagBase {
  /* eslint-enable jsdoc/check-values */
  readonly kind: 'ApexDocSince';
}

/**
 * @throws {string} ExceptionType - Description of when this exception is thrown.
 */
interface ApexDocThrows extends ApexDocBlockTagBase {
  readonly kind: 'ApexDocThrows';
  readonly exceptionType?: string;
}

/* eslint-disable jsdoc/check-values -- @version value is valid in ApexDoc */

/**
 * @version version - Specifies the version of this feature.
 */
interface ApexDocVersion extends ApexDocBlockTagBase {
  /* eslint-enable jsdoc/check-values */
  readonly kind: 'ApexDocVersion';
}

/**
 * Inline tag types (appear within descriptions, enclosed in {}).
 */
/* eslint-disable @typescript-eslint/no-type-alias -- Type alias needed for union type in AST structure */
type ApexDocInlineTag = ApexDocCode | ApexDocHidden | ApexDocLink | ApexDocLiteral;
/* eslint-enable @typescript-eslint/no-type-alias */

/**
 * Inline tag kind discriminator.
 */
/* eslint-disable @typescript-eslint/no-type-alias -- Type alias needed for union type in AST structure */
type ApexDocInlineTagKind = 'ApexDocCode' | 'ApexDocHidden' | 'ApexDocLink' | 'ApexDocLiteral';
/* eslint-enable @typescript-eslint/no-type-alias */

/**
 * Base interface for inline tags.
 */
interface ApexDocInlineTagBase extends ASTNode {
  readonly kind: ApexDocInlineTagKind;
}

/* eslint-disable jsdoc/check-tag-names -- {@code} is a valid ApexDoc inline tag */

/**
 * {@code text} - Formats text as inline code. If text contains Apex code, it's parsed as nested AST.
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
/* eslint-enable jsdoc/check-tag-names */

/* eslint-disable jsdoc/check-tag-names -- {@hidden} is a valid ApexDoc inline tag */

/**
 * {@hidden text} - Prevents element from appearing in generated docs.
 */
interface ApexDocHidden extends ApexDocInlineTagBase {
  readonly kind: 'ApexDocHidden';
  readonly text: string;
}
/* eslint-enable jsdoc/check-tag-names */

/* eslint-disable jsdoc/no-undefined-types -- 'reference' is a generic term for link target */

/**
 * {@link reference} - Creates an inline link.
 */
interface ApexDocLink extends ApexDocInlineTagBase {
  readonly kind: 'ApexDocLink';

  /**
   * Class#member, "text", or HTML link.
   */
  readonly reference?: string;

  /**
   * Optional label for the link.
   */
  readonly label?: string;
}
/* eslint-enable jsdoc/no-undefined-types */

/* eslint-disable jsdoc/check-tag-names -- {@literal} is a valid ApexDoc inline tag */

/**
 * {@literal text} - Shows text literally without HTML tag interpretation.
 */
interface ApexDocLiteral extends ApexDocInlineTagBase {
  readonly kind: 'ApexDocLiteral';
  readonly text: string;
}
/* eslint-enable jsdoc/check-tag-names */

/**
 * Content within ApexDoc (can be plain text or inline tags).
 */
/* eslint-disable @typescript-eslint/no-type-alias -- Type alias needed for union type in AST structure */
type ApexDocContent = ApexDocInlineTag | ApexDocText;
/* eslint-enable @typescript-eslint/no-type-alias */

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
