/**
 * ApexDoc parser utilities
 * Parses ApexDoc comments (starting with /**) into ApexDoc AST nodes
 */

import type { ASTNode } from '../ast/base.js';
import type {
  ApexDocComment,
  ApexDocBlockTag,
  ApexDocParamTag,
  ApexDocReturnTag,
  ApexDocAuthorTag,
  ApexDocDeprecatedTag,
  ApexDocExampleTag,
  ApexDocGroupTag,
  ApexDocSeeTag,
  ApexDocSinceTag,
  ApexDocThrowsTag,
  ApexDocVersionTag,
  ApexDocInlineTag,
  ApexDocCodeTag,
  ApexDocHiddenTag,
  ApexDocLinkTag,
  ApexDocLiteralTag,
  ApexDocContent,
  ApexDocText,
} from '../ast/nodes/ApexDoc.js';
import type { SourceRange } from '../ast/base.js';
import { parseApexCode } from './apex-parser.js';

/**
 * Options for parsing ApexDoc comments
 */
export interface ApexDocParseOptions {
  readonly includeLocation?: boolean;
  readonly parseCodeInCodeTag?: boolean; // Parse {@code} content as Apex AST
  readonly parseTreeAdapter?: (source: string) => any; // For parsing nested code
}

/**
 * Parse an ApexDoc comment into an AST node
 */
export function parseApexDocComment(
  commentText: string,
  location?: SourceRange,
  options: ApexDocParseOptions = {}
): ApexDocComment | null {
  const {
    includeLocation = true,
    parseCodeInCodeTag = true,
    parseTreeAdapter,
  } = options;

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

  const mainDescriptionContent = parseContent(mainDescription, includeLocation ? location : undefined, {
    parseCodeInCodeTag,
    parseTreeAdapter,
  });
  
  // Extract text from all content nodes (text nodes and inline tag text)
  const mainDescriptionText = mainDescriptionContent
    .map((c) => {
      if (c.kind === 'ApexDocText') {
        return c.text;
      } else if (c.kind === 'ApexDocCodeTag') {
        return c.text;
      } else if (c.kind === 'ApexDocLinkTag') {
        return c.reference || c.label || '';
      } else if (c.kind === 'ApexDocLiteralTag') {
        return c.text;
      } else if (c.kind === 'ApexDocHiddenTag') {
        return c.text;
      }
      return '';
    })
    .join('');

  const result: ApexDocComment = {
    kind: 'ApexDocComment',
    mainDescription: mainDescriptionText,
    blockTags,
    ...(includeLocation && location ? { location } : {}),
  };

  return result;
}

/**
 * Clean ApexDoc comment by removing delimiters and leading asterisks
 */
