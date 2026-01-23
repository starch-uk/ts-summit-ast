/**
 * @file Declaration parsing.
 * Parses declarations: classes, interfaces, triggers, enums, annotations, members, types.
 */

import type { ParseTreeNode } from './parseTree.js';
import { TokenType, type Token } from './tokenType.js';
import type { ParserContext } from './apexParser.js';

// ============================================================================
// Compilation Unit
// ============================================================================

/**
 * Parse compilation unit (top-level).
 * @param ctx - The parser context.
 * @returns The compilation unit parse tree node.
 * @throws {Error} If the compilation unit is malformed or unexpected tokens are encountered.
 */
export function parseCompilationUnit(ctx: ParserContext): ParseTreeNode {
  const declarations: ParseTreeNode[] = [];

  // Skip whitespace and comments at start to find the first actual token
  ctx.skipWhitespaceAndComments();

  /**
   * Start from first actual token, not beginning of source.
   */
  const start = ctx.current;

  while (!ctx.isAtEnd()) {
    const beforeDecl = ctx.current;
    const decl = ctx.parseDeclaration();
    if (decl != null) {
      declarations.push(decl);
    }
    // Safety check: ensure we always advance
    if (ctx.current === beforeDecl && !ctx.isAtEnd()) {
      ctx.advance();
    }
    ctx.skipWhitespaceAndComments();
  }

  // For compilation unit, we want the location to span from first token to end of source
  // including trailing newlines. Use a special end position that includes everything.

  /**
   * This will trigger EOF handling in getLocation.
   */
  const endPos = ctx.tokens.length;

  return {
    children: declarations,
    location: ctx.getLocation(start, endPos),
    type: 'compilation_unit',
  };
}

// ============================================================================
// Declaration Parsing
// ============================================================================

/**
 * Parse a declaration (class, interface, trigger, etc.).
 * @param ctx - The parser context.
 * @returns The declaration parse tree node, or null if not a declaration.
 * @throws {Error} If the declaration is malformed or unexpected tokens are encountered.
 */
export function parseDeclaration(ctx: ParserContext): ParseTreeNode | null {
  ctx.skipWhitespaceAndComments();

  // Check for annotation type declaration: @interface
  if (ctx.match(TokenType.AT)) {
    if (ctx.check(TokenType.INTERFACE)) {
      ctx.advance(); // Consume INTERFACE
      return parseAnnotationDeclaration(ctx);
    } else {
      // Not @interface, might be an annotation on a declaration, reset
      ctx.current--;
    }
  }

  // Collect annotations before the declaration (for class, interface, enum, etc.)
  const annotations: ParseTreeNode[] = [];
  while (ctx.match(TokenType.AT)) {
    const annotation = ctx.parseAnnotation();
    if (annotation) {
      annotations.push(annotation);
    }
    ctx.skipWhitespaceAndComments();
  }

  // Parse modifiers (public, private, etc.) that can come before class/interface/enum
  const modifiers: ParseTreeNode[] = [];
  const singleIndexOffset = 1;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Infinite loop pattern for parsing modifiers
  while (true) {
    const beforeMatch = ctx.current;
    let modifierText: string | null = null;
    let modifierStart: number | null = null;

    // Check for multi-word modifiers first: "with sharing", "without sharing", "inherited sharing"
    if (ctx.match(TokenType.WITH)) {
      modifierStart = ctx.current - singleIndexOffset;
      ctx.skipWhitespaceAndComments();
      if (ctx.match(TokenType.SHARING)) {
        modifierText = 'with sharing';
      } else {
        // "with" without "sharing" is not a modifier, reset
        ctx.current = beforeMatch;
        break;
      }
    } else if (ctx.match(TokenType.WITHOUT)) {
      modifierStart = ctx.current - singleIndexOffset;
      ctx.skipWhitespaceAndComments();
      if (ctx.match(TokenType.SHARING)) {
        modifierText = 'without sharing';
      } else {
        // "without" without "sharing" is not a modifier, reset
        ctx.current = beforeMatch;
        break;
      }
    } else if (ctx.match(TokenType.INHERITED)) {
      modifierStart = ctx.current - singleIndexOffset;
      ctx.skipWhitespaceAndComments();
      if (ctx.match(TokenType.SHARING)) {
        modifierText = 'inherited sharing';
      } else {
        // "inherited" without "sharing" is not a modifier, reset
        ctx.current = beforeMatch;
        break;
      }
    } else if (
      ctx.match(
        TokenType.PUBLIC,
        TokenType.PRIVATE,
        TokenType.PROTECTED,
        TokenType.GLOBAL,
        TokenType.STATIC,
        TokenType.FINAL,
        TokenType.ABSTRACT,
        TokenType.OVERRIDE,
        TokenType.VIRTUAL,
        TokenType.TESTMETHOD,
        TokenType.WEBSERVICE,
        TokenType.TRANSIENT
      )
    ) {
      const prevToken = ctx.tokens[ctx.current - singleIndexOffset];
      modifierText = prevToken.text;
      modifierStart = ctx.current - singleIndexOffset;
    } else {
      // No more modifiers
      break;
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Both variables are set together in branches above
    if (modifierText !== null && modifierStart !== null) {
      modifiers.push({
        location: ctx.getLocation(modifierStart, ctx.current),
        text: modifierText,
        type: 'modifier',
      });
      ctx.skipWhitespaceAndComments();
    } else {
      break;
    }
  }

  if (ctx.match(TokenType.CLASS)) {
    return parseClassDeclaration(ctx, annotations, modifiers);
  }
  if (ctx.match(TokenType.INTERFACE)) {
    return parseInterfaceDeclaration(ctx, annotations, modifiers);
  }
  if (ctx.match(TokenType.TRIGGER)) {
    return parseTriggerDeclaration(ctx);
  }
  if (ctx.match(TokenType.ENUM)) {
    return parseEnumDeclaration(ctx, annotations, modifiers);
  }

  // Could be a method or field at top level (unlikely but handle it)
  return null;
}

// ============================================================================
// Interface, Trigger, Enum Declarations
// ============================================================================

/**
 * Parses an interface declaration from the token stream.
 * @param ctx - The parser context.
 * @returns The interface declaration parse tree node.
 * @throws {Error} If the interface declaration is malformed or unexpected tokens are encountered.
 */
export function parseInterfaceDeclaration(
  ctx: ParserContext,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Default empty array parameter
  preAnnotations: readonly ParseTreeNode[] = [],
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Default empty array parameter
  preModifiers: readonly ParseTreeNode[] = []
): ParseTreeNode {
  // Use preAnnotations and preModifiers
  void preAnnotations;
  const singleIndexOffset = 1;
  const zeroIndex = 0;
  const start = ctx.current - singleIndexOffset;
  const modifiers: ParseTreeNode[] = [...preModifiers];

  // INTERFACE keyword was already consumed by match() in parseDeclaration()
  // So we don't need to consume it again
  ctx.skipWhitespaceAndComments();

  // Interface name
  const name = ctx.consume(TokenType.IDENTIFIER, 'Expected interface name');

  // Type parameters: <T, U extends Bound>
  const typeParameters = ctx.parseTypeParameters();

  // Extends clause (interfaces can extend other interfaces)
  const extendsList: ParseTreeNode[] = [];
  if (ctx.match(TokenType.EXTENDS)) {
    do {
      ctx.skipWhitespaceAndComments();
      const extendsType = ctx.parseType();
      if (extendsType) {
        extendsList.push(extendsType);
      } else {
        throw new Error('Expected type after extends');
      }
    } while (ctx.match(TokenType.COMMA));
  }

  // Skip whitespace before interface body
  ctx.skipWhitespaceAndComments();

  // Interface body
  const body = ctx.parseBlock(true);

  const children: ParseTreeNode[] = [];
  if (modifiers.length > zeroIndex) {
    children.push({ children: modifiers, type: 'modifiers' });
  }
  children.push({ location: ctx.locationToRange(name.location), text: name.text, type: 'name' });

  if (typeParameters.length > zeroIndex) {
    children.push({ children: typeParameters, type: 'type_parameters' });
  }
  if (extendsList.length > zeroIndex) {
    children.push({ children: extendsList, type: 'extends_clause' });
  }
  children.push(body);

  return {
    children,
    location: ctx.getLocation(start, ctx.current),
    type: 'interface_declaration',
  };
}

/**
 * Parses a trigger declaration from the token stream.
 * @param ctx - The parser context.
 * @returns The trigger declaration parse tree node.
 * @throws {Error} If the trigger declaration is malformed or unexpected tokens are encountered.
 */
export function parseTriggerDeclaration(ctx: ParserContext): ParseTreeNode {
  const singleIndexOffset = 1;
  const start = ctx.current - singleIndexOffset;
  // TRIGGER keyword was already consumed by match() in parseDeclaration()
  // So we don't need to consume it again
  ctx.skipWhitespaceAndComments();
  const name = ctx.consume(TokenType.IDENTIFIER, 'Expected trigger name');
  // ON is not a keyword in our lexer, so we'll check for identifier
  ctx.skipWhitespaceAndComments();
  const onToken = ctx.consume(TokenType.IDENTIFIER, 'Expected ON');
  if (onToken.text.toLowerCase() !== 'on') {
    throw new Error('Expected ON after trigger name');
  }
  ctx.skipWhitespaceAndComments();
  const objectName = ctx.consume(TokenType.IDENTIFIER, 'Expected object name');

  const events: ParseTreeNode[] = [];
  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.LEFT_PAREN, 'Expected (');
  ctx.skipWhitespaceAndComments();
  // Parse at least one event
  do {
    // Trigger events are two identifiers: "before update", "after delete", etc.
    const firstPart = ctx.consume(TokenType.IDENTIFIER, 'Expected trigger event');
    ctx.skipWhitespaceAndComments();
    let eventText = firstPart.text;
    // Check if there's a second identifier (e.g., "update", "delete", "insert")
    if (ctx.check(TokenType.IDENTIFIER)) {
      const secondPart = ctx.consume(TokenType.IDENTIFIER, 'Expected trigger event part');
      eventText += ' ' + secondPart.text;
      ctx.skipWhitespaceAndComments();
    }
    events.push({
      location: ctx.locationToRange(firstPart.location),
      text: eventText,
      type: 'trigger_event',
    });
    // Check for comma and skip whitespace if found
    if (ctx.match(TokenType.COMMA)) {
      ctx.skipWhitespaceAndComments();
    } else {
      break;
    }
  } while (true); // eslint-disable-line @typescript-eslint/no-unnecessary-condition -- Intentional infinite loop pattern
  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.RIGHT_PAREN, 'Expected )');

  ctx.skipWhitespaceAndComments();

  /**
   * Trigger bodies can contain class members like methods.
   * Parse as class body to handle method declarations.
   */
  const body = ctx.parseBlock(true);

  return {
    children: [
      { location: ctx.locationToRange(name.location), text: name.text, type: 'name' },
      {
        location: ctx.locationToRange(objectName.location),
        text: objectName.text,
        type: 'object_name',
      },
      { children: events, type: 'events' },
      body,
    ],
    location: ctx.getLocation(start, ctx.current),
    type: 'trigger_declaration',
  };
}

