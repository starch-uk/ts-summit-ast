/**
 * @file ApexDoc parser utilities.
 * Parses ApexDoc comments (starting with /**) into ApexDoc AST nodes.
 */

import type { ASTNode } from '../ast/base.js';
import type { ParseTreeNode } from '../parser/ParseTreeTypes.js';
import type {
  ApexDocComment,
  ApexDocBlockTag,
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
  ApexDocCode,
  ApexDocHidden,
  ApexDocLink,
  ApexDocLiteral,
  ApexDocContent,
  ApexDocText,
} from '../ast/ApexDoc.js';
import type { SourceRange } from '../ast/base.js';
import { parseApexCode } from './apex-parser.js';

/**
 * Options for parsing ApexDoc comments.
 */
interface ApexDocParseOptions {
  readonly includeLocation?: boolean;

  /**
   * Parse code tag content as Apex AST.
   */
  readonly parseCodeInCodeTag?: boolean;

  /**
   * For parsing nested code.
   */
  readonly parseTreeAdapter?: (source: string) => ParseTreeNode | null;
}

/**
 * Parse an ApexDoc comment into an AST node.
 * @param commentText - The ApexDoc comment text (including comment delimiters).
 * @param location - Optional source location for the comment.
 * @param options - Parsing options.
 * @returns The parsed ApexDoc comment AST node, or null if parsing fails.
 */
function parseApexDocComment(
  commentText: string,
  location?: SourceRange,
  options: ApexDocParseOptions = {}
): ApexDocComment | null {
  const { includeLocation = true, parseCodeInCodeTag = true, parseTreeAdapter } = options;

  // Remove /** and */ delimiters and leading asterisks from each line
  // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Function is defined later in file
  const cleaned = cleanApexDocComment(commentText);
  if (cleaned === null) {
    return null;
  }
  // Allow empty strings for empty comments

  // Split into main description and block tags
  // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Function is defined later in file
  const { mainDescription, blockTagLines } = splitMainDescriptionAndTags(cleaned);

  // Parse block tags
  const blockTags: ApexDocBlockTag[] = [];
  for (const tagLine of blockTagLines) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Function is defined later in file
    const tag = parseBlockTag(tagLine, includeLocation ? location : undefined, {
      parseCodeInCodeTag,
      parseTreeAdapter,
    });
    if (tag) {
      blockTags.push(tag);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Function is defined later in file
  const mainDescriptionContent = parseContent(
    mainDescription,
    includeLocation ? location : undefined,
    {
      parseCodeInCodeTag,
      parseTreeAdapter,
    }
  );

  // Extract text from all content nodes (text nodes and inline tag text)
  const mainDescriptionText = mainDescriptionContent
    .map((c) => {
      if (c.kind === 'ApexDocText') {
        return c.text;
      } else if (c.kind === 'ApexDocCode') {
        return c.text;
      } else if (c.kind === 'ApexDocLink') {
        return c.reference ?? c.label ?? '';
      } else if (c.kind === 'ApexDocLiteral') {
        return c.text;
      } else {
        // c.kind === 'ApexDocHidden'
        return c.text;
      }
      return '';
    })
    .join('');

  const result: ApexDocComment = {
    blockTags,
    kind: 'ApexDocComment',
    mainDescription: mainDescriptionText,
    ...(includeLocation && location ? { location } : {}),
  };

  return result;
}

/**
 * Clean ApexDoc comment by removing delimiters and leading asterisks.
 * @param commentText - The raw ApexDoc comment text.
 * @returns The cleaned comment text, or null if invalid.
 */
function cleanApexDocComment(commentText: string): string | null {
  // Remove /** at start
  let cleaned = commentText.replace(/^\/\*\*/, '');
  // Remove */ at end
  cleaned = cleaned.replace(/\*\/$/, '');

  // Split into lines and remove leading asterisks and whitespace
  const lines = cleaned.split(/\r?\n/).map((line) => {
    // Remove leading whitespace and asterisk
    const match = /^\s*\*\s?(.*)$/.exec(line);
    if (match) {
      const firstCaptureGroup = 1;
      const captured = match[firstCaptureGroup];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Capture group can be undefined if not matched
      if (captured !== undefined) {
        return captured;
      }
    }
    // If no asterisk, just trim
    return line.trimStart();
  });

  const result = lines.join('\n').trim();
  // Return empty string for empty comments (not null)
  return result;
}

/**
 * Split comment into main description and block tag lines.
 * @param commentText - The cleaned comment text.
 * @returns Object with main description and block tag lines.
 */
function splitMainDescriptionAndTags(commentText: string): {
  mainDescription: string;
  blockTagLines: string[];
} {
  const lines = commentText.split(/\r?\n/);
  const blockTagLines: string[] = [];
  let mainDescriptionLines: string[] = [];
  let inMainDescription = true;

  // eslint-disable-next-line @typescript-eslint/prefer-for-of -- Need index for array access
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') {
      if (inMainDescription) {
        mainDescriptionLines.push(line);
      } else {
        // Empty line between tags, skip
      }
      continue;
    }

    // Check if line starts with a block tag (@tag)
    const blockTagMatch = /^@(\w+)\s*(.*)$/.exec(line);
    if (blockTagMatch) {
      inMainDescription = false;
      blockTagLines.push(line);
    } else if (inMainDescription) {
      mainDescriptionLines.push(line);
    } else {
      // Continuation of previous block tag

      const emptyArrayLength = 0;
      if (blockTagLines.length > emptyArrayLength) {
        const lastIndex = 1;
        blockTagLines[blockTagLines.length - lastIndex] += ' ' + line;
      }
    }
  }

  return {
    blockTagLines,
    mainDescription: mainDescriptionLines.join('\n'),
  };
}

