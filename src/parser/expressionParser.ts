/**
 * @file Expression parsing.
 * Parses expressions: assignment, ternary, logical, equality, comparison, arithmetic, unary, primary.
 */

import type { SourceRange } from '../ast/baseNode.js';
import { CAPTURE_GROUP_FIRST, PREVIOUS_POSITION_OFFSET } from '../constants.js';
import type { ParseTreeNode } from './parseTree.js';
import { TokenType, type Token } from './tokenType.js';
import type { ParserContext } from './apexParser.js';

/**
 * Stub used before real parser is assigned (mutually recursive).
 * @throws {Error} Always, if called before assignment.
 */
const parserStubNull = (): ParseTreeNode | null => {
  throw new Error('parser used before assignment');
};

/**
 * Stub used before real parser is assigned (returns node).
 * @throws {Error} Always, if called before assignment.
 */
const parserStubNode = (): ParseTreeNode => {
  throw new Error('parser used before assignment');
};

/** Forward declarations for mutually recursive expression parsers. */
let parseAssignment: (ctx: Readonly<ParserContext>) => ParseTreeNode | null = parserStubNull;
let parseTernary: (ctx: Readonly<ParserContext>) => ParseTreeNode | null = parserStubNull;
let parseOr: (ctx: Readonly<ParserContext>) => ParseTreeNode | null = parserStubNull;
let parseAnd: (ctx: Readonly<ParserContext>) => ParseTreeNode | null = parserStubNull;
let parseEquality: (ctx: Readonly<ParserContext>) => ParseTreeNode | null = parserStubNull;
let parseComparison: (ctx: Readonly<ParserContext>) => ParseTreeNode | null = parserStubNull;
let parseAddition: (ctx: Readonly<ParserContext>) => ParseTreeNode | null = parserStubNull;
let parseMultiplication: (ctx: Readonly<ParserContext>) => ParseTreeNode | null = parserStubNull;
let parseUnary: (ctx: Readonly<ParserContext>) => ParseTreeNode | null = parserStubNull;
let parsePrimary: (ctx: Readonly<ParserContext>) => ParseTreeNode | null = parserStubNull;
let parseNewExpression: (ctx: Readonly<ParserContext>) => ParseTreeNode = parserStubNode;
let parseSoqlSoslQuery: (ctx: Readonly<ParserContext>) => ParseTreeNode = parserStubNode;
let parseLambdaParameter: (ctx: Readonly<ParserContext>) => ParseTreeNode | null = parserStubNull;

/**
 * Parse expression (entry point - delegates to assignment).
 * @param ctx - The parser context.
 * @returns The parsed expression parse tree node, or null if parsing fails.
 */
function parseExpression(ctx: Readonly<ParserContext>): ParseTreeNode | null {
  return parseAssignment(ctx);
}

/**
 * Parse assignment expression.
 * @param ctx - The parser context.
 * @returns The parsed assignment expression parse tree node, or null if parsing fails.
 */
