/**
 * @file Statement parsing.
 * Parses statements: if, switch, try, break, continue, throw, return, variable declarations, blocks, loops.
 */

import type { ParseTreeNode } from './parseTree.js';
import { TokenType } from './tokenType.js';
import type { ParserContext } from './apexParser.js';

/**
 * Stub used before real parser is assigned (mutually recursive).
 * @throws {Error} Always, if called before assignment.
 */
const statementParserStub = (): ParseTreeNode | null => {
  throw new Error('statement parser used before assignment');
};

/**
 * Stub used before real parser is assigned (returns node).
 * @throws {Error} Always, if called before assignment.
 */
const statementParserStubNode = (): ParseTreeNode => {
  throw new Error('statement parser used before assignment');
};

/** Forward declarations for statement parsers used in parseStatement. */
let parseIfStatement: (ctx: Readonly<ParserContext>) => ParseTreeNode = statementParserStubNode;
let parseForStatement: (ctx: Readonly<ParserContext>) => ParseTreeNode = statementParserStubNode;
let parseWhileStatement: (ctx: Readonly<ParserContext>) => ParseTreeNode = statementParserStubNode;
let parseDoWhileStatement: (ctx: Readonly<ParserContext>) => ParseTreeNode =
  statementParserStubNode;
let parseSwitchStatement: (ctx: Readonly<ParserContext>) => ParseTreeNode = statementParserStubNode;
let parseTryStatement: (ctx: Readonly<ParserContext>) => ParseTreeNode = statementParserStubNode;
let parseReturnStatement: (ctx: Readonly<ParserContext>) => ParseTreeNode = statementParserStubNode;
let parseBreakStatement: (ctx: Readonly<ParserContext>) => ParseTreeNode = statementParserStubNode;
let parseContinueStatement: (ctx: Readonly<ParserContext>) => ParseTreeNode =
  statementParserStubNode;
let parseThrowStatement: (ctx: Readonly<ParserContext>) => ParseTreeNode = statementParserStubNode;
let parseVariableDeclaration: (ctx: Readonly<ParserContext>) => ParseTreeNode | null =
  statementParserStub;

// ============================================================================
// Block Parsing
// ============================================================================

/**
 * Parse a block (statements enclosed in braces)
 * In class context, this parses class members; otherwise, it parses statements.
 * @param ctx - The parser context.
 * @param isClassBody - Whether this is a class body (true) or statement block (false).
 * @returns The block parse tree node.
 * @throws {Error} If the block is malformed or unexpected tokens are encountered.
 */
function parseBlock(ctx: Readonly<ParserContext>, isClassBody = false): ParseTreeNode {
  const start = ctx.getCurrent();
  ctx.consume(TokenType.LEFT_BRACE, 'Expected {');

  const statements: ParseTreeNode[] = [];
  ctx.skipWhitespaceAndComments();

  while (!ctx.check(TokenType.RIGHT_BRACE) && !ctx.isAtEnd()) {
    const beforeParse = ctx.getCurrent();
    if (isClassBody) {
      const member = ctx.parseClassMember();
      if (member) {
        statements.push(member);
      } else {
        // If parsing as class member failed, restore position and try parsing as statement
        // This handles triggers with statements like System.debug('')
        // parseClassMember() may have advanced past whitespace, so we restore the position
        ctx.setCurrent(beforeParse);
        ctx.skipWhitespaceAndComments();
        const stmt = ctx.parseStatement();
        if (stmt) {
          statements.push(stmt);
        }
      }
    } else {
      const stmt = ctx.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }
    // Safety check: ensure we always advance, even if parsing failed
    if (ctx.getCurrent() === beforeParse && !ctx.isAtEnd()) {
      ctx.advance();
    }
    ctx.skipWhitespaceAndComments();
  }

  ctx.consume(TokenType.RIGHT_BRACE, 'Expected }');

  return {
    children: statements,
    location: ctx.getLocation(start, ctx.getCurrent()),
    type: 'block',
  };
}

// ============================================================================
// Statement Parsing
// ============================================================================

/**
 * Parse a statement.
 * @param ctx - The parser context.
 * @returns The parsed statement node, or null if parsing fails.
 * @throws {Error} If the statement is malformed or unexpected tokens are encountered.
 */