/**
 * Parses an enum declaration from the token stream.
 * @param ctx - The parser context.
 * @returns The enum declaration parse tree node.
 */
export function parseEnumDeclaration(
  ctx: ParserContext,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Default empty array parameter
  preAnnotations: readonly ParseTreeNode[] = [],
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Default empty array parameter
  preModifiers: readonly ParseTreeNode[] = []
): ParseTreeNode {
  // Use preAnnotations and preModifiers
  void preAnnotations;
  const singleIndexOffset = 1;
  const zeroIndex = 0;
  const start = ctx.current - singleIndexOffset;
  const modifiers: ParseTreeNode[] = [...preModifiers];

  // ENUM keyword was already consumed by match() in parseDeclaration()
  // So we don't need to consume it again
  ctx.skipWhitespaceAndComments();

  const name = ctx.consume(TokenType.IDENTIFIER, 'Expected enum name');

  // Parse enum body with constants
  const enumBodyStart = ctx.current;
  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.LEFT_BRACE, 'Expected { after enum name');

  const constants: ParseTreeNode[] = [];
  ctx.skipWhitespaceAndComments();

  // Parse enum constants (can be empty)
  while (!ctx.check(TokenType.RIGHT_BRACE) && !ctx.isAtEnd()) {
    const beforeConstant = ctx.current;
    const constant = ctx.parseEnumConstant();
    if (constant) {
      constants.push(constant);
      ctx.skipWhitespaceAndComments();
      if (ctx.match(TokenType.COMMA)) {
        ctx.skipWhitespaceAndComments();
      } else if (!ctx.check(TokenType.RIGHT_BRACE)) {
        // Safety check: ensure we always advance if we didn't match comma or brace
        if (ctx.current === beforeConstant && !ctx.isAtEnd()) {
          ctx.advance();
        } else {
          break;
        }
      }
    } else {
      // If we can't parse a constant, break
      // Safety check: ensure we always advance if we didn't parse anything
      if (ctx.current === beforeConstant && !ctx.isAtEnd()) {
        ctx.advance();
      } else {
        break;
      }
    }
    ctx.skipWhitespaceAndComments();
  }

  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.RIGHT_BRACE, 'Expected } after enum');

  const body = {
    children: constants,
    location: ctx.getLocation(enumBodyStart, ctx.current),
    type: 'block',
  };

  const children: ParseTreeNode[] = [];
  if (preAnnotations.length > zeroIndex) {
    children.push({ children: [...preAnnotations], type: 'annotations' });
  }
  if (modifiers.length > zeroIndex) {
    children.push({ children: modifiers, type: 'modifiers' });
  }
  children.push({ location: ctx.locationToRange(name.location), text: name.text, type: 'name' });
  children.push(body);

  return {
    children,
    location: ctx.getLocation(start, ctx.current),
    type: 'enum_declaration',
  };
}

