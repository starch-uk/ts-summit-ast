/**
 * @file Integration tests for AST translator.
 */

import { ASTTranslator } from '../../src/translator/astTranslator.js';
import type { ParseTreeNode } from '../../src/parser/parseTree.js';
import {
  isIfStatement,
  isReturnStatement,
  isBlock,
  isVariableExpression,
  isStringLiteral,
  isNumberLiteral,
  isBooleanLiteral,
  isNullLiteral,
  isBinaryExpression,
  isMethodCallExpression,
} from '../../src/guard/index.js';

describe('AST Translator', () => {
  const translator = new ASTTranslator();

  describe('Expression translation', () => {
    it('should translate identifier', () => {
      const parseTree: ParseTreeNode = {
        text: 'myVariable',
        type: 'identifier',
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      if (!result.ast) throw new Error('Expected ast to be defined');
      expect(isVariableExpression(result.ast)).toBe(true);
      if (isVariableExpression(result.ast)) {
        expect(result.ast.id.name).toBe('myVariable');
      }
    });

    it('should translate string literal', () => {
      const parseTree: ParseTreeNode = {
        text: '"hello world"',
        type: 'string_literal',
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      if (!result.ast) throw new Error('Expected ast to be defined');
      expect(isStringLiteral(result.ast)).toBe(true);
      if (isStringLiteral(result.ast)) {
        expect(result.ast.value).toBe('hello world');
      }
    });

    it('should translate number literal', () => {
      const parseTree: ParseTreeNode = {
        text: '42',
        type: 'number_literal',
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      if (!result.ast) throw new Error('Expected ast to be defined');
      expect(isNumberLiteral(result.ast)).toBe(true);
      if (isNumberLiteral(result.ast)) {
        expect(result.ast.value).toBe(42);
      }
    });

    it('should translate boolean literal', () => {
      const parseTree: ParseTreeNode = {
        text: 'true',
        type: 'boolean_literal',
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      if (!result.ast) throw new Error('Expected ast to be defined');
      expect(isBooleanLiteral(result.ast)).toBe(true);
      if (isBooleanLiteral(result.ast)) {
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
      if (!result.ast) throw new Error('Expected ast to be defined');
      expect(isNullLiteral(result.ast)).toBe(true);
    });

    it('should translate binary expression', () => {
      const parseTree: ParseTreeNode = {
        left: {
          text: '5',
          type: 'number_literal',
        },
        operator: '+',
        right: {
          text: '3',
          type: 'number_literal',
        },
        type: 'binary_expression',
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      if (!result.ast) throw new Error('Expected ast to be defined');
      expect(isBinaryExpression(result.ast)).toBe(true);
      if (isBinaryExpression(result.ast)) {
        expect(result.ast.operator).toBe('+');
      }
    });

    it('should translate method call', () => {
      const parseTree: ParseTreeNode = {
        arguments: [
          {
            text: '"arg1"',
            type: 'string_literal',
          },
          {
            text: '42',
            type: 'number_literal',
          },
        ],
        methodName: 'doSomething',
        type: 'method_call',
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      if (!result.ast) throw new Error('Expected ast to be defined');
      expect(isMethodCallExpression(result.ast)).toBe(true);
      if (isMethodCallExpression(result.ast)) {
        expect(result.ast.methodName).toBe('doSomething');
        expect(result.ast.arguments).toHaveLength(2);
      }
    });
  });

  describe('Statement translation', () => {
    it('should translate return statement', () => {
      const parseTree: ParseTreeNode = {
        expression: {
          text: '42',
          type: 'number_literal',
        },
        type: 'return_statement',
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      if (!result.ast) throw new Error('Expected ast to be defined');
      expect(isReturnStatement(result.ast)).toBe(true);
    });

    it('should translate return statement without expression', () => {
      const parseTree: ParseTreeNode = {
        type: 'return',
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      if (!result.ast) throw new Error('Expected ast to be defined');
      expect(isReturnStatement(result.ast)).toBe(true);
    });

    it('should translate if statement', () => {
      const parseTree: ParseTreeNode = {
        condition: {
          text: 'true',
          type: 'boolean_literal',
        },
        elseBody: {
          expression: {
            text: '0',
            type: 'number_literal',
          },
          type: 'return_statement',
        },
        thenBody: {
          expression: {
            text: '1',
            type: 'number_literal',
          },
          type: 'return_statement',
        },
        type: 'if_statement',
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      if (!result.ast) throw new Error('Expected ast to be defined');
      expect(isIfStatement(result.ast)).toBe(true);
    });

    it('should translate block statement', () => {
      const parseTree: ParseTreeNode = {
        children: [
          {
            expression: {
              text: '1',
              type: 'number_literal',
            },
            type: 'return_statement',
          },
          {
            expression: {
              text: '2',
              type: 'number_literal',
            },
            type: 'return_statement',
          },
        ],
        type: 'block',
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      if (!result.ast) throw new Error('Expected ast to be defined');
      expect(isBlock(result.ast)).toBe(true);
      if (isBlock(result.ast)) {
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
        location: {
          end: { column: 9, line: 10 },
          start: { column: 5, line: 10 },
        },
        text: 'test',
        type: 'identifier',
      };

      const result = translator.translate(parseTree);
      expect(result.errors).toHaveLength(0);
      expect(result.ast?.location).toBeDefined();
      expect(result.ast?.location?.start.line).toBe(10);
    });
  });
});