function parseStatement(ctx: Readonly<ParserContext>): ParseTreeNode | null {
  ctx.skipWhitespaceAndComments();

  if (ctx.match(TokenType.IF)) {
    return parseIfStatement(ctx);
  }
  if (ctx.match(TokenType.FOR)) {
    return parseForStatement(ctx);
  }
  if (ctx.match(TokenType.WHILE)) {
    return parseWhileStatement(ctx);
  }
  if (ctx.match(TokenType.DO)) {
    return parseDoWhileStatement(ctx);
  }
  if (ctx.match(TokenType.SWITCH)) {
    return parseSwitchStatement(ctx);
  }
  if (ctx.match(TokenType.TRY)) {
    return parseTryStatement(ctx);
  }
  if (ctx.match(TokenType.RETURN)) {
    return parseReturnStatement(ctx);
  }
  if (ctx.match(TokenType.BREAK)) {
    return parseBreakStatement(ctx);
  }
  if (ctx.match(TokenType.CONTINUE)) {
    return parseContinueStatement(ctx);
  }
  if (ctx.match(TokenType.THROW)) {
    return parseThrowStatement(ctx);
  }
  if (ctx.check(TokenType.LEFT_BRACE)) {
    return ctx.parseBlock();
  }

  // Check for DML statements: insert, update, delete, upsert, merge, undelete
  const singleIndexOffset = 1;
  const savedPos = ctx.getCurrent();
  if (ctx.check(TokenType.IDENTIFIER)) {
    const token = ctx.peek();
    const dmlKeyword = token.text.toLowerCase();
    if (['insert', 'update', 'delete', 'upsert', 'merge', 'undelete'].includes(dmlKeyword)) {
      ctx.advance(); // Consume DML keyword
      ctx.skipWhitespaceAndComments();

      // Check for optional "as user" or "as system" modifier
      let accessLevel: string | undefined = undefined;
      if (ctx.check(TokenType.IDENTIFIER) && ctx.peek().text.toLowerCase() === 'as') {
        ctx.advance(); // Consume "as"
        ctx.skipWhitespaceAndComments();
        if (ctx.check(TokenType.IDENTIFIER)) {
          const accessToken = ctx.peek();
          const accessText = accessToken.text.toLowerCase();
          if (accessText === 'user' || accessText === 'system') {
            ctx.advance(); // Consume "user" or "system"
            accessLevel = accessText;
            ctx.skipWhitespaceAndComments();
          }
        }
      }

      // Parse target expression(s)
      // Upsert and merge have two arguments, others have one
      const isTwoArgDml = dmlKeyword === 'upsert' || dmlKeyword === 'merge';
      const target = ctx.parseExpression();
      if (target) {
        const children: ParseTreeNode[] = [target];

        // For upsert and merge, parse the second argument
        if (isTwoArgDml) {
          ctx.skipWhitespaceAndComments();
          const secondArg = ctx.parseExpression();
          if (secondArg) {
            children.push(secondArg);
          }
        }

        ctx.skipWhitespaceAndComments(); // Skip whitespace before semicolon
        ctx.consume(TokenType.SEMICOLON, `Expected ; after ${dmlKeyword} statement`);
        const node: ParseTreeNode = {
          children,
          location: ctx.getLocation(savedPos, ctx.getCurrent()),
          text: dmlKeyword,
          type: 'dml_statement',
        };
        // Store access level if present
        if (accessLevel !== undefined && accessLevel !== '') {
          (node as ParseTreeNode & { accessLevel?: string }).accessLevel = accessLevel;
        }
        return node;
      }
    }
  }
  ctx.setCurrent(savedPos); // Reset if not a DML statement

  // Variable declaration (check before expression statement since types can be identifiers)
  // Peek ahead to see if it's likely a variable declaration: type followed by identifier
  if (ctx.checkType()) {
    const savedPosForVar = ctx.getCurrent();
    // Try to parse type without consuming if it fails
    const type = ctx.parseType();
    if (type) {
      ctx.skipWhitespaceAndComments();
      // Check if next token is an identifier (variable name) - if so, it's likely a variable declaration
      if (ctx.check(TokenType.IDENTIFIER)) {
        // Reset and parse as variable declaration
        ctx.setCurrent(savedPosForVar);
        const varDecl = parseVariableDeclaration(ctx);
        if (varDecl) {
          return varDecl;
        }
      }
      // Not a variable declaration, reset to before type parsing
      ctx.setCurrent(savedPosForVar);
    }
  }

  // Expression statement
  const expr = ctx.parseExpression();
  if (expr) {
    if (ctx.match(TokenType.SEMICOLON)) {
      return {
        children: [expr],
        location:
          expr.location ?? ctx.getLocation(ctx.getCurrent() - singleIndexOffset, ctx.getCurrent()),
        type: 'expression_statement',
      };
    }
  }

  // Skip unknown tokens
  if (!ctx.isAtEnd()) {
    ctx.advance();
  }

  return null;
}

/**
 * Parses an if statement from the token stream.
 * @param ctx - The parser context.
 * @returns The parsed if statement parse tree node.
 * @throws {Error} If the if statement is malformed or unexpected tokens are encountered.
 */
parseIfStatement = function (ctx: Readonly<ParserContext>): ParseTreeNode {
  const singleIndexOffset = 1;
  const start = ctx.getCurrent() - singleIndexOffset;
  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.LEFT_PAREN, 'Expected ( after if');
  ctx.skipWhitespaceAndComments();
  const condition = ctx.parseExpression();
  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.RIGHT_PAREN, 'Expected ) after condition');
  ctx.skipWhitespaceAndComments();
  const thenBody = parseStatement(ctx);
  let elseBody: ParseTreeNode | undefined = undefined;

  ctx.skipWhitespaceAndComments();
  if (ctx.match(TokenType.ELSE)) {
    ctx.skipWhitespaceAndComments();
    const stmt = parseStatement(ctx);
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
    location: ctx.getLocation(start, ctx.getCurrent()),
    type: 'if_statement',
  };
};