/**
 * Parse type parameters: <T, U extends Bound>.
 * @param ctx - The parser context.
 * @returns Array of type parameter parse tree nodes.
 */
export function parseTypeParameters(ctx: ParserContext): ParseTreeNode[] {
  ctx.skipWhitespaceAndComments();
  if (!ctx.match(TokenType.LESS_THAN)) {
    return [];
  }

  const typeParams: ParseTreeNode[] = [];
  do {
    const param = parseTypeParameter(ctx);
    if (param) {
      typeParams.push(param);
    }
  } while (ctx.match(TokenType.COMMA));

  ctx.consume(TokenType.GREATER_THAN, 'Expected > after type parameters');
  return typeParams;
}

/**
 * Parse a single type parameter: T or T extends Bound.
 * @param ctx - The parser context.
 * @returns The parsed type parameter parse tree node, or null if parsing fails.
 */
export function parseTypeParameter(ctx: ParserContext): ParseTreeNode | null {
  const start = ctx.current;
  const name = ctx.consume(TokenType.IDENTIFIER, 'Expected type parameter name');

  let extendsBound: ParseTreeNode | undefined = undefined;
  if (ctx.match(TokenType.EXTENDS)) {
    const bound = ctx.parseType();
    if (bound) {
      extendsBound = bound;
    }
  }

  const children: ParseTreeNode[] = [
    { location: ctx.locationToRange(name.location), text: name.text, type: 'name' },
  ];
  if (extendsBound) {
    children.push(extendsBound);
  }

  return {
    children,
    location: ctx.getLocation(start, ctx.current),
    type: 'type_parameter',
  };
}

/**
 * Parse type (supports arrays, generics, qualified types, etc.).
 * @param ctx - The parser context.
 * @returns The parsed type parse tree node, or null if parsing fails.
 */
export function parseType(ctx: ParserContext): ParseTreeNode | null {
  ctx.skipWhitespaceAndComments();
  if (!checkType(ctx)) {
    return null;
  }

  const zeroIndex = 0;
  const start = ctx.current;

  /**
   * Consume the type token (INTEGER, STRING, IDENTIFIER, etc.).
   */
  const baseType = ctx.advance();

  // Parse qualified type parts (e.g., A.B.C.D)
  let qualifiedName = baseType.text;
  while (ctx.match(TokenType.DOT)) {
    ctx.skipWhitespaceAndComments();
    if (ctx.check(TokenType.IDENTIFIER)) {
      const nextPart = ctx.advance();
      qualifiedName += '.' + nextPart.text;
    } else {
      // If we can't parse the next part, break
      break;
    }
  }

  // Parse generic type parameters
  let typeArguments: ParseTreeNode[] | undefined = undefined;
  if (ctx.match(TokenType.LESS_THAN)) {
    typeArguments = [];
    ctx.skipWhitespaceAndComments();
    // Parse at least one type argument
    const firstTypeArg = ctx.parseType();
    if (!firstTypeArg) {
      // If we can't parse the first type argument, we still need to consume the >
      // This handles malformed generics gracefully
      ctx.skipWhitespaceAndComments();
      ctx.consume(TokenType.GREATER_THAN, 'Expected > after <');
      // Return type with empty type arguments
    } else {
      typeArguments.push(firstTypeArg);
      // Parse additional type arguments separated by commas
      while (ctx.match(TokenType.COMMA)) {
        ctx.skipWhitespaceAndComments();
        const typeArg = ctx.parseType();
        if (typeArg) {
          typeArguments.push(typeArg);
        } else {
          // If we can't parse a type argument after comma, break
          break;
        }
      }
      // Always consume the closing >
      ctx.skipWhitespaceAndComments();
      ctx.consume(TokenType.GREATER_THAN, 'Expected > after type arguments');
    }
  }

  // Parse array brackets (only empty brackets [] for array dimensions)
  // Don't consume [size] - that's handled by the caller (e.g., new Type[size])
  const initialArrayDimensions = 0;
  let arrayDimensions = initialArrayDimensions;
  while (ctx.check(TokenType.LEFT_BRACKET)) {
    // Peek ahead to see if it's empty brackets [] or [size]
    const savedPos = ctx.current;
    ctx.advance(); // Consume [
    ctx.skipWhitespaceAndComments();
    if (ctx.check(TokenType.RIGHT_BRACKET)) {
      // Empty brackets - consume ]
      ctx.advance(); // Consume ]
      arrayDimensions++;
    } else {
      // Not an empty bracket, it's [size] - don't consume, let caller handle it
      // Back up to before the [
      ctx.current = savedPos;
      break;
    }
  }

  const children: ParseTreeNode[] = [
    { location: ctx.locationToRange(baseType.location), text: qualifiedName, type: 'base_type' },
  ];

  if (typeArguments !== undefined && typeArguments.length > zeroIndex) {
    children.push({ children: typeArguments, type: 'type_arguments' });
  }

  if (arrayDimensions > zeroIndex) {
    children.push({ text: arrayDimensions.toString(), type: 'array_dimensions' });
  }

  return {
    children,
    location: ctx.getLocation(start, ctx.current),
    type: 'type',
  };
}

/**
 * Check if current token is a type.
 * @param ctx - The parser context.
 * @returns True if the current token represents a type.
 */
export function checkType(ctx: ParserContext): boolean {
  return ctx.check(
    TokenType.INTEGER,
    TokenType.STRING,
    TokenType.BOOLEAN,
    TokenType.DECIMAL,
    TokenType.DOUBLE,
    TokenType.LONG,
    TokenType.DATE,
    TokenType.DATETIME,
    TokenType.TIME,
    TokenType.BLOB,
    TokenType.ID,
    TokenType.OBJECT,
    TokenType.VOID,
    TokenType.IDENTIFIER
  );
}
// ============================================================================
// Annotation Parsing
// ============================================================================
/**
 * Parse annotation type declaration: `@interface` Name { members }.
 * @param ctx - The parser context.
 * @returns The annotation declaration parse tree node.
 */