parseAssignment = function (ctx: Readonly<ParserContext>): ParseTreeNode | null {
  let expr = parseTernary(ctx);

  if (
    ctx.match(
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
    const operator = ctx.previous();
    const right = parseAssignment(ctx);
    if (right != null && expr?.location != null && right.location != null) {
      return {
        children: [expr, right],
        location: ctx.combineLocations(expr.location, right.location),
        operator: operator.text,
        type: 'binary_expression',
      };
    }
  }

  return expr;
};

/**
 * Parse ternary/null-coalescing expression.
 * @param ctx - The parser context.
 * @returns The parsed ternary expression parse tree node, or null if parsing fails.
 */
parseTernary = function (ctx: Readonly<ParserContext>): ParseTreeNode | null {
  let expr = parseOr(ctx);

  // Null coalescing operator ??
  while (ctx.match(TokenType.NULL_COALESCING)) {
    const operator = ctx.previous();
    const right = parseTernary(ctx);
    if (right != null && expr?.location != null && right.location != null) {
      expr = {
        children: [expr, right],
        location: ctx.combineLocations(expr.location, right.location),
        operator: operator.text,
        type: 'binary_expression',
      };
    }
  }

  // Ternary operator ? :
  if (ctx.match(TokenType.QUESTION)) {
    const thenExpr = parseExpression(ctx);
    ctx.consume(TokenType.COLON, 'Expected : in ternary expression');
    const elseExpr = parseTernary(ctx);
    if (thenExpr && elseExpr && expr) {
      expr = {
        children: [expr, thenExpr, elseExpr],
        location:
          expr.location != null && thenExpr.location != null && elseExpr.location != null
            ? ctx.combineLocations(expr.location, elseExpr.location)
            : ((): SourceRange => {
                const ternaryExpressionOffset = 3;
                return ctx.getLocation(
                  ctx.getCurrent() - ternaryExpressionOffset,
                  ctx.getCurrent()
                );
              })(),
        type: 'ternary_expression',
      };
    }
  }

  return expr;
};

/**
 * Parse logical OR expression.
 * @param ctx - The parser context.
 * @returns The parsed OR expression parse tree node, or null if parsing fails.
 */
parseOr = function (ctx: Readonly<ParserContext>): ParseTreeNode | null {
  let expr = parseAnd(ctx);

  while (ctx.match(TokenType.OR)) {
    const operator = ctx.previous();
    const right = parseAnd(ctx);
    if (right != null && expr?.location != null && right.location != null) {
      expr = {
        children: [expr, right],
        location: ctx.combineLocations(expr.location, right.location),
        operator: operator.text,
        type: 'binary_expression',
      };
    }
  }

  return expr;
};

/**
 * Parse logical AND expression.
 * @param ctx - The parser context.
 * @returns The parsed AND expression parse tree node, or null if parsing fails.
 */
parseAnd = function (ctx: Readonly<ParserContext>): ParseTreeNode | null {
  let expr = parseEquality(ctx);

  while (ctx.match(TokenType.AND)) {
    const operator = ctx.previous();
    const right = parseEquality(ctx);
    if (right) {
      expr = {
        children: expr !== null ? [expr, right] : [right],
        location:
          expr?.location != null && right.location != null
            ? ctx.combineLocations(expr.location, right.location)
            : (right.location ??
              ((): SourceRange => {
                const previousTokenOffset = 1;
                return ctx.getLocation(ctx.getCurrent() - previousTokenOffset, ctx.getCurrent());
              })()),
        operator: operator.text,
        type: 'binary_expression',
      };
    }
  }

  return expr;
};

/**
 * Parse equality expression (==, !=).
 * @param ctx - The parser context.
 * @returns The parsed equality expression parse tree node, or null if parsing fails.
 */
parseEquality = function (ctx: Readonly<ParserContext>): ParseTreeNode | null {
  let expr = parseComparison(ctx);

  while (ctx.match(TokenType.EQUALS, TokenType.NOT_EQUALS)) {
    const operator = ctx.previous();
    const right = parseComparison(ctx);
    if (right) {
      expr = {
        children: expr !== null ? [expr, right] : [right],
        location:
          expr?.location != null && right.location != null
            ? ctx.combineLocations(expr.location, right.location)
            : (right.location ??
              ((): SourceRange => {
                const previousTokenOffset = 1;
                return ctx.getLocation(ctx.getCurrent() - previousTokenOffset, ctx.getCurrent());
              })()),
        operator: operator.text,
        type: 'binary_expression',
      };
    }
  }

  return expr;
};

/**
 * Parse comparison expression (<, >, <=, >=, instanceof).
 * @param ctx - The parser context.
 * @returns The parsed comparison expression parse tree node, or null if parsing fails.
 */
parseComparison = function (ctx: Readonly<ParserContext>): ParseTreeNode | null {
  let expr = parseAddition(ctx);

  while (
    ctx.match(
      TokenType.LESS_THAN,
      TokenType.LESS_EQUAL,
      TokenType.GREATER_THAN,
      TokenType.GREATER_EQUAL
    )
  ) {
    const operator = ctx.previous();
    const right = parseAddition(ctx);
    if (right) {
      expr = {
        children: expr !== null ? [expr, right] : [right],
        location:
          expr?.location != null && right.location != null
            ? ctx.combineLocations(expr.location, right.location)
            : (right.location ??
              ((): SourceRange => {
                const previousTokenOffset = 1;
                return ctx.getLocation(ctx.getCurrent() - previousTokenOffset, ctx.getCurrent());
              })()),
        operator: operator.text,
        type: 'binary_expression',
      };
    }
  }

  // Check for instanceof (as identifier keyword)
  if (expr !== null && ctx.check(TokenType.IDENTIFIER)) {
    const nextToken = ctx.peek();
    if (nextToken.text.toLowerCase() === 'instanceof') {
      ctx.advance(); // Skip 'instanceof'
      const right = ctx.parseType();
      if (right) {
        expr = {
          children: [expr, right],
          location:
            expr.location != null && right.location != null
              ? ctx.combineLocations(expr.location, right.location)
              : (right.location ??
                ((): SourceRange => {
                  const previousTokenOffset = 1;
                  return ctx.getLocation(ctx.getCurrent() - previousTokenOffset, ctx.getCurrent());
                })()),
          type: 'instanceof_expression',
        };
      }
    }
  }

  return expr;
};

/**
 * Parse addition/subtraction expression (+, -).
 * @param ctx - The parser context.
 * @returns The parsed addition expression parse tree node, or null if parsing fails.
 */
parseAddition = function (ctx: Readonly<ParserContext>): ParseTreeNode | null {
  let expr = parseMultiplication(ctx);

  while (ctx.match(TokenType.PLUS, TokenType.MINUS)) {
    const operator = ctx.previous();
    const right = parseMultiplication(ctx);
    if (right) {
      expr = {
        children: expr !== null ? [expr, right] : [right],
        location:
          expr?.location != null && right.location != null
            ? ctx.combineLocations(expr.location, right.location)
            : (right.location ??
              ((): SourceRange => {
                const previousTokenOffset = 1;
                return ctx.getLocation(ctx.getCurrent() - previousTokenOffset, ctx.getCurrent());
              })()),
        operator: operator.text,
        type: 'binary_expression',
      };
    }
  }

  return expr;
};

/**
 * Parse multiplication/division/modulo expression (*, /, %).
 * @param ctx - The parser context.
 * @returns The parsed multiplication expression parse tree node, or null if parsing fails.
 */
parseMultiplication = function (ctx: Readonly<ParserContext>): ParseTreeNode | null {
  let expr = parseUnary(ctx);

  while (ctx.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO)) {
    const operator = ctx.previous();
    const right = parseUnary(ctx);
    if (right != null && expr != null) {
      expr = {
        children: [expr, right],
        location:
          expr.location != null && right.location != null
            ? ctx.combineLocations(expr.location, right.location)
            : (right.location ??
              ((): SourceRange => {
                const previousTokenOffset = 1;
                return ctx.getLocation(ctx.getCurrent() - previousTokenOffset, ctx.getCurrent());
              })()),
        operator: operator.text,
        type: 'binary_expression',
      };
    }
  }

  return expr;
};