/**
 * Parses a switch statement from the token stream.
 * @param ctx - The parser context.
 * @returns The parsed switch statement parse tree node.
 * @throws {Error} If the switch statement is malformed or unexpected tokens are encountered.
 */
parseSwitchStatement = function (ctx: Readonly<ParserContext>): ParseTreeNode {
  const singleIndexOffset = 1;
  const zeroIndex = 0;
  const start = ctx.getCurrent() - singleIndexOffset;
  ctx.skipWhitespaceAndComments();

  // Apex uses "switch on expression" syntax, not "switch (expression)"
  // After match(SWITCH) and skipping whitespace, check if next token is "on"
  if (ctx.check(TokenType.IDENTIFIER) && ctx.peek().text.toLowerCase() === 'on') {
    ctx.advance(); // Consume "on"
    ctx.skipWhitespaceAndComments();
  } else if (ctx.check(TokenType.LEFT_PAREN)) {
    // Java-style switch (expression)
    ctx.consume(TokenType.LEFT_PAREN, 'Expected ( after switch');
  }

  const expression = ctx.parseExpression();

  if (ctx.check(TokenType.RIGHT_PAREN)) {
    ctx.consume(TokenType.RIGHT_PAREN, 'Expected ) after switch expression');
  }

  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.LEFT_BRACE, 'Expected { after switch');

  const cases: ParseTreeNode[] = [];
  let defaultCase: ParseTreeNode | undefined = undefined;

  ctx.skipWhitespaceAndComments();
  while (!ctx.check(TokenType.RIGHT_BRACE) && !ctx.isAtEnd()) {
    // Check for Apex "when" clause
    // "when" is tokenized as IDENTIFIER, so we need to check the text
    const currentToken = ctx.peek();
    if (currentToken.type === TokenType.IDENTIFIER && currentToken.text.toLowerCase() === 'when') {
      ctx.advance(); // Consume "when"
      ctx.skipWhitespaceAndComments();

      // Check for "when else"
      // "else" can be either ELSE keyword or IDENTIFIER (depending on lexer)
      const nextToken = ctx.peek();
      const isElse =
        nextToken.type === TokenType.ELSE ||
        (nextToken.type === TokenType.IDENTIFIER && nextToken.text.toLowerCase() === 'else');
      if (isElse) {
        // Consume "else" token
        ctx.advance(); // Consume ELSE keyword or IDENTIFIER "else"
        ctx.skipWhitespaceAndComments();
        ctx.consume(TokenType.LEFT_BRACE, 'Expected { after when else');
        ctx.skipWhitespaceAndComments();

        const statements: ParseTreeNode[] = [];
        while (!ctx.isAtEnd()) {
          ctx.skipWhitespaceAndComments();
          if (ctx.check(TokenType.RIGHT_BRACE)) {
            break;
          }
          const beforeStmt = ctx.getCurrent();
          const stmt = parseStatement(ctx);
          if (stmt) {
            statements.push(stmt);
          }
          if (ctx.getCurrent() === beforeStmt && !ctx.isAtEnd()) {
            void ctx.advance();
          }
        }
        ctx.consume(TokenType.RIGHT_BRACE, 'Expected } after when else block');
        ctx.skipWhitespaceAndComments();

        defaultCase = {
          children: [{ children: statements, type: 'statements' }],
          location: ctx.getLocation(start, ctx.getCurrent()),
          type: 'switch_case',
        };
      } else {
        // Parse when clause values
        const whenValues: ParseTreeNode[] = [];
        let whenType: ParseTreeNode | null = null;
        let whenVariable: ParseTreeNode | null = null;

        // Check if it's a type declaration: "when Type variable"
        // Pattern: Type (identifier) followed by identifier (variable name)
        const savedPos = ctx.getCurrent();

        // Check if we have two consecutive identifiers (type name, then variable name)
        // This is a heuristic: if we see IDENTIFIER + whitespace + IDENTIFIER, it might be "Type variable"
        if (ctx.checkType()) {
          // Try to parse as type first
          const potentialType = ctx.parseType();
          if (potentialType !== null) {
            ctx.skipWhitespaceAndComments();
            // Check if next token is an identifier (variable name)
            // Also check that it's not a keyword or operator that would indicate it's an expression
            if (ctx.check(TokenType.IDENTIFIER)) {
              const peekedToken = ctx.peek();
              // Make sure it's not a keyword that would be part of an expression
              const isKeyword = ['else', 'when', 'case', 'default'].includes(
                peekedToken.text.toLowerCase()
              );
              if (!isKeyword) {
                // It's a type declaration: "when Type variable"
                whenType = potentialType;
                const varNameStart = ctx.getCurrent();
                const varName = ctx.consume(TokenType.IDENTIFIER, 'Expected variable name');
                const varNameEnd = ctx.getCurrent();
                whenVariable = {
                  location: ctx.getLocation(varNameStart, varNameEnd),
                  text: varName.text,
                  type: 'name',
                };
              } else {
                // Next token is a keyword, so this is not a type declaration
                ctx.setCurrent(savedPos);
                const expr = ctx.parseExpression();
                if (expr) {
                  whenValues.push(expr);
                }
              }
            } else {
              // Not a type declaration (no variable name after type), reset and parse as expression
              ctx.setCurrent(savedPos);
              const expr = ctx.parseExpression();
              if (expr) {
                whenValues.push(expr);
              }
            }
          } else {
            // Failed to parse type, reset and parse as expression
            ctx.setCurrent(savedPos);
            const expr = ctx.parseExpression();
            if (expr) {
              whenValues.push(expr);
            }
          }
        } else {
          // Not a type, parse as expression
          const expr = ctx.parseExpression();
          if (expr) {
            whenValues.push(expr);
          }
        }

        // Check for comma-separated values: "when value1, value2"
        ctx.skipWhitespaceAndComments();
        while (ctx.match(TokenType.COMMA)) {
          ctx.skipWhitespaceAndComments();
          const expr2 = ctx.parseExpression();
          if (expr2) {
            whenValues.push(expr2);
          }
          ctx.skipWhitespaceAndComments();
        }

        ctx.skipWhitespaceAndComments();
        ctx.consume(TokenType.LEFT_BRACE, 'Expected { after when clause');
        ctx.skipWhitespaceAndComments();

        const statements: ParseTreeNode[] = [];
        while (!ctx.isAtEnd()) {
          ctx.skipWhitespaceAndComments();
          if (ctx.check(TokenType.RIGHT_BRACE)) {
            break;
          }
          const beforeStmt = ctx.getCurrent();
          const stmt = parseStatement(ctx);
          if (stmt) {
            statements.push(stmt);
          }
          if (ctx.getCurrent() === beforeStmt && !ctx.isAtEnd()) {
            void ctx.advance();
          }
        }
        ctx.consume(TokenType.RIGHT_BRACE, 'Expected } after when block');
        ctx.skipWhitespaceAndComments();

        // Build the case node structure
        const caseChildren: ParseTreeNode[] = [];
        if (whenType && whenVariable) {
          // Type match pattern: "when Type variable"
          // Create a type_match node with type and name children
          const typeMatchNode: ParseTreeNode = {
            children: [whenType, whenVariable],
            location: ctx.getLocation(start, ctx.getCurrent()),
            type: 'type_match',
          };
          caseChildren.push(typeMatchNode);
        } else if (whenValues.length > zeroIndex) {
          // Regular value expressions
          whenValues.forEach((val: Readonly<ParseTreeNode>) => {
            caseChildren.push(val);
          });
        }
        caseChildren.push({ children: statements, type: 'statements' });

        cases.push({
          children: caseChildren,
          location: ctx.getLocation(start, ctx.getCurrent()),
          type: 'switch_case',
        });
      }
    } else if (ctx.match(TokenType.CASE)) {
      // Java-style case
      const caseValue = ctx.parseExpression();
      if (caseValue === null) {
        throw new Error('Expected case value expression');
      }
      ctx.consume(TokenType.COLON, 'Expected : after case value');

      const statements: ParseTreeNode[] = [];
      while (
        !ctx.check(TokenType.CASE) &&
        !ctx.check(TokenType.DEFAULT) &&
        !ctx.check(TokenType.RIGHT_BRACE) &&
        !ctx.isAtEnd()
      ) {
        const beforeStmt = ctx.getCurrent();
        const stmt = parseStatement(ctx);
        if (stmt) {
          statements.push(stmt);
        }

        if (ctx.getCurrent() === beforeStmt && !ctx.isAtEnd()) {
          ctx.advance();
        }
      }

      cases.push({
        children: [caseValue, { children: statements, type: 'statements' }],
        location: ctx.getLocation(start, ctx.getCurrent()),
        type: 'switch_case',
      });
    } else if (ctx.match(TokenType.DEFAULT)) {
      // Java-style default
      ctx.consume(TokenType.COLON, 'Expected : after default');

      const statements: ParseTreeNode[] = [];
      while (
        !ctx.check(TokenType.CASE) &&
        !ctx.check(TokenType.DEFAULT) &&
        !ctx.check(TokenType.RIGHT_BRACE) &&
        !ctx.isAtEnd()
      ) {
        const beforeStmt = ctx.getCurrent();
        const stmt = parseStatement(ctx);
        if (stmt) {
          statements.push(stmt);
        }

        if (ctx.getCurrent() === beforeStmt && !ctx.isAtEnd()) {
          ctx.advance();
        }
      }

      defaultCase = {
        children: [{ children: statements, type: 'statements' }],
        location: ctx.getLocation(start, ctx.getCurrent()),
        type: 'switch_case',
      };
    } else {
      ctx.advance();
    }
    ctx.skipWhitespaceAndComments();
  }

  ctx.consume(TokenType.RIGHT_BRACE, 'Expected } after switch');

  // Build switch statement
  let finalExpression = expression;
  if (!finalExpression) {
    ctx.skipWhitespaceAndComments();
    const fallbackExpr = ctx.parsePrimary();
    if (fallbackExpr) {
      finalExpression = fallbackExpr;
    } else {
      throw new Error('Switch statement requires an expression');
    }
  }

  const switchChildren: ParseTreeNode[] = [finalExpression];
  if (cases.length > zeroIndex) {
    switchChildren.push({ children: [...cases], type: 'cases' });
  }

  if (defaultCase !== undefined) {
    switchChildren.push(defaultCase);
  }

  return {
    children: switchChildren,
    location: ctx.getLocation(start, ctx.getCurrent()),
    type: 'switch_statement',
  };
};