export function parseAnnotationDeclaration(ctx: ParserContext): ParseTreeNode {
  /**
   * Start at @.
   */
  const annotationStartOffset = 2;
  const zeroIndex = 0;
  const start = ctx.current - annotationStartOffset;
  const modifiers: ParseTreeNode[] = [];

  // Parse modifiers (public, global, etc.)
  while (ctx.match(TokenType.PUBLIC, TokenType.PRIVATE, TokenType.GLOBAL)) {
    const prevToken = ctx.previous();
    modifiers.push({
      location: ctx.locationToRange(prevToken.location),
      text: prevToken.text,
      type: 'modifier',
    });
    ctx.skipWhitespaceAndComments();
  }

  // Annotation type name
  const name = ctx.consume(TokenType.IDENTIFIER, 'Expected annotation type name');

  // Annotation type body
  ctx.consume(TokenType.LEFT_BRACE, 'Expected { after annotation type name');

  const members: ParseTreeNode[] = [];
  ctx.skipWhitespaceAndComments();

  while (!ctx.check(TokenType.RIGHT_BRACE) && !ctx.isAtEnd()) {
    const beforeMember = ctx.current;
    const member = parseAnnotationMember(ctx);
    if (member) {
      members.push(member);
    }
    // Safety check: ensure we always advance
    if (ctx.current === beforeMember && !ctx.isAtEnd()) {
      ctx.advance();
    }
    ctx.skipWhitespaceAndComments();
  }

  ctx.consume(TokenType.RIGHT_BRACE, 'Expected } after annotation type body');

  const children: ParseTreeNode[] = [];
  if (modifiers.length > zeroIndex) {
    children.push({ children: modifiers, type: 'modifiers' });
  }
  children.push({ location: ctx.locationToRange(name.location), text: name.text, type: 'name' });
  if (members.length > zeroIndex) {
    children.push({ children: members, type: 'members' });
  }

  return {
    children,
    location: ctx.getLocation(start, ctx.current),
    type: 'annotation_declaration',
  };
}

/**
 * Parse annotation member (method-like but simpler)
 * Example: String value(); or Integer count() default 0;.
 * @param ctx - The parser context.
 * @returns The parsed annotation member node, or null if parsing fails.
 */
export function parseAnnotationMember(ctx: ParserContext): ParseTreeNode | null {
  const start = ctx.current;

  // Parse return type
  const returnType = ctx.parseType();
  if (!returnType) {
    return null;
  }

  // Member name
  const name = ctx.consume(TokenType.IDENTIFIER, 'Expected annotation member name');

  // Parameters (empty parentheses)
  ctx.consume(TokenType.LEFT_PAREN, 'Expected ( after annotation member name');
  ctx.consume(TokenType.RIGHT_PAREN, 'Expected ) after annotation member parameters');

  // Optional default value
  let defaultValue: ParseTreeNode | undefined = undefined;
  if (ctx.match(TokenType.IDENTIFIER)) {
    const defaultKeyword = ctx.previous();
    if (defaultKeyword.text.toLowerCase() === 'default') {
      const expr = ctx.parseExpression();
      if (expr != null) {
        defaultValue = {
          children: [expr],
          location: expr.location ?? undefined,
          type: 'defaultValue',
        };
      }
    } else {
      // Not 'default', reset
      ctx.current--;
    }
  }

  // Semicolon
  ctx.consume(TokenType.SEMICOLON, 'Expected ; after annotation member');

  const children: ParseTreeNode[] = [
    returnType,
    { location: ctx.locationToRange(name.location), text: name.text, type: 'name' },
  ];
  if (defaultValue) {
    children.push(defaultValue);
  }

  return {
    children,
    location: ctx.getLocation(start, ctx.current),
    type: 'annotation_member',
  };
}

/**
 * Parses an annotation from the token stream.
 * @param ctx - The parser context.
 * @returns The parsed annotation node, or null if parsing fails.
 */
export function parseAnnotation(ctx: ParserContext): ParseTreeNode | null {
  const singleIndexOffset = 1;
  const zeroIndex = 0;
  const start = ctx.current - singleIndexOffset;
  const name = ctx.consume(TokenType.IDENTIFIER, 'Expected annotation name');

  let arguments_: ParseTreeNode[] = [];
  if (ctx.match(TokenType.LEFT_PAREN)) {
    if (!ctx.check(TokenType.RIGHT_PAREN)) {
      // Parse first argument
      const firstArg = parseAnnotationArgument(ctx);
      if (firstArg) {
        arguments_.push(firstArg);
      }

      // Parse additional arguments (can be separated by comma or whitespace for named args)
      while (!ctx.check(TokenType.RIGHT_PAREN)) {
        ctx.skipWhitespaceAndComments();

        // Check if there's a comma (explicit separator)
        if (ctx.match(TokenType.COMMA)) {
          ctx.skipWhitespaceAndComments();
        } else {
          // For named arguments, whitespace can separate them
          // Check if next token is an identifier followed by = (named argument)
          const peekOffset = 1;
          const peekToken = ctx.peek(peekOffset);
          if (!(ctx.check(TokenType.IDENTIFIER) && peekToken.type === TokenType.ASSIGN)) {
            // Not a named argument, must be end of arguments
            break;
          }
        }

        // If we're at the end, break
        if (ctx.check(TokenType.RIGHT_PAREN)) {
          break;
        }

        const arg = parseAnnotationArgument(ctx);
        if (arg) {
          arguments_.push(arg);
        } else {
          // Failed to parse argument, break to avoid infinite loop
          break;
        }
      }
    }
    ctx.consume(TokenType.RIGHT_PAREN, 'Expected ) after annotation arguments');
  }

  const children: ParseTreeNode[] = [
    { location: ctx.locationToRange(name.location), text: name.text, type: 'name' },
  ];
  if (arguments_.length > zeroIndex) {
    children.push({ children: arguments_, type: 'arguments' });
  }

  return {
    children,
    location: ctx.getLocation(start, ctx.current),
    type: 'annotation',
  };
}

/**
 * Parses an annotation argument from the token stream.
 * @param ctx - The parser context.
 * @returns The parsed annotation argument node, or null if parsing fails.
 */