/**
 * Parses a unary expression (prefix and postfix operators).
 * @param ctx - The parser context.
 * @returns The parsed unary expression parse tree node, or null if parsing fails.
 */
parseUnary = function (ctx: Readonly<ParserContext>): ParseTreeNode | null {
  const singleIndexOffset = 1;
  // Prefix operators
  if (
    ctx.match(
      TokenType.NOT,
      TokenType.MINUS,
      TokenType.PLUS,
      TokenType.INCREMENT,
      TokenType.DECREMENT
    )
  ) {
    const operator = ctx.previous();
    const right = parseUnary(ctx);
    if (right?.location) {
      return {
        children: [right],
        location: ctx.combineLocations(ctx.locationToRange(operator.location), right.location),
        operator: operator.text,
        prefix: true,
        type: 'unary_expression',
      };
    }
  }

  let expr = parsePrimary(ctx);
  if (!expr) {
    return null;
  }

  // Postfix operators (increment/decrement)
  while (ctx.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
    const operator = ctx.previous();
    expr = {
      children: [expr],
      location: ctx.combineLocations(
        expr.location ?? ctx.getLocation(ctx.getCurrent() - singleIndexOffset, ctx.getCurrent()),
        ctx.locationToRange(operator.location)
      ),
      operator: operator.text,
      prefix: false,
      type: 'unary_expression',
    };
  }

  // Handle postfix operations (method calls, field access, array access) for super/this expressions
  if (expr !== null && (expr.type === 'super_expression' || expr.type === 'this_expression')) {
    // Get the token that created this expression (super or this)
    const previousTokenIndex = 1;
    const token = ctx.tokens[ctx.getCurrent() - previousTokenIndex];
    // Parse postfix operations (method calls, field access, array access)
    while (true) {
      // Check for safe navigation operator ?. or ?(
      const peekOffset = 1;
      const peekToken = ctx.peek(peekOffset);
      const isSafe =
        ctx.check(TokenType.QUESTION) &&
        (peekToken.type === TokenType.DOT || peekToken.type === TokenType.LEFT_PAREN);

      if (isSafe) {
        ctx.advance(); // Consume QUESTION
      }

      if (ctx.match(TokenType.LEFT_PAREN)) {
        // Method call
        const args: ParseTreeNode[] = [];
        if (!ctx.check(TokenType.RIGHT_PAREN)) {
          do {
            const beforeArg = ctx.getCurrent();
            const arg = parseExpression(ctx);
            if (arg) {
              args.push(arg);
            }
            // Safety check: ensure we always advance
            if (ctx.getCurrent() === beforeArg && !ctx.isAtEnd()) {
              ctx.advance();
            }
          } while (ctx.match(TokenType.COMMA));
        }
        ctx.consume(TokenType.RIGHT_PAREN, 'Expected ) after arguments');

        const methodCallNode: ParseTreeNode = {
          children: [expr, { children: args, type: 'arguments' }],
          ...(isSafe ? { isSafe: true } : {}),
          location: ctx.combineLocations(
            expr.location ?? ctx.locationToRange(token.location),
            ((): SourceRange => {
              const previousTokenOffset = 1;
              return ctx.getLocation(ctx.getCurrent() - previousTokenOffset, ctx.getCurrent());
            })()
          ),
          type: 'method_call_expression',
        };
        expr = methodCallNode;
      } else if (ctx.match(TokenType.DOT)) {
        // Field access
        // Special case: .class is a class literal (e.g., Object.class)
        const field = ctx.check(TokenType.CLASS)
          ? ctx.advance()
          : ctx.consume(TokenType.IDENTIFIER, 'Expected field name');
        const fieldAccessNode: ParseTreeNode = {
          children: [
            expr,
            { location: ctx.locationToRange(field.location), text: field.text, type: 'field' },
          ],
          ...(isSafe ? { isSafe: true } : {}),
          location: ctx.combineLocations(
            expr.location ?? ctx.locationToRange(token.location),
            ctx.locationToRange(field.location)
          ),
          type: 'field_access_expression',
        };
        expr = fieldAccessNode;
      } else if (ctx.match(TokenType.LEFT_BRACKET)) {
        // Array access
        const index = parseExpression(ctx);
        if (!index) {
          break;
        }
        ctx.consume(TokenType.RIGHT_BRACKET, 'Expected ] after array index');
        expr = {
          children: [expr, index],
          location: ctx.combineLocations(
            expr.location ?? ctx.locationToRange(token.location),
            ((): SourceRange => {
              const previousTokenOffset = 1;
              return ctx.getLocation(ctx.getCurrent() - previousTokenOffset, ctx.getCurrent());
            })()
          ),
          type: 'array_access_expression',
        };
      } else {
        break;
      }
    }
  }

  /**
   * Generic postfix handling (method calls, field access, array access) for any primary expression.
   */
  while (expr !== null) {
    const peekOffset = 1;
    const peekToken = ctx.peek(peekOffset);
    const isSafe =
      ctx.check(TokenType.QUESTION) &&
      (peekToken.type === TokenType.DOT || peekToken.type === TokenType.LEFT_PAREN);

    if (isSafe) {
      ctx.advance(); // Consume QUESTION
    }

    if (ctx.match(TokenType.LEFT_PAREN)) {
      // Method call
      const args: ParseTreeNode[] = [];
      if (!ctx.check(TokenType.RIGHT_PAREN)) {
        do {
          const beforeArg = ctx.getCurrent();
          const arg = parseExpression(ctx);
          if (arg) {
            args.push(arg);
          }
          if (ctx.getCurrent() === beforeArg && !ctx.isAtEnd()) {
            ctx.advance();
          }
        } while (ctx.match(TokenType.COMMA));
      }
      ctx.consume(TokenType.RIGHT_PAREN, 'Expected ) after arguments');

      const methodCallNode: ParseTreeNode = {
        children: [expr, { children: args, type: 'arguments' }],
        ...(isSafe ? { isSafe: true } : {}),
        location:
          expr.location ??
          ((): SourceRange => {
            const previousTokenOffset = 1;
            return ctx.getLocation(ctx.getCurrent() - previousTokenOffset, ctx.getCurrent());
          })(),
        type: 'method_call_expression',
      };
      expr = methodCallNode;
    } else if (ctx.match(TokenType.DOT)) {
      // Field access
      const field = ctx.check(TokenType.CLASS)
        ? ctx.advance()
        : ctx.consume(TokenType.IDENTIFIER, 'Expected field name');

      const fieldAccessNode: ParseTreeNode = {
        children: [
          expr,
          { location: ctx.locationToRange(field.location), text: field.text, type: 'field' },
        ],
        ...(isSafe ? { isSafe: true } : {}),
        location: ctx.combineLocations(
          expr.location ?? ctx.locationToRange(field.location),
          ctx.locationToRange(field.location)
        ),
        type: 'field_access_expression',
      };
      expr = fieldAccessNode;
    } else if (ctx.match(TokenType.LEFT_BRACKET)) {
      // Array access
      const index = parseExpression(ctx);
      if (!index) {
        break;
      }
      ctx.consume(TokenType.RIGHT_BRACKET, 'Expected ] after array index');
      expr = {
        children: [expr, index],
        location:
          expr.location ??
          ((): SourceRange => {
            const previousTokenOffset = 1;
            return ctx.getLocation(ctx.getCurrent() - previousTokenOffset, ctx.getCurrent());
          })(),
        type: 'array_access_expression',
      };
    } else {
      break;
    }
  }

  return expr;
};