/**
 * Parses a try-catch-finally statement block from the source code.
 * @param ctx - The parser context.
 * @returns The parsed try statement parse tree node.
 * @throws {Error} If the try statement is malformed or unexpected tokens are encountered.
 */
parseTryStatement = function (ctx: Readonly<ParserContext>): ParseTreeNode {
  const singleIndexOffset = 1;
  const zeroIndex = 0;
  const start = ctx.getCurrent() - singleIndexOffset;
  ctx.skipWhitespaceAndComments();
  const tryBlock = ctx.parseBlock();

  const catchClauses: ParseTreeNode[] = [];
  ctx.skipWhitespaceAndComments();
  while (ctx.match(TokenType.CATCH)) {
    ctx.skipWhitespaceAndComments();
    ctx.consume(TokenType.LEFT_PAREN, 'Expected ( after catch');
    ctx.skipWhitespaceAndComments();
    const exceptionType = ctx.parseType();
    if (exceptionType === null) {
      throw new Error('Expected exception type in catch clause');
    }
    ctx.skipWhitespaceAndComments();
    const exceptionName = ctx.consume(TokenType.IDENTIFIER, 'Expected exception variable name');
    ctx.skipWhitespaceAndComments();
    ctx.consume(TokenType.RIGHT_PAREN, 'Expected ) after catch parameter');
    ctx.skipWhitespaceAndComments();
    const catchBlock = ctx.parseBlock();
    ctx.skipWhitespaceAndComments();

    catchClauses.push({
      children: [
        exceptionType,
        {
          location: ctx.locationToRange(exceptionName.location),
          text: exceptionName.text,
          type: 'name',
        },
        catchBlock,
      ],
      location: ctx.getLocation(start, ctx.getCurrent()),
      type: 'catch_clause',
    });
  }

  let finallyBlock: ParseTreeNode | undefined = undefined;
  ctx.skipWhitespaceAndComments();
  if (ctx.match(TokenType.FINALLY)) {
    ctx.skipWhitespaceAndComments();
    finallyBlock = ctx.parseBlock();
  }

  const children: ParseTreeNode[] = [tryBlock];
  if (catchClauses.length > zeroIndex) {
    children.push({ children: catchClauses, type: 'catch_clauses' });
  }
  if (finallyBlock) {
    children.push(finallyBlock);
  }

  return {
    children,
    location: ctx.getLocation(start, ctx.getCurrent()),
    type: 'try_statement',
  };
};