/**
 * Parse a block tag line.
 * @param tagLine - The block tag line to parse (e.g., "@param name description").
 * @param location - Optional source location.
 * @param options - Parsing options.
 * @returns The parsed block tag, or null if parsing fails.
 */
function parseBlockTag(
  tagLine: string,
  location: SourceRange | undefined,
  options: ApexDocParseOptions
): ApexDocBlockTag | null {
  const match = /^@(\w+)\s*(.*)$/.exec(tagLine);
  if (!match) {
    return null;
  }

  const firstCaptureGroup = 1;
  const secondCaptureGroup = 2;
  const tagName = match[firstCaptureGroup];
  const content = match[secondCaptureGroup];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Capture groups can be undefined if not matched
  if (tagName === undefined || content === undefined) {
    return null;
  }

  // Parse content (may contain inline tags)
  // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Function is defined later in file
  const description = parseContent(content, location, options);

  const baseTag = {
    description,
  };

  if (location) {
    (baseTag as Record<string, unknown>).location = location;
  }

  switch (tagName) {
    case 'param': {
      // @param paramName description
      const paramMatch = /^(\w+)\s+(.*)$/.exec(content);
      if (paramMatch) {
        const [, paramName, descriptionText] = paramMatch;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Function is defined later in file
        const desc = parseContent(descriptionText, location, options);
        return {
          description: desc,
          kind: 'ApexDocParam',
          paramName,
          ...(location ? { location } : {}),
        } as ApexDocParam;
      }
      return null;
    }

    case 'return':
      return {
        kind: 'ApexDocReturn',
        ...baseTag,
      } as ApexDocReturn;

    case 'author':
      return {
        kind: 'ApexDocAuthor',
        ...baseTag,
      } as ApexDocAuthor;

    case 'deprecated':
      return {
        kind: 'ApexDocDeprecated',
        ...baseTag,
      } as ApexDocDeprecated;

    case 'example':
      return {
        kind: 'ApexDocExample',
        ...baseTag,
      } as ApexDocExample;

    case 'group': {
      // @group groupName
      const groupMatch = /^(\w+)(?:\s+(.*))?$/.exec(content);
      if (groupMatch) {
        const [, groupName, descriptionText] = groupMatch;
        const desc = descriptionText ? parseContent(descriptionText, location, options) : [];
        return {
          description: desc,
          groupName,
          kind: 'ApexDocGroup',
          ...(location ? { location } : {}),
        } as ApexDocGroup;
      }
      return null;
    }

    case 'see': {
      // @see reference or @see description
      // Can be: class#member, "text", or <a href="url">label</a>
      const seeMatch = /^(class#member|"[^"]*"|<a\s+href="[^"]*">[^<]*<\/a>)(?:\s+(.*))?$/.exec(
        content
      );
      if (seeMatch) {
        const seeFirstCaptureGroup = 1;
        const seeSecondCaptureGroup = 2;
        const seeReference = seeMatch[seeFirstCaptureGroup];
        const seeDescriptionText = seeMatch[seeSecondCaptureGroup];

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Capture groups can be undefined if not matched
        if (seeReference === undefined) {
          return null;
        }

        const seeDescription = seeDescriptionText
          ? parseContent(seeDescriptionText, location, options)
          : [];
        return {
          description: seeDescription,
          kind: 'ApexDocSee',
          reference: seeReference,
          ...(location ? { location } : {}),
        } as ApexDocSee;
      }
      // Just description
      return {
        description,
        kind: 'ApexDocSee',
        ...(location ? { location } : {}),
      } as ApexDocSee;
    }

    case 'since':
      return {
        kind: 'ApexDocSince',
        ...baseTag,
      } as ApexDocSince;

    case 'throws': {
      // @throws exceptionType description
      const throwsMatch = /^(\w+(?:\.\w+)*)\s+(.*)$/.exec(content);
      if (throwsMatch) {
        const [, exceptionType, descriptionText] = throwsMatch;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Function is defined later in file
        const desc = parseContent(descriptionText, location, options);
        return {
          description: desc,
          exceptionType,
          kind: 'ApexDocThrows',
          ...(location ? { location } : {}),
        } as ApexDocThrows;
      }
      // Just description
      return {
        description,
        kind: 'ApexDocThrows',
        ...(location ? { location } : {}),
      } as ApexDocThrows;
    }

    case 'version':
      return {
        kind: 'ApexDocVersion',
        ...baseTag,
      } as ApexDocVersion;

    default:
      return null;
  }
}