// ============================================================================
// Primary Expression Parsing
// ============================================================================

/**
 * Parse primary expression.
 * @param ctx - The parser context.
 * @returns The parsed primary expression parse tree node, or null if parsing fails.
 * @throws {Error} If the primary expression is malformed or unexpected tokens are encountered.
 */
parsePrimary = function (ctx: Readonly<ParserContext>): ParseTreeNode | null {
  if (ctx.match(TokenType.BOOLEAN_LITERAL, TokenType.TRUE, TokenType.FALSE)) {
    const token = ctx.previous();
    return {
      location: ctx.locationToRange(token.location),
      text: token.text,
      type: 'boolean_literal',
    };
  }

  if (ctx.match(TokenType.NULL, TokenType.NULL_LITERAL)) {
    const token = ctx.previous();
    return {
      location: ctx.locationToRange(token.location),
      text: token.text,
      type: 'null_literal',
    };
  }

  if (ctx.match(TokenType.STRING_LITERAL)) {
    const token = ctx.previous();
    return {
      location: ctx.locationToRange(token.location),
      text: token.text,
      type: 'string_literal',
    };
  }

  if (ctx.match(TokenType.NUMBER_LITERAL)) {
    const token = ctx.previous();
    return {
      location: ctx.locationToRange(token.location),
      text: token.text,
      type: 'number_literal',
    };
  }

  if (ctx.match(TokenType.THIS)) {
    const token = ctx.previous();
    return {
      location: ctx.locationToRange(token.location),
      text: token.text,
      type: 'this_expression',
    };
  }

  if (ctx.match(TokenType.SUPER)) {
    const token = ctx.previous();
    return {
      location: ctx.locationToRange(token.location),
      text: token.text,
      type: 'super_expression',
    };
  }

  if (ctx.match(TokenType.NEW)) {
    return parseNewExpression(ctx);
  }

  // SOQL/SOSL query: [SELECT ... FROM ...] or [FIND ... IN ... RETURNING ...]
  if (ctx.match(TokenType.LEFT_BRACKET)) {
    return parseSoqlSoslQuery(ctx);
  }

  // Lambda expression: (params) => body or (Type param) => body
  // Cast expression: (Type) expression
  // Parenthesized expression: (expression)
  if (ctx.match(TokenType.LEFT_PAREN)) {
    const savedPos = ctx.getCurrent();

    // Try to parse as lambda: check if we have parameters followed by =>
    const lambdaParams: ParseTreeNode[] = [];
    let isLambda = false;

    // Check if it's a lambda by looking ahead for =>
    if (!ctx.isAtEnd()) {
      // Try to parse parameters
      const testParam = parseLambdaParameter(ctx);
      if (testParam) {
        lambdaParams.push(testParam);
        // Check for more parameters
        while (ctx.match(TokenType.COMMA)) {
          const param = parseLambdaParameter(ctx);
          if (param) {
            lambdaParams.push(param);
          } else {
            break;
          }
        }
        // If we have parameters, check if next is ) followed by =>
        if (ctx.check(TokenType.RIGHT_PAREN)) {
          // Temporarily consume ) and check for =>
          ctx.advance(); // Consume )
          if (ctx.check(TokenType.ARROW)) {
            isLambda = true;
          } else {
            // Not a lambda, reset
            ctx.setCurrent(savedPos);
          }
        } else {
          // No closing paren, not a lambda
          ctx.setCurrent(savedPos);
        }
      } else {
        // Could be empty lambda: () =>
        if (ctx.check(TokenType.RIGHT_PAREN)) {
          ctx.advance(); // Consume )
          if (ctx.check(TokenType.ARROW)) {
            isLambda = true;
          } else {
            ctx.setCurrent(savedPos);
          }
        } else {
          // Reset to check for cast or parenthesized
          ctx.setCurrent(savedPos);
        }
      }
    }

    if (isLambda) {
      // We already consumed ) if it's a lambda, now consume =>
      ctx.consume(TokenType.ARROW, 'Expected => after lambda parameters');

      // Lambda body can be an expression or a block
      const body: ParseTreeNode = ctx.check(TokenType.LEFT_BRACE)
        ? ctx.parseBlock()
        : ((): ParseTreeNode => {
            const expr = parseExpression(ctx);
            if (!expr) {
              throw new Error('Expected lambda body expression or block');
            }
            return expr;
          })();

      return {
        children: [{ children: lambdaParams, type: 'parameters' }, body],
        location: ctx.getLocation(savedPos - PREVIOUS_POSITION_OFFSET, ctx.getCurrent()),
        type: 'lambda_expression',
      };
    }

    // Not a lambda, check for cast
    const potentialType = ctx.parseType();
    if (potentialType?.location != null && ctx.check(TokenType.RIGHT_PAREN)) {
      // It's a cast: (Type) expression
      ctx.consume(TokenType.RIGHT_PAREN, 'Expected ) after cast type');
      const expr = parseUnary(ctx);
      if (expr?.location != null) {
        return {
          children: [potentialType, expr],
          location: ctx.combineLocations(potentialType.location, expr.location),
          type: 'cast_expression',
        };
      }
    }
    // Not a cast, reset to before type parsing and parse as parenthesized expression
    ctx.setCurrent(savedPos);
    // Now parse as parenthesized expression - we're at the position after LEFT_PAREN
    const expr = parseExpression(ctx);
    if (expr === null) {
      throw new Error('Expected expression in parentheses');
    }
    ctx.consume(TokenType.RIGHT_PAREN, 'Expected ) after expression');

    const arrayIndexOffset = 1;
    return {
      children: [expr],
      location: ctx.getLocation(savedPos - arrayIndexOffset, ctx.getCurrent()),
      type: 'parenthesized_expression',
    };
  }

  // Type keywords can be used as identifiers in expressions (e.g., Object.class)
  // Also check for TRIGGER keyword which is used in Trigger context variables
  if (
    ctx.match(
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
    const singleIndexOffset = 1;
    const token = ctx.previous();
    let expr: ParseTreeNode = {
      location: ctx.locationToRange(token.location),
      text: token.text,
      type: 'identifier',
    };

    // Check for trigger context variables: Trigger.new, Trigger.old, etc.
    // Handle both IDENTIFIER("trigger") and TRIGGER keyword
    if (
      (token.type === TokenType.TRIGGER || token.text.toLowerCase() === 'trigger') &&
      ctx.match(TokenType.DOT)
    ) {
      // Trigger context variables can be keywords (new) or identifiers (old, isInsert, etc.)
      const nextToken = ctx.peek();
      const triggerVar: Token =
        nextToken.type === TokenType.NEW
          ? ctx.advance()
          : ctx.consume(TokenType.IDENTIFIER, 'Expected trigger context variable');
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
          location: ctx.combineLocations(
            ctx.locationToRange(token.location),
            ctx.locationToRange(triggerVar.location)
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
              location: ctx.locationToRange(triggerVar.location),
              text: triggerVar.text,
              type: 'field',
            },
          ],
          location: ctx.combineLocations(
            expr.location ??
              ctx.getLocation(ctx.getCurrent() - singleIndexOffset, ctx.getCurrent()),
            ctx.locationToRange(triggerVar.location)
          ),
          type: 'field_access_expression',
        };
      }
    }

    // Parse postfix operations (method calls, field access, array access)
    while (true) {
      // Check for safe navigation operator ?. or ?(
      const singleCharOffset = 1;
      const peekToken = ctx.peek(singleCharOffset);
      const isSafe =
        ctx.check(TokenType.QUESTION) &&
        (peekToken.type === TokenType.DOT || peekToken.type === TokenType.LEFT_PAREN);

      if (isSafe) {
        ctx.advance(); // Consume QUESTION
      }

      if (ctx.match(TokenType.LEFT_PAREN)) {
        // Method call
        const args: ParseTreeNode[] = [];
        if (!ctx.check(TokenType.RIGHT_PAREN)) {
          do {
            const beforeArg = ctx.getCurrent();
            const arg = parseExpression(ctx);
            if (arg) {
              args.push(arg);
            }
            // Safety check: ensure we always advance
            if (ctx.getCurrent() === beforeArg && !ctx.isAtEnd()) {
              ctx.advance();
            }
          } while (ctx.match(TokenType.COMMA));
        }
        ctx.consume(TokenType.RIGHT_PAREN, 'Expected ) after arguments');

        const methodCallNode: ParseTreeNode = {
          children: [expr, { children: args, type: 'arguments' }],
          ...(isSafe ? { isSafe: true } : {}),
          location: ctx.combineLocations(
            expr.location ?? ctx.locationToRange(token.location),
            ctx.getLocation(ctx.getCurrent() - singleIndexOffset, ctx.getCurrent())
          ),
          type: 'method_call_expression',
        };
        expr = methodCallNode;
      } else if (ctx.match(TokenType.DOT)) {
        // Field access
        // Special case: .class is a class literal (e.g., Object.class)
        const field = ctx.check(TokenType.CLASS)
          ? ctx.advance()
          : ctx.consume(TokenType.IDENTIFIER, 'Expected field name');
        const fieldAccessNode: ParseTreeNode = {
          children: [
            expr,
            { location: ctx.locationToRange(field.location), text: field.text, type: 'field' },
          ],
          ...(isSafe ? { isSafe: true } : {}),
          location: ctx.combineLocations(
            expr.location ?? ctx.locationToRange(token.location),
            ctx.locationToRange(field.location)
          ),
          type: 'field_access_expression',
        };
        expr = fieldAccessNode;
      } else if (ctx.match(TokenType.LEFT_BRACKET)) {
        // Array access
        const index = parseExpression(ctx);
        ctx.consume(TokenType.RIGHT_BRACKET, 'Expected ] after array index');
        if (index === null) {
          throw new Error('Array index expression is required');
        }
        expr = {
          children: [expr, index],
          location: ctx.combineLocations(
            expr.location ?? ctx.locationToRange(token.location),
            ((): SourceRange => {
              const previousTokenOffset = 1;
              return ctx.getLocation(ctx.getCurrent() - previousTokenOffset, ctx.getCurrent());
            })()
          ),
          type: 'array_access_expression',
        };
      } else {
        break;
      }
    }

    return expr;
  }

  if (ctx.match(TokenType.LEFT_PAREN)) {
    const expr = parseExpression(ctx);
    if (expr === null) {
      throw new Error('Expected expression in parentheses');
    }
    ctx.consume(TokenType.RIGHT_PAREN, 'Expected ) after expression');
    return {
      children: [expr],
      location: ((): SourceRange => {
        const parenthesizedExpressionOffset = 2;
        return ctx.getLocation(ctx.getCurrent() - parenthesizedExpressionOffset, ctx.getCurrent());
      })(),
      type: 'parenthesized_expression',
    };
  }

  return null;
};