/**
 * Parses a break statement from the source code.
 * @param ctx - The parser context.
 * @returns The parsed break statement parse tree node.
 */
parseBreakStatement = function (ctx: Readonly<ParserContext>): ParseTreeNode {
  const singleIndexOffset = 1;
  const start = ctx.getCurrent() - singleIndexOffset;
  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.SEMICOLON, 'Expected ; after break');

  return {
    children: [],
    location: ctx.getLocation(start, ctx.getCurrent()),
    type: 'break_statement',
  };
};

/**
 * Parses a continue statement from the source code.
 * @param ctx - The parser context.
 * @returns The parsed continue statement parse tree node.
 */
parseContinueStatement = function (ctx: Readonly<ParserContext>): ParseTreeNode {
  const singleIndexOffset = 1;
  const start = ctx.getCurrent() - singleIndexOffset;
  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.SEMICOLON, 'Expected ; after continue');

  return {
    children: [],
    location: ctx.getLocation(start, ctx.getCurrent()),
    type: 'continue_statement',
  };
};

/**
 * Parses a throw statement from the source code.
 * @param ctx - The parser context.
 * @returns The parsed throw statement parse tree node.
 */
parseThrowStatement = function (ctx: Readonly<ParserContext>): ParseTreeNode {
  const singleIndexOffset = 1;
  const start = ctx.getCurrent() - singleIndexOffset;
  ctx.skipWhitespaceAndComments();
  const expression = ctx.parseExpression();
  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.SEMICOLON, 'Expected ; after throw');

  const children: ParseTreeNode[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- expression can be null
  if (expression !== null && expression !== undefined) {
    children.push(expression);
  }

  return {
    children,
    location: ctx.getLocation(start, ctx.getCurrent()),
    type: 'throw_statement',
  };
};

