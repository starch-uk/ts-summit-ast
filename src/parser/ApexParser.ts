/**
 * @file Simple Apex parser.
 * Parses Apex source code into a parse tree structure.
 */

import type { SourceRange, SourceLocation } from '../ast/base.js';
import { ApexLexer } from './ApexLexer.js';
import { TokenType, type Token } from './TokenTypes.js';
import type { ParseTreeNode } from './ParseTreeTypes.js';

/**
 * Simple recursive descent parser for Apex.
 */
export class ApexParser {
  private readonly tokens: Token[] = [];
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Initial index constant
  private readonly initialIndex = 0;
  private current = this.initialIndex;
  private readonly source: string = '';

  /**
   * Track pending > tokens from RIGHT_SHIFT.
   */
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Initial count constant
  private readonly initialPendingCount = 0;
  private pendingGreaterThan = this.initialPendingCount;

  public constructor(_source: string) {
    this.source = _source;
    const lexer = new ApexLexer(_source);
    this.tokens = lexer.tokenize();
  }

  /**
   * Parse the source code into a parse tree.
   * @returns The parse tree, or null if parsing fails.
   */
  public parse(): ParseTreeNode | null {
    try {
      // Reset pendingGreaterThan at the start of parsing
      this.pendingGreaterThan = 0;
      return this.parseCompilationUnit();
    } catch {
      // Silently return null on parse errors
      // Error logging can be enabled for debugging if needed
      return null;
    }
  }

  /**
   * Parse compilation unit (top-level).
   * @returns The compilation unit parse tree node.
   */
  private parseCompilationUnit(): ParseTreeNode {
    const declarations: ParseTreeNode[] = [];

    // Skip whitespace and comments at start to find the first actual token
    this.skipWhitespaceAndComments();

    /**
     * Start from first actual token, not beginning of source.
     */
    const start = this.current;

    while (!this.isAtEnd()) {
      const beforeDecl = this.current;
      const decl = this.parseDeclaration();
      if (decl != null) {
        declarations.push(decl);
      }
      // Safety check: ensure we always advance
      if (this.current === beforeDecl && !this.isAtEnd()) {
        this.advance();
      }
      this.skipWhitespaceAndComments();
    }

    // For compilation unit, we want the location to span from first token to end of source
    // including trailing newlines. Use a special end position that includes everything.

    /**
     * This will trigger EOF handling in getLocation.
     */
    const endPos = this.tokens.length;

    return {
      children: declarations,
      location: this.getLocation(start, endPos),
      type: 'compilation_unit',
    };
  }

  /**
   * Parse a declaration (class, interface, trigger, etc.).
   * @returns The declaration parse tree node, or null if not a declaration.
   */
  private parseDeclaration(): ParseTreeNode | null {
    this.skipWhitespaceAndComments();

    // Check for annotation type declaration: @interface
    if (this.match(TokenType.AT)) {
      if (this.check(TokenType.INTERFACE)) {
        this.advance(); // Consume INTERFACE
        return this.parseAnnotationDeclaration();
      } else {
        // Not @interface, might be an annotation on a declaration, reset
        this.current--;
      }
    }

    // Collect annotations before the declaration (for class, interface, enum, etc.)
    const annotations: ParseTreeNode[] = [];
    while (this.match(TokenType.AT)) {
      const annotation = this.parseAnnotation();
      if (annotation) {
        annotations.push(annotation);
      }
      this.skipWhitespaceAndComments();
    }

    // Parse modifiers (public, private, etc.) that can come before class/interface/enum
    const modifiers: ParseTreeNode[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Infinite loop pattern for parsing modifiers
    while (true) {
      const beforeMatch = this.current;
      let modifierText: string | null = null;
      let modifierStart: number | null = null;

      // Check for multi-word modifiers first: "with sharing", "without sharing", "inherited sharing"
      if (this.match(TokenType.WITH)) {
        modifierStart = this.current - 1;
        this.skipWhitespaceAndComments();
        if (this.match(TokenType.SHARING)) {
          modifierText = 'with sharing';
        } else {
          // "with" without "sharing" is not a modifier, reset
          this.current = beforeMatch;
          break;
        }
      } else if (this.match(TokenType.WITHOUT)) {
        modifierStart = this.current - 1;
        this.skipWhitespaceAndComments();
        if (this.match(TokenType.SHARING)) {
          modifierText = 'without sharing';
        } else {
          // "without" without "sharing" is not a modifier, reset
          this.current = beforeMatch;
          break;
        }
      } else if (this.match(TokenType.INHERITED)) {
        modifierStart = this.current - 1;
        this.skipWhitespaceAndComments();
        if (this.match(TokenType.SHARING)) {
          modifierText = 'inherited sharing';
        } else {
          // "inherited" without "sharing" is not a modifier, reset
          this.current = beforeMatch;
          break;
        }
      } else if (
        this.match(
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
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Previous token index offset
        const prevToken = this.tokens[this.current - 1];
        modifierText = prevToken.text;
        modifierStart = this.current - 1;
      } else {
        // No more modifiers
        break;
      }

      if (modifierText && modifierStart !== null) {
        modifiers.push({
          location: this.getLocation(modifierStart, this.current),
          text: modifierText,
          type: 'modifier',
        });
        this.skipWhitespaceAndComments();
      } else {
        break;
      }
    }

    if (this.match(TokenType.CLASS)) {
      return this.parseClassDeclaration(annotations, modifiers);
    }
    if (this.match(TokenType.INTERFACE)) {
      return this.parseInterfaceDeclaration();
    }
    if (this.match(TokenType.TRIGGER)) {
      return this.parseTriggerDeclaration();
    }
    if (this.match(TokenType.ENUM)) {
      return this.parseEnumDeclaration();
    }

    // Could be a method or field at top level (unlikely but handle it)
    return null;
  }

  /**
   * Parse class declaration.
   * @param annotations - Annotations that were parsed before the class keyword.
   * @param preModifiers - Modifiers that were parsed before the class keyword.
   * @returns The class declaration parse tree node.
   */
  private parseClassDeclaration(
    annotations: ParseTreeNode[] = [],
    preModifiers: ParseTreeNode[] = []
  ): ParseTreeNode {
    const start = this.current - 1;
    const modifiers: ParseTreeNode[] = [...preModifiers];

    // CLASS keyword was already consumed by match() in parseDeclaration()
    // So we don't need to consume it again
    this.skipWhitespaceAndComments();

    // Class name
    const name = this.consume(TokenType.IDENTIFIER, 'Expected class name');

    // Type parameters: <T, U extends Bound>
    const typeParameters = this.parseTypeParameters();

    // Extends clause
    this.skipWhitespaceAndComments();
    let extendsClause: ParseTreeNode | undefined = undefined;
    if (this.match(TokenType.EXTENDS)) {
      this.skipWhitespaceAndComments();
      const extendsType = this.parseType();
      if (extendsType) {
        extendsClause = {
          children: [extendsType],
          location: this.getLocation(start, this.current),
          type: 'extends_clause',
        };
      } else {
        throw new Error('Expected type after extends');
      }
    }

    // Implements clause
    const implementsList: ParseTreeNode[] = [];
    if (this.match(TokenType.IMPLEMENTS)) {
      do {
        this.skipWhitespaceAndComments();
        const implType = this.parseType();
        if (implType) {
          implementsList.push(implType);
        } else {
          throw new Error('Expected type after implements');
        }
      } while (this.match(TokenType.COMMA));
    }

    // Skip whitespace before class body
    this.skipWhitespaceAndComments();

    // Class body
    const body = this.parseBlock(true);

    const children: ParseTreeNode[] = [];
    if (annotations.length > 0) {
      children.push({ children: annotations, type: 'annotations' });
    }
    if (modifiers.length > 0) {
      children.push({ children: modifiers, type: 'modifiers' });
    }
    children.push({ location: this.locationToRange(name.location), text: name.text, type: 'name' });
    if (typeParameters != null && typeParameters.length > 0) {
      children.push({ children: typeParameters, type: 'type_parameters' });
    }
    if (extendsClause != null) {
      children.push(extendsClause);
    }
    if (implementsList.length > 0) {
      children.push({ children: implementsList, type: 'implements_clause' });
    }
    children.push(body);

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'class_declaration',
    };
  }

  /**
   * Parse interface declaration.
   * @returns The interface declaration parse tree node.
   */
  private parseInterfaceDeclaration(): ParseTreeNode {
    const start = this.current - 1;
    const modifiers: ParseTreeNode[] = [];

    // INTERFACE keyword was already consumed by match() in parseDeclaration()
    // So we don't need to consume it again
    this.skipWhitespaceAndComments();

    // Interface name
    const name = this.consume(TokenType.IDENTIFIER, 'Expected interface name');

    // Type parameters: <T, U extends Bound>
    const typeParameters = this.parseTypeParameters();

    // Extends clause (interfaces can extend other interfaces)
    const extendsList: ParseTreeNode[] = [];
    if (this.match(TokenType.EXTENDS)) {
      do {
        this.skipWhitespaceAndComments();
        const extendsType = this.parseType();
        if (extendsType) {
          extendsList.push(extendsType);
        } else {
          throw new Error('Expected type after extends');
        }
      } while (this.match(TokenType.COMMA));
    }

    // Skip whitespace before interface body
    this.skipWhitespaceAndComments();

    // Interface body
    const body = this.parseBlock(true);

    const children: ParseTreeNode[] = [];
    if (modifiers.length > 0) {
      children.push({ children: modifiers, type: 'modifiers' });
    }
    children.push({ location: this.locationToRange(name.location), text: name.text, type: 'name' });
    if (typeParameters != null && typeParameters.length > 0) {
      children.push({ children: typeParameters, type: 'type_parameters' });
    }
    if (extendsList.length > 0) {
      children.push({ children: extendsList, type: 'extends_clause' });
    }
    children.push(body);

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'interface_declaration',
    };
  }

  /**
   * Parse trigger declaration.
   * @returns The trigger declaration parse tree node.
   */
  private parseTriggerDeclaration(): ParseTreeNode {
    const start = this.current - 1;
    this.advance(); // TRIGGER

    this.skipWhitespaceAndComments();
    const name = this.consume(TokenType.IDENTIFIER, 'Expected trigger name');
    // ON is not a keyword in our lexer, so we'll check for identifier
    this.skipWhitespaceAndComments();
    const onToken = this.consume(TokenType.IDENTIFIER, 'Expected ON');
    if (onToken.text.toLowerCase() !== 'on') {
      throw new Error('Expected ON after trigger name');
    }
    this.skipWhitespaceAndComments();
    const objectName = this.consume(TokenType.IDENTIFIER, 'Expected object name');

    const events: ParseTreeNode[] = [];
    this.skipWhitespaceAndComments();
    this.consume(TokenType.LEFT_PAREN, 'Expected (');
    this.skipWhitespaceAndComments();
    // Parse at least one event
    do {
      // Trigger events are two identifiers: "before update", "after delete", etc.
      const firstPart = this.consume(TokenType.IDENTIFIER, 'Expected trigger event');
      this.skipWhitespaceAndComments();
      let eventText = firstPart.text;
      // Check if there's a second identifier (e.g., "update", "delete", "insert")
      if (this.check(TokenType.IDENTIFIER)) {
        const secondPart = this.consume(TokenType.IDENTIFIER, 'Expected trigger event part');
        eventText += ' ' + secondPart.text;
        this.skipWhitespaceAndComments();
      }
      events.push({
        location: this.locationToRange(firstPart.location),
        text: eventText,
        type: 'trigger_event',
      });
      // Check for comma and skip whitespace if found
      if (this.match(TokenType.COMMA)) {
        this.skipWhitespaceAndComments();
      } else {
        break;
      }
    } while (true);
    this.skipWhitespaceAndComments();
    this.consume(TokenType.RIGHT_PAREN, 'Expected )');

    this.skipWhitespaceAndComments();

    /**
     * Trigger bodies can contain class members like methods.
     */
    const body = this.parseBlock(true);

    return {
      children: [
        { location: this.locationToRange(name.location), text: name.text, type: 'name' },
        {
          location: this.locationToRange(objectName.location),
          text: objectName.text,
          type: 'object_name',
        },
        { children: events, type: 'events' },
        body,
      ],
      location: this.getLocation(start, this.current),
      type: 'trigger_declaration',
    };
  }

  /**
   * Parse annotation type declaration: @interface Name { members }.
   * @returns The annotation declaration parse tree node.
   */
  private parseAnnotationDeclaration(): ParseTreeNode {
    /**
     * Start at @.
     */
    const start = this.current - 2;
    const modifiers: ParseTreeNode[] = [];

    // Parse modifiers (public, global, etc.)
    while (this.match(TokenType.PUBLIC, TokenType.PRIVATE, TokenType.GLOBAL)) {
      const prevToken = this.previous();
      modifiers.push({
        location: this.locationToRange(prevToken.location),
        text: prevToken.text,
        type: 'modifier',
      });
      this.skipWhitespaceAndComments();
    }

    // Annotation type name
    const name = this.consume(TokenType.IDENTIFIER, 'Expected annotation type name');

    // Annotation type body
    this.consume(TokenType.LEFT_BRACE, 'Expected { after annotation type name');

    const members: ParseTreeNode[] = [];
    this.skipWhitespaceAndComments();

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const beforeMember = this.current;
      const member = this.parseAnnotationMember();
      if (member) {
        members.push(member);
      }
      // Safety check: ensure we always advance
      if (this.current === beforeMember && !this.isAtEnd()) {
        this.advance();
      }
      this.skipWhitespaceAndComments();
    }