/**
 * Parses a lambda parameter from lambda expressions. Can be either a simple identifier or a typed parameter (Type identifier).
 * @param ctx - The parser context.
 * @returns The parsed lambda parameter parse tree node, or null if parsing fails.
 */
parseLambdaParameter = function (ctx: Readonly<ParserContext>): ParseTreeNode | null {
  // Try to parse as typed parameter: Type name
  const savedPos = ctx.getCurrent();
  const type = ctx.parseType();
  if (type && ctx.check(TokenType.IDENTIFIER)) {
    const name = ctx.consume(TokenType.IDENTIFIER, 'Expected parameter name');
    return {
      children: [
        type,
        { location: ctx.locationToRange(name.location), text: name.text, type: 'name' },
      ],
      location: ctx.getLocation(savedPos, ctx.getCurrent()),
      type: 'lambda_parameter',
    };
  }

  // Reset and try as untyped parameter: just identifier
  ctx.setCurrent(savedPos);

  if (ctx.check(TokenType.IDENTIFIER)) {
    const name = ctx.consume(TokenType.IDENTIFIER, 'Expected parameter name');
    return {
      children: [{ location: ctx.locationToRange(name.location), text: name.text, type: 'name' }],
      location: ctx.locationToRange(name.location),
      type: 'lambda_parameter',
    };
  }

  return null;
};

