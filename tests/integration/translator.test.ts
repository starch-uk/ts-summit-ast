/**
 * Integration tests for AST translator
 */

import { describe, it, expect } from 'vitest';
import { ASTTranslator } from '../../src/translator/ASTTranslator.js';
import type { ParseTreeNode } from '../../src/parser/ParseTreeTypes.js';
import {
  isIfStatement,
  isReturnStatement,
  isBlock,
  isIdentifier,
  isStringLiteral,
  isNumberLiteral,
  isBooleanLiteral,
  isNullLiteral,
  isBinaryExpression,
  isMethodCallExpression,
} from '../../src/ast/type-guards.js';

describe('AST Translator', () => {
  const translator = new ASTTranslator();

  describe('Expression translation', () => {
    it('should translate identifier', () => {
      const parseTree: ParseTreeNode = {
        type: 'identifier',
        text: 'myVariable',
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      expect(isIdentifier(result.ast!)).toBe(true);
      if (isIdentifier(result.ast!)) {
        expect(result.ast.name).toBe('myVariable');
      }
    });

    it('should translate string literal', () => {
      const parseTree: ParseTreeNode = {
        type: 'string_literal',
        text: '"hello world"',
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      expect(isStringLiteral(result.ast!)).toBe(true);
      if (isStringLiteral(result.ast!)) {
        expect(result.ast.value).toBe('hello world');
      }
    });

    it('should translate number literal', () => {
      const parseTree: ParseTreeNode = {
        type: 'number_literal',
        text: '42',
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      expect(isNumberLiteral(result.ast!)).toBe(true);
      if (isNumberLiteral(result.ast!)) {
        expect(result.ast.value).toBe(42);
      }
    });

    it('should translate boolean literal', () => {
      const parseTree: ParseTreeNode = {
        type: 'boolean_literal',
        text: 'true',
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      expect(isBooleanLiteral(result.ast!)).toBe(true);
      if (isBooleanLiteral(result.ast!)) {
        expect(result.ast.value).toBe(true);
      }
    });

    it('should translate null literal', () => {
      const parseTree: ParseTreeNode = {
        type: 'null_literal',
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      expect(isNullLiteral(result.ast!)).toBe(true);
    });

    it('should translate binary expression', () => {
      const parseTree: ParseTreeNode = {
        type: 'binary_expression',
        operator: '+',
        left: {
          type: 'number_literal',
          text: '5',
        },
        right: {
          type: 'number_literal',
          text: '3',
        },
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      expect(isBinaryExpression(result.ast!)).toBe(true);
      if (isBinaryExpression(result.ast!)) {
        expect(result.ast.operator).toBe('+');
      }
    });

    it('should translate method call', () => {
      const parseTree: ParseTreeNode = {
        type: 'method_call',
        methodName: 'doSomething',
        arguments: [
          {
            type: 'string_literal',
            text: '"arg1"',
          },
          {
            type: 'number_literal',
            text: '42',
          },
        ],
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      expect(isMethodCallExpression(result.ast!)).toBe(true);
      if (isMethodCallExpression(result.ast!)) {
        expect(result.ast.methodName).toBe('doSomething');
        expect(result.ast.arguments).toHaveLength(2);
      }
    });
  });

  describe('Statement translation', () => {
    it('should translate return statement', () => {
      const parseTree: ParseTreeNode = {
        type: 'return_statement',
        expression: {
          type: 'number_literal',
          text: '42',
        },
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      expect(isReturnStatement(result.ast!)).toBe(true);
    });

    it('should translate return statement without expression', () => {
      const parseTree: ParseTreeNode = {
        type: 'return',
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      expect(isReturnStatement(result.ast!)).toBe(true);
    });

    it('should translate if statement', () => {
      const parseTree: ParseTreeNode = {
        type: 'if_statement',
        condition: {
          type: 'boolean_literal',
          text: 'true',
        },
        thenBody: {
          type: 'return_statement',
          expression: {
            type: 'number_literal',
            text: '1',
          },
        },
        elseBody: {
          type: 'return_statement',
          expression: {
            type: 'number_literal',
            text: '0',
          },
        },
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      expect(isIfStatement(result.ast!)).toBe(true);
    });

    it('should translate block statement', () => {
      const parseTree: ParseTreeNode = {
        type: 'block',
        children: [
          {
            type: 'return_statement',
            expression: {
              type: 'number_literal',
              text: '1',
            },
          },
          {
            type: 'return_statement',
            expression: {
              type: 'number_literal',
              text: '2',
            },
          },
        ],
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      expect(isBlock(result.ast!)).toBe(true);
      if (isBlock(result.ast!)) {
        expect(result.ast.statements).toHaveLength(2);
      }
    });
  });

  describe('Error handling', () => {
    it('should handle unknown node types', () => {
      const parseTree: ParseTreeNode = {
        type: 'unknown_node_type',
      };

      const result = translator.translate(parseTree);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Unknown node type');
    });

    it('should handle missing required children', () => {
      const parseTree: ParseTreeNode = {
        type: 'if_statement',
        // Missing condition and thenBody
      };

      const result = translator.translate(parseTree);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Source location preservation', () => {
    it('should preserve location information when provided', () => {
      const parseTree: ParseTreeNode = {
        type: 'identifier',
        text: 'test',
        location: {
          start: { line: 10, column: 5 },
          end: { line: 10, column: 9 },
        },
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast?.location).toBeDefined();
      expect(result.ast?.location?.start.line).toBe(10);
    });
  });
});