    this.consume(TokenType.RIGHT_BRACE, 'Expected } after annotation type body');

    const children: ParseTreeNode[] = [];
    if (modifiers.length > 0) {
      children.push({ children: modifiers, type: 'modifiers' });
    }
    children.push({ location: this.locationToRange(name.location), text: name.text, type: 'name' });
    if (members.length > 0) {
      children.push({ children: members, type: 'members' });
    }

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'annotation_declaration',
    };
  }

  /**
   * Parse annotation member (method-like but simpler)
   * Example: String value(); or Integer count() default 0;.
   * @returns The parsed annotation member node, or null if parsing fails.
   */
  private parseAnnotationMember(): ParseTreeNode | null {
    const start = this.current;

    // Parse return type
    const returnType = this.parseType();
    if (!returnType) {
      return null;
    }

    // Member name
    const name = this.consume(TokenType.IDENTIFIER, 'Expected annotation member name');

    // Parameters (empty parentheses)
    this.consume(TokenType.LEFT_PAREN, 'Expected ( after annotation member name');
    this.consume(TokenType.RIGHT_PAREN, 'Expected ) after annotation member parameters');

    // Optional default value
    let defaultValue: ParseTreeNode | undefined = undefined;
    if (this.match(TokenType.IDENTIFIER)) {
      const defaultKeyword = this.previous();
      if (defaultKeyword.text.toLowerCase() === 'default') {
        const expr = this.parseExpression();
        if (expr != null) {
          defaultValue = {
            children: [expr],
            location: expr.location ?? undefined,
            type: 'defaultValue',
          };
        }
      } else {
        // Not 'default', reset
        this.current--;
      }
    }

    // Semicolon
    this.consume(TokenType.SEMICOLON, 'Expected ; after annotation member');

    const children: ParseTreeNode[] = [
      returnType,
      { location: this.locationToRange(name.location), text: name.text, type: 'name' },
    ];
    if (defaultValue) {
      children.push(defaultValue);
    }

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'annotation_member',
    };
  }

  /**
   * Parse enum declaration.
   * @returns The enum declaration parse tree node.
   */
  private parseEnumDeclaration(): ParseTreeNode {
    const start = this.current - 1;
    const modifiers: ParseTreeNode[] = [];

    // ENUM keyword was already consumed by match() in parseDeclaration()
    // So we don't need to consume it again
    this.skipWhitespaceAndComments();

    const name = this.consume(TokenType.IDENTIFIER, 'Expected enum name');

    // Parse enum body with constants
    const enumBodyStart = this.current;
    this.skipWhitespaceAndComments();
    this.consume(TokenType.LEFT_BRACE, 'Expected { after enum name');

    const constants: ParseTreeNode[] = [];
    this.skipWhitespaceAndComments();

    // Parse enum constants (can be empty)
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const beforeConstant = this.current;
      const constant = this.parseEnumConstant();
      if (constant) {
        constants.push(constant);
        this.skipWhitespaceAndComments();
        if (this.match(TokenType.COMMA)) {
          this.skipWhitespaceAndComments();
        } else if (!this.check(TokenType.RIGHT_BRACE)) {
          // Safety check: ensure we always advance if we didn't match comma or brace
          if (this.current === beforeConstant && !this.isAtEnd()) {
            this.advance();
          } else {
            break;
          }
        }
      } else {
        // If we can't parse a constant, break
        // Safety check: ensure we always advance if we didn't parse anything
        if (this.current === beforeConstant && !this.isAtEnd()) {
          this.advance();
        } else {
          break;
        }
      }
      this.skipWhitespaceAndComments();
    }

    this.skipWhitespaceAndComments();
    this.consume(TokenType.RIGHT_BRACE, 'Expected } after enum');

    const body = {
      children: constants,
      location: this.getLocation(enumBodyStart, this.current),
      type: 'block',
    };

    const children: ParseTreeNode[] = [];
    if (modifiers.length > 0) {
      children.push({ children: modifiers, type: 'modifiers' });
    }
    children.push({ location: this.locationToRange(name.location), text: name.text, type: 'name' });
    children.push(body);

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'enum_declaration',
    };
  }

  /**
   * Parse a block (statements enclosed in braces)
   * In class context, this parses class members; otherwise, it parses statements.
   * @param isClassBody - Whether this is a class body (true) or statement block (false).
   * @returns The block parse tree node.
   */
  private parseBlock(isClassBody = false): ParseTreeNode {
    const start = this.current;
    this.consume(TokenType.LEFT_BRACE, 'Expected {');

    const statements: ParseTreeNode[] = [];
    this.skipWhitespaceAndComments();

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const beforeParse = this.current;
      if (isClassBody) {
        const member = this.parseClassMember();
        if (member) {
          statements.push(member);
        }
      } else {
        const stmt = this.parseStatement();
        if (stmt) {
          statements.push(stmt);
        }
      }
      // Safety check: ensure we always advance, even if parsing failed
      if (this.current === beforeParse && !this.isAtEnd()) {
        this.advance();
      }
      this.skipWhitespaceAndComments();
    }

    this.consume(TokenType.RIGHT_BRACE, 'Expected }');

    return {
      children: statements,
      location: this.getLocation(start, this.current),
      type: 'block',
    };
  }

  /**
   * Parse a class member (method, constructor, field, inner class, etc.).
   * @returns The parsed class member node, or null if parsing fails.
   */
  private parseClassMember(): ParseTreeNode | null {
    this.skipWhitespaceAndComments();

    // Parse annotations
    const annotations: ParseTreeNode[] = [];
    while (this.match(TokenType.AT)) {
      const annotation = this.parseAnnotation();
      if (annotation) {
        annotations.push(annotation);
      }
      this.skipWhitespaceAndComments();
    }

    // Parse modifiers
    const modifiers: ParseTreeNode[] = [];
    while (
      this.match(
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
        TokenType.FUTURE
      )
    ) {
      const prevToken = this.previous();
      modifiers.push({
        location: this.locationToRange(prevToken.location),
        text: prevToken.text,
        type: 'modifier',
      });
      this.skipWhitespaceAndComments();
    }

    // Check for constructor first (identifier followed by parentheses, no return type)
    // In Apex, constructors don't have a return type - they're just: ClassName(params) { }
    if (this.check(TokenType.IDENTIFIER)) {
      const savedPos = this.current;
      this.advance(); // Peek at the identifier
      this.skipWhitespaceAndComments();
      if (this.check(TokenType.LEFT_PAREN)) {
        // This is a constructor - reset and parse it properly
        this.current = savedPos;
        const name = this.consume(TokenType.IDENTIFIER, 'Expected constructor name');
        // Create a "void" type node for constructors (they don't have a return type)
        const voidType: ParseTreeNode = {
          location: this.locationToRange(name.location),
          text: 'void',
          type: 'void_type',
        };
        return this.parseMethodOrConstructor(name, modifiers, annotations, voidType);
      } else {
        // Not a constructor, reset position
        this.current = savedPos;
      }
    }

    // Check for constructor (same name as class) or method
    // First check if it's a type (primitive or identifier that could be a type)
    if (this.checkType()) {
      /**
       * Capture start before parsing type for field location.
       */
      const fieldStart = this.current;
      const type = this.parseType();
      if (type) {
        // Could be method, constructor, or field
        // After parsing type, we should have the identifier name
        this.skipWhitespaceAndComments();
        if (this.check(TokenType.IDENTIFIER)) {
          const name = this.consume(TokenType.IDENTIFIER, 'Expected member name');

          // Check if it's a method/constructor (has parentheses) or field/property
          this.skipWhitespaceAndComments();
          if (this.check(TokenType.LEFT_PAREN)) {
            // Method or constructor
            return this.parseMethodOrConstructor(name, modifiers, annotations, type);
          } else if (this.check(TokenType.LEFT_BRACE)) {
            // Property with getter/setter
            return this.parsePropertyDeclaration(name, modifiers, annotations, type);
          } else {
            // Field declaration - pass the start position from before type parsing
            return this.parseFieldDeclaration(name, modifiers, annotations, type, fieldStart);
          }
        }
      }
    }

    // Inner class, interface, or annotation type
    if (this.match(TokenType.CLASS)) {
      return this.parseClassDeclaration();
    }
    if (this.match(TokenType.INTERFACE)) {
      return this.parseInterfaceDeclaration();
    }
    if (this.match(TokenType.ENUM)) {
      return this.parseEnumDeclaration();
    }
    // Check for annotation type declaration: @interface
    if (this.match(TokenType.AT)) {
      if (this.check(TokenType.INTERFACE)) {
        this.advance(); // Consume INTERFACE
        return this.parseAnnotationDeclaration();
      } else {
        // Not @interface, might be an annotation on a member, reset
        this.current--;
      }
    }

    // Static initializer: static { } or check if static was consumed as modifier
    // Check if we have static modifier and next token is {
    const hasStaticModifier = modifiers.some(
      (m: any) => m.text === 'static' || m.text === 'STATIC'
    );
    if (hasStaticModifier && this.check(TokenType.LEFT_BRACE)) {
      const block = this.parseBlock();
      const initializerNode: any = {
        children: [block],
        location: block.location,
        type: 'static_initializer',
      };
      // Add modifiers (static modifier)
      if (modifiers.length > 0) {
        initializerNode.children.unshift({ children: modifiers, type: 'modifiers' });
      }
      return initializerNode;
    }

    // Also check if static keyword is next (not yet consumed as modifier)
    if (this.check(TokenType.STATIC)) {
      const savedPos = this.current;
      this.advance(); // STATIC
      if (this.check(TokenType.LEFT_BRACE)) {
        const block = this.parseBlock();
        const initializerNode: any = {
          children: [block],
          location: block.location,
          type: 'static_initializer',
        };
        // Add static modifier
        const staticModifier = {
          location: this.locationToRange(this.tokens[savedPos].location),
          text: 'static',
          type: 'modifier',
        };
        initializerNode.children.unshift({ children: [staticModifier], type: 'modifiers' });
        return initializerNode;
      } else {
        // Not a static initializer, reset
        this.current = savedPos;
      }
    }

    // Instance initializer (bare { } block)
    if (this.check(TokenType.LEFT_BRACE)) {
      const block = this.parseBlock();
      const initializerNode: any = {
        children: [block],
        location: block.location,
        type: 'instance_initializer',
      };
      // Add modifiers if present (though instance initializers typically have none)
      if (modifiers.length > 0) {
        initializerNode.children.unshift({ children: modifiers, type: 'modifiers' });
      }
      return initializerNode;
    }

    // Skip unknown tokens
    if (!this.isAtEnd()) {
      this.advance();
    }

    return null;
  }

  /**
   * Parse method or constructor declaration.
   * @param name - The method/constructor name token.
   * @param modifiers - Array of modifier parse tree nodes.
   * @param annotations - Array of annotation parse tree nodes.
   * @param returnType - The return type parse tree node.
   * @returns The method or constructor declaration parse tree node.
   */
  private parseMethodOrConstructor(
    name: Token,
    modifiers: ParseTreeNode[],
    annotations: ParseTreeNode[],
    returnType: ParseTreeNode
  ): ParseTreeNode {
    const start = this.current - 1;

    // Type parameters: <T, U extends Bound>
    const typeParameters = this.parseTypeParameters();

    this.consume(TokenType.LEFT_PAREN, 'Expected ( after method name');

    // Parse parameters
    const parameters: ParseTreeNode[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        const param = this.parseParameter();
        if (param) {
          parameters.push(param);
        }
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RIGHT_PAREN, 'Expected ) after parameters');

    // Parse throws clause (if present) - in Apex, this is typically not used but we support it
    const throwsList: ParseTreeNode[] = [];
    // Note: Apex doesn't have checked exceptions, but we parse it for compatibility
    if (this.check(TokenType.IDENTIFIER)) {
      const nextToken = this.peek();
      if (nextToken.text.toLowerCase() === 'throws') {
        this.advance(); // Skip 'throws'
        do {
          const throwType = this.parseType();
          if (throwType) {
            throwsList.push(throwType);
          }
        } while (this.match(TokenType.COMMA));
      }
    }

    // Parse body (may be abstract/interface method with no body)
    this.skipWhitespaceAndComments();
    let body: ParseTreeNode | undefined = undefined;
    if (this.check(TokenType.LEFT_BRACE)) {
      body = this.parseBlock();
    } else if (this.check(TokenType.SEMICOLON)) {
      this.consume(TokenType.SEMICOLON, 'Expected ; or {');
    }

    const children: ParseTreeNode[] = [];
    if (annotations.length > 0) {
      children.push({ children: annotations, type: 'annotations' });
    }
    if (modifiers.length > 0) {
      children.push({ children: modifiers, type: 'modifiers' });
    }
    children.push(returnType);
    children.push({ location: this.locationToRange(name.location), text: name.text, type: 'name' });
    if (typeParameters != null && typeParameters.length > 0) {
      children.push({ children: typeParameters, type: 'type_parameters' });
    }
    if (parameters.length > 0) {
      children.push({ children: parameters, type: 'parameters' });
    }
    if (throwsList.length > 0) {
      children.push({ children: throwsList, type: 'throws_clause' });
    }
    if (body) {
      children.push(body);
    }

    // Check if it's a constructor
    // In Apex, constructors don't have a return type, but we check if the name matches the class
    // For now, we'll check if returnType is the same as name (constructor) or if it's explicitly void
    // This is a heuristic - in practice, we'd need class context
    const firstChild = returnType.children?.[0];
    const isConstructor =
      (firstChild != null && (firstChild as { text?: string }).text === name.text) ||
      (returnType.text != null && returnType.text === name.text);

    return {
      children,
      location: this.getLocation(start, this.current),
      type: isConstructor ? 'constructor_declaration' : 'method_declaration',
    };
  }

  /**
   * Parse parameter declaration.
   * @returns The parsed parameter node, or null if parsing fails.
   */
  private parseParameter(): ParseTreeNode | null {
    const start = this.current;
    const modifiers: ParseTreeNode[] = [];

    // Parse parameter modifiers (final, etc.)
    while (this.match(TokenType.FINAL)) {
      const prevToken = this.previous();
      modifiers.push({
        location: this.locationToRange(prevToken.location),
        text: prevToken.text,
        type: 'modifier',
      });
    }

    const type = this.parseType();
    if (!type) {
      return null;
    }

    // Skip whitespace before parameter name (e.g., "String [] input")
    this.skipWhitespaceAndComments();
    const name = this.consume(TokenType.IDENTIFIER, 'Expected parameter name');

    const children: ParseTreeNode[] = [];
    if (modifiers.length > 0) {
      children.push({ children: modifiers, type: 'modifiers' });
    }
    children.push(type);
    children.push({ location: this.locationToRange(name.location), text: name.text, type: 'name' });

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'parameter',
    };
  }

  /**
   * Parse property declaration (with getter/setter).
   * @param name - The property name token.
   * @param modifiers - Array of modifier parse tree nodes.
   * @param annotations - Array of annotation parse tree nodes.
   * @param type - The property type parse tree node.
   * @returns The property declaration parse tree node.
   */
  private parsePropertyDeclaration(
    name: Token,
    modifiers: ParseTreeNode[],
    annotations: ParseTreeNode[],
    type: ParseTreeNode
  ): ParseTreeNode {
    const start = this.current - 1;
    this.consume(TokenType.LEFT_BRACE, 'Expected { for property');

    const getter: ParseTreeNode[] = [];
    const setter: ParseTreeNode[] = [];

    this.skipWhitespaceAndComments();

    // Parse getter
    const peekToken = this.peek();
    if (this.check(TokenType.IDENTIFIER) && peekToken?.text.toLowerCase() === 'get') {
      this.advance(); // Consume 'get'
      this.skipWhitespaceAndComments();
      if (this.check(TokenType.LEFT_BRACE)) {
        const getBody = this.parseBlock();
        getter.push(getBody);
      } else {
        this.consume(TokenType.SEMICOLON, 'Expected ; or { after get');
      }
      this.skipWhitespaceAndComments();
    }

    // Parse setter
    const setterPeekToken = this.peek();
    if (this.check(TokenType.IDENTIFIER) && setterPeekToken?.text.toLowerCase() === 'set') {
      this.advance(); // Consume 'set'
      this.skipWhitespaceAndComments();
      if (this.check(TokenType.LEFT_BRACE)) {
        const setBody = this.parseBlock();
        setter.push(setBody);
      } else {
        this.consume(TokenType.SEMICOLON, 'Expected ; or { after set');
      }
      this.skipWhitespaceAndComments();
    }

    this.consume(TokenType.RIGHT_BRACE, 'Expected } after property');

    const children: ParseTreeNode[] = [];
    if (annotations.length > 0) {
      children.push({ children: annotations, type: 'annotations' });
    }
    if (modifiers.length > 0) {
      children.push({ children: modifiers, type: 'modifiers' });
    }
    children.push(type);
    children.push({ location: this.locationToRange(name.location), text: name.text, type: 'name' });
    if (getter.length > 0) {
      children.push({ children: getter, type: 'getter' });
    }
    if (setter.length > 0) {
      children.push({ children: setter, type: 'setter' });
    }

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'property_declaration',
    };
  }

  /**
   * Parse field declaration.
   * @param name - The field name token.
   * @param modifiers - Array of modifier parse tree nodes.
   * @param annotations - Array of annotation parse tree nodes.
   * @param type - The field type parse tree node.
   * @param start - Optional start position for location tracking.
   * @returns The field declaration parse tree node.
   */
  private parseFieldDeclaration(
    name: Token,
    modifiers: ParseTreeNode[],
    annotations: ParseTreeNode[],
    type: ParseTreeNode,
    start?: number
  ): ParseTreeNode {
    // Use provided start position (from before type parsing) or current position
    const fieldStart = start ?? this.current - 1;

    const declarations: ParseTreeNode[] = [];

    /**
     * Track declaration data.
     */
    const declarationData: { start: number; children: ParseTreeNode[] }[] = [];

    // Parse declarators (can be multiple, separated by commas)
    while (true) {
      // For first declarator, use fieldStart (before type parsing); for subsequent ones, use current position
      const declStart = declarationData.length === 0 ? fieldStart : this.current;

      // First declarator uses the provided name (already consumed), subsequent ones need to be consumed
      let fieldName: Token;
      if (declarationData.length === 0) {
        // First declarator - name was already consumed, we're positioned after it
        // Skip whitespace before checking for initializer
        this.skipWhitespaceAndComments();
        fieldName = name;
      } else {
        // Subsequent declarators - need to consume the identifier
        this.skipWhitespaceAndComments();
        fieldName = this.consume(TokenType.IDENTIFIER, 'Expected field name');
      }

      let initializer: ParseTreeNode | undefined = undefined;
      if (this.match(TokenType.ASSIGN)) {
        this.skipWhitespaceAndComments();
        const expr = this.parseExpression();
        initializer = expr ?? undefined;
      }

      const declChildren: ParseTreeNode[] = [];
      if (annotations.length > 0) {
        declChildren.push({ children: annotations, type: 'annotations' });
      }
      if (modifiers.length > 0) {
        declChildren.push({ children: modifiers, type: 'modifiers' });
      }
      declChildren.push(type);
      declChildren.push({
        location: this.locationToRange(fieldName.location),
        text: fieldName.text,
        type: 'name',
      });
      if (initializer) {
        declChildren.push(initializer);
      }

      declarationData.push({ children: declChildren, start: declStart });

      // Check for comma (multiple declarators)
      this.skipWhitespaceAndComments();
      if (!this.match(TokenType.COMMA)) {
        break;
      }
      // Skip whitespace after comma before next declarator
      this.skipWhitespaceAndComments();
    }

    this.skipWhitespaceAndComments();
    this.consume(TokenType.SEMICOLON, 'Expected ; after field declaration');

    // Create declaration nodes with correct locations (including semicolon)
    for (const data of declarationData) {
      declarations.push({
        children: data.children,
        location: this.getLocation(data.start, this.current),
        type: 'field_declaration',
      });
    }

    // For multiple declarators, return a block with multiple field declarations
    if (declarations.length > 1) {
      return {
        children: declarations,
        location: this.getLocation(fieldStart, this.current),
        type: 'block',
      };
    }

    // Single declarator, return the field declaration directly
    return declarations[0];
  }

  /**
   * Parse annotation.
   * @returns The parsed annotation node, or null if parsing fails.
   */
  private parseAnnotation(): ParseTreeNode | null {
    const start = this.current - 1;
    const name = this.consume(TokenType.IDENTIFIER, 'Expected annotation name');

    let arguments_: ParseTreeNode[] = [];
    if (this.match(TokenType.LEFT_PAREN)) {
      if (!this.check(TokenType.RIGHT_PAREN)) {
        // Parse first argument
        const firstArg = this.parseAnnotationArgument();
        if (firstArg) {
          arguments_.push(firstArg);
        }

        // Parse additional arguments (can be separated by comma or whitespace for named args)
        while (!this.check(TokenType.RIGHT_PAREN)) {
          this.skipWhitespaceAndComments();

          // Check if there's a comma (explicit separator)
          if (this.match(TokenType.COMMA)) {
            this.skipWhitespaceAndComments();
          } else {
            // For named arguments, whitespace can separate them
            // Check if next token is an identifier followed by = (named argument)
            const peekToken = this.peek(1);
            if (!(this.check(TokenType.IDENTIFIER) && peekToken?.type === TokenType.ASSIGN)) {
              // Not a named argument, must be end of arguments
              break;
            }
          }

          // If we're at the end, break
          if (this.check(TokenType.RIGHT_PAREN)) {
            break;
          }

          const arg = this.parseAnnotationArgument();
          if (arg) {
            arguments_.push(arg);
          } else {
            // Failed to parse argument, break to avoid infinite loop
            break;
          }
        }
      }
      this.consume(TokenType.RIGHT_PAREN, 'Expected ) after annotation arguments');
    }

    const children: ParseTreeNode[] = [
      { location: this.locationToRange(name.location), text: name.text, type: 'name' },
    ];
    if (arguments_.length > 0) {
      children.push({ children: arguments_, type: 'arguments' });
    }

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'annotation',
    };
  }

  /**
   * Parse enum constant.
   * @returns The parsed enum constant node, or null if parsing fails.
   */
  private parseEnumConstant(): ParseTreeNode | null {
    const start = this.current;
    // Enum constants can be IDENTIFIER or ID (keyword)
    if (!this.check(TokenType.IDENTIFIER) && !this.check(TokenType.ID)) {
      return null;
    }

    /**
     * Consume IDENTIFIER or ID.
     */
    const name = this.advance();

    let value: ParseTreeNode | undefined = undefined;
    if (this.match(TokenType.ASSIGN)) {
      const expr = this.parseExpression();
      value = expr ?? undefined;
    }

    const children: ParseTreeNode[] = [
      { location: this.locationToRange(name.location), text: name.text, type: 'name' },
    ];
    if (value) {
      children.push(value);
    }

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'enum_constant',
    };
  }

  /**
   * Parse annotation argument.
   * @returns The parsed annotation argument node, or null if parsing fails.
   */
  private parseAnnotationArgument(): ParseTreeNode | null {
    const start = this.current;

    // Could be name = value or just value
    let name: Token | undefined = undefined;
    // Check for named argument: peek past whitespace to find ASSIGN
    let nextNonWhitespaceOffset = 1;
    while (
      nextNonWhitespaceOffset < 5 &&
      (this.peek(nextNonWhitespaceOffset)?.type === TokenType.WHITESPACE ||
        this.peek(nextNonWhitespaceOffset)?.type === TokenType.NEWLINE ||
        this.peek(nextNonWhitespaceOffset)?.type === TokenType.LINE_COMMENT ||
        this.peek(nextNonWhitespaceOffset)?.type === TokenType.BLOCK_COMMENT)
    ) {
      nextNonWhitespaceOffset++;
    }
    const nextNonWhitespaceToken = this.peek(nextNonWhitespaceOffset);
    if (this.check(TokenType.IDENTIFIER) && nextNonWhitespaceToken?.type === TokenType.ASSIGN) {
      name = this.consume(TokenType.IDENTIFIER, 'Expected argument name');
      // Skip whitespace before ASSIGN
      while (
        this.check(TokenType.WHITESPACE) ||
        this.check(TokenType.NEWLINE) ||
        this.check(TokenType.LINE_COMMENT) ||
        this.check(TokenType.BLOCK_COMMENT)
      ) {
        this.advance();
      }
      this.consume(TokenType.ASSIGN, 'Expected =');
      this.skipWhitespaceAndComments();
    }

    // Check for annotation expression: @X
    let value: ParseTreeNode | null = null;
    if (this.check(TokenType.AT)) {
      // Parse annotation expression (annotation as a value)
      this.advance(); // Consume @
      const annotation = this.parseAnnotation();
      if (annotation) {
        value = {
          children: [annotation],
          location: annotation.location,
          type: 'annotation_expression',
        };
      }
    } else if (this.check(TokenType.LEFT_BRACE)) {
      // Parse array initializer: {1, 2, 3} or {@Y, @Z}

      /**
       * Position before consuming {.
       */
      const arrayStart = this.current;
      this.advance(); // Consume {
      const elements: ParseTreeNode[] = [];
      if (!this.check(TokenType.RIGHT_BRACE)) {
        do {
          this.skipWhitespaceAndComments();
          // Array elements can be expressions or annotation expressions
          let element: ParseTreeNode | null = null;
          if (this.check(TokenType.AT)) {
            // Annotation expression in array
            this.advance(); // Consume @
            const annotation = this.parseAnnotation();
            if (annotation) {
              element = {
                children: [annotation],
                location: annotation.location,
                type: 'annotation_expression',
              };
            }
          } else {
            // Regular expression
            element = this.parseExpression();
          }
          if (element) {
            elements.push(element);
          } else {
            // Failed to parse element, break to avoid infinite loop
            break;
          }
          this.skipWhitespaceAndComments();
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RIGHT_BRACE, 'Expected } after array initializer');

      // Create a new_expression with values_initializer for the array
      value = {
        children: [
          {
            children: elements,
            location: this.getLocation(arrayStart, this.current),
            type: 'values_initializer',
          },
        ],
        location: this.getLocation(arrayStart, this.current),
        type: 'new_expression',
      };
    } else {
      // Regular expression
      value = this.parseExpression();
    }

    if (!value) {
      return null;
    }

    const children: ParseTreeNode[] = [value];
    if (name) {
      children.unshift({
        location: this.locationToRange(name.location),
        text: name.text,
        type: 'name',
      });
    }

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'annotation_argument',
    };
  }

  /**
   * Parse a statement.
   * @returns The parsed statement node, or null if parsing fails.
   */
  private parseStatement(): ParseTreeNode | null {
    this.skipWhitespaceAndComments();

    if (this.match(TokenType.IF)) {
      return this.parseIfStatement();
    }
    if (this.match(TokenType.FOR)) {
      return this.parseForStatement();
    }
    if (this.match(TokenType.WHILE)) {
      return this.parseWhileStatement();
    }
    if (this.match(TokenType.DO)) {
      return this.parseDoWhileStatement();
    }
    if (this.match(TokenType.SWITCH)) {
      return this.parseSwitchStatement();
    }
    if (this.match(TokenType.TRY)) {
      return this.parseTryStatement();
    }
    if (this.match(TokenType.RETURN)) {
      return this.parseReturnStatement();
    }
    if (this.match(TokenType.BREAK)) {
      return this.parseBreakStatement();
    }
    if (this.match(TokenType.CONTINUE)) {
      return this.parseContinueStatement();
    }
    if (this.match(TokenType.THROW)) {
      return this.parseThrowStatement();
    }
    if (this.check(TokenType.LEFT_BRACE)) {
      return this.parseBlock();
    }

    // Check for DML statements: insert, update, delete, upsert, merge, undelete
    const savedPos = this.current;
    if (this.check(TokenType.IDENTIFIER)) {
      const token = this.peek();
      const dmlKeyword = token.text.toLowerCase();
      if (['insert', 'update', 'delete', 'upsert', 'merge', 'undelete'].includes(dmlKeyword)) {
        this.advance(); // Consume DML keyword
        this.skipWhitespaceAndComments();

        // Check for optional "as user" or "as system" modifier
        let accessLevel: string | undefined = undefined;
        if (this.check(TokenType.IDENTIFIER) && this.peek().text.toLowerCase() === 'as') {
          this.advance(); // Consume "as"
          this.skipWhitespaceAndComments();
          if (this.check(TokenType.IDENTIFIER)) {
            const accessToken = this.peek();
            const accessText = accessToken.text.toLowerCase();
            if (accessText === 'user' || accessText === 'system') {
              this.advance(); // Consume "user" or "system"
              accessLevel = accessText;
              this.skipWhitespaceAndComments();
            }
          }
        }

        // Parse target expression(s)
        // Upsert and merge have two arguments, others have one
        const isTwoArgDml = dmlKeyword === 'upsert' || dmlKeyword === 'merge';
        const target = this.parseExpression();
        if (target) {
          const children: ParseTreeNode[] = [target];

          // For upsert and merge, parse the second argument
          if (isTwoArgDml) {
            this.skipWhitespaceAndComments();
            const secondArg = this.parseExpression();
            if (secondArg) {
              children.push(secondArg);
            }
          }

          this.skipWhitespaceAndComments(); // Skip whitespace before semicolon
          this.consume(TokenType.SEMICOLON, `Expected ; after ${dmlKeyword} statement`);
          const node: ParseTreeNode = {
            children,
            location: this.getLocation(savedPos, this.current),
            text: dmlKeyword,
            type: 'dml_statement',
          };
          // Store access level if present
          if (accessLevel != null && accessLevel !== '') {
            (node as any).accessLevel = accessLevel;
          }
          return node;
        }
      }
    }
    this.current = savedPos; // Reset if not a DML statement

    // Variable declaration (check before expression statement since types can be identifiers)
    // Peek ahead to see if it's likely a variable declaration: type followed by identifier
    if (this.checkType()) {
      const savedPosForVar = this.current;
      // Try to parse type without consuming if it fails
      const type = this.parseType();
      if (type) {
        this.skipWhitespaceAndComments();
        // Check if next token is an identifier (variable name) - if so, it's likely a variable declaration
        if (this.check(TokenType.IDENTIFIER)) {
          // Reset and parse as variable declaration
          this.current = savedPosForVar;
          const varDecl = this.parseVariableDeclaration();
          if (varDecl) {
            return varDecl;
          }
        }
        // Not a variable declaration, reset to before type parsing
        this.current = savedPosForVar;
      }
    }

    // Expression statement
    const expr = this.parseExpression();
    if (expr) {
      if (this.match(TokenType.SEMICOLON)) {
        return {
          children: [expr],
          location: expr.location ?? this.getLocation(this.current - 1, this.current),
          type: 'expression_statement',
        };
      }
    }

    // Skip unknown tokens
    if (!this.isAtEnd()) {
      this.advance();
    }

    return null;
  }

  /**
   * Parse if statement.
   * @returns The parsed if statement parse tree node.
   */
  private parseIfStatement(): ParseTreeNode {
    const start = this.current - 1;
    this.skipWhitespaceAndComments();
    this.consume(TokenType.LEFT_PAREN, 'Expected ( after if');
    this.skipWhitespaceAndComments();
    const condition = this.parseExpression();
    this.skipWhitespaceAndComments();
    this.consume(TokenType.RIGHT_PAREN, 'Expected ) after condition');
    this.skipWhitespaceAndComments();
    const thenBody = this.parseStatement();
    let elseBody: ParseTreeNode | undefined = undefined;

    this.skipWhitespaceAndComments();
    if (this.match(TokenType.ELSE)) {
      this.skipWhitespaceAndComments();
      const stmt = this.parseStatement();
      elseBody = stmt ?? undefined;
    }

    const children: ParseTreeNode[] = [];
    if (condition) children.push(condition);
    if (thenBody) children.push(thenBody);
    if (elseBody) {
      children.push(elseBody);
    }

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'if_statement',
    };
  }

  /**
   * Parse for statement (supports both traditional for and for-each).
   * @returns The parsed for statement parse tree node.
   */
  private parseForStatement(): ParseTreeNode {
    const start = this.current - 1;
    this.skipWhitespaceAndComments();
    this.consume(TokenType.LEFT_PAREN, 'Expected ( after for');

    // Check if it's a for-each loop (Type variable : iterable)
    // We need to check this before traditional for loop parsing
    this.skipWhitespaceAndComments();
    const savedPosForEach = this.current;
    if (this.checkType()) {
      const type = this.parseType();
      if (type) {
        this.skipWhitespaceAndComments();
        if (this.check(TokenType.IDENTIFIER)) {
          const name = this.consume(TokenType.IDENTIFIER, 'Expected variable name');
          this.skipWhitespaceAndComments();
          if (this.match(TokenType.COLON)) {
            // It's a for-each loop
            this.skipWhitespaceAndComments();
            const iterable = this.parseExpression();
            this.skipWhitespaceAndComments();
            this.consume(TokenType.RIGHT_PAREN, 'Expected ) after for-each');
            this.skipWhitespaceAndComments();
            const body = this.parseStatement();

            const children: ParseTreeNode[] = [
              type,
              { location: this.locationToRange(name.location), text: name.text, type: 'name' },
              iterable!,
              body!,
            ];

            return {
              children,
              location: this.getLocation(start, this.current),
              type: 'for_each_statement',
            };
          } else {
            // Not a for-each, reset and parse as traditional for
            this.current = savedPosForEach;
          }
        } else {
          // Not a for-each, reset
          this.current = savedPosForEach;
        }
      } else {
        // Failed to parse type, reset
        this.current = savedPosForEach;
      }
    }

    // Traditional for loop

    /**
     * Initialization: Could be variable declaration or expression(s).
     * Can be multiple expressions separated by commas: i=0, j=0.
     */
    let init: ParseTreeNode | null = null;
    const initStart = this.current;

    // Try to parse as variable declaration first (without consuming semicolon)
    const savedPosForInit = this.current;
    if (this.checkType()) {
      const type = this.parseType();
      if (type) {
        this.skipWhitespaceAndComments();
        // Check if there's an identifier (variable name) - if so, it's a variable declaration
        if (this.check(TokenType.IDENTIFIER)) {
          const declarations: ParseTreeNode[] = [];

          // Parse declarators (can be multiple, separated by commas)
          while (true) {
            const declStart = this.current;
            this.skipWhitespaceAndComments();
            const name = this.consume(TokenType.IDENTIFIER, 'Expected variable name');
            let initializer: ParseTreeNode | undefined;

            if (this.match(TokenType.ASSIGN)) {
              const expr = this.parseExpression();
              initializer = expr ?? undefined;
            }

            const declChildren: ParseTreeNode[] = [
              type,
              { location: this.locationToRange(name.location), text: name.text, type: 'name' },
            ];
            if (initializer) {
              declChildren.push(initializer);
            }

            declarations.push({
              children: declChildren,
              location: this.getLocation(declStart, this.current),
              type: 'variable_declaration',
            });

            // Check for comma (multiple declarators)
            this.skipWhitespaceAndComments();
            if (!this.match(TokenType.COMMA)) {
              break;
            }
            // Skip whitespace after comma before next declarator
            this.skipWhitespaceAndComments();
          }

          // Create variable declaration statement(s) - don't consume semicolon here
          if (declarations.length > 1) {
            const statementNodes: ParseTreeNode[] = declarations.map((decl) => ({
              children: [decl],
              location: decl.location,
              type: 'variable_declaration_statement',
            }));
            init = {
              children: statementNodes,
              location: this.getLocation(initStart, this.current),
              type: 'block',
            };
          } else {
            init = {
              children: [declarations[0]],
              location: this.getLocation(initStart, this.current),
              type: 'variable_declaration_statement',
            };
          }
        } else {
          // Not a variable declaration, reset
          this.current = savedPosForInit;
        }
      }
    }

    // If not a variable declaration, try parsing as expression(s)
    if (!init) {
      // Check if init is empty (just semicolon)
      if (this.check(TokenType.SEMICOLON)) {
        // Empty init - leave as null
        init = null;
      } else {
        const expressions: ParseTreeNode[] = [];

        // Parse first expression
        const firstExpr = this.parseExpression();
        if (firstExpr) {
          expressions.push(firstExpr);

          // Check for comma-separated expressions
          this.skipWhitespaceAndComments();
          while (this.match(TokenType.COMMA)) {
            this.skipWhitespaceAndComments();
            const expr = this.parseExpression();
            if (expr) {
              expressions.push(expr);
            }
            this.skipWhitespaceAndComments();
          }

          // If multiple expressions, wrap them in a block/compound statement
          if (expressions.length > 1) {
            init = {
              children: expressions.map((expr) => ({
                children: [expr],
                location: expr.location,
                type: 'expression_statement',
              })),
              location: this.getLocation(initStart, this.current),
              type: 'block',
            };
          } else {
            // Single expression - create expression statement
            init = {
              children: [expressions[0]],
              location: expressions[0].location,
              type: 'expression_statement',
            };
          }
        }
      }
    }

    this.skipWhitespaceAndComments();
    this.consume(TokenType.SEMICOLON, 'Expected ; after init');
    this.skipWhitespaceAndComments();

    // Condition: can be empty
    let condition: ParseTreeNode | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.parseExpression();
    }
    this.skipWhitespaceAndComments();
    this.consume(TokenType.SEMICOLON, 'Expected ; after condition');
    this.skipWhitespaceAndComments();

    // Update: can be empty or multiple expressions
    let update: ParseTreeNode | null = null;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      const updateExpressions: ParseTreeNode[] = [];
      const updateStart = this.current;

      const firstUpdate = this.parseExpression();
      if (firstUpdate) {
        updateExpressions.push(firstUpdate);

        // Check for comma-separated update expressions
        this.skipWhitespaceAndComments();
        while (this.match(TokenType.COMMA)) {
          this.skipWhitespaceAndComments();
          const expr = this.parseExpression();
          if (expr) {
            updateExpressions.push(expr);
          }
          this.skipWhitespaceAndComments();
        }

        // If multiple expressions, wrap them
        if (updateExpressions.length > 1) {
          update = {
            children: updateExpressions.map((expr) => ({
              children: [expr],
              location: expr.location,
              type: 'expression_statement',
            })),
            location: this.getLocation(updateStart, this.current),
            type: 'block',
          };
        } else {
          update = firstUpdate;
        }
      }
    }

    this.skipWhitespaceAndComments();
    this.consume(TokenType.RIGHT_PAREN, 'Expected ) after for');
    this.skipWhitespaceAndComments();
    const body = this.parseStatement();

    const children: ParseTreeNode[] = [];
    if (init) children.push(init);
    if (condition) children.push(condition);
    if (update) children.push(update);
    if (body) children.push(body);

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'for_statement',
    };
  }

  /**
   * Parse while statement.
   * @returns The parsed while statement parse tree node.
   */
  private parseWhileStatement(): ParseTreeNode {
    const start = this.current - 1;
    this.skipWhitespaceAndComments();
    this.consume(TokenType.LEFT_PAREN, 'Expected ( after while');
    this.skipWhitespaceAndComments();
    const condition = this.parseExpression();
    this.skipWhitespaceAndComments();
    this.consume(TokenType.RIGHT_PAREN, 'Expected ) after condition');
    this.skipWhitespaceAndComments();
    const body = this.parseStatement();

    const children: ParseTreeNode[] = [];
    if (condition) children.push(condition);
    if (body) children.push(body);

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'while_statement',
    };
  }

  /**
   * Parse do-while statement.
   * @returns The parsed do-while statement parse tree node.
   */
  private parseDoWhileStatement(): ParseTreeNode {
    const start = this.current - 1;
    this.skipWhitespaceAndComments();
    const body = this.parseStatement();
    this.skipWhitespaceAndComments();
    this.consume(TokenType.WHILE, 'Expected while after do');
    this.skipWhitespaceAndComments();
    this.consume(TokenType.LEFT_PAREN, 'Expected ( after while');
    this.skipWhitespaceAndComments();
    const condition = this.parseExpression();
    this.skipWhitespaceAndComments();
    this.consume(TokenType.RIGHT_PAREN, 'Expected ) after condition');
    this.skipWhitespaceAndComments();
    this.consume(TokenType.SEMICOLON, 'Expected ; after do-while');

    const children: ParseTreeNode[] = [];
    if (body) children.push(body);
    if (condition) children.push(condition);

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'do_while_statement',
    };
  }

  /**
   * Parse switch statement.
   * @returns The parsed switch statement parse tree node.
   */
  private parseSwitchStatement(): ParseTreeNode {
    const start = this.current - 1;
    this.skipWhitespaceAndComments();

    // Apex uses "switch on expression" syntax, not "switch (expression)"
    // After match(SWITCH) and skipping whitespace, check if next token is "on"
    if (this.check(TokenType.IDENTIFIER) && this.peek().text.toLowerCase() === 'on') {
      this.advance(); // Consume "on"
      this.skipWhitespaceAndComments();
    } else if (this.check(TokenType.LEFT_PAREN)) {
      // Java-style switch (expression)
      this.consume(TokenType.LEFT_PAREN, 'Expected ( after switch');
    }

    const expression = this.parseExpression();

    if (this.check(TokenType.RIGHT_PAREN)) {
      this.consume(TokenType.RIGHT_PAREN, 'Expected ) after switch expression');
    }

    this.skipWhitespaceAndComments();
    this.consume(TokenType.LEFT_BRACE, 'Expected { after switch');

    const cases: ParseTreeNode[] = [];
    let defaultCase: ParseTreeNode | undefined = undefined;

    this.skipWhitespaceAndComments();
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      // Check for Apex "when" clause
      // "when" is tokenized as IDENTIFIER, so we need to check the text
      const currentToken = this.peek();
      if (
        currentToken?.type === TokenType.IDENTIFIER &&
        currentToken.text.toLowerCase() === 'when'
      ) {
        this.advance(); // Consume "when"
        this.skipWhitespaceAndComments();

        // Check for "when else"
        // "else" can be either ELSE keyword or IDENTIFIER (depending on lexer)
        const nextToken = this.peek();
        const isElse =
          nextToken != null &&
          (nextToken.type === TokenType.ELSE ||
            (nextToken.type === TokenType.IDENTIFIER && nextToken.text.toLowerCase() === 'else'));
        if (isElse) {
          // Consume "else" token
          this.advance(); // Consume ELSE keyword or IDENTIFIER "else"
          this.skipWhitespaceAndComments();
          this.consume(TokenType.LEFT_BRACE, 'Expected { after when else');
          this.skipWhitespaceAndComments();

          const statements: ParseTreeNode[] = [];
          while (!this.isAtEnd()) {
            this.skipWhitespaceAndComments();
            if (this.check(TokenType.RIGHT_BRACE)) {
              break;
            }
            const beforeStmt = this.current;
            const stmt = this.parseStatement();
            if (stmt) {
              statements.push(stmt);
            }
            if (this.current === beforeStmt && !this.isAtEnd()) {
              this.advance();
            }
          }
          this.consume(TokenType.RIGHT_BRACE, 'Expected } after when else block');
          this.skipWhitespaceAndComments();

          defaultCase = {
            children: [{ children: statements, type: 'statements' }],
            location: this.getLocation(start, this.current),
            type: 'switch_case',
          };
        } else {
          // Parse when clause values
          const whenValues: ParseTreeNode[] = [];
          let whenType: ParseTreeNode | null = null;
          let whenVariable: ParseTreeNode | null = null;

          // Check if it's a type declaration: "when Type variable"
          // Pattern: Type (identifier) followed by identifier (variable name)
          // We need to check if we have: identifier (type) + identifier (variable name)
          const savedPos = this.current;

          // Check if we have two consecutive identifiers (type name, then variable name)
          // This is a heuristic: if we see IDENTIFIER + whitespace + IDENTIFIER, it might be "Type variable"
          if (this.checkType()) {
            // Try to parse as type first
            const potentialType = this.parseType();
            if (potentialType) {
              this.skipWhitespaceAndComments();
              // Check if next token is an identifier (variable name)
              // Also check that it's not a keyword or operator that would indicate it's an expression
              if (this.check(TokenType.IDENTIFIER)) {
                const nextToken = this.peek();
                // Make sure it's not a keyword that would be part of an expression
                const isKeyword = ['else', 'when', 'case', 'default'].includes(
                  nextToken.text.toLowerCase()
                );
                if (!isKeyword) {
                  // It's a type declaration: "when Type variable"
                  whenType = potentialType;
                  const varName = this.consume(TokenType.IDENTIFIER, 'Expected variable name');
                  whenVariable = {
                    location: this.locationToRange(varName.location),
                    text: varName.text,
                    type: 'name',
                  };
                } else {
                  // Next token is a keyword, so this is not a type declaration
                  this.current = savedPos;
                  const expr = this.parseExpression();
                  if (expr) {
                    whenValues.push(expr);
                  }
                }
              } else {
                // Not a type declaration (no variable name after type), reset and parse as expression
                this.current = savedPos;
                const expr = this.parseExpression();
                if (expr) {
                  whenValues.push(expr);
                }
              }
            } else {
              // Failed to parse type, reset and parse as expression
              this.current = savedPos;
              const expr = this.parseExpression();
              if (expr) {
                whenValues.push(expr);
              }
            }
          } else {
            // Not a type token, parse as expression
            const expr = this.parseExpression();
            if (expr) {
              whenValues.push(expr);
            }
          }

          // Check for comma-separated values: "when value1, value2"
          this.skipWhitespaceAndComments();
          while (this.match(TokenType.COMMA)) {
            this.skipWhitespaceAndComments();
            const expr = this.parseExpression();
            if (expr) {
              whenValues.push(expr);
            }
            this.skipWhitespaceAndComments();
          }

          this.skipWhitespaceAndComments();
          this.consume(TokenType.LEFT_BRACE, 'Expected { after when clause');
          this.skipWhitespaceAndComments();

          const statements: ParseTreeNode[] = [];
          while (!this.isAtEnd()) {
            this.skipWhitespaceAndComments();
            if (this.check(TokenType.RIGHT_BRACE)) {
              break;
            }
            const beforeStmt = this.current;
            const stmt = this.parseStatement();
            if (stmt) {
              statements.push(stmt);
            }
            if (this.current === beforeStmt && !this.isAtEnd()) {
              this.advance();
            }
          }
          this.consume(TokenType.RIGHT_BRACE, 'Expected } after when block');
          this.skipWhitespaceAndComments();

          // Build the case node structure matching Java-style cases
          // Structure: children array with [value?, statements]
          const caseChildren: ParseTreeNode[] = [];

          if (whenType && whenVariable) {
            // Type matching case: "when Type variable"
            // Create a value node that represents the type matching
            caseChildren.push({
              children: [whenType, whenVariable],
              type: 'type_match',
            });
          } else if (whenValues.length > 0) {
            // Value matching case(s): "when value1, value2" or "when value"
            whenValues.forEach((val) => caseChildren.push(val));
          }

          // Add statements wrapper (matching Java-style case structure)
          caseChildren.push({ children: statements, type: 'statements' });

          cases.push({
            children: caseChildren,
            location: this.getLocation(start, this.current),
            type: 'switch_case',
          });
        }
      } else if (this.match(TokenType.CASE)) {
        // Java-style case
        const caseValue = this.parseExpression();
        this.consume(TokenType.COLON, 'Expected : after case value');

        const statements: ParseTreeNode[] = [];
        while (
          !this.check(TokenType.CASE) &&
          !this.check(TokenType.DEFAULT) &&
          !this.check(TokenType.RIGHT_BRACE) &&
          !this.isAtEnd()
        ) {
          const beforeStmt = this.current;
          const stmt = this.parseStatement();
          if (stmt) {
            statements.push(stmt);
          }
          if (this.current === beforeStmt && !this.isAtEnd()) {
            this.advance();
          }
        }

        cases.push({
          children: [caseValue!, { children: statements, type: 'statements' }],
          location: this.getLocation(start, this.current),
          type: 'switch_case',
        });
      } else if (this.match(TokenType.DEFAULT)) {
        // Java-style default
        this.consume(TokenType.COLON, 'Expected : after default');

        const statements: ParseTreeNode[] = [];
        while (
          !this.check(TokenType.CASE) &&
          !this.check(TokenType.DEFAULT) &&
          !this.check(TokenType.RIGHT_BRACE) &&
          !this.isAtEnd()
        ) {
          const beforeStmt = this.current;
          const stmt = this.parseStatement();
          if (stmt) {
            statements.push(stmt);
          }
          if (this.current === beforeStmt && !this.isAtEnd()) {
            this.advance();
          }
        }

        defaultCase = {
          children: [{ children: statements, type: 'statements' }],
          location: this.getLocation(start, this.current),
          type: 'switch_case',
        };
      } else {
        this.advance();
      }
      this.skipWhitespaceAndComments();
    }

    this.consume(TokenType.RIGHT_BRACE, 'Expected } after switch');

    // Build switch statement with named properties for translator
    // If expression is null, try to parse it again or create a placeholder
    let finalExpression = expression;
    if (!finalExpression) {
      // Try parsing expression one more time, or create a placeholder identifier
      // This allows parsing to continue even if expression parsing failed
      this.skipWhitespaceAndComments();
      const fallbackExpr = this.parsePrimary();
      if (fallbackExpr) {
        finalExpression = fallbackExpr;
      } else {
        // If still null, throw error
        throw new Error('Switch statement requires an expression');
      }
    }

    const switchNode: any = {
      children: [finalExpression],
      expression: finalExpression,
      location: this.getLocation(start, this.current),
      type: 'switch_statement',
    };

    if (cases.length > 0) {
      const casesNode = { children: cases, type: 'cases' };
      switchNode.cases = casesNode;
      switchNode.children ??= [];
      switchNode.children.push(casesNode);
    }

    if (defaultCase != null) {
      switchNode.defaultCase = defaultCase;
      switchNode.children ??= [];
      switchNode.children.push(defaultCase);
    }

    return switchNode;
  }

  /**
   * Parse try statement.
   * @returns The parsed try statement parse tree node.
   */
  private parseTryStatement(): ParseTreeNode {
    const start = this.current - 1;
    this.skipWhitespaceAndComments();
    const tryBlock = this.parseBlock();

    const catchClauses: ParseTreeNode[] = [];
    this.skipWhitespaceAndComments();
    while (this.match(TokenType.CATCH)) {
      this.skipWhitespaceAndComments();
      this.consume(TokenType.LEFT_PAREN, 'Expected ( after catch');
      this.skipWhitespaceAndComments();
      const exceptionType = this.parseType();
      this.skipWhitespaceAndComments();
      const exceptionName = this.consume(TokenType.IDENTIFIER, 'Expected exception variable name');
      this.skipWhitespaceAndComments();
      this.consume(TokenType.RIGHT_PAREN, 'Expected ) after catch parameter');
      this.skipWhitespaceAndComments();
      const catchBlock = this.parseBlock();
      this.skipWhitespaceAndComments();

      catchClauses.push({
        children: [
          exceptionType!,
          {
            location: this.locationToRange(exceptionName.location),
            text: exceptionName.text,
            type: 'name',
          },
          catchBlock,
        ],
        location: this.getLocation(start, this.current),
        type: 'catch_clause',
      });
    }

    let finallyBlock: ParseTreeNode | undefined = undefined;
    this.skipWhitespaceAndComments();
    if (this.match(TokenType.FINALLY)) {
      this.skipWhitespaceAndComments();
      finallyBlock = this.parseBlock();
    }

    const children: ParseTreeNode[] = [tryBlock];
    if (catchClauses.length > 0) {
      children.push({ children: catchClauses, type: 'catch_clauses' });
    }
    if (finallyBlock) {
      children.push(finallyBlock);
    }

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'try_statement',
    };
  }

  /**
   * Parse break statement.
   * @returns The parsed break statement parse tree node.
   */
  private parseBreakStatement(): ParseTreeNode {
    const start = this.current - 1;
    this.skipWhitespaceAndComments();
    this.consume(TokenType.SEMICOLON, 'Expected ; after break');

    return {
      children: [],
      location: this.getLocation(start, this.current),
      type: 'break_statement',
    };
  }

  /**
   * Parse continue statement.
   * @returns The parsed continue statement parse tree node.
   */
  private parseContinueStatement(): ParseTreeNode {
    const start = this.current - 1;
    this.skipWhitespaceAndComments();
    this.consume(TokenType.SEMICOLON, 'Expected ; after continue');

    return {
      children: [],
      location: this.getLocation(start, this.current),
      type: 'continue_statement',
    };
  }

  /**
   * Parse throw statement.
   * @returns The parsed throw statement parse tree node.
   */
  private parseThrowStatement(): ParseTreeNode {
    const start = this.current - 1;
    this.skipWhitespaceAndComments();
    const expression = this.parseExpression();
    this.skipWhitespaceAndComments();
    this.consume(TokenType.SEMICOLON, 'Expected ; after throw');

    const children: ParseTreeNode[] = [];
    if (expression) {
      children.push(expression);
    }

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'throw_statement',
    };
  }

  /**
   * Parse return statement.
   * @returns The parsed return statement parse tree node.
   */
  private parseReturnStatement(): ParseTreeNode {
    const start = this.current - 1;
    let expression: ParseTreeNode | undefined = undefined;

    this.skipWhitespaceAndComments();
    if (!this.check(TokenType.SEMICOLON)) {
      const expr = this.parseExpression();
      expression = expr ?? undefined;
    }

    this.skipWhitespaceAndComments();
    this.consume(TokenType.SEMICOLON, 'Expected ; after return');

    const children: ParseTreeNode[] = [];
    if (expression) {
      children.push(expression);
    }

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'return_statement',
    };
  }

  /**
   * Parse variable declaration.
   * Handles multiple declarators: String s = null, t = 'hello';.
   * @returns The parsed variable declaration parse tree node, or null if parsing fails.
   */
  private parseVariableDeclaration(): ParseTreeNode | null {
    const start = this.current;
    const type = this.parseType();
    if (!type) {
      return null;
    }

    const declarations: ParseTreeNode[] = [];

    // Parse declarators (can be multiple, separated by commas)
    while (true) {
      const declStart = this.current;
      this.skipWhitespaceAndComments();
      const name = this.consume(TokenType.IDENTIFIER, 'Expected variable name');
      let initializer: ParseTreeNode | undefined;

      if (this.match(TokenType.ASSIGN)) {
        const expr = this.parseExpression();
        initializer = expr ?? undefined;
      }

      const declChildren: ParseTreeNode[] = [
        type,
        { location: this.locationToRange(name.location), text: name.text, type: 'name' },
      ];
      if (initializer) {
        declChildren.push(initializer);
      }

      declarations.push({
        children: declChildren,
        location: this.getLocation(declStart, this.current),
        type: 'variable_declaration',
      });

      // Check for comma (multiple declarators)
      this.skipWhitespaceAndComments();
      if (!this.match(TokenType.COMMA)) {
        break;
      }
      // Skip whitespace after comma before next declarator
      this.skipWhitespaceAndComments();
    }

    this.consume(TokenType.SEMICOLON, 'Expected ; after variable declaration');

    // For multiple declarators, we need to create a block/compound statement
    // with multiple variable declaration statements
    if (declarations.length > 1) {
      const statementNodes: ParseTreeNode[] = declarations.map((decl) => ({
        children: [decl], // Put the variable_declaration directly as child
        location: decl.location,
        type: 'variable_declaration_statement',
      }));

      return {
        children: statementNodes,
        location: this.getLocation(start, this.current),
        type: 'block',
      };
    }

    // Single declaration - return as variable_declaration_statement
    // Put the variable_declaration directly as child (translator will look for it)
    return {
      children: [declarations[0]],
      location: this.getLocation(start, this.current),
      type: 'variable_declaration_statement',
    };
  }

  /**
   * Parse type parameters: <T, U extends Bound>.
   * @returns Array of parsed type parameter parse tree nodes.
   */
  private parseTypeParameters(): ParseTreeNode[] {
    this.skipWhitespaceAndComments();
    if (!this.match(TokenType.LESS_THAN)) {
      return [];
    }

    const typeParams: ParseTreeNode[] = [];
    do {
      const param = this.parseTypeParameter();
      if (param) {
        typeParams.push(param);
      }
    } while (this.match(TokenType.COMMA));

    this.consume(TokenType.GREATER_THAN, 'Expected > after type parameters');
    return typeParams;
  }

  /**
   * Parse a single type parameter: T or T extends Bound.
   * @returns The parsed type parameter parse tree node, or null if parsing fails.
   */
  private parseTypeParameter(): ParseTreeNode | null {
    const start = this.current;
    const name = this.consume(TokenType.IDENTIFIER, 'Expected type parameter name');

    let extendsBound: ParseTreeNode | undefined = undefined;
    if (this.match(TokenType.EXTENDS)) {
      const bound = this.parseType();
      if (bound) {
        extendsBound = bound;
      }
    }

    const children: ParseTreeNode[] = [
      { location: this.locationToRange(name.location), text: name.text, type: 'name' },
    ];
    if (extendsBound) {
      children.push(extendsBound);
    }

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'type_parameter',
    };
  }

  /**
   * Parse type (supports arrays, generics, qualified types, etc.).
   * @returns The parsed type parse tree node, or null if parsing fails.
   */
  private parseType(): ParseTreeNode | null {
    this.skipWhitespaceAndComments();
    if (!this.checkType()) {
      return null;
    }

    const start = this.current;

    /**
     * Consume the type token (INTEGER, STRING, IDENTIFIER, etc.).
     */
    const baseType = this.advance();

    // Parse qualified type parts (e.g., A.B.C.D)
    let qualifiedName = baseType.text;
    while (this.match(TokenType.DOT)) {
      this.skipWhitespaceAndComments();
      if (this.check(TokenType.IDENTIFIER)) {
        const nextPart = this.advance();
        qualifiedName += '.' + nextPart.text;
      } else {
        // If we can't parse the next part, break
        break;
      }
    }

    // Parse generic type parameters
    let typeArguments: ParseTreeNode[] | undefined = undefined;
    if (this.match(TokenType.LESS_THAN)) {
      typeArguments = [];
      this.skipWhitespaceAndComments();
      // Parse at least one type argument
      const firstTypeArg = this.parseType();
      if (!firstTypeArg) {
        // If we can't parse the first type argument, we still need to consume the >
        // This handles malformed generics gracefully
        this.skipWhitespaceAndComments();
        this.consume(TokenType.GREATER_THAN, 'Expected > after <');
        // Return type with empty type arguments
      } else {
        typeArguments.push(firstTypeArg);
        // Parse additional type arguments separated by commas
        while (this.match(TokenType.COMMA)) {
          this.skipWhitespaceAndComments();
          const typeArg = this.parseType();
          if (typeArg) {
            typeArguments.push(typeArg);
          } else {
            // If we can't parse a type argument after comma, break
            break;
          }
        }
        // Always consume the closing >
        this.skipWhitespaceAndComments();
        this.consume(TokenType.GREATER_THAN, 'Expected > after type arguments');
      }
    }

    // Parse array brackets (only empty brackets [] for array dimensions)
    // Don't consume [size] - that's handled by the caller (e.g., new Type[size])
    let arrayDimensions = 0;
    while (this.check(TokenType.LEFT_BRACKET)) {
      // Peek ahead to see if it's empty brackets [] or [size]
      const savedPos = this.current;
      this.advance(); // Consume [
      this.skipWhitespaceAndComments();
      if (this.check(TokenType.RIGHT_BRACKET)) {
        // Empty brackets - consume ]
        this.advance(); // Consume ]
        arrayDimensions++;
      } else {
        // Not an empty bracket, it's [size] - don't consume, let caller handle it
        // Back up to before the [
        this.current = savedPos;
        break;
      }
    }

    const children: ParseTreeNode[] = [
      { location: this.locationToRange(baseType.location), text: qualifiedName, type: 'base_type' },
    ];

    if (typeArguments && typeArguments.length > 0) {
      children.push({ children: typeArguments, type: 'type_arguments' });
    }

    if (arrayDimensions > 0) {
      children.push({ text: arrayDimensions.toString(), type: 'array_dimensions' });
    }

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'type',
    };
  }

  /**
   * Check if current token is a type.
   * @returns True if the current token represents a type.
   */
  private checkType(): boolean {
    return this.check(
      TokenType.INTEGER,
      TokenType.STRING,
      TokenType.BOOLEAN,
      TokenType.DECIMAL,
      TokenType.DOUBLE,
      TokenType.LONG,
      TokenType.DATE,
      TokenType.DATETIME,
      TokenType.ID,
      TokenType.BLOB,
      TokenType.OBJECT,
      TokenType.VOID,
      TokenType.IDENTIFIER
    );
  }

  /**
   * Parse expression.
   * @returns The parsed expression parse tree node, or null if parsing fails.
   */
  private parseExpression(): ParseTreeNode | null {
    return this.parseAssignment();
  }

  /**
   * Parse assignment expression.
   * @returns The parsed assignment expression parse tree node, or null if parsing fails.
   */
  private parseAssignment(): ParseTreeNode | null {
    let expr = this.parseTernary();

    if (
      this.match(
        TokenType.ASSIGN,
        TokenType.PLUS_ASSIGN,
        TokenType.MINUS_ASSIGN,
        TokenType.MULTIPLY_ASSIGN,
        TokenType.DIVIDE_ASSIGN,
        TokenType.AND_ASSIGN,
        TokenType.OR_ASSIGN,
        TokenType.XOR_ASSIGN,
        TokenType.LEFT_SHIFT_ASSIGN,
        TokenType.RIGHT_SHIFT_ASSIGN,
        TokenType.RIGHT_SHIFT_UNSIGNED_ASSIGN
      )
    ) {
      const operator = this.previous();
      const right = this.parseAssignment();
      if (right != null && expr?.location != null && right.location != null) {
        return {
          children: [expr, right],
          location: this.combineLocations(expr.location, right.location),
          operator: operator.text,
          type: 'binary_expression',
        };
      }
    }

    return expr;
  }

  /**
   * Parse ternary/null-coalescing expression.
   * @returns The parsed ternary expression parse tree node, or null if parsing fails.
   */
  private parseTernary(): ParseTreeNode | null {
    let expr = this.parseOr();

    // Null coalescing operator ??
    while (this.match(TokenType.NULL_COALESCING)) {
      const operator = this.previous();
      const right = this.parseTernary();
      if (right != null && expr?.location != null && right.location != null) {
        expr = {
          children: [expr, right],
          location: this.combineLocations(expr.location, right.location),
          operator: operator.text,
          type: 'binary_expression',
        };
      }
    }

    // Ternary operator ? :
    if (this.match(TokenType.QUESTION)) {
      const thenExpr = this.parseExpression();
      this.consume(TokenType.COLON, 'Expected : in ternary expression');
      const elseExpr = this.parseTernary();
      if (thenExpr && elseExpr && expr) {
        expr = {
          children: [expr, thenExpr, elseExpr],
          location:
            expr.location != null && thenExpr.location != null && elseExpr.location != null
              ? this.combineLocations(expr.location, elseExpr.location)
              : this.getLocation(this.current - 3, this.current),
          type: 'ternary_expression',
        };
      }
    }

    return expr;
  }

  /**
   * Parse OR expression.
   */

  /**
   * Parse logical OR expression.
   * @returns The parsed OR expression parse tree node, or null if parsing fails.
   */
  private parseOr(): ParseTreeNode | null {
    let expr = this.parseAnd();

    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.parseAnd();
      if (right != null && expr?.location != null && right.location != null) {
        expr = {
          children: [expr, right],
          location: this.combineLocations(expr.location, right.location),
          operator: operator.text,
          type: 'binary_expression',
        };
      }
    }

    return expr;
  }

  /**
   * Parse AND expression.
   */

  /**
   * Parse logical AND expression.
   * @returns The parsed AND expression parse tree node, or null if parsing fails.
   */
  private parseAnd(): ParseTreeNode | null {
    let expr = this.parseEquality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.parseEquality();
      if (right) {
        expr = {
          children: [expr!, right],
          location:
            expr?.location != null && right.location != null
              ? this.combineLocations(expr.location, right.location)
              : (right.location ?? this.getLocation(this.current - 1, this.current)),
          operator: operator.text,
          type: 'binary_expression',
        };
      }
    }

    return expr;
  }

  /**
   * Parse equality expression.
   */

  /**
   * Parse equality expression (==, !=).
   * @returns The parsed equality expression parse tree node, or null if parsing fails.
   */
  private parseEquality(): ParseTreeNode | null {
    let expr = this.parseComparison();

    while (this.match(TokenType.EQUALS, TokenType.NOT_EQUALS)) {
      const operator = this.previous();
      const right = this.parseComparison();
      if (right) {
        expr = {
          children: [expr!, right],
          location:
            expr?.location != null && right.location != null
              ? this.combineLocations(expr.location, right.location)
              : (right.location ?? this.getLocation(this.current - 1, this.current)),
          operator: operator.text,
          type: 'binary_expression',
        };
      }
    }

    return expr;
  }

  /**
   * Parse comparison expression (includes instanceof).
   */

  /**
   * Parse comparison expression (<, >, <=, >=).
   * @returns The parsed comparison expression parse tree node, or null if parsing fails.
   */
  private parseComparison(): ParseTreeNode | null {
    let expr = this.parseAddition();

    while (
      this.match(
        TokenType.LESS_THAN,
        TokenType.LESS_EQUAL,
        TokenType.GREATER_THAN,
        TokenType.GREATER_EQUAL
      )
    ) {
      const operator = this.previous();
      const right = this.parseAddition();
      if (right) {
        expr = {
          children: [expr!, right],
          location:
            expr?.location != null && right.location != null
              ? this.combineLocations(expr.location, right.location)
              : (right.location ?? this.getLocation(this.current - 1, this.current)),
          operator: operator.text,
          type: 'binary_expression',
        };
      }
    }

    // Check for instanceof (as identifier keyword)
    if (expr && this.check(TokenType.IDENTIFIER)) {
      const nextToken = this.peek();
      if (nextToken.text.toLowerCase() === 'instanceof') {
        this.advance(); // Skip 'instanceof'
        const right = this.parseType();
        if (right) {
          expr = {
            children: [expr, right],
            location:
              expr.location != null && right.location != null
                ? this.combineLocations(expr.location, right.location)
                : (right.location ?? this.getLocation(this.current - 1, this.current)),
            type: 'instanceof_expression',
          };
        }
      }
    }

    return expr;
  }

  /**
   * Parse addition expression.
   */

  /**
   * Parse addition/subtraction expression (+, -).
   * @returns The parsed addition expression parse tree node, or null if parsing fails.
   */
  private parseAddition(): ParseTreeNode | null {
    let expr = this.parseMultiplication();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.parseMultiplication();
      if (right) {
        expr = {
          children: [expr!, right],
          location:
            expr?.location != null && right.location != null
              ? this.combineLocations(expr.location, right.location)
              : (right.location ?? this.getLocation(this.current - 1, this.current)),
          operator: operator.text,
          type: 'binary_expression',
        };
      }
    }

    return expr;
  }

  /**
   * Parse multiplication expression.
   */

  /**
   * Parse multiplication/division/modulo expression (*, /, %).
   * @returns The parsed multiplication expression parse tree node, or null if parsing fails.
   */
  private parseMultiplication(): ParseTreeNode | null {
    let expr = this.parseUnary();

    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO)) {
      const operator = this.previous();
      const right = this.parseUnary();
      if (right != null) {
        expr = {
          children: [expr!, right],
          location:
            expr?.location != null && right.location != null
              ? this.combineLocations(expr.location, right.location)
              : (right.location ?? this.getLocation(this.current - 1, this.current)),
          operator: operator.text,
          type: 'binary_expression',
        };
      }
    }

    return expr;
  }

  /**
   * Parse unary expression (prefix and postfix).
   */
  private parseUnary(): ParseTreeNode | null {
    // Prefix operators
    if (
      this.match(
        TokenType.NOT,
        TokenType.MINUS,
        TokenType.PLUS,
        TokenType.INCREMENT,
        TokenType.DECREMENT
      )
    ) {
      const operator = this.previous();
      const right = this.parseUnary();
      if (right?.location) {
        return {
          children: [right],
          location: this.combineLocations(this.locationToRange(operator.location), right.location),
          operator: operator.text,
          prefix: true,
          type: 'unary_expression',
        };
      }
    }

    let expr = this.parsePrimary();
    if (!expr) {
      return null;
    }

    // Postfix operators (increment/decrement)
    while (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
      const operator = this.previous();
      expr = {
        children: [expr],
        location: this.combineLocations(
          expr.location ?? this.getLocation(this.current - 1, this.current),
          this.locationToRange(operator.location)
        ),
        operator: operator.text,
        prefix: false,
        type: 'unary_expression',
      };
    }

    // Handle postfix operations (method calls, field access, array access) for super/this expressions
    // This allows super(x, y) and this(x, y) to be parsed as method calls
    if (expr != null && (expr.type === 'super_expression' || expr.type === 'this_expression')) {
      // Get the token that created this expression (super or this)
      const token = this.tokens[this.current - 1];
      // Parse postfix operations (method calls, field access, array access)
      while (true) {
        // Check for safe navigation operator ?. or ?(
        const isSafe =
          this.check(TokenType.QUESTION) &&
          (this.peek(1)?.type === TokenType.DOT || this.peek(1)?.type === TokenType.LEFT_PAREN);

        if (isSafe) {
          this.advance(); // Consume QUESTION
        }

        if (this.match(TokenType.LEFT_PAREN)) {
          // Method call
          const args: ParseTreeNode[] = [];
          if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
              const beforeArg = this.current;
              const arg = this.parseExpression();
              if (arg) {
                args.push(arg);
              }
              // Safety check: ensure we always advance
              if (this.current === beforeArg && !this.isAtEnd()) {
                this.advance();
              }
            } while (this.match(TokenType.COMMA));
          }
          this.consume(TokenType.RIGHT_PAREN, 'Expected ) after arguments');

          if (!expr) {
            break;
          }
          const methodCallNode: any = {
            children: [expr, { children: args, type: 'arguments' }],
            location: this.combineLocations(
              expr.location ?? this.locationToRange(token.location),
              this.getLocation(this.current - 1, this.current)
            ),
            type: 'method_call_expression',
          };
          if (isSafe) {
            methodCallNode.isSafe = true;
          }
          expr = methodCallNode;
        } else if (this.match(TokenType.DOT)) {
          // Field access
          if (!expr) {
            break;
          }
          // Special case: .class is a class literal (e.g., Object.class)
          let field: Token;
          if (this.check(TokenType.CLASS)) {
            // Handle .class as a special field access
            field = this.advance();
          } else {
            field = this.consume(TokenType.IDENTIFIER, 'Expected field name');
          }
          const fieldAccessNode: any = {
            children: [
              expr,
              { location: this.locationToRange(field.location), text: field.text, type: 'field' },
            ],
            location: this.combineLocations(
              expr.location ?? this.locationToRange(token.location),
              this.locationToRange(field.location)
            ),
            type: 'field_access_expression',
          };
          if (isSafe) {
            fieldAccessNode.isSafe = true;
          }
          expr = fieldAccessNode;
        } else if (this.match(TokenType.LEFT_BRACKET)) {
          // Array access
          if (!expr) {
            break;
          }
          const index = this.parseExpression();
          if (!index) {
            break;
          }
          this.consume(TokenType.RIGHT_BRACKET, 'Expected ] after array index');
          expr = {
            children: [expr, index],
            location: this.combineLocations(
              expr.location ?? this.locationToRange(token.location),
              this.getLocation(this.current - 1, this.current)
            ),
            type: 'array_access_expression',
          };
        } else {
          break;
        }
      }
    }

    return expr;
  }

  /**
   * Parse primary expression.
   */
  private parsePrimary(): ParseTreeNode | null {
    if (this.match(TokenType.BOOLEAN_LITERAL, TokenType.TRUE, TokenType.FALSE)) {
      const token = this.previous();
      return {
        location: this.locationToRange(token.location),
        text: token.text,
        type: 'boolean_literal',
      };
    }

    if (this.match(TokenType.NULL, TokenType.NULL_LITERAL)) {
      const token = this.previous();
      return {
        location: this.locationToRange(token.location),
        text: token.text,
        type: 'null_literal',
      };
    }

    if (this.match(TokenType.STRING_LITERAL)) {
      const token = this.previous();
      return {
        location: this.locationToRange(token.location),
        text: token.text,
        type: 'string_literal',
      };
    }

    if (this.match(TokenType.NUMBER_LITERAL)) {
      const token = this.previous();
      return {
        location: this.locationToRange(token.location),
        text: token.text,
        type: 'number_literal',
      };
    }

    if (this.match(TokenType.THIS)) {
      const token = this.previous();
      return {
        location: this.locationToRange(token.location),
        text: token.text,
        type: 'this_expression',
      };
    }

    if (this.match(TokenType.SUPER)) {
      const token = this.previous();
      return {
        location: this.locationToRange(token.location),
        text: token.text,
        type: 'super_expression',
      };
    }

    if (this.match(TokenType.NEW)) {
      return this.parseNewExpression();
    }

    // SOQL/SOSL query: [SELECT ... FROM ...] or [FIND ... IN ... RETURNING ...]
    if (this.match(TokenType.LEFT_BRACKET)) {
      return this.parseSoqlSoslQuery();
    }

    // Lambda expression: (params) => body or (Type param) => body
    // Cast expression: (Type) expression
    // Parenthesized expression: (expression)
    if (this.match(TokenType.LEFT_PAREN)) {
      const savedPos = this.current;

      // Try to parse as lambda: check if we have parameters followed by =>
      const lambdaParams: ParseTreeNode[] = [];
      let isLambda = false;

      // Check if it's a lambda by looking ahead for =>
      if (!this.isAtEnd()) {
        // Try to parse parameters
        const testParam = this.parseLambdaParameter();
        if (testParam) {
          lambdaParams.push(testParam);
          // Check for more parameters
          while (this.match(TokenType.COMMA)) {
            const param = this.parseLambdaParameter();
            if (param) {
              lambdaParams.push(param);
            } else {
              break;
            }
          }
          // If we have parameters, check if next is ) followed by =>
          if (this.check(TokenType.RIGHT_PAREN)) {
            // Temporarily consume ) and check for =>
            this.advance(); // Consume )
            if (this.check(TokenType.ARROW)) {
              isLambda = true;
            } else {
              // Not a lambda, reset
              this.current = savedPos;
            }
          } else {
            // No closing paren, not a lambda
            this.current = savedPos;
          }
        } else {
          // Could be empty lambda: () =>
          if (this.check(TokenType.RIGHT_PAREN)) {
            this.advance(); // Consume )
            if (this.check(TokenType.ARROW)) {
              isLambda = true;
            } else {
              this.current = savedPos;
            }
          } else {
            // Reset to check for cast or parenthesized
            this.current = savedPos;
          }
        }
      }

      if (isLambda) {
        // We already consumed ) if it's a lambda, now consume =>
        this.consume(TokenType.ARROW, 'Expected => after lambda parameters');

        // Lambda body can be an expression or a block
        let body: ParseTreeNode;
        if (this.check(TokenType.LEFT_BRACE)) {
          // Block body: { statements }
          body = this.parseBlock();
        } else {
          // Expression body
          const expr = this.parseExpression();
          if (!expr) {
            throw new Error('Expected lambda body expression or block');
          }
          body = expr;
        }

        return {
          children: [{ children: lambdaParams, type: 'parameters' }, body],
          location: this.getLocation(savedPos - 1, this.current),
          type: 'lambda_expression',
        };
      }

      // Not a lambda, check for cast
      // Save position before trying to parse type
      // const beforeTypePos = this.current; // Unused
      const potentialType = this.parseType();
      if (potentialType?.location != null && this.check(TokenType.RIGHT_PAREN)) {
        // It's a cast: (Type) expression
        this.consume(TokenType.RIGHT_PAREN, 'Expected ) after cast type');
        const expr = this.parseUnary();
        if (expr?.location != null) {
          return {
            children: [potentialType, expr],
            location: this.combineLocations(potentialType.location, expr.location),
            type: 'cast_expression',
          };
        }
      }
      // Not a cast, reset to before type parsing and parse as parenthesized expression
      this.current = savedPos;
      // Now parse as parenthesized expression - we're at the position after LEFT_PAREN
      const expr = this.parseExpression();
      this.consume(TokenType.RIGHT_PAREN, 'Expected ) after expression');
      return {
        children: [expr!],
        location: this.getLocation(savedPos - 1, this.current),
        type: 'parenthesized_expression',
      };
    }

    // Type keywords can be used as identifiers in expressions (e.g., Object.class)
    // Also check for TRIGGER keyword which is used in Trigger context variables
    if (
      this.match(
        TokenType.IDENTIFIER,
        TokenType.ID,
        TokenType.INTEGER,
        TokenType.STRING,
        TokenType.BOOLEAN,
        TokenType.DECIMAL,
        TokenType.DOUBLE,
        TokenType.LONG,
        TokenType.DATE,
        TokenType.DATETIME,
        TokenType.BLOB,
        TokenType.OBJECT,
        TokenType.TRIGGER
      )
    ) {
      const token = this.previous();
      let expr: ParseTreeNode = {
        location: this.locationToRange(token.location),
        text: token.text,
        type: 'identifier',
      };

      // Check for trigger context variables: Trigger.new, Trigger.old, etc.
      // Handle both IDENTIFIER("trigger") and TRIGGER keyword
      if (
        (token.type === TokenType.TRIGGER || token.text.toLowerCase() === 'trigger') &&
        this.match(TokenType.DOT)
      ) {
        // Trigger context variables can be keywords (new) or identifiers (old, isInsert, etc.)
        let triggerVar: Token;
        const nextToken = this.peek();
        if (nextToken?.type === TokenType.NEW) {
          // Consume NEW keyword token
          triggerVar = this.advance();
        } else {
          // Consume identifier token (for old, isInsert, etc.)
          triggerVar = this.consume(TokenType.IDENTIFIER, 'Expected trigger context variable');
        }
        const triggerVarName = triggerVar.text.toLowerCase();
        if (
          [
            'new',
            'old',
            'newmap',
            'oldmap',
            'size',
            'isinsert',
            'isupdate',
            'isdelete',
            'isundelete',
            'isbefore',
            'isafter',
            'isexecuting',
          ].includes(triggerVarName)
        ) {
          expr = {
            location: this.combineLocations(
              this.locationToRange(token.location),
              this.locationToRange(triggerVar.location)
            ),
            text: `Trigger.${triggerVar.text}`,
            type: 'trigger_context_variable',
          };
          // Continue parsing postfix operations
        } else {
          // Not a trigger context variable, treat as regular field access
          expr = {
            children: [
              expr,
              {
                location: this.locationToRange(triggerVar.location),
                text: triggerVar.text,
                type: 'field',
              },
            ],
            location: this.combineLocations(
              expr.location ?? this.locationToRange(token.location),
              this.locationToRange(triggerVar.location)
            ),
            type: 'field_access_expression',
          };
        }
      }

      // Parse postfix operations (method calls, field access, array access)
      while (true) {
        // Check for safe navigation operator ?. or ?(
        const isSafe =
          this.check(TokenType.QUESTION) &&
          (this.peek(1)?.type === TokenType.DOT || this.peek(1)?.type === TokenType.LEFT_PAREN);

        if (isSafe) {
          this.advance(); // Consume QUESTION
        }

        if (this.match(TokenType.LEFT_PAREN)) {
          // Method call
          const args: ParseTreeNode[] = [];
          if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
              const beforeArg = this.current;
              const arg = this.parseExpression();
              if (arg) {
                args.push(arg);
              }
              // Safety check: ensure we always advance
              if (this.current === beforeArg && !this.isAtEnd()) {
                this.advance();
              }
            } while (this.match(TokenType.COMMA));
          }
          this.consume(TokenType.RIGHT_PAREN, 'Expected ) after arguments');

          const methodCallNode: any = {
            children: [expr, { children: args, type: 'arguments' }],
            location: this.combineLocations(
              expr.location ?? this.locationToRange(token.location),
              this.getLocation(this.current - 1, this.current)
            ),
            type: 'method_call_expression',
          };
          if (isSafe) {
            methodCallNode.isSafe = true;
          }
          expr = methodCallNode;
        } else if (this.match(TokenType.DOT)) {
          // Field access
          // Special case: .class is a class literal (e.g., Object.class)
          let field: Token;
          if (this.check(TokenType.CLASS)) {
            // Handle .class as a special field access
            field = this.advance();
          } else {
            field = this.consume(TokenType.IDENTIFIER, 'Expected field name');
          }
          const fieldAccessNode: any = {
            children: [
              expr,
              { location: this.locationToRange(field.location), text: field.text, type: 'field' },
            ],
            location: this.combineLocations(
              expr.location ?? this.locationToRange(token.location),
              this.locationToRange(field.location)
            ),
            type: 'field_access_expression',
          };
          if (isSafe) {
            fieldAccessNode.isSafe = true;
          }
          expr = fieldAccessNode;
        } else if (this.match(TokenType.LEFT_BRACKET)) {
          // Array access
          const index = this.parseExpression();
          this.consume(TokenType.RIGHT_BRACKET, 'Expected ] after array index');
          expr = {
            children: [expr, index!],
            location: this.combineLocations(
              expr.location ?? this.locationToRange(token.location),
              this.getLocation(this.current - 1, this.current)
            ),
            type: 'array_access_expression',
          };
        } else {
          break;
        }
      }

      return expr;
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RIGHT_PAREN, 'Expected ) after expression');
      return {
        children: [expr!],
        location: this.getLocation(this.current - 2, this.current),
        type: 'parenthesized_expression',
      };
    }

    return null;
  }

  /**
   * Parse lambda parameter (for lambda expressions)
   * Can be: identifier or Type identifier.
   */
  private parseLambdaParameter(): ParseTreeNode | null {
    // Try to parse as typed parameter: Type name
    const savedPos = this.current;
    const type = this.parseType();
    if (type && this.check(TokenType.IDENTIFIER)) {
      const name = this.consume(TokenType.IDENTIFIER, 'Expected parameter name');
      return {
        children: [
          type,
          { location: this.locationToRange(name.location), text: name.text, type: 'name' },
        ],
        location: this.getLocation(savedPos, this.current),
        type: 'lambda_parameter',
      };
    }

    // Reset and try as untyped parameter: just identifier
    this.current = savedPos;
    if (this.check(TokenType.IDENTIFIER)) {
      const name = this.consume(TokenType.IDENTIFIER, 'Expected parameter name');
      return {
        children: [
          { location: this.locationToRange(name.location), text: name.text, type: 'name' },
        ],
        location: this.locationToRange(name.location),
        type: 'lambda_parameter',
      };
    }

    return null;
  }

  /**
   * Parse SOQL/SOSL query.
   */
  private parseSoqlSoslQuery(): ParseTreeNode {
    const start = this.current - 1;

    /**
     * Start of actual query text (after [).
     */
    const queryStart = this.current;
    let queryText = '';

    // Read until matching ]
    let depth = 1;
    while (depth > 0 && !this.isAtEnd()) {
      const token = this.peek();
      if (token.type === TokenType.LEFT_BRACKET) {
        depth++;
      } else if (token.type === TokenType.RIGHT_BRACKET) {
        depth--;
      }
      if (depth > 0) {
        queryText += token.text;
        this.advance();
      }
    }

    // Consume the closing ]
    if (this.match(TokenType.RIGHT_BRACKET)) {
      // Already consumed by the loop
    }

    // Determine if it's SOQL or SOSL
    const isSosl = queryText.toLowerCase().includes('find');
    const queryType = isSosl ? 'sosl_query' : 'soql_query';

    // Extract bound expressions (e.g., :variableName), excluding those in // line comments
    const boundExpressions: ParseTreeNode[] = [];
    const queryTextWithoutLineComments = queryText
      .split('\n')
      .map((line) => {
        const i = line.indexOf('//');
        return i >= 0 ? line.substring(0, i) : line;
      })
      .join('\n');
    const bindingRegex = /:(\w+)/g;
    let match;
    while ((match = bindingRegex.exec(queryTextWithoutLineComments)) !== null) {
      // For now, we'll extract the binding name
      // In a full implementation, we'd need to parse the actual expression
      boundExpressions.push({
        location: this.getLocation(
          queryStart + match.index + 1,
          queryStart + match.index + 1 + match[1].length
        ),
        text: match[1],
        type: 'identifier',
      });
    }

    const children: ParseTreeNode[] = [];
    if (boundExpressions.length > 0) {
      children.push({ children: boundExpressions, type: 'bound_expressions' });
    }

    return {
      children,
      location: this.getLocation(start, this.current),
      text: queryText, // Query text without brackets
      type: queryType,
    };
  }

  /**
   * Parse new expression.
   */
  private parseNewExpression(): ParseTreeNode {
    const start = this.current - 1;
    // Don't skip whitespace here - parseType() will do it
    const type = this.parseType();
    if (!type) {
      throw new Error('Expected type after new');
    }

    // Check for array creation: new Type[size]
    // Skip whitespace before checking for [
    this.skipWhitespaceAndComments();
    if (this.match(TokenType.LEFT_BRACKET)) {
      this.skipWhitespaceAndComments();
      const size = this.parseExpression();
      if (!size) {
        throw new Error('Expected expression for array size');
      }
      this.skipWhitespaceAndComments();
      this.consume(TokenType.RIGHT_BRACKET, 'Expected ] after array size');
      return {
        children: [type, size],
        location: this.getLocation(start, this.current),
        type: 'new_array_expression',
      };
    }

    // Check for collection initializer: new List<Type>{...} or new Set<Type>{...} or new Map<K,V>{...}
    if (this.match(TokenType.LEFT_BRACE)) {
      const initializers: ParseTreeNode[] = [];
      if (!this.check(TokenType.RIGHT_BRACE)) {
        do {
          // For Map, entries are key => value, for List/Set just values
          const savedPos = this.current;
          const firstExpr = this.parseExpression();
          if (firstExpr && this.match(TokenType.ARROW)) {
            // It's a Map entry: key => value
            const secondExpr = this.parseExpression();
            if (secondExpr) {
              initializers.push({
                children: [firstExpr, secondExpr],
                location: this.combineLocations(
                  firstExpr.location ?? this.getLocation(savedPos, this.current),
                  secondExpr.location ?? this.getLocation(this.current - 1, this.current)
                ),
                type: 'map_entry',
              });
            }
          } else if (firstExpr) {
            // It's a List/Set value
            initializers.push(firstExpr);
          }
          // Safety check: ensure we always advance
          if (
            this.current === savedPos &&
            !this.isAtEnd() &&
            !this.check(TokenType.COMMA) &&
            !this.check(TokenType.RIGHT_BRACE)
          ) {
            this.advance();
          }
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RIGHT_BRACE, 'Expected } after collection initializer');

      const children: ParseTreeNode[] = [type];
      // Always create arrayInitializer node, even if empty (for empty List/Set/Map initializers)
      children.push({ children: initializers, type: 'arrayInitializer' });

      const newNode = {
        children,
        location: this.getLocation(start, this.current),
        type: 'new_expression',
      };
      return newNode;
    }

    // Regular constructor call
    this.consume(TokenType.LEFT_PAREN, 'Expected ( after new type');
    const args: ParseTreeNode[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        const beforeArg = this.current;
        const arg = this.parseExpression();
        if (arg) {
          args.push(arg);
        }
        // Safety check: ensure we always advance
        if (this.current === beforeArg && !this.isAtEnd()) {
          this.advance();
        }
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RIGHT_PAREN, 'Expected ) after constructor arguments');

    const children: ParseTreeNode[] = [type];
    if (args.length > 0) {
      children.push({ children: args, type: 'arguments' });
    }

    return {
      children,
      location: this.getLocation(start, this.current),
      type: 'new_expression',
    };
  }

  // Helper methods

  private match(...types: TokenType[]): boolean {
    this.skipWhitespaceAndComments();
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType, ...types: TokenType[]): boolean {
    // If we have pending > tokens from RIGHT_SHIFT, and we're checking for GREATER_THAN, return true
    if (type === TokenType.GREATER_THAN && this.pendingGreaterThan > 0) {
      return true;
    }
    if (this.isAtEnd()) {
      return false;
    }
    if (this.peek().type === type) {
      return true;
    }
    // Also check for RIGHT_SHIFT if we're looking for GREATER_THAN
    if (type === TokenType.GREATER_THAN && this.peek().type === TokenType.RIGHT_SHIFT) {
      return true;
    }
    for (const t of types) {
      if (this.peek().type === t) {
        return true;
      }
      // Also check for RIGHT_SHIFT if we're looking for GREATER_THAN
      if (t === TokenType.GREATER_THAN && this.peek().type === TokenType.RIGHT_SHIFT) {
        return true;
      }
    }
    return false;
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(offset = 0): Token {
    const pos = this.current + offset;
    return this.tokens[pos] ?? this.tokens[this.tokens.length - 1];
  }

  private previous(): Token {
    return this.tokens[this.current - 1] ?? this.tokens[0];
  }

  private consume(type: TokenType, message: string): Token {
    // If we have pending > tokens from RIGHT_SHIFT, use one of them
    if (type === TokenType.GREATER_THAN && this.pendingGreaterThan > 0) {
      this.pendingGreaterThan--;
      // Return a synthetic GREATER_THAN token
      const currentToken = this.peek();
      return {
        location: currentToken.location,
        text: '>',
        type: TokenType.GREATER_THAN,
      };
    }

    // If we're consuming GREATER_THAN but encounter RIGHT_SHIFT, split it
    if (
      type === TokenType.GREATER_THAN &&
      !this.isAtEnd() &&
      this.peek().type === TokenType.RIGHT_SHIFT
    ) {
      this.advance(); // Consume the RIGHT_SHIFT
      this.pendingGreaterThan++; // Mark that we have one more > available
      // Return a synthetic GREATER_THAN token
      const consumedToken = this.previous();
      return {
        location: consumedToken.location,
        text: '>',
        type: TokenType.GREATER_THAN,
      };
    }

    if (this.check(type)) {
      return this.advance();
    }
    throw new Error(message);
  }

  private skipWhitespaceAndComments(): void {
    while (
      !this.isAtEnd() &&
      (this.peek().type === TokenType.WHITESPACE ||
        this.peek().type === TokenType.LINE_COMMENT ||
        this.peek().type === TokenType.BLOCK_COMMENT ||
        this.peek().type === TokenType.NEWLINE)
    ) {
      this.advance();
    }
  }

  private getLocation(start: number, end: number): SourceRange {
    const startToken = this.tokens[Math.min(start, this.tokens.length - 1)];
    let endToken = this.tokens[Math.min(end - 1, this.tokens.length - 1)];

    let endLocation = endToken?.location ?? { column: 1, line: 1 };

    // If we're at EOF, check if source has trailing newline/whitespace
    if (end >= this.tokens.length - 1 && endToken?.type === TokenType.EOF) {
      // Count lines in source
      const lines = this.source.split(/\r?\n/);
      const lastLineNum = lines.length;

      // Check if source ends with newline
      if (this.source.endsWith('\n') || this.source.endsWith('\r\n')) {
        // If source ends with newline, the split creates an empty line at the end
        // So lines.length already includes that empty line
        // The end location should be on that last line (which is empty), column 0 (1-based)
        endLocation = {
          column: 0,
          line: lastLineNum,
        };
      } else if (this.source.endsWith(' ') || this.source.endsWith('\t')) {
        // Source ends with whitespace (but not newline)
        const lastLine = lines[lastLineNum - 1] || '';
        endLocation = {
          column: lastLine.length + 1, // +1 because columns are 1-based
          line: lastLineNum,
        };
      } else {
        // Use the last non-EOF token's location and extend to end of that token
        const lastNonEofToken = this.tokens[this.tokens.length - 2];
        if (lastNonEofToken != null) {
          endLocation = {
            column: lastNonEofToken.location.column + (lastNonEofToken.text?.length || 0),
            line: lastNonEofToken.location.line,
          };
        }
      }
    }

    return {
      end: endLocation,
      start: startToken?.location ?? { column: 1, line: 1 },
    };
  }

  private locationToRange(location: SourceLocation): SourceRange {
    return {
      end: location,
      start: location,
    };
  }

  private combineLocations(loc1: SourceRange, loc2: SourceRange): SourceRange {
    return {
      end: loc2.end,
      start: loc1.start,
    };
  }
}