/**
 * Parses a bracketed SOQL/SOSL query (e.g., `[SELECT ...]`) into a parse tree node.
 * @param ctx - The parser context.
 * @returns The parsed SOQL/SOSL query parse tree node.
 * @throws {Error} If the query is malformed or unexpected tokens are encountered.
 */
parseSoqlSoslQuery = function (ctx: Readonly<ParserContext>): ParseTreeNode {
  const singleIndexOffset = 1;
  const zeroIndex = 0;
  const start = ctx.getCurrent() - singleIndexOffset;

  /**
   * Start of actual query text (after [).
   */
  const queryStart = ctx.getCurrent();
  let queryText = '';

  // Read until matching ]
  let depth = 1;

  const zeroDepth = 0;
  while (depth > zeroDepth && !ctx.isAtEnd()) {
    const token = ctx.peek();
    if (token.type === TokenType.LEFT_BRACKET) {
      depth++;
    } else if (token.type === TokenType.RIGHT_BRACKET) {
      depth--;
    }

    const zeroDepthInner = 0;
    if (depth > zeroDepthInner) {
      queryText += token.text;
      ctx.advance();
    }
  }

  // Consume the closing ]
  if (ctx.match(TokenType.RIGHT_BRACKET)) {
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
      return i >= zeroIndex ? line.substring(zeroIndex, i) : line;
    })
    .join('\n');
  const bindingRegex = /:(\w+)/g;
  let match: RegExpExecArray | null = null;
  while ((match = bindingRegex.exec(queryTextWithoutLineComments)) !== null) {
    // For now, we'll extract the binding name
    // In a full implementation, we'd need to parse the actual expression
    boundExpressions.push({
      location: ctx.getLocation(
        queryStart + match.index + singleIndexOffset,
        queryStart + match.index + singleIndexOffset + match[singleIndexOffset].length
      ),
      text: match[CAPTURE_GROUP_FIRST],
      type: 'identifier',
    });
  }

  const children: ParseTreeNode[] = [];
  if (boundExpressions.length > zeroIndex) {
    children.push({ children: boundExpressions, type: 'bound_expressions' });
  }

  return {
    children,
    location: ctx.getLocation(start, ctx.getCurrent()),
    text: queryText, // Query text without brackets
    type: queryType,
  };
};

