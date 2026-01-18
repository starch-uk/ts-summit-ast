/**
 * @file ApexDoc parser utilities.
 * Parses ApexDoc comments (starting with /**) into ApexDoc AST nodes.
 */

import type { ASTNode } from '../ast/base.js';
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
export interface ApexDocParseOptions {
  readonly includeLocation?: boolean;

  /**
   * Parse {@code} content as Apex AST.
   */
  readonly parseCodeInCodeTag?: boolean;

  /**
   * For parsing nested code.
   */
  readonly parseTreeAdapter?: (source: string) => any;
}

/**
 * Parse an ApexDoc comment into an AST node.
 * @param commentText - The ApexDoc comment text (including comment delimiters).
 * @param location - Optional source location for the comment.
 * @param options - Parsing options.
 * @returns The parsed ApexDoc comment AST node, or null if parsing fails.
 */
export function parseApexDocComment(
  commentText: string,
  location?: SourceRange,
  options: ApexDocParseOptions = {}
): ApexDocComment | null {
  const { includeLocation = true, parseCodeInCodeTag = true, parseTreeAdapter } = options;

  // Remove /** and */ delimiters and leading asterisks from each line
  const cleaned = cleanApexDocComment(commentText);
  if (cleaned === null) {
    return null;
  }
  // Allow empty strings for empty comments

  // Split into main description and block tags
  const { mainDescription, blockTagLines } = splitMainDescriptionAndTags(cleaned);

  // Parse block tags
  const blockTags: ApexDocBlockTag[] = [];
  for (const tagLine of blockTagLines) {
    const tag = parseBlockTag(tagLine, includeLocation ? location : undefined, {
      parseCodeInCodeTag,
      parseTreeAdapter,
    });
    if (tag) {
      blockTags.push(tag);
    }
  }

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
        return c.reference || c.label || '';
      } else if (c.kind === 'ApexDocLiteral') {
        return c.text;
      } else if (c.kind === 'ApexDocHidden') {
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
      return match[1];
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
      if (blockTagLines.length > 0) {
        blockTagLines[blockTagLines.length - 1] += ' ' + line;
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

  const tagName = match[1];
  const content = match[2];

  // Parse content (may contain inline tags)
  const description = parseContent(content, location, options);

  const baseTag = {
    description,
  };

  if (location) {
    (baseTag as any).location = location;
  }

  switch (tagName) {
    case 'param': {
      // @param paramName description
      const paramMatch = /^(\w+)\s+(.*)$/.exec(content);
      if (paramMatch) {
        const paramName = paramMatch[1];
        const desc = parseContent(paramMatch[2], location, options);
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
        const groupName = groupMatch[1];
        const desc = groupMatch[2] ? parseContent(groupMatch[2], location, options) : [];
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
        return {
          description: seeMatch[2] ? parseContent(seeMatch[2], location, options) : [],
          kind: 'ApexDocSee',
          reference: seeMatch[1],
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
        const exceptionType = throwsMatch[1];
        const desc = parseContent(throwsMatch[2], location, options);
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
  let match: RegExpExecArray | null;

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
    const tagName = match[1];
    const tagContent = match[2] || '';

    const inlineTag = parseInlineTag(tagName, tagContent, location, options);
    if (inlineTag) {
      result.push(inlineTag);
    }

    currentPos = match.index + match[0].length;
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
  if (result.length === 0 && text) {
    result.push({
      kind: 'ApexDocText',
      text,
      ...(location ? { location } : {}),
    } as ApexDocText);
  }

  return result;
}

/**
 * Parse an inline tag.
 * @param tagName - The inline tag name (e.g., "code", "link").
 * @param content - The tag content.
 * @param location - Optional source location.
 * @param options - Parsing options.
 * @returns The parsed inline tag, or null if parsing fails.
 */
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
      let nestedAST: ASTNode | undefined;
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
        return {
          kind: 'ApexDocLink',
          label: linkMatch[2],
          reference: linkMatch[1],
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
export function isApexDocCommentString(commentText: string): boolean {
  return commentText.trimStart().startsWith('/**');
}