export function parseAnnotationArgument(ctx: ParserContext): ParseTreeNode | null {
  const start = ctx.current;

  // Could be name = value or just value
  let name:
    | { location: { line: number; column: number }; text: string; type: TokenType }
    | undefined = undefined;
  // Check for named argument: peek past whitespace to find ASSIGN
  let nextNonWhitespaceOffset = 1;
  const maxWhitespacePeekOffset = 5;
  while (nextNonWhitespaceOffset < maxWhitespacePeekOffset) {
    const peekedToken = ctx.peek(nextNonWhitespaceOffset);
    if (
      peekedToken.type !== TokenType.WHITESPACE &&
      peekedToken.type !== TokenType.NEWLINE &&
      peekedToken.type !== TokenType.LINE_COMMENT &&
      peekedToken.type !== TokenType.BLOCK_COMMENT
    ) {
      break;
    }
    nextNonWhitespaceOffset++;
  }
  const nextNonWhitespaceToken = ctx.peek(nextNonWhitespaceOffset);
  if (ctx.check(TokenType.IDENTIFIER) && nextNonWhitespaceToken.type === TokenType.ASSIGN) {
    name = ctx.consume(TokenType.IDENTIFIER, 'Expected argument name');
    // Skip whitespace before ASSIGN
    while (
      ctx.check(TokenType.WHITESPACE) ||
      ctx.check(TokenType.NEWLINE) ||
      ctx.check(TokenType.LINE_COMMENT) ||
      ctx.check(TokenType.BLOCK_COMMENT)
    ) {
      ctx.advance();
    }
    ctx.consume(TokenType.ASSIGN, 'Expected =');
    ctx.skipWhitespaceAndComments();
  }

  // Check for annotation expression: @X
  let value: ParseTreeNode | null = null;
  if (ctx.check(TokenType.AT)) {
    // Parse annotation expression (annotation as a value)
    ctx.advance(); // Consume @
    const annotation = parseAnnotation(ctx);
    if (annotation) {
      value = {
        children: [annotation],
        location: annotation.location,
        type: 'annotation_expression',
      };
    }
  } else if (ctx.check(TokenType.LEFT_BRACE)) {
    // Parse array initializer: {1, 2, 3} or {@Y, @Z}
    /**
     * Position before consuming {.
     */
    const arrayStart = ctx.current;
    ctx.advance(); // Consume {
    const elements: ParseTreeNode[] = [];
    if (!ctx.check(TokenType.RIGHT_BRACE)) {
      do {
        ctx.skipWhitespaceAndComments();
        // Array elements can be expressions or annotation expressions
        let element: ParseTreeNode | null = null;
        if (ctx.check(TokenType.AT)) {
          // Annotation expression in array
          ctx.advance(); // Consume @
          const annotation = parseAnnotation(ctx);
          if (annotation) {
            element = {
              children: [annotation],
              location: annotation.location,
              type: 'annotation_expression',
            };
          }
        } else {
          // Regular expression
          element = ctx.parseExpression();
        }
        if (element) {
          elements.push(element);
        } else {
          // Failed to parse element, break to avoid infinite loop
          break;
        }
        ctx.skipWhitespaceAndComments();
      } while (ctx.match(TokenType.COMMA));
    }
    ctx.consume(TokenType.RIGHT_BRACE, 'Expected } after array initializer');

    // Create a new_expression with values_initializer for the array
    value = {
      children: [
        {
          children: elements,
          location: ctx.getLocation(arrayStart, ctx.current),
          type: 'values_initializer',
        },
      ],
      location: ctx.getLocation(arrayStart, ctx.current),
      type: 'new_expression',
    };
  } else {
    // Regular expression
    value = ctx.parseExpression();
  }

  if (!value) {
    return null;
  }

  const children: ParseTreeNode[] = [value];
  if (name) {
    children.unshift({
      location: ctx.locationToRange(name.location),
      text: name.text,
      type: 'name',
    });
  }

  return {
    children,
    location: ctx.getLocation(start, ctx.current),
    type: 'annotation_argument',
  };
}

/**
 * Parses an enum constant from the token stream.
 * @param ctx - The parser context.
 * @returns The parsed enum constant node, or null if parsing fails.
 */
export function parseEnumConstant(ctx: ParserContext): ParseTreeNode | null {
  const start = ctx.current;
  // Enum constants can be IDENTIFIER or ID (keyword)
  if (!ctx.check(TokenType.IDENTIFIER) && !ctx.check(TokenType.ID)) {
    return null;
  }

  /**
   * Consume IDENTIFIER or ID.
   */
  const name = ctx.advance();

  let value: ParseTreeNode | undefined = undefined;
  if (ctx.match(TokenType.ASSIGN)) {
    const expr = ctx.parseExpression();
    value = expr ?? undefined;
  }

  const children: ParseTreeNode[] = [
    { location: ctx.locationToRange(name.location), text: name.text, type: 'name' },
  ];
  if (value) {
    children.push(value);
  }

  return {
    children,
    location: ctx.getLocation(start, ctx.current),
    type: 'enum_constant',
  };
}
// ============================================================================
// Class Declaration
// ============================================================================
// ============================================================================
// Class Declaration
// ============================================================================

/**
 * Parses a class declaration from the token stream.
 * @param ctx - The parser context.
 * @param annotations - Annotations that were parsed before the class keyword.
 * @param preModifiers - Modifiers that were parsed before the class keyword.
 * @returns The class declaration parse tree node.
 * @throws {Error} If the class declaration is malformed or unexpected tokens are encountered.
 */
export function parseClassDeclaration(
  ctx: ParserContext,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Default empty array parameter
  annotations: readonly ParseTreeNode[] = [],
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Default empty array parameter
  preModifiers: readonly ParseTreeNode[] = []
): ParseTreeNode {
  const singleIndexOffset = 1;
  const zeroIndex = 0;
  const start = ctx.current - singleIndexOffset;
  const modifiers: ParseTreeNode[] = [...preModifiers];

  // CLASS keyword was already consumed by match() in parseDeclaration()
  // So we don't need to consume it again
  ctx.skipWhitespaceAndComments();

  // Class name
  const name = ctx.consume(TokenType.IDENTIFIER, 'Expected class name');

  // Type parameters: <T, U extends Bound>
  const typeParameters = ctx.parseTypeParameters();

  // Extends clause
  ctx.skipWhitespaceAndComments();
  let extendsClause: ParseTreeNode | undefined = undefined;
  if (ctx.match(TokenType.EXTENDS)) {
    ctx.skipWhitespaceAndComments();
    const extendsType = ctx.parseType();
    if (extendsType) {
      extendsClause = {
        children: [extendsType],
        location: ctx.getLocation(start, ctx.current),
        type: 'extends_clause',
      };
    } else {
      throw new Error('Expected type after extends');
    }
  }

  // Implements clause
  const implementsList: ParseTreeNode[] = [];
  if (ctx.match(TokenType.IMPLEMENTS)) {
    do {
      ctx.skipWhitespaceAndComments();
      const implType = ctx.parseType();
      if (implType) {
        implementsList.push(implType);
      } else {
        throw new Error('Expected type after implements');
      }
    } while (ctx.match(TokenType.COMMA));
  }

  // Skip whitespace before class body
  ctx.skipWhitespaceAndComments();

  // Class body
  const body = ctx.parseBlock(true);

  const children: ParseTreeNode[] = [];
  if (annotations.length > zeroIndex) {
    children.push({ children: [...annotations], type: 'annotations' });
  }
  if (modifiers.length > zeroIndex) {
    children.push({ children: [...modifiers], type: 'modifiers' });
  }
  children.push({ location: ctx.locationToRange(name.location), text: name.text, type: 'name' });

  if (typeParameters.length > zeroIndex) {
    children.push({ children: typeParameters, type: 'type_parameters' });
  }
  if (extendsClause != null) {
    children.push(extendsClause);
  }
  if (implementsList.length > zeroIndex) {
    children.push({ children: implementsList, type: 'implements_clause' });
  }
  children.push(body);

  return {
    children,
    location: ctx.getLocation(start, ctx.current),
    type: 'class_declaration',
  };
}