/**
 * Parses a new object instantiation expression from the source code.
 * @param ctx - The parser context.
 * @returns The parsed new expression parse tree node.
 * @throws {Error} If the new expression is malformed or unexpected tokens are encountered.
 */
parseNewExpression = function (ctx: Readonly<ParserContext>): ParseTreeNode {
  const singleIndexOffset = 1;
  const zeroIndex = 0;
  const start = ctx.getCurrent() - singleIndexOffset;
  // Don't skip whitespace here - parseType() will do it
  const type = ctx.parseType();
  if (!type) {
    throw new Error('Expected type after new');
  }

  // Check for array creation: new Type[size]
  // Skip whitespace before checking for [
  ctx.skipWhitespaceAndComments();
  if (ctx.match(TokenType.LEFT_BRACKET)) {
    ctx.skipWhitespaceAndComments();
    const size = parseExpression(ctx);
    if (!size) {
      throw new Error('Expected expression for array size');
    }
    ctx.skipWhitespaceAndComments();
    ctx.consume(TokenType.RIGHT_BRACKET, 'Expected ] after array size');
    return {
      children: [type, size],
      location: ctx.getLocation(start, ctx.getCurrent()),
      type: 'new_array_expression',
    };
  }

  // Check for collection initializer: new List<Type>{...} or new Set<Type>{...} or new Map<K,V>{...}
  if (ctx.match(TokenType.LEFT_BRACE)) {
    const initializers: ParseTreeNode[] = [];
    if (!ctx.check(TokenType.RIGHT_BRACE)) {
      do {
        // For Map, entries are key => value, for List/Set just values
        const savedPos = ctx.getCurrent();
        const firstExpr = parseExpression(ctx);
        if (firstExpr && ctx.match(TokenType.ARROW)) {
          // It's a Map entry: key => value
          const secondExpr = parseExpression(ctx);
          if (secondExpr) {
            initializers.push({
              children: [firstExpr, secondExpr],
              location: ctx.combineLocations(
                firstExpr.location ?? ctx.getLocation(savedPos, ctx.getCurrent()),
                secondExpr.location ??
                  ctx.getLocation(ctx.getCurrent() - PREVIOUS_POSITION_OFFSET, ctx.getCurrent())
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
          ctx.getCurrent() === savedPos &&
          !ctx.isAtEnd() &&
          !ctx.check(TokenType.COMMA) &&
          !ctx.check(TokenType.RIGHT_BRACE)
        ) {
          ctx.advance();
        }
      } while (ctx.match(TokenType.COMMA));
    }
    ctx.consume(TokenType.RIGHT_BRACE, 'Expected } after collection initializer');

    const children: ParseTreeNode[] = [type];
    // Always create arrayInitializer node, even if empty (for empty List/Set/Map initializers)
    children.push({ children: initializers, type: 'arrayInitializer' });

    const newNode = {
      children,
      location: ctx.getLocation(start, ctx.getCurrent()),
      type: 'new_expression',
    };
    return newNode;
  }

  // Regular constructor call
  ctx.consume(TokenType.LEFT_PAREN, 'Expected ( after new type');
  const args: ParseTreeNode[] = [];
  if (!ctx.check(TokenType.RIGHT_PAREN)) {
    do {
      const beforeArg = ctx.getCurrent();
      const arg = parseExpression(ctx);
      if (arg) {
        args.push(arg);
      }
      // Safety check: ensure we always advance
      if (ctx.getCurrent() === beforeArg && !ctx.isAtEnd()) {
        ctx.advance();
      }
    } while (ctx.match(TokenType.COMMA));
  }
  ctx.consume(TokenType.RIGHT_PAREN, 'Expected ) after constructor arguments');

  const children: ParseTreeNode[] = [type];
  if (args.length > zeroIndex) {
    children.push({ children: args, type: 'arguments' });
  }

  return {
    children,
    location: ctx.getLocation(start, ctx.getCurrent()),
    type: 'new_expression',
  };
};

export {
  parseExpression,
  parseAssignment,
  parseTernary,
  parseOr,
  parseAnd,
  parseEquality,
  parseComparison,
  parseAddition,
  parseMultiplication,
  parseUnary,
  parsePrimary,
  parseLambdaParameter,
  parseSoqlSoslQuery,
  parseNewExpression,
};