/**
 * Parses a return statement from the source code.
 * @param ctx - The parser context.
 * @returns The parsed return statement parse tree node.
 */
parseReturnStatement = function (ctx: Readonly<ParserContext>): ParseTreeNode {
  const singleIndexOffset = 1;
  const start = ctx.getCurrent() - singleIndexOffset;
  let expression: ParseTreeNode | undefined = undefined;

  ctx.skipWhitespaceAndComments();
  if (!ctx.check(TokenType.SEMICOLON)) {
    const expr = ctx.parseExpression();
    expression = expr ?? undefined;
  }

  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.SEMICOLON, 'Expected ; after return');

  const children: ParseTreeNode[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- expression can be null
  if (expression !== null && expression !== undefined) {
    children.push(expression);
  }

  return {
    children,
    location: ctx.getLocation(start, ctx.getCurrent()),
    type: 'return_statement',
  };
};

/**
 * Parse variable declaration.
 * Handles multiple declarators: String s = null, t = 'hello';.
 * @param ctx - The parser context.
 * @returns The parsed variable declaration parse tree node, or null if parsing fails.
 */
parseVariableDeclaration = function (ctx: Readonly<ParserContext>): ParseTreeNode | null {
  const start = ctx.getCurrent();
  const type = ctx.parseType();
  if (!type) {
    return null;
  }

  const declarations: ParseTreeNode[] = [];

  // Parse declarators (can be multiple, separated by commas)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Loop condition is intentional
  while (true) {
    const declStart = ctx.getCurrent();
    ctx.skipWhitespaceAndComments();
    const name = ctx.consume(TokenType.IDENTIFIER, 'Expected variable name');
    let initializer: ParseTreeNode | undefined = undefined;

    if (ctx.match(TokenType.ASSIGN)) {
      const expr = ctx.parseExpression();
      initializer = expr ?? undefined;
    }

    const declChildren: ParseTreeNode[] = [
      type,
      { location: ctx.locationToRange(name.location), text: name.text, type: 'name' },
    ];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- initializer can be undefined
    if (initializer !== null && initializer !== undefined) {
      declChildren.push(initializer);
    }

    declarations.push({
      children: declChildren,
      location: ctx.getLocation(declStart, ctx.getCurrent()),
      type: 'variable_declaration',
    });

    // Check for comma (multiple declarators)
    ctx.skipWhitespaceAndComments();
    if (!ctx.match(TokenType.COMMA)) {
      break;
    }
    // Skip whitespace after comma before next declarator
    ctx.skipWhitespaceAndComments();
  }

  ctx.consume(TokenType.SEMICOLON, 'Expected ; after variable declaration');

  // For multiple declarators, we need to create a block/compound statement
  // with multiple variable declaration statements
  const singleDeclarationCount = 1;
  const firstDeclarationIndex = 0;
  if (declarations.length > singleDeclarationCount) {
    const statementNodes: ParseTreeNode[] = declarations.map((decl: Readonly<ParseTreeNode>) => ({
      children: [decl], // Put the variable_declaration directly as child
      location: decl.location,
      type: 'variable_declaration_statement',
    }));

    return {
      children: statementNodes,
      location: ctx.getLocation(start, ctx.getCurrent()),
      type: 'block',
    };
  }

  // Single declaration - return as variable_declaration_statement
  return {
    children: [declarations[firstDeclarationIndex]],
    location: ctx.getLocation(start, ctx.getCurrent()),
    type: 'variable_declaration_statement',
  };
};

// Import loop parsing functions to avoid circular dependency
// Loop functions defined below

// ============================================================================
// Loop Parsing
// ============================================================================

/**
 * Parse for statement (supports both traditional for and for-each).
 * @param ctx - The parser context.
 * @returns The parsed for statement parse tree node.
 * @throws {Error} If the for statement is malformed or unexpected tokens are encountered.
 */