// ============================================================================
// Class Member Parsing
// ============================================================================

/**
 * Parse a class member (method, field, property, initializer block).
 * @param ctx - The parser context.
 * @returns The parsed class member node, or null if parsing fails.
 */
export function parseClassMember(ctx: ParserContext): ParseTreeNode | null {
  ctx.skipWhitespaceAndComments();

  // Collect annotations
  const annotations: ParseTreeNode[] = [];
  while (ctx.match(TokenType.AT)) {
    const annotation = ctx.parseAnnotation();
    if (annotation) {
      annotations.push(annotation);
    }
    ctx.skipWhitespaceAndComments();
  }

  // Parse modifiers
  const modifiers: ParseTreeNode[] = [];
  const singleIndexOffset = 1;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Infinite loop pattern
  while (true) {
    let modifierText: string | null = null;
    let modifierStart: number | null = null;

    if (
      ctx.match(
        TokenType.PUBLIC,
        TokenType.PRIVATE,
        TokenType.PROTECTED,
        TokenType.GLOBAL,
        TokenType.STATIC,
        TokenType.FINAL,
        TokenType.ABSTRACT,
        TokenType.OVERRIDE,
        TokenType.VIRTUAL,
        TokenType.TESTMETHOD,
        TokenType.WEBSERVICE,
        TokenType.TRANSIENT
      )
    ) {
      const prevToken = ctx.tokens[ctx.current - singleIndexOffset];
      modifierText = prevToken.text;
      modifierStart = ctx.current - singleIndexOffset;
    } else {
      break;
    }

    if (modifierText !== null && modifierStart !== null) {
      modifiers.push({
        location: ctx.getLocation(modifierStart, ctx.current),
        text: modifierText,
        type: 'modifier',
      });
      ctx.skipWhitespaceAndComments();
    } else {
      break;
    }
  }

  // Check for static/instance initializer block: { ... }
  if (ctx.check(TokenType.LEFT_BRACE)) {
    const start = ctx.current;
    const block = ctx.parseBlock();
    return {
      children: [
        ...(modifiers.length > 0 ? [{ children: modifiers, type: 'modifiers' }] : []),
        block,
      ],
      location: ctx.getLocation(start, ctx.current),
      type: 'initializer_block',
    };
  }

  // Check for inner class/interface/enum declarations
  // These need to be checked before trying to parse a type
  if (ctx.match(TokenType.CLASS)) {
    // parseClassDeclaration expects CLASS to be consumed (which we just did with match)
    // and accepts pre-parsed modifiers and annotations
    return parseClassDeclaration(ctx, annotations, modifiers);
  }
  if (ctx.match(TokenType.INTERFACE)) {
    // parseInterfaceDeclaration expects INTERFACE to be consumed (which we just did with match)
    // and accepts pre-parsed modifiers and annotations
    return parseInterfaceDeclaration(ctx, annotations, modifiers);
  }
  if (ctx.match(TokenType.ENUM)) {
    // parseEnumDeclaration expects ENUM to be consumed (which we just did with match)
    // and accepts pre-parsed modifiers and annotations
    return parseEnumDeclaration(ctx, annotations, modifiers);
  }

  // Parse type (for methods, fields, properties)
  // For constructors, the type name is the constructor name, so we need to save it
  const typeStart = ctx.current;
  let savedTypeName: string | null = null;
  let savedTypeLocation:
    | { start: { line: number; column: number }; end: { line: number; column: number } }
    | undefined = undefined;

  // Peek ahead to see if this might be a constructor (type followed by '(')
  if (ctx.check(TokenType.IDENTIFIER)) {
    const peekToken = ctx.tokens[ctx.current];
    savedTypeName = peekToken.text;
    savedTypeLocation = ctx.locationToRange(peekToken.location);
  }

  // Save position before parseType in case it fails but advances
  const beforeTypeParse = ctx.current;
  const type = ctx.parseType();
  if (!type) {
    // parseType() may have advanced past whitespace or partially parsed tokens
    // Restore position to before the type parse attempt
    ctx.current = beforeTypeParse;
    return null;
  }

  ctx.skipWhitespaceAndComments();

  // Check if it's a constructor (type followed by '(' instead of identifier)
  if (ctx.check(TokenType.LEFT_PAREN)) {
    // Extract the type name to check if it's qualified
    let typeName = savedTypeName;
    if (!typeName) {
      // Try to get the type name from the type node
      // Access children directly since we're in the parser, not translator
      const children = type.children ?? [];
      const baseTypeNode = children.find((c) => c.type === 'base_type');
      if (baseTypeNode) {
        typeName = baseTypeNode.text ?? (baseTypeNode as { text?: string }).text ?? null;
      }
      if (!typeName) {
        const typeNameNode =
          children.find((c) => c.type === 'name') ?? children.find((c) => c.type === 'identifier');
        typeName = typeNameNode
          ? (typeNameNode.text ??
            (typeNameNode as { name?: string }).name ??
            'Unknown')
          : 'Unknown';
      }
    }
    // If the type is qualified (contains a dot), it's not a constructor
    // Qualified types like "System.debug" are method calls, not constructors
    // Also check the type node's text property directly
    const typeText = type.text ?? (type.children?.[0] as { text?: string })?.text;
    const isQualified =
      (typeName && typeName.includes('.')) || (typeText && typeText.includes('.'));
    if (isQualified) {
      // This is not a constructor, restore position and return null
      // so it can be parsed as a statement
      ctx.current = beforeTypeParse;
      return null;
    }
    // This is a constructor - use the saved type name
    if (!savedTypeName || !savedTypeLocation) {
      // Fallback: try to extract from type node
      // Access children directly since we're in the parser, not translator
      const children = type.children ?? [];
      const typeNameNode =
        children.find((c) => c.type === 'name') ?? children.find((c) => c.type === 'identifier');
      savedTypeName = typeNameNode
        ? (typeNameNode.text ?? (typeNameNode as { name?: string }).name ?? 'Unknown')
        : 'Unknown';
      savedTypeLocation = type.location;
    }
    // Create a token-like object for the constructor name
    const nameToken: Token = {
      location: savedTypeLocation
        ? {
            line: savedTypeLocation.start.line,
            column: savedTypeLocation.start.column,
          }
        : (type.location?.start ?? { line: 1, column: 1 }),
      text: savedTypeName ?? 'Unknown',
      type: TokenType.IDENTIFIER,
    };
    // For constructors, create a void_type node instead of using the type node
    // This allows the translator to correctly identify it as a constructor
    const voidTypeNode: ParseTreeNode = {
      children: [],
      location: type.location,
      type: 'void_type',
    };
    return parseMethodOrConstructor(ctx, nameToken, modifiers, annotations, voidTypeNode);
  }

  // Check if it's a property (has { after name)
  if (ctx.check(TokenType.IDENTIFIER)) {
    const name = ctx.consume(TokenType.IDENTIFIER, 'Expected member name');
    ctx.skipWhitespaceAndComments();

    if (ctx.check(TokenType.LEFT_BRACE)) {
      // Property declaration
      return parsePropertyDeclaration(ctx, name, modifiers, annotations, type);
    } else if (ctx.check(TokenType.LEFT_PAREN)) {
      // Method/constructor
      return parseMethodOrConstructor(ctx, name, modifiers, annotations, type);
    } else {
      // Field declaration
      return parseFieldDeclaration(ctx, name, modifiers, annotations, type, typeStart);
    }
  }

  return null;
}