/**
 * Parse content that may contain inline tags.
 * @param text - The text content to parse.
 * @param location - Optional source location.
 * @param options - Parsing options.
 * @returns Array of content nodes (text and inline tags).
 */
function parseContent(
  text: string,
  location: SourceRange | undefined,
  options: ApexDocParseOptions
): ApexDocContent[] {
  const result: ApexDocContent[] = [];
  let currentPos = 0;

  // Match inline tags: {@tag ...}
  const inlineTagRegex = /\{@(\w+)(?:\s+([^}]*))?\}/g;

  let match: RegExpExecArray | null = null;

  while ((match = inlineTagRegex.exec(text)) !== null) {
    // Add text before the tag
    if (match.index > currentPos) {
      const textBefore = text.substring(currentPos, match.index);
      if (textBefore) {
        result.push({
          kind: 'ApexDocText',
          text: textBefore,
          ...(location ? { location } : {}),
        } as ApexDocText);
      }
    }

    // Parse the inline tag

    const [, tagName, tagContentRaw] = match;
    const tagContent = tagContentRaw || '';

    // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Function is defined later in file
    const inlineTag = parseInlineTag(tagName, tagContent, location, options);
    if (inlineTag) {
      result.push(inlineTag);
    }

    const fullMatchIndex = 0;
    const fullMatch = match[fullMatchIndex];
    currentPos = match.index + fullMatch.length;
  }

  // Add remaining text
  if (currentPos < text.length) {
    const remainingText = text.substring(currentPos);
    if (remainingText) {
      result.push({
        kind: 'ApexDocText',
        text: remainingText,
        ...(location ? { location } : {}),
      } as ApexDocText);
    }
  }

  // If no inline tags found, return as single text node

  const emptyArrayLength = 0;
  if (result.length === emptyArrayLength && text) {
    result.push({
      kind: 'ApexDocText',
      text,
      ...(location ? { location } : {}),
    } as ApexDocText);
  }

  return result;
}

/**
 * Parses an inline ApexDoc tag.
 * @param tagName - The inline tag name (e.g., "code", "link").
 * @param content - The raw inline tag content.
 * @param location - Optional source location range for the tag.
 * @param options - Parser options controlling inline parsing behavior.
 * @returns The parsed inline tag, or null if parsing fails.
 */
// eslint-disable-next-line @typescript-eslint/max-params -- Inline tag parsing requires 4 parameters
function parseInlineTag(
  tagName: string,
  content: string,
  location: SourceRange | undefined,
  options: ApexDocParseOptions
): ApexDocInlineTag | null {
  const { parseCodeInCodeTag = true, parseTreeAdapter } = options;

  const baseTag = location ? { location } : {};

  switch (tagName) {
    case 'code': {
      // {@code text} - may contain Apex code to parse

      let nestedAST: ASTNode | undefined = undefined;
      if (parseCodeInCodeTag && content.trim()) {
        try {
          const parseResult = parseApexCode(content, {
            includeLocation: false,
            parseTreeAdapter,
          });
          if (parseResult.ast) {
            nestedAST = parseResult.ast;
          }
        } catch {
          // If parsing fails, just keep the text
        }
      }

      return {
        kind: 'ApexDocCode',
        text: content,
        ...(nestedAST ? { nestedAST } : {}),
        ...baseTag,
      } as ApexDocCode;
    }

    case 'hidden':
      return {
        kind: 'ApexDocHidden',
        text: content,
        ...baseTag,
      } as ApexDocHidden;

    case 'link': {
      // {@link reference} or {@link "text"} or {@link <a href="url">label</a>}
      const linkMatch = /^(class#member|"[^"]*"|<a\s+href="[^"]*">([^<]*)<\/a>)/.exec(content);
      if (linkMatch) {
        const linkFirstCaptureGroup = 1;
        const label = linkMatch.length > 2 ? linkMatch[2] : undefined;
        const reference = linkMatch[linkFirstCaptureGroup];
        return {
          kind: 'ApexDocLink',
          ...(label ? { label } : {}),
          reference,
          ...baseTag,
        } as ApexDocLink;
      }
      return {
        kind: 'ApexDocLink',
        reference: content || undefined,
        ...baseTag,
      } as ApexDocLink;
    }

    case 'literal':
      return {
        kind: 'ApexDocLiteral',
        text: content,
        ...baseTag,
      } as ApexDocLiteral;

    default:
      return null;
  }
}

/**
 * Check if a comment string is an ApexDoc comment (starts with /**).
 * @param commentText - The comment text to check.
 * @returns True if the comment is an ApexDoc comment.
 */
function isApexDocCommentString(commentText: string): boolean {
  return commentText.trimStart().startsWith('/**');
}

export type { ApexDocParseOptions };
export { parseApexDocComment, isApexDocCommentString };