function cleanApexDocComment(commentText: string): string | null {
  // Remove /** at start
  let cleaned = commentText.replace(/^\/\*\*/, '');
  // Remove */ at end
  cleaned = cleaned.replace(/\*\/$/, '');

  // Split into lines and remove leading asterisks and whitespace
  const lines = cleaned.split(/\r?\n/).map((line) => {
    // Remove leading whitespace and asterisk
    const match = line.match(/^\s*\*\s?(.*)$/);
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
 * Split comment into main description and block tag lines
 */
function splitMainDescriptionAndTags(
  commentText: string
): { mainDescription: string; blockTagLines: string[] } {
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
    const blockTagMatch = line.match(/^@(\w+)\s*(.*)$/);
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
    mainDescription: mainDescriptionLines.join('\n'),
    blockTagLines,
  };
}

/**
 * Parse a block tag line
 */
function parseBlockTag(
  tagLine: string,
  location: SourceRange | undefined,
  options: ApexDocParseOptions
): ApexDocBlockTag | null {
  const match = tagLine.match(/^@(\w+)\s*(.*)$/);
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
      const paramMatch = content.match(/^(\w+)\s+(.*)$/);
      if (paramMatch) {
        const paramName = paramMatch[1];
        const desc = parseContent(paramMatch[2], location, options);
        return {
          kind: 'ApexDocParamTag',
          paramName,
          description: desc,
          ...(location ? { location } : {}),
        } as ApexDocParamTag;
      }
      return null;
    }

    case 'return':
      return {
        kind: 'ApexDocReturnTag',
        ...baseTag,
      } as ApexDocReturnTag;

    case 'author':
      return {
        kind: 'ApexDocAuthorTag',
        ...baseTag,
      } as ApexDocAuthorTag;

    case 'deprecated':
      return {
        kind: 'ApexDocDeprecatedTag',
        ...baseTag,
      } as ApexDocDeprecatedTag;

    case 'example':
      return {
        kind: 'ApexDocExampleTag',
        ...baseTag,
      } as ApexDocExampleTag;

    case 'group': {
      // @group groupName
      const groupMatch = content.match(/^(\w+)(?:\s+(.*))?$/);
      if (groupMatch) {
        const groupName = groupMatch[1];
        const desc = groupMatch[2]
          ? parseContent(groupMatch[2], location, options)
          : [];
        return {
          kind: 'ApexDocGroupTag',
          groupName,
          description: desc,
          ...(location ? { location } : {}),
        } as ApexDocGroupTag;
      }
      return null;
    }

    case 'see': {
      // @see reference or @see description
      // Can be: class#member, "text", or <a href="url">label</a>
      const seeMatch = content.match(/^(class#member|"[^"]*"|<a\s+href="[^"]*">[^<]*<\/a>)(?:\s+(.*))?$/);
      if (seeMatch) {
        return {
          kind: 'ApexDocSeeTag',
          reference: seeMatch[1],
          description: seeMatch[2] ? parseContent(seeMatch[2], location, options) : [],
          ...(location ? { location } : {}),
        } as ApexDocSeeTag;
      }
      // Just description
      return {
        kind: 'ApexDocSeeTag',
        description,
        ...(location ? { location } : {}),
      } as ApexDocSeeTag;
    }

    case 'since':
      return {
        kind: 'ApexDocSinceTag',
        ...baseTag,
      } as ApexDocSinceTag;

    case 'throws': {
      // @throws exceptionType description
      const throwsMatch = content.match(/^(\w+(?:\.\w+)*)\s+(.*)$/);
      if (throwsMatch) {
        const exceptionType = throwsMatch[1];
        const desc = parseContent(throwsMatch[2], location, options);
        return {
          kind: 'ApexDocThrowsTag',
          exceptionType,
          description: desc,
          ...(location ? { location } : {}),
        } as ApexDocThrowsTag;
      }
      // Just description
      return {
        kind: 'ApexDocThrowsTag',
        description,
        ...(location ? { location } : {}),
      } as ApexDocThrowsTag;
    }

    case 'version':
      return {
        kind: 'ApexDocVersionTag',
        ...baseTag,
      } as ApexDocVersionTag;

    default:
      return null;
  }
}

/**
 * Parse content that may contain inline tags
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
 * Parse an inline tag
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
            parseTreeAdapter,
            includeLocation: false,
          });
          if (parseResult.ast) {
            nestedAST = parseResult.ast;
          }
        } catch {
          // If parsing fails, just keep the text
        }
      }

      return {
        kind: 'ApexDocCodeTag',
        text: content,
        ...(nestedAST ? { nestedAST } : {}),
        ...baseTag,
      } as ApexDocCodeTag;
    }

    case 'hidden':
      return {
        kind: 'ApexDocHiddenTag',
        text: content,
        ...baseTag,
      } as ApexDocHiddenTag;

    case 'link': {
      // {@link reference} or {@link "text"} or {@link <a href="url">label</a>}
      const linkMatch = content.match(/^(class#member|"[^"]*"|<a\s+href="[^"]*">([^<]*)<\/a>)/);
      if (linkMatch) {
        return {
          kind: 'ApexDocLinkTag',
          reference: linkMatch[1],
          label: linkMatch[2],
          ...baseTag,
        } as ApexDocLinkTag;
      }
      return {
        kind: 'ApexDocLinkTag',
        reference: content || undefined,
        ...baseTag,
      } as ApexDocLinkTag;
    }

    case 'literal':
      return {
        kind: 'ApexDocLiteralTag',
        text: content,
        ...baseTag,
      } as ApexDocLiteralTag;

    default:
      return null;
  }
}

/**
 * Check if a comment string is an ApexDoc comment (starts with /**)
 */
export function isApexDocCommentString(commentText: string): boolean {
  return /^\/\*\*/.test(commentText.trimStart());
}