// ============================================================================
// Member Parsing
// ============================================================================

/**
 * Parse method or constructor declaration.
 * @param ctx - The parser context.
 * @param name - The method/constructor name token.
 * @param modifiers - Array of modifier parse tree nodes.
 * @param annotations - Array of annotation parse tree nodes.
 * @param returnType - The return type parse tree node.
 * @returns The method or constructor declaration parse tree node.
 */
// eslint-disable-next-line @typescript-eslint/max-params -- Method parsing requires 4 parameters
export function parseMethodOrConstructor(
  ctx: ParserContext,
  name: Readonly<Token>,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameters are already readonly
  modifiers: readonly ParseTreeNode[],
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameters are already readonly
  annotations: readonly ParseTreeNode[],
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameters are already readonly
  returnType: Readonly<ParseTreeNode>
): ParseTreeNode {
  const singleIndexOffset = 1;
  const zeroIndex = 0;
  const start = ctx.current - singleIndexOffset;

  // Type parameters: <T, U extends Bound>
  const typeParameters = ctx.parseTypeParameters();

  ctx.consume(TokenType.LEFT_PAREN, 'Expected ( after method name');

  // Parse parameters
  const parameters: ParseTreeNode[] = [];
  if (!ctx.check(TokenType.RIGHT_PAREN)) {
    do {
      const param = ctx.parseParameter();
      if (param) {
        parameters.push(param);
      }
    } while (ctx.match(TokenType.COMMA));
  }
  ctx.consume(TokenType.RIGHT_PAREN, 'Expected ) after parameters');

  // Parse throws clause (if present) - in Apex, this is typically not used but we support it
  const throwsList: ParseTreeNode[] = [];
  // Note: Apex doesn't have checked exceptions, but we parse it for compatibility
  if (ctx.check(TokenType.IDENTIFIER)) {
    const nextToken = ctx.peek();
    if (nextToken.text.toLowerCase() === 'throws') {
      ctx.advance(); // Skip 'throws'
      do {
        const throwType = ctx.parseType();
        if (throwType) {
          throwsList.push(throwType);
        }
      } while (ctx.match(TokenType.COMMA));
    }
  }

  // Parse body (may be abstract/interface method with no body)
  ctx.skipWhitespaceAndComments();
  let body: ParseTreeNode | undefined = undefined;
  if (ctx.check(TokenType.LEFT_BRACE)) {
    body = ctx.parseBlock();
  } else if (ctx.check(TokenType.SEMICOLON)) {
    ctx.consume(TokenType.SEMICOLON, 'Expected ; or {');
  }

  const children: ParseTreeNode[] = [];

  if (annotations.length > zeroIndex) {
    children.push({ children: [...annotations], type: 'annotations' });
  }

  if (modifiers.length > zeroIndex) {
    children.push({ children: [...modifiers], type: 'modifiers' });
  }
  children.push(returnType);
  children.push({ location: ctx.locationToRange(name.location), text: name.text, type: 'name' });

  if (typeParameters.length > zeroIndex) {
    children.push({ children: typeParameters, type: 'type_parameters' });
  }
  if (parameters.length > zeroIndex) {
    children.push({ children: parameters, type: 'parameters' });
  }
  if (throwsList.length > zeroIndex) {
    children.push({ children: throwsList, type: 'throws_clause' });
  }
  if (body) {
    children.push(body);
  }

  // Check if it's a constructor
  // In Apex, constructors don't have a return type, but we check if the name matches the class
  // For now, we'll check if returnType is the same as name (constructor) or if it's explicitly void
  // This is a heuristic - in practice, we'd need class context
  const firstChild =
    returnType.children !== undefined && returnType.children.length > zeroIndex
      ? returnType.children[zeroIndex]
      : undefined;
  const isConstructor =
    (firstChild != null && (firstChild as { text?: string }).text === name.text) ||
    (returnType.text != null && returnType.text === name.text);

  return {
    children,
    location: ctx.getLocation(start, ctx.current),
    type: isConstructor ? 'constructor_declaration' : 'method_declaration',
  };
}

/**
 * Parse parameter declaration.
 * @param ctx - The parser context.
 * @returns The parsed parameter node, or null if parsing fails.
 * @throws {Error} If the parameter declaration is malformed or unexpected tokens are encountered.
 */
export function parseParameter(ctx: ParserContext): ParseTreeNode | null {
  const zeroIndex = 0;
  const start = ctx.current;
  const modifiers: ParseTreeNode[] = [];

  // Parse parameter modifiers (final, etc.)
  while (ctx.match(TokenType.FINAL)) {
    const prevToken = ctx.previous();
    modifiers.push({
      location: ctx.locationToRange(prevToken.location),
      text: prevToken.text,
      type: 'modifier',
    });
  }

  const type = ctx.parseType();
  if (!type) {
    return null;
  }

  // Skip whitespace before parameter name (e.g., "String [] input")
  ctx.skipWhitespaceAndComments();
  const name = ctx.consume(TokenType.IDENTIFIER, 'Expected parameter name');

  const children: ParseTreeNode[] = [];
  if (modifiers.length > zeroIndex) {
    children.push({ children: modifiers, type: 'modifiers' });
  }
  children.push(type);
  children.push({ location: ctx.locationToRange(name.location), text: name.text, type: 'name' });

  return {
    children,
    location: ctx.getLocation(start, ctx.current),
    type: 'parameter',
  };
}