parseForStatement = function (ctx: Readonly<ParserContext>): ParseTreeNode {
  const singleIndexOffset = 1;
  const zeroIndex = 0;
  const start = ctx.getCurrent() - singleIndexOffset;
  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.LEFT_PAREN, 'Expected ( after for');

  // Check if it's a for-each loop (Type variable : iterable)
  // We need to check this before traditional for loop parsing
  ctx.skipWhitespaceAndComments();
  const savedPosForEach = ctx.getCurrent();
  if (ctx.checkType()) {
    const type = ctx.parseType();
    if (type) {
      ctx.skipWhitespaceAndComments();
      if (ctx.check(TokenType.IDENTIFIER)) {
        const name = ctx.consume(TokenType.IDENTIFIER, 'Expected variable name');
        ctx.skipWhitespaceAndComments();
        if (ctx.match(TokenType.COLON)) {
          // It's a for-each loop
          ctx.skipWhitespaceAndComments();
          const iterable = ctx.parseExpression();
          ctx.skipWhitespaceAndComments();
          ctx.consume(TokenType.RIGHT_PAREN, 'Expected ) after for-each');
          ctx.skipWhitespaceAndComments();
          const body = parseStatement(ctx);

          if (iterable === null) {
            throw new Error('Expected iterable expression in for-each loop');
          }
          if (body === null) {
            throw new Error('Expected body statement in for-each loop');
          }
          const children: ParseTreeNode[] = [
            type,
            { location: ctx.locationToRange(name.location), text: name.text, type: 'name' },
            iterable,
            body,
          ];

          return {
            children,
            location: ctx.getLocation(start, ctx.getCurrent()),
            type: 'for_each_statement',
          };
        } else {
          // Not a for-each, reset and parse as traditional for
          ctx.setCurrent(savedPosForEach);
        }
      } else {
        // Not a for-each, reset
        ctx.setCurrent(savedPosForEach);
      }
    } else {
      // Failed to parse type, reset
      ctx.setCurrent(savedPosForEach);
    }
  }

  // Traditional for loop

  /**
   * Initialization: Could be variable declaration or expression(s).
   * Can be multiple expressions separated by commas: i=0, j=0.
   */
  let init: ParseTreeNode | null = null;
  const initStart = ctx.getCurrent();

  // Try to parse as variable declaration first (without consuming semicolon)
  const savedPosForInit = ctx.getCurrent();
  if (ctx.checkType()) {
    const type = ctx.parseType();
    if (type !== null) {
      ctx.skipWhitespaceAndComments();
      // Check if there's an identifier (variable name) - if so, it's a variable declaration
      if (ctx.check(TokenType.IDENTIFIER)) {
        const declarations: ParseTreeNode[] = [];

        // Parse declarators (can be multiple, separated by commas)
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Intentional infinite loop pattern
        while (true) {
          const declStart = ctx.getCurrent();
          ctx.skipWhitespaceAndComments();
          const name = ctx.consume(TokenType.IDENTIFIER, 'Expected variable name');
          let initializer: ParseTreeNode | undefined = undefined;

          if (ctx.match(TokenType.ASSIGN)) {
            const expr = ctx.parseExpression();
            initializer = expr ?? undefined;
          }

          const declChildren: ParseTreeNode[] = [
            type,
            { location: ctx.locationToRange(name.location), text: name.text, type: 'name' },
          ];
          if (initializer) {
            declChildren.push(initializer);
          }

          declarations.push({
            children: declChildren,
            location: ctx.getLocation(declStart, ctx.getCurrent()),
            type: 'variable_declaration',
          });

          // Check for comma (multiple declarators)
          ctx.skipWhitespaceAndComments();
          if (!ctx.match(TokenType.COMMA)) {
            break;
          }
          // Skip whitespace after comma before next declarator
          ctx.skipWhitespaceAndComments();
        }

        // Create variable declaration statement(s) - don't consume semicolon here
        const singleDeclarationCount = 1;
        if (declarations.length > singleDeclarationCount) {
          const statementNodes: ParseTreeNode[] = declarations.map(
            (decl: Readonly<ParseTreeNode>) => ({
              children: [decl],
              location: decl.location,
              type: 'variable_declaration_statement',
            })
          );
          init = {
            children: statementNodes,
            location: ctx.getLocation(initStart, ctx.getCurrent()),
            type: 'block',
          };
        } else {
          init = {
            children: [declarations[zeroIndex]],
            location: ctx.getLocation(initStart, ctx.getCurrent()),
            type: 'variable_declaration_statement',
          };
        }
      } else {
        // Not a variable declaration, reset
        ctx.setCurrent(savedPosForInit);
      }
    }
  }

  // If not a variable declaration, try parsing as expression(s)
  if (!init) {
    // Check if init is empty (just semicolon)
    if (ctx.check(TokenType.SEMICOLON)) {
      // Empty init - leave as null
      init = null;
    } else {
      const expressions: ParseTreeNode[] = [];

      // Parse first expression
      const firstExpr = ctx.parseExpression();
      if (firstExpr) {
        expressions.push(firstExpr);

        // Check for comma-separated expressions
        ctx.skipWhitespaceAndComments();
        while (ctx.match(TokenType.COMMA)) {
          ctx.skipWhitespaceAndComments();
          const expr = ctx.parseExpression();
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- expr can be null
          if (expr !== null && expr !== undefined) {
            expressions.push(expr);
          }
          ctx.skipWhitespaceAndComments();
        }

        // If multiple expressions, wrap them in a block/compound statement
        const singleExpressionCount = 1;
        if (expressions.length > singleExpressionCount) {
          init = {
            children: expressions.map((expr: Readonly<ParseTreeNode>) => ({
              children: [expr],
              location: expr.location,
              type: 'expression_statement',
            })),
            location: ctx.getLocation(initStart, ctx.getCurrent()),
            type: 'block',
          };
        } else {
          // Single expression - create expression statement
          init = {
            children: [expressions[zeroIndex]],
            location: expressions[zeroIndex].location,
            type: 'expression_statement',
          };
        }
      }
    }
  }

  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.SEMICOLON, 'Expected ; after init');
  ctx.skipWhitespaceAndComments();

  // Condition: can be empty
  let condition: ParseTreeNode | null = null;
  if (!ctx.check(TokenType.SEMICOLON)) {
    condition = ctx.parseExpression();
  }
  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.SEMICOLON, 'Expected ; after condition');
  ctx.skipWhitespaceAndComments();

  // Update: can be empty or multiple expressions
  let update: ParseTreeNode | null = null;
  if (!ctx.check(TokenType.RIGHT_PAREN)) {
    const updateExpressions: ParseTreeNode[] = [];
    const updateStart = ctx.getCurrent();

    const firstUpdate = ctx.parseExpression();
    if (firstUpdate) {
      updateExpressions.push(firstUpdate);

      // Check for comma-separated update expressions
      ctx.skipWhitespaceAndComments();
      while (ctx.match(TokenType.COMMA)) {
        ctx.skipWhitespaceAndComments();
        const expr = ctx.parseExpression();
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- expr can be null
        if (expr !== null && expr !== undefined) {
          updateExpressions.push(expr);
        }
        ctx.skipWhitespaceAndComments();
      }

      // If multiple expressions, wrap them
      const singleExpressionCount = 1;
      if (updateExpressions.length > singleExpressionCount) {
        update = {
          children: updateExpressions.map((expr: Readonly<ParseTreeNode>) => ({
            children: [expr],
            location: expr.location,
            type: 'expression_statement',
          })),
          location: ctx.getLocation(updateStart, ctx.getCurrent()),
          type: 'block',
        };
      } else {
        update = firstUpdate;
      }
    }
  }

  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.RIGHT_PAREN, 'Expected ) after for');
  ctx.skipWhitespaceAndComments();
  const body = parseStatement(ctx);

  const children: ParseTreeNode[] = [];
  if (init) children.push(init);
  if (condition) children.push(condition);
  if (update) children.push(update);
  if (body) children.push(body);

  return {
    children,
    location: ctx.getLocation(start, ctx.getCurrent()),
    type: 'for_statement',
  };
};

