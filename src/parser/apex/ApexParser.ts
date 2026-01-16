/**
 * Simple Apex parser
 * Parses Apex source code into a parse tree structure
 */

import { ApexLexer, Token, TokenType } from './ApexLexer.js';
import type { ParseTreeNode } from '../ParseTreeTypes.js';
import type { SourceRange, SourceLocation } from '../../ast/base.js';

/**
 * Simple recursive descent parser for Apex
 */
export class ApexParser {
  private tokens: Token[] = [];
  private current: number = 0;
  private source: string = '';
  private pendingGreaterThan: number = 0; // Track pending > tokens from RIGHT_SHIFT

  constructor(_source: string) {
    this.source = _source;
    const lexer = new ApexLexer(_source);
    this.tokens = lexer.tokenize();
  }

  /**
   * Parse the source code into a parse tree
   */
  parse(): ParseTreeNode | null {
    try {
      // Reset pendingGreaterThan at the start of parsing
      this.pendingGreaterThan = 0;
      return this.parseCompilationUnit();
    } catch (error: any) {
      // Silently return null on parse errors
      // Error logging can be enabled for debugging if needed
      return null;
    }
  }

  /**
   * Parse compilation unit (top-level)
   */
  private parseCompilationUnit(): ParseTreeNode {
    const declarations: ParseTreeNode[] = [];

    // Skip whitespace and comments at start to find the first actual token
    this.skipWhitespaceAndComments();
    const start = this.current; // Start from first actual token, not beginning of source

    while (!this.isAtEnd()) {
      const beforeDecl = this.current;
      const decl = this.parseDeclaration();
      if (decl) {
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
    const endPos = this.tokens.length; // This will trigger EOF handling in getLocation

    return {
      type: 'compilation_unit',
      children: declarations,
      location: this.getLocation(start, endPos),
    };
  }

  /**
   * Parse a declaration (class, interface, trigger, etc.)
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

    if (this.match(TokenType.CLASS)) {
      return this.parseClassDeclaration();
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
   * Parse class declaration
   */
  private parseClassDeclaration(): ParseTreeNode {
    const start = this.current - 1;
    const modifiers: ParseTreeNode[] = [];

    // CLASS keyword was already consumed by match() in parseDeclaration()
    // So we don't need to consume it again
    this.skipWhitespaceAndComments();

    // Class name
    const name = this.consume(TokenType.IDENTIFIER, 'Expected class name');

    // Type parameters: <T, U extends Bound>
    const typeParameters = this.parseTypeParameters();

    // Extends clause
    this.skipWhitespaceAndComments();
    let extendsClause: ParseTreeNode | undefined;
    if (this.match(TokenType.EXTENDS)) {
      this.skipWhitespaceAndComments();
      const extendsType = this.parseType();
      if (extendsType) {
        extendsClause = {
          type: 'extends_clause',
          children: [extendsType],
          location: this.getLocation(start, this.current),
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
    if (modifiers.length > 0) {
      children.push({ type: 'modifiers', children: modifiers });
    }
    children.push({ type: 'name', text: name.text, location: this.locationToRange(name.location) });
    if (typeParameters && typeParameters.length > 0) {
      children.push({ type: 'type_parameters', children: typeParameters });
    }
    if (extendsClause) {
      children.push(extendsClause);
    }
    if (implementsList.length > 0) {
      children.push({ type: 'implements_clause', children: implementsList });
    }
    children.push(body);

    return {
      type: 'class_declaration',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse interface declaration
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
      children.push({ type: 'modifiers', children: modifiers });
    }
    children.push({ type: 'name', text: name.text, location: this.locationToRange(name.location) });
    if (typeParameters && typeParameters.length > 0) {
      children.push({ type: 'type_parameters', children: typeParameters });
    }
    if (extendsList.length > 0) {
      children.push({ type: 'extends_clause', children: extendsList });
    }
    children.push(body);

    return {
      type: 'interface_declaration',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse trigger declaration
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
        type: 'trigger_event',
        text: eventText,
        location: this.locationToRange(firstPart.location),
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
    const body = this.parseBlock();

    return {
      type: 'trigger_declaration',
      children: [
        { type: 'name', text: name.text, location: this.locationToRange(name.location) },
        { type: 'object_name', text: objectName.text, location: this.locationToRange(objectName.location) },
        { type: 'events', children: events },
        body,
      ],
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse annotation type declaration: @interface Name { members }
   */
  private parseAnnotationDeclaration(): ParseTreeNode {
    const start = this.current - 2; // Start at @
    const modifiers: ParseTreeNode[] = [];

    // Parse modifiers (public, global, etc.)
    while (this.match(TokenType.PUBLIC, TokenType.PRIVATE, TokenType.GLOBAL)) {
      const prevToken = this.previous();
      modifiers.push({
        type: 'modifier',
        text: prevToken.text,
        location: this.locationToRange(prevToken.location),
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
      children.push({ type: 'modifiers', children: modifiers });
    }
    children.push({ type: 'name', text: name.text, location: this.locationToRange(name.location) });
    if (members.length > 0) {
      children.push({ type: 'members', children: members });
    }

    return {
      type: 'annotation_declaration',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse annotation member (method-like but simpler)
   * Example: String value(); or Integer count() default 0;
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
    let defaultValue: ParseTreeNode | undefined;
    if (this.match(TokenType.IDENTIFIER)) {
      const defaultKeyword = this.previous();
      if (defaultKeyword.text.toLowerCase() === 'default') {
        const expr = this.parseExpression();
        if (expr) {
          defaultValue = {
            type: 'defaultValue',
            children: [expr],
            location: expr.location,
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
      { type: 'name', text: name.text, location: this.locationToRange(name.location) },
    ];
    if (defaultValue) {
      children.push(defaultValue);
    }

    return {
      type: 'annotation_member',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse enum declaration
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
    
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const beforeConstant = this.current;
      const constant = this.parseEnumConstant();
      if (constant) {
        constants.push(constant);
      } else {
        // If we can't parse a constant, break
        break;
      }
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
      this.skipWhitespaceAndComments();
    }
    
    this.skipWhitespaceAndComments();
    this.consume(TokenType.RIGHT_BRACE, 'Expected } after enum');
    
    const body = {
      type: 'block',
      children: constants,
      location: this.getLocation(enumBodyStart, this.current),
    };

    const children: ParseTreeNode[] = [];
    if (modifiers.length > 0) {
      children.push({ type: 'modifiers', children: modifiers });
    }
    children.push({ type: 'name', text: name.text, location: this.locationToRange(name.location) });
    children.push(body);

    return {
      type: 'enum_declaration',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse a block (statements enclosed in braces)
   * In class context, this parses class members; otherwise, it parses statements
   */
  private parseBlock(isClassBody: boolean = false): ParseTreeNode {
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
      type: 'block',
      children: statements,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse a class member (method, constructor, field, inner class, etc.)
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
    while (this.match(
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
    )) {
      const prevToken = this.previous();
      modifiers.push({
        type: 'modifier',
        text: prevToken.text,
        location: this.locationToRange(prevToken.location),
      });
      this.skipWhitespaceAndComments();
    }

      // Check for constructor (same name as class) or method
      // First check if it's a type (primitive or identifier that could be a type)
      if (this.checkType()) {
        const fieldStart = this.current; // Capture start before parsing type for field location
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

    // Static initializer
    if (this.check(TokenType.STATIC)) {
      const savedPos = this.current;
      this.advance(); // STATIC
      if (this.check(TokenType.LEFT_BRACE)) {
        const block = this.parseBlock();
        return {
          type: 'static_initializer',
          children: [block],
          location: block.location,
        };
      } else {
        // Not a static initializer, reset
        this.current = savedPos;
      }
    }

    // Skip unknown tokens
    if (!this.isAtEnd()) {
      this.advance();
    }

    return null;
  }

  /**
   * Parse method or constructor declaration
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
    let body: ParseTreeNode | undefined;
    if (this.check(TokenType.LEFT_BRACE)) {
      body = this.parseBlock();
    } else if (this.check(TokenType.SEMICOLON)) {
      this.consume(TokenType.SEMICOLON, 'Expected ; or {');
    }

    const children: ParseTreeNode[] = [];
    if (annotations.length > 0) {
      children.push({ type: 'annotations', children: annotations });
    }
    if (modifiers.length > 0) {
      children.push({ type: 'modifiers', children: modifiers });
    }
    children.push(returnType);
    children.push({ type: 'name', text: name.text, location: this.locationToRange(name.location) });
    if (typeParameters && typeParameters.length > 0) {
      children.push({ type: 'type_parameters', children: typeParameters });
    }
    if (parameters.length > 0) {
      children.push({ type: 'parameters', children: parameters });
    }
    if (throwsList.length > 0) {
      children.push({ type: 'throws_clause', children: throwsList });
    }
    if (body) {
      children.push(body);
    }

    // Check if it's a constructor
    // In Apex, constructors don't have a return type, but we check if the name matches the class
    // For now, we'll check if returnType is the same as name (constructor) or if it's explicitly void
    // This is a heuristic - in practice, we'd need class context
    const isConstructor = 
      (returnType.children && returnType.children[0] && (returnType.children[0] as any).text === name.text) ||
      (returnType.text && returnType.text === name.text);

    return {
      type: isConstructor ? 'constructor_declaration' : 'method_declaration',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse parameter declaration
   */
  private parseParameter(): ParseTreeNode | null {
    const start = this.current;
    const modifiers: ParseTreeNode[] = [];

    // Parse parameter modifiers (final, etc.)
    while (this.match(TokenType.FINAL)) {
      const prevToken = this.previous();
      modifiers.push({
        type: 'modifier',
        text: prevToken.text,
        location: this.locationToRange(prevToken.location),
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
      children.push({ type: 'modifiers', children: modifiers });
    }
    children.push(type);
    children.push({ type: 'name', text: name.text, location: this.locationToRange(name.location) });

    return {
      type: 'parameter',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse property declaration (with getter/setter)
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
    if (this.match(TokenType.IDENTIFIER) && this.previous().text.toLowerCase() === 'get') {
      if (this.check(TokenType.LEFT_BRACE)) {
        const getBody = this.parseBlock();
        getter.push(getBody);
      } else {
        this.consume(TokenType.SEMICOLON, 'Expected ; or { after get');
      }
    }

    this.skipWhitespaceAndComments();

    // Parse setter
    if (this.match(TokenType.IDENTIFIER) && this.previous().text.toLowerCase() === 'set') {
      if (this.check(TokenType.LEFT_BRACE)) {
        const setBody = this.parseBlock();
        setter.push(setBody);
      } else {
        this.consume(TokenType.SEMICOLON, 'Expected ; or { after set');
      }
    }

    this.consume(TokenType.RIGHT_BRACE, 'Expected } after property');

    const children: ParseTreeNode[] = [];
    if (annotations.length > 0) {
      children.push({ type: 'annotations', children: annotations });
    }
    if (modifiers.length > 0) {
      children.push({ type: 'modifiers', children: modifiers });
    }
    children.push(type);
    children.push({ type: 'name', text: name.text, location: this.locationToRange(name.location) });
    if (getter.length > 0) {
      children.push({ type: 'getter', children: getter });
    }
    if (setter.length > 0) {
      children.push({ type: 'setter', children: setter });
    }

    return {
      type: 'property_declaration',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse field declaration
   */
  private parseFieldDeclaration(
    name: Token,
    modifiers: ParseTreeNode[],
    annotations: ParseTreeNode[],
    type: ParseTreeNode,
    start?: number
  ): ParseTreeNode {
    // Use provided start position (from before type parsing) or current position
    const fieldStart = start !== undefined ? start : this.current - 1;

    this.skipWhitespaceAndComments();
    let initializer: ParseTreeNode | undefined;
    if (this.match(TokenType.ASSIGN)) {
      this.skipWhitespaceAndComments();
      const expr = this.parseExpression();
      initializer = expr || undefined;
    }

    this.skipWhitespaceAndComments();
    this.consume(TokenType.SEMICOLON, 'Expected ; after field declaration');

    const children: ParseTreeNode[] = [];
    if (annotations.length > 0) {
      children.push({ type: 'annotations', children: annotations });
    }
    if (modifiers.length > 0) {
      children.push({ type: 'modifiers', children: modifiers });
    }
    children.push(type);
    children.push({ type: 'name', text: name.text, location: this.locationToRange(name.location) });
    if (initializer) {
      children.push(initializer);
    }

    return {
      type: 'field_declaration',
      children,
      location: this.getLocation(fieldStart, this.current),
    };
  }

  /**
   * Parse annotation
   */
  private parseAnnotation(): ParseTreeNode | null {
    const start = this.current - 1;
    const name = this.consume(TokenType.IDENTIFIER, 'Expected annotation name');

    let arguments_: ParseTreeNode[] = [];
    if (this.match(TokenType.LEFT_PAREN)) {
      if (!this.check(TokenType.RIGHT_PAREN)) {
        do {
          const arg = this.parseAnnotationArgument();
          if (arg) {
            arguments_.push(arg);
          }
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RIGHT_PAREN, 'Expected ) after annotation arguments');
    }

    const children: ParseTreeNode[] = [
      { type: 'name', text: name.text, location: this.locationToRange(name.location) },
    ];
    if (arguments_.length > 0) {
      children.push({ type: 'arguments', children: arguments_ });
    }

    return {
      type: 'annotation',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse enum constant
   */
  private parseEnumConstant(): ParseTreeNode | null {
    const start = this.current;
    // Enum constants can be IDENTIFIER or ID (keyword)
    if (!this.check(TokenType.IDENTIFIER) && !this.check(TokenType.ID)) {
      return null;
    }
    const name = this.advance(); // Consume IDENTIFIER or ID
    
    let value: ParseTreeNode | undefined;
    if (this.match(TokenType.ASSIGN)) {
      const expr = this.parseExpression();
      value = expr || undefined;
    }
    
    const children: ParseTreeNode[] = [
      { type: 'name', text: name.text, location: this.locationToRange(name.location) },
    ];
    if (value) {
      children.push(value);
    }
    
    return {
      type: 'enum_constant',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse annotation argument
   */
  private parseAnnotationArgument(): ParseTreeNode | null {
    const start = this.current;

    // Could be name = value or just value
    let name: Token | undefined;
    if (this.check(TokenType.IDENTIFIER) && this.peek(1)?.type === TokenType.ASSIGN) {
      name = this.consume(TokenType.IDENTIFIER, 'Expected argument name');
      this.consume(TokenType.ASSIGN, 'Expected =');
    }

    const value = this.parseExpression();
    if (!value) {
      return null;
    }

    const children: ParseTreeNode[] = [value];
    if (name) {
      children.unshift({ type: 'name', text: name.text, location: this.locationToRange(name.location) });
    }

    return {
      type: 'annotation_argument',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse a statement
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
        this.skipWhitespaceAndComments(); // Skip whitespace before target expression
        const target = this.parseExpression();
        if (target) {
          this.skipWhitespaceAndComments(); // Skip whitespace before semicolon
          this.consume(TokenType.SEMICOLON, `Expected ; after ${dmlKeyword} statement`);
          return {
            type: 'dml_statement',
            text: dmlKeyword,
            children: [target],
            location: this.getLocation(savedPos, this.current),
          };
        }
      }
    }
    this.current = savedPos; // Reset if not a DML statement

    // Expression statement or variable declaration
    const expr = this.parseExpression();
    if (expr) {
      if (this.match(TokenType.SEMICOLON)) {
        return {
          type: 'expression_statement',
          children: [expr],
          location: expr.location || this.getLocation(this.current - 1, this.current),
        };
      }
    }

    // Variable declaration
    if (this.check(TokenType.IDENTIFIER) || this.checkType()) {
      return this.parseVariableDeclaration();
    }

    // Skip unknown tokens
    if (!this.isAtEnd()) {
      this.advance();
    }

    return null;
  }

  /**
   * Parse if statement
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
    let elseBody: ParseTreeNode | undefined;

    this.skipWhitespaceAndComments();
    if (this.match(TokenType.ELSE)) {
      this.skipWhitespaceAndComments();
      const stmt = this.parseStatement();
      elseBody = stmt || undefined;
    }

    const children: ParseTreeNode[] = [];
    if (condition) children.push(condition);
    if (thenBody) children.push(thenBody);
    if (elseBody) {
      children.push(elseBody);
    }

    return {
      type: 'if_statement',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse for statement (supports both traditional for and for-each)
   */
  private parseForStatement(): ParseTreeNode {
    const start = this.current - 1;
    this.skipWhitespaceAndComments();
    this.consume(TokenType.LEFT_PAREN, 'Expected ( after for');

    // Check if it's a for-each loop (Type variable : iterable)
    this.skipWhitespaceAndComments();
    const savedPos = this.current;
    const type = this.parseType();
    if (type) {
      this.skipWhitespaceAndComments();
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
          { type: 'name', text: name.text, location: this.locationToRange(name.location) },
          iterable!,
          body!,
        ];

        return {
          type: 'for_each_statement',
          children,
          location: this.getLocation(start, this.current),
        };
      } else {
        // Not a for-each, reset and parse as traditional for
        this.current = savedPos;
      }
    }

    // Traditional for loop
    const init = this.parseStatement(); // Could be variable declaration or expression
    this.skipWhitespaceAndComments();
    this.consume(TokenType.SEMICOLON, 'Expected ; after init');
    this.skipWhitespaceAndComments();
    const condition = this.parseExpression();
    this.skipWhitespaceAndComments();
    this.consume(TokenType.SEMICOLON, 'Expected ; after condition');
    this.skipWhitespaceAndComments();
    const update = this.parseExpression();
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
      type: 'for_statement',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse while statement
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
      type: 'while_statement',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse do-while statement
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
      type: 'do_while_statement',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse switch statement
   */
  private parseSwitchStatement(): ParseTreeNode {
    const start = this.current - 1;
    this.consume(TokenType.LEFT_PAREN, 'Expected ( after switch');
    const expression = this.parseExpression();
    this.consume(TokenType.RIGHT_PAREN, 'Expected ) after switch expression');
    this.consume(TokenType.LEFT_BRACE, 'Expected { after switch');

    const cases: ParseTreeNode[] = [];
    let defaultCase: ParseTreeNode | undefined;

    this.skipWhitespaceAndComments();
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      if (this.match(TokenType.CASE)) {
        const caseValue = this.parseExpression();
        this.consume(TokenType.COLON, 'Expected : after case value');

        const statements: ParseTreeNode[] = [];
        while (!this.check(TokenType.CASE) && !this.check(TokenType.DEFAULT) && !this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
          const beforeStmt = this.current;
          const stmt = this.parseStatement();
          if (stmt) {
            statements.push(stmt);
          }
          // Safety check: ensure we always advance
          if (this.current === beforeStmt && !this.isAtEnd()) {
            this.advance();
          }
        }

        cases.push({
          type: 'switch_case',
          children: [caseValue!, { type: 'statements', children: statements }],
          location: this.getLocation(start, this.current),
        });
      } else if (this.match(TokenType.DEFAULT)) {
        this.consume(TokenType.COLON, 'Expected : after default');

        const statements: ParseTreeNode[] = [];
        while (!this.check(TokenType.CASE) && !this.check(TokenType.DEFAULT) && !this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
          const beforeStmt = this.current;
          const stmt = this.parseStatement();
          if (stmt) {
            statements.push(stmt);
          }
          // Safety check: ensure we always advance
          if (this.current === beforeStmt && !this.isAtEnd()) {
            this.advance();
          }
        }

        defaultCase = {
          type: 'switch_case',
          children: [{ type: 'statements', children: statements }],
          location: this.getLocation(start, this.current),
        };
      } else {
        this.advance();
      }
      this.skipWhitespaceAndComments();
    }

    this.consume(TokenType.RIGHT_BRACE, 'Expected } after switch');

    const children: ParseTreeNode[] = [];
    if (expression) children.push(expression);
    if (cases.length > 0) {
      children.push({ type: 'cases', children: cases });
    }
    if (defaultCase) {
      children.push(defaultCase);
    }

    return {
      type: 'switch_statement',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse try statement
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
        type: 'catch_clause',
        children: [
          exceptionType!,
          { type: 'name', text: exceptionName.text, location: this.locationToRange(exceptionName.location) },
          catchBlock,
        ],
        location: this.getLocation(start, this.current),
      });
    }

    let finallyBlock: ParseTreeNode | undefined;
    this.skipWhitespaceAndComments();
    if (this.match(TokenType.FINALLY)) {
      this.skipWhitespaceAndComments();
      finallyBlock = this.parseBlock();
    }

    const children: ParseTreeNode[] = [tryBlock];
    if (catchClauses.length > 0) {
      children.push({ type: 'catch_clauses', children: catchClauses });
    }
    if (finallyBlock) {
      children.push(finallyBlock);
    }

    return {
      type: 'try_statement',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse break statement
   */
  private parseBreakStatement(): ParseTreeNode {
    const start = this.current - 1;
    this.skipWhitespaceAndComments();
    this.consume(TokenType.SEMICOLON, 'Expected ; after break');

    return {
      type: 'break_statement',
      children: [],
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse continue statement
   */
  private parseContinueStatement(): ParseTreeNode {
    const start = this.current - 1;
    this.skipWhitespaceAndComments();
    this.consume(TokenType.SEMICOLON, 'Expected ; after continue');

    return {
      type: 'continue_statement',
      children: [],
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse throw statement
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
      type: 'throw_statement',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse return statement
   */
  private parseReturnStatement(): ParseTreeNode {
    const start = this.current - 1;
    let expression: ParseTreeNode | undefined;

    this.skipWhitespaceAndComments();
    if (!this.check(TokenType.SEMICOLON)) {
      const expr = this.parseExpression();
      expression = expr || undefined;
    }

    this.skipWhitespaceAndComments();
    this.consume(TokenType.SEMICOLON, 'Expected ; after return');

    const children: ParseTreeNode[] = [];
    if (expression) {
      children.push(expression);
    }

    return {
      type: 'return_statement',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse variable declaration
   */
  private parseVariableDeclaration(): ParseTreeNode | null {
    const start = this.current;
    const type = this.parseType();
    if (!type) {
      return null;
    }

    const name = this.consume(TokenType.IDENTIFIER, 'Expected variable name');
    let initializer: ParseTreeNode | undefined;

    if (this.match(TokenType.ASSIGN)) {
      const expr = this.parseExpression();
      initializer = expr || undefined;
    }

    this.consume(TokenType.SEMICOLON, 'Expected ; after variable declaration');

    const children: ParseTreeNode[] = [type, { type: 'name', text: name.text, location: this.locationToRange(name.location) }];
    if (initializer) {
      children.push(initializer);
    }

    return {
      type: 'variable_declaration',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse type parameters: <T, U extends Bound>
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
   * Parse a single type parameter: T or T extends Bound
   */
  private parseTypeParameter(): ParseTreeNode | null {
    const start = this.current;
    const name = this.consume(TokenType.IDENTIFIER, 'Expected type parameter name');

    let extendsBound: ParseTreeNode | undefined;
    if (this.match(TokenType.EXTENDS)) {
      const bound = this.parseType();
      if (bound) {
        extendsBound = bound;
      }
    }

    const children: ParseTreeNode[] = [
      { type: 'name', text: name.text, location: this.locationToRange(name.location) },
    ];
    if (extendsBound) {
      children.push(extendsBound);
    }

    return {
      type: 'type_parameter',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse type (supports arrays, generics, qualified types, etc.)
   */
  private parseType(): ParseTreeNode | null {
    this.skipWhitespaceAndComments();
    if (!this.checkType()) {
      return null;
    }

    const start = this.current;
    const baseType = this.advance(); // Consume the type token (INTEGER, STRING, IDENTIFIER, etc.)
    
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
    let typeArguments: ParseTreeNode[] | undefined;
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
      { type: 'base_type', text: qualifiedName, location: this.locationToRange(baseType.location) },
    ];

    if (typeArguments && typeArguments.length > 0) {
      children.push({ type: 'type_arguments', children: typeArguments });
    }

    if (arrayDimensions > 0) {
      children.push({ type: 'array_dimensions', text: arrayDimensions.toString() });
    }

    return {
      type: 'type',
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Check if current token is a type
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
   * Parse expression
   */
  private parseExpression(): ParseTreeNode | null {
    return this.parseAssignment();
  }

  /**
   * Parse assignment expression
   */
  private parseAssignment(): ParseTreeNode | null {
    let expr = this.parseTernary();

    if (this.match(TokenType.ASSIGN, TokenType.PLUS_ASSIGN, TokenType.MINUS_ASSIGN, TokenType.MULTIPLY_ASSIGN, TokenType.DIVIDE_ASSIGN)) {
      const operator = this.previous();
      const right = this.parseAssignment();
      if (right && expr && expr.location && right.location) {
        return {
          type: 'binary_expression',
          operator: operator.text,
          children: [expr, right],
          location: this.combineLocations(expr.location, right.location),
        };
      }
    }

    return expr;
  }

  /**
   * Parse ternary/null-coalescing expression
   */
  private parseTernary(): ParseTreeNode | null {
    let expr = this.parseOr();

    // Null coalescing operator ??
    while (this.match(TokenType.NULL_COALESCING)) {
      const operator = this.previous();
      const right = this.parseTernary();
      if (right && expr && expr.location && right.location) {
        expr = {
          type: 'binary_expression',
          operator: operator.text,
          children: [expr, right],
          location: this.combineLocations(expr.location, right.location),
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
          type: 'ternary_expression',
          children: [expr, thenExpr, elseExpr],
          location: expr.location && thenExpr.location && elseExpr.location
            ? this.combineLocations(expr.location, elseExpr.location)
            : this.getLocation(this.current - 3, this.current),
        };
      }
    }

    return expr;
  }

  /**
   * Parse OR expression
   */
  private parseOr(): ParseTreeNode | null {
    let expr = this.parseAnd();

    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.parseAnd();
      if (right && expr && expr.location && right.location) {
        expr = {
          type: 'binary_expression',
          operator: operator.text,
          children: [expr, right],
          location: this.combineLocations(expr.location, right.location),
        };
      }
    }

    return expr;
  }

  /**
   * Parse AND expression
   */
  private parseAnd(): ParseTreeNode | null {
    let expr = this.parseEquality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.parseEquality();
      if (right) {
        expr = {
          type: 'binary_expression',
          operator: operator.text,
          children: [expr!, right],
          location: expr && expr.location && right.location ? this.combineLocations(expr.location, right.location) : (right.location || this.getLocation(this.current - 1, this.current)),
        };
      }
    }

    return expr;
  }

  /**
   * Parse equality expression
   */
  private parseEquality(): ParseTreeNode | null {
    let expr = this.parseComparison();

    while (this.match(TokenType.EQUALS, TokenType.NOT_EQUALS)) {
      const operator = this.previous();
      const right = this.parseComparison();
      if (right) {
        expr = {
          type: 'binary_expression',
          operator: operator.text,
          children: [expr!, right],
          location: expr && expr.location && right.location ? this.combineLocations(expr.location, right.location) : (right.location || this.getLocation(this.current - 1, this.current)),
        };
      }
    }

    return expr;
  }

  /**
   * Parse comparison expression (includes instanceof)
   */
  private parseComparison(): ParseTreeNode | null {
    let expr = this.parseAddition();

    while (this.match(TokenType.LESS_THAN, TokenType.LESS_EQUAL, TokenType.GREATER_THAN, TokenType.GREATER_EQUAL)) {
      const operator = this.previous();
      const right = this.parseAddition();
      if (right) {
        expr = {
          type: 'binary_expression',
          operator: operator.text,
          children: [expr!, right],
          location: expr && expr.location && right.location ? this.combineLocations(expr.location, right.location) : (right.location || this.getLocation(this.current - 1, this.current)),
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
            type: 'instanceof_expression',
            children: [expr, right],
            location: expr.location && right.location ? this.combineLocations(expr.location, right.location) : (right.location || this.getLocation(this.current - 1, this.current)),
          };
        }
      }
    }

    return expr;
  }

  /**
   * Parse addition expression
   */
  private parseAddition(): ParseTreeNode | null {
    let expr = this.parseMultiplication();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.parseMultiplication();
      if (right) {
        expr = {
          type: 'binary_expression',
          operator: operator.text,
          children: [expr!, right],
          location: expr && expr.location && right.location ? this.combineLocations(expr.location, right.location) : (right.location || this.getLocation(this.current - 1, this.current)),
        };
      }
    }

    return expr;
  }

  /**
   * Parse multiplication expression
   */
  private parseMultiplication(): ParseTreeNode | null {
    let expr = this.parseUnary();

    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO)) {
      const operator = this.previous();
      const right = this.parseUnary();
      if (right) {
        expr = {
          type: 'binary_expression',
          operator: operator.text,
          children: [expr!, right],
          location: expr && expr.location && right.location ? this.combineLocations(expr.location, right.location) : (right.location || this.getLocation(this.current - 1, this.current)),
        };
      }
    }

    return expr;
  }

  /**
   * Parse unary expression (prefix and postfix)
   */
  private parseUnary(): ParseTreeNode | null {
    // Prefix operators
    if (this.match(TokenType.NOT, TokenType.MINUS, TokenType.PLUS, TokenType.INCREMENT, TokenType.DECREMENT)) {
      const operator = this.previous();
      const right = this.parseUnary();
      if (right && right.location) {
        return {
          type: 'unary_expression',
          operator: operator.text,
          prefix: true,
          children: [right],
          location: this.combineLocations(this.locationToRange(operator.location), right.location),
        };
      }
    }

    let expr = this.parsePrimary();
    if (!expr) {
      return null;
    }

    // Postfix operators
    while (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
      const operator = this.previous();
      expr = {
        type: 'unary_expression',
        operator: operator.text,
        prefix: false,
        children: [expr],
        location: this.combineLocations(expr.location || this.getLocation(this.current - 1, this.current), this.locationToRange(operator.location)),
      };
    }

    return expr;
  }

  /**
   * Parse primary expression
   */
  private parsePrimary(): ParseTreeNode | null {
    if (this.match(TokenType.BOOLEAN_LITERAL, TokenType.TRUE, TokenType.FALSE)) {
      const token = this.previous();
      return {
        type: 'boolean_literal',
        text: token.text,
        location: this.locationToRange(token.location),
      };
    }

    if (this.match(TokenType.NULL, TokenType.NULL_LITERAL)) {
      const token = this.previous();
      return {
        type: 'null_literal',
        text: token.text,
        location: this.locationToRange(token.location),
      };
    }

    if (this.match(TokenType.STRING_LITERAL)) {
      const token = this.previous();
      return {
        type: 'string_literal',
        text: token.text,
        location: this.locationToRange(token.location),
      };
    }

    if (this.match(TokenType.NUMBER_LITERAL)) {
      const token = this.previous();
      return {
        type: 'number_literal',
        text: token.text,
        location: this.locationToRange(token.location),
      };
    }

    if (this.match(TokenType.THIS)) {
      const token = this.previous();
      return {
        type: 'this_expression',
        text: token.text,
        location: this.locationToRange(token.location),
      };
    }

    if (this.match(TokenType.SUPER)) {
      const token = this.previous();
      return {
        type: 'super_expression',
        text: token.text,
        location: this.locationToRange(token.location),
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
          type: 'lambda_expression',
          children: [
            { type: 'parameters', children: lambdaParams },
            body,
          ],
          location: this.getLocation(savedPos - 1, this.current),
        };
      }
      
      // Not a lambda, check for cast
      // Save position before trying to parse type
      // const beforeTypePos = this.current; // Unused
      const potentialType = this.parseType();
      if (potentialType && potentialType.location && this.check(TokenType.RIGHT_PAREN)) {
        // It's a cast: (Type) expression
        this.consume(TokenType.RIGHT_PAREN, 'Expected ) after cast type');
        const expr = this.parseUnary();
        if (expr && expr.location) {
          return {
            type: 'cast_expression',
            children: [potentialType, expr],
            location: this.combineLocations(potentialType.location, expr.location),
          };
        }
      }
      // Not a cast, reset to before type parsing and parse as parenthesized expression
      this.current = savedPos;
      // Now parse as parenthesized expression - we're at the position after LEFT_PAREN
      const expr = this.parseExpression();
      this.consume(TokenType.RIGHT_PAREN, 'Expected ) after expression');
      return {
        type: 'parenthesized_expression',
        children: [expr!],
        location: this.getLocation(savedPos - 1, this.current),
      };
    }

    if (this.match(TokenType.IDENTIFIER) || this.match(TokenType.ID)) {
      const token = this.previous();
      let expr: ParseTreeNode = {
        type: 'identifier',
        text: token.text,
        location: this.locationToRange(token.location),
      };

      // Check for trigger context variables: Trigger.new, Trigger.old, etc.
      if (token.text.toLowerCase() === 'trigger' && this.match(TokenType.DOT)) {
        const triggerVar = this.consume(TokenType.IDENTIFIER, 'Expected trigger context variable');
        const triggerVarName = triggerVar.text.toLowerCase();
        if (['new', 'old', 'newmap', 'oldmap', 'size', 'isinsert', 'isupdate', 'isdelete', 'isundelete', 'isbefore', 'isafter', 'isexecuting'].includes(triggerVarName)) {
          expr = {
            type: 'trigger_context_variable',
            text: `Trigger.${triggerVar.text}`,
            location: this.combineLocations(this.locationToRange(token.location), this.locationToRange(triggerVar.location)),
          };
          // Continue parsing postfix operations
        } else {
          // Not a trigger context variable, treat as regular field access
          expr = {
            type: 'field_access_expression',
            children: [
              expr,
              { type: 'field', text: triggerVar.text, location: this.locationToRange(triggerVar.location) },
            ],
            location: this.combineLocations(expr.location || this.locationToRange(token.location), this.locationToRange(triggerVar.location)),
          };
        }
      }

      // Parse postfix operations (method calls, field access, array access)
      while (true) {
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

          expr = {
            type: 'method_call_expression',
            children: [expr, { type: 'arguments', children: args }],
            location: this.combineLocations(expr.location || this.locationToRange(token.location), this.getLocation(this.current - 1, this.current)),
          };
        } else if (this.match(TokenType.DOT)) {
          // Field access
          const field = this.consume(TokenType.IDENTIFIER, 'Expected field name');
          expr = {
            type: 'field_access_expression',
            children: [
              expr,
              { type: 'field', text: field.text, location: this.locationToRange(field.location) },
            ],
            location: this.combineLocations(expr.location || this.locationToRange(token.location), this.locationToRange(field.location)),
          };
        } else if (this.match(TokenType.LEFT_BRACKET)) {
          // Array access
          const index = this.parseExpression();
          this.consume(TokenType.RIGHT_BRACKET, 'Expected ] after array index');
          expr = {
            type: 'array_access_expression',
            children: [expr, index!],
            location: this.combineLocations(expr.location || this.locationToRange(token.location), this.getLocation(this.current - 1, this.current)),
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
        type: 'parenthesized_expression',
        children: [expr!],
        location: this.getLocation(this.current - 2, this.current),
      };
    }

    return null;
  }

  /**
   * Parse lambda parameter (for lambda expressions)
   * Can be: identifier or Type identifier
   */
  private parseLambdaParameter(): ParseTreeNode | null {
    // Try to parse as typed parameter: Type name
    const savedPos = this.current;
    const type = this.parseType();
    if (type && this.check(TokenType.IDENTIFIER)) {
      const name = this.consume(TokenType.IDENTIFIER, 'Expected parameter name');
      return {
        type: 'lambda_parameter',
        children: [
          type,
          { type: 'name', text: name.text, location: this.locationToRange(name.location) },
        ],
        location: this.getLocation(savedPos, this.current),
      };
    }
    
    // Reset and try as untyped parameter: just identifier
    this.current = savedPos;
    if (this.check(TokenType.IDENTIFIER)) {
      const name = this.consume(TokenType.IDENTIFIER, 'Expected parameter name');
      return {
        type: 'lambda_parameter',
        children: [
          { type: 'name', text: name.text, location: this.locationToRange(name.location) },
        ],
        location: this.locationToRange(name.location),
      };
    }
    
    return null;
  }

  /**
   * Parse SOQL/SOSL query
   */
  private parseSoqlSoslQuery(): ParseTreeNode {
    const start = this.current - 1;
    const queryStart = this.current; // Start of actual query text (after [)
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
    
    // Extract bound expressions (e.g., :variableName)
    const boundExpressions: ParseTreeNode[] = [];
    const bindingRegex = /:(\w+)/g;
    let match;
    while ((match = bindingRegex.exec(queryText)) !== null) {
      // For now, we'll extract the binding name
      // In a full implementation, we'd need to parse the actual expression
      boundExpressions.push({
        type: 'identifier',
        text: match[1],
        location: this.getLocation(queryStart + match.index + 1, queryStart + match.index + 1 + match[1].length),
      });
    }
    
    const children: ParseTreeNode[] = [];
    if (boundExpressions.length > 0) {
      children.push({ type: 'bound_expressions', children: boundExpressions });
    }
    
    return {
      type: queryType,
      text: queryText, // Query text without brackets
      children,
      location: this.getLocation(start, this.current),
    };
  }

  /**
   * Parse new expression
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
        type: 'new_array_expression',
        children: [type, size],
        location: this.getLocation(start, this.current),
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
                type: 'map_entry',
                children: [firstExpr, secondExpr],
                location: this.combineLocations(firstExpr.location || this.getLocation(savedPos, this.current), secondExpr.location || this.getLocation(this.current - 1, this.current)),
              });
            }
          } else if (firstExpr) {
            // It's a List/Set value
            initializers.push(firstExpr);
          }
          // Safety check: ensure we always advance
          if (this.current === savedPos && !this.isAtEnd() && !this.check(TokenType.COMMA) && !this.check(TokenType.RIGHT_BRACE)) {
            this.advance();
          }
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RIGHT_BRACE, 'Expected } after collection initializer');

      const children: ParseTreeNode[] = [type];
      // Always create arrayInitializer node, even if empty (for empty List/Set/Map initializers)
      children.push({ type: 'arrayInitializer', children: initializers });

      return {
        type: 'new_expression',
        children,
        location: this.getLocation(start, this.current),
      };
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
      children.push({ type: 'arguments', children: args });
    }

    return {
      type: 'new_expression',
      children,
      location: this.getLocation(start, this.current),
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

  private peek(offset: number = 0): Token {
    const pos = this.current + offset;
    return this.tokens[pos] || this.tokens[this.tokens.length - 1];
  }

  private previous(): Token {
    return this.tokens[this.current - 1] || this.tokens[0];
  }

  private consume(type: TokenType, message: string): Token {
    // If we have pending > tokens from RIGHT_SHIFT, use one of them
    if (type === TokenType.GREATER_THAN && this.pendingGreaterThan > 0) {
      this.pendingGreaterThan--;
      // Return a synthetic GREATER_THAN token
      const currentToken = this.peek();
      return {
        type: TokenType.GREATER_THAN,
        text: '>',
        location: currentToken.location,
      };
    }
    
    // If we're consuming GREATER_THAN but encounter RIGHT_SHIFT, split it
    if (type === TokenType.GREATER_THAN && !this.isAtEnd() && this.peek().type === TokenType.RIGHT_SHIFT) {
      this.advance(); // Consume the RIGHT_SHIFT
      this.pendingGreaterThan++; // Mark that we have one more > available
      // Return a synthetic GREATER_THAN token
      const consumedToken = this.previous();
      return {
        type: TokenType.GREATER_THAN,
        text: '>',
        location: consumedToken.location,
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

    let endLocation = endToken?.location || { line: 1, column: 1 };
    
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
          line: lastLineNum,
          column: 0,
        };
      } else if (this.source.endsWith(' ') || this.source.endsWith('\t')) {
        // Source ends with whitespace (but not newline)
        const lastLine = lines[lastLineNum - 1] || '';
        endLocation = {
          line: lastLineNum,
          column: lastLine.length + 1, // +1 because columns are 1-based
        };
      } else {
        // Use the last non-EOF token's location and extend to end of that token
        const lastNonEofToken = this.tokens[this.tokens.length - 2];
        if (lastNonEofToken) {
          endLocation = {
            line: lastNonEofToken.location.line,
            column: lastNonEofToken.location.column + (lastNonEofToken.text?.length || 0),
          };
        }
      }
    }

    return {
      start: startToken?.location || { line: 1, column: 1 },
      end: endLocation,
    };
  }

  private locationToRange(location: SourceLocation): SourceRange {
    return {
      start: location,
      end: location,
    };
  }

  private combineLocations(loc1: SourceRange, loc2: SourceRange): SourceRange {
    return {
      start: loc1.start,
      end: loc2.end,
    };
  }
}