/**
 * Parse property declaration (with getter/setter).
 * @param ctx - The parser context.
 * @param name - The property name token.
 * @param modifiers - Array of modifier parse tree nodes.
 * @param annotations - Array of annotation parse tree nodes.
 * @param type - The property type parse tree node.
 * @returns The property declaration parse tree node.
 */
// eslint-disable-next-line @typescript-eslint/max-params -- Property parsing requires 4 parameters
export function parsePropertyDeclaration(
  ctx: ParserContext,
  name: Readonly<Token>,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameters are already readonly
  modifiers: readonly ParseTreeNode[],
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameters are already readonly
  annotations: readonly ParseTreeNode[],
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameters are already readonly
  type: Readonly<ParseTreeNode>
): ParseTreeNode {
  const singleIndexOffset = 1;
  const zeroIndex = 0;
  const start = ctx.current - singleIndexOffset;
  ctx.consume(TokenType.LEFT_BRACE, 'Expected { for property');

  const getter: ParseTreeNode[] = [];
  const setter: ParseTreeNode[] = [];

  ctx.skipWhitespaceAndComments();

  // Parse getter
  const peekToken = ctx.peek();

  if (ctx.check(TokenType.IDENTIFIER) && peekToken.text.toLowerCase() === 'get') {
    ctx.advance(); // Consume 'get'
    ctx.skipWhitespaceAndComments();
    if (ctx.check(TokenType.LEFT_BRACE)) {
      const getBody = ctx.parseBlock();
      getter.push(getBody);
    } else {
      ctx.consume(TokenType.SEMICOLON, 'Expected ; or { after get');
    }
    ctx.skipWhitespaceAndComments();
  }

  // Parse setter
  const setterPeekToken = ctx.peek();

  if (ctx.check(TokenType.IDENTIFIER) && setterPeekToken.text.toLowerCase() === 'set') {
    ctx.advance(); // Consume 'set'
    ctx.skipWhitespaceAndComments();
    if (ctx.check(TokenType.LEFT_BRACE)) {
      const setBody = ctx.parseBlock();
      setter.push(setBody);
    } else {
      ctx.consume(TokenType.SEMICOLON, 'Expected ; or { after set');
    }
    ctx.skipWhitespaceAndComments();
  }

  ctx.consume(TokenType.RIGHT_BRACE, 'Expected } after property');

  const children: ParseTreeNode[] = [];

  if (annotations.length > zeroIndex) {
    children.push({ children: [...annotations], type: 'annotations' });
  }

  if (modifiers.length > zeroIndex) {
    children.push({ children: [...modifiers], type: 'modifiers' });
  }
  children.push(type);
  children.push({ location: ctx.locationToRange(name.location), text: name.text, type: 'name' });
  if (getter.length > zeroIndex) {
    children.push({ children: getter, type: 'getter' });
  }
  if (setter.length > zeroIndex) {
    children.push({ children: setter, type: 'setter' });
  }

  return {
    children,
    location: ctx.getLocation(start, ctx.current),
    type: 'property_declaration',
  };
}

/**
 * Parses a field declaration from the token stream.
 * @param ctx - The parser context.
 * @param name - The field name token.
 * @param modifiers - Array of modifier parse tree nodes.
 * @param annotations - Array of annotation parse tree nodes.
 * @param type - The field type parse tree node.
 * @param start - Optional start position for location tracking.
 * @returns The field declaration parse tree node.
 */
// eslint-disable-next-line @typescript-eslint/max-params -- Field parsing requires 5 parameters
export function parseFieldDeclaration(
  ctx: ParserContext,
  name: Readonly<Token>,
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameters are already readonly
  modifiers: readonly ParseTreeNode[],
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameters are already readonly
  annotations: readonly ParseTreeNode[],
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameters are already readonly
  type: Readonly<ParseTreeNode>,
  start?: number
): ParseTreeNode {
  const singleIndexOffset = 1;
  const zeroIndex = 0;
  // Use provided start position (from before type parsing) or current position
  const fieldStart = start ?? ctx.current - singleIndexOffset;

  const declarations: ParseTreeNode[] = [];

  /**
   * Track declaration data.
   */
  const declarationData: { start: number; children: ParseTreeNode[] }[] = [];

  // Parse declarators (can be multiple, separated by commas)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Intentional infinite loop pattern
  while (true) {
    // For first declarator, use fieldStart (before type parsing); for subsequent ones, use current position
    const declStart = declarationData.length === zeroIndex ? fieldStart : ctx.current;

    // First declarator uses the provided name (already consumed), subsequent ones need to be consumed
    let fieldName: Token | undefined = undefined;
    if (declarationData.length === zeroIndex) {
      // First declarator - name was already consumed, we're positioned after it
      // Skip whitespace before checking for initializer
      ctx.skipWhitespaceAndComments();
      fieldName = name;
    } else {
      // Subsequent declarators - need to consume the identifier
      ctx.skipWhitespaceAndComments();
      fieldName = ctx.consume(TokenType.IDENTIFIER, 'Expected field name');
    }

    let initializer: ParseTreeNode | undefined = undefined;
    if (ctx.match(TokenType.ASSIGN)) {
      ctx.skipWhitespaceAndComments();
      const expr = ctx.parseExpression();
      initializer = expr ?? undefined;
    }

    const declChildren: ParseTreeNode[] = [];
    if (annotations.length > zeroIndex) {
      declChildren.push({ children: [...annotations], type: 'annotations' });
    }
    if (modifiers.length > zeroIndex) {
      declChildren.push({ children: [...modifiers], type: 'modifiers' });
    }
    declChildren.push(type);
    if (!fieldName) {
      throw new Error('Expected field name');
    }
    declChildren.push({
      location: ctx.locationToRange(fieldName.location),
      text: fieldName.text,
      type: 'name',
    });
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- initializer can be undefined
    if (initializer !== null && initializer !== undefined) {
      declChildren.push(initializer);
    }

    declarationData.push({ children: declChildren, start: declStart });

    // Check for comma (multiple declarators)
    ctx.skipWhitespaceAndComments();
    if (!ctx.match(TokenType.COMMA)) {
      break;
    }
    // Skip whitespace after comma before next declarator
    ctx.skipWhitespaceAndComments();
  }

  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.SEMICOLON, 'Expected ; after field declaration');

  // Create declaration nodes with correct locations (including semicolon)
  for (const data of declarationData) {
    declarations.push({
      children: data.children,
      location: ctx.getLocation(data.start - singleIndexOffset, ctx.current),
      type: 'field_declaration',
    });
  }

  // For multiple declarators, return a block with multiple field declarations
  const singleDeclarationCount = 1;
  if (declarations.length > singleDeclarationCount) {
    return {
      children: declarations,
      location: ctx.getLocation(fieldStart, ctx.current),
      type: 'block',
    };
  }

  // Single declarator, return the field declaration directly
  return declarations[zeroIndex];
}