/**
 * Parses a while loop statement from the source code.
 * @param ctx - The parser context.
 * @returns The parsed while statement parse tree node.
 * @throws {Error} If the while statement is malformed or unexpected tokens are encountered.
 */
parseWhileStatement = function (ctx: Readonly<ParserContext>): ParseTreeNode {
  const singleIndexOffset = 1;
  const start = ctx.getCurrent() - singleIndexOffset;
  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.LEFT_PAREN, 'Expected ( after while');
  ctx.skipWhitespaceAndComments();
  const condition = ctx.parseExpression();
  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.RIGHT_PAREN, 'Expected ) after condition');
  ctx.skipWhitespaceAndComments();
  const body = parseStatement(ctx);

  const children: ParseTreeNode[] = [];
  if (condition) children.push(condition);
  if (body) children.push(body);

  return {
    children,
    location: ctx.getLocation(start, ctx.getCurrent()),
    type: 'while_statement',
  };
};

/**
 * Parses a do-while loop statement from the source code.
 * @param ctx - The parser context.
 * @returns The parsed do-while statement parse tree node.
 * @throws {Error} If the do-while statement is malformed or unexpected tokens are encountered.
 */
parseDoWhileStatement = function (ctx: Readonly<ParserContext>): ParseTreeNode {
  const singleIndexOffset = 1;
  const start = ctx.getCurrent() - singleIndexOffset;
  ctx.skipWhitespaceAndComments();
  const body = parseStatement(ctx);
  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.WHILE, 'Expected while after do');
  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.LEFT_PAREN, 'Expected ( after while');
  ctx.skipWhitespaceAndComments();
  const condition = ctx.parseExpression();
  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.RIGHT_PAREN, 'Expected ) after condition');
  ctx.skipWhitespaceAndComments();
  ctx.consume(TokenType.SEMICOLON, 'Expected ; after do-while');

  const children: ParseTreeNode[] = [];

  if (body) children.push(body);

  if (condition) children.push(condition);

  return {
    children,
    location: ctx.getLocation(start, ctx.getCurrent()),
    type: 'do_while_statement',
  };
};

export {
  parseBlock,
  parseStatement,
  parseIfStatement,
  parseSwitchStatement,
  parseTryStatement,
  parseBreakStatement,
  parseContinueStatement,
  parseThrowStatement,
  parseReturnStatement,
  parseVariableDeclaration,
  parseForStatement,
  parseWhileStatement,
  parseDoWhileStatement,
};
