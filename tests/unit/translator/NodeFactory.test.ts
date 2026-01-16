/**
 * Comprehensive tests for NodeFactory
 */

import { describe, it, expect } from 'vitest';
import { NodeFactory } from '../../../src/translator/NodeFactory.js';
import {
  isIfStatement,
  isForStatement,
  isWhileStatement,
  isReturnStatement,
  isBlock,
  isBinaryExpression,
  isMethodCallExpression,
  isIdentifier,
  isStringLiteral,
  isNumberLiteral,
  isBooleanLiteral,
  isNullLiteral,
  isPrimitiveType,
  isClassType,
  isVariableDeclaration,
} from '../../../src/ast/type-guards.js';

describe('NodeFactory', () => {
  describe('Statement Creation', () => {
    it('should create all statement types correctly', () => {
      // IfStatement
      const ifStmt = NodeFactory.createIfStatement(
        NodeFactory.createBooleanLiteral(true),
        NodeFactory.createReturnStatement()
      );
      expect(isIfStatement(ifStmt)).toBe(true);

      // ForStatement
      const forStmt = NodeFactory.createForStatement(
        NodeFactory.createBlock([])
      );
      expect(isForStatement(forStmt)).toBe(true);

      // WhileStatement
      const whileStmt = NodeFactory.createWhileStatement(
        NodeFactory.createBooleanLiteral(true),
        NodeFactory.createBlock([])
      );
      expect(isWhileStatement(whileStmt)).toBe(true);

      // ReturnStatement
      const returnStmt = NodeFactory.createReturnStatement();
      expect(isReturnStatement(returnStmt)).toBe(true);

      // Block
      const block = NodeFactory.createBlock([]);
      expect(isBlock(block)).toBe(true);

      // ExpressionStatement
      const exprStmt = NodeFactory.createExpressionStatement(
        NodeFactory.createIdentifier('x')
      );
      expect(exprStmt.kind).toBe('ExpressionStatement');
    });
  });

  describe('Expression Creation', () => {
    it('should create all expression types correctly', () => {
      // BinaryExpression
      const binary = NodeFactory.createBinaryExpression(
        '+',
        NodeFactory.createNumberLiteral(1, '1'),
        NodeFactory.createNumberLiteral(2, '2')
      );
      expect(isBinaryExpression(binary)).toBe(true);

      // MethodCallExpression
      const methodCall = NodeFactory.createMethodCallExpression('test', []);
      expect(isMethodCallExpression(methodCall)).toBe(true);

      // Identifier
      const identifier = NodeFactory.createIdentifier('x');
      expect(isIdentifier(identifier)).toBe(true);
    });
  });

  describe('Literal Creation', () => {
    it('should create all literal types correctly', () => {
      // StringLiteral
      const str = NodeFactory.createStringLiteral('test');
      expect(isStringLiteral(str)).toBe(true);

      // NumberLiteral
      const num = NodeFactory.createNumberLiteral(42);
      expect(isNumberLiteral(num)).toBe(true);

      // BooleanLiteral
      const bool = NodeFactory.createBooleanLiteral(true);
      expect(isBooleanLiteral(bool)).toBe(true);

      // NullLiteral
      const nullLit = NodeFactory.createNullLiteral();
      expect(isNullLiteral(nullLit)).toBe(true);
    });
  });

  describe('Type Creation', () => {
    it('should create all type types correctly', () => {
      // PrimitiveType
      const primitive = NodeFactory.createPrimitiveType('String');
      expect(isPrimitiveType(primitive)).toBe(true);

      // ClassType
      const classType = NodeFactory.createClassType('MyClass');
      expect(isClassType(classType)).toBe(true);
    });
  });

  describe('Declaration Creation', () => {
    it('should create variable declarations correctly', () => {
      const varDecl = NodeFactory.createVariableDeclaration(
        'x',
        NodeFactory.createPrimitiveType('Integer')
      );
      expect(isVariableDeclaration(varDecl)).toBe(true);
    });
  });

  describe('Options Handling', () => {
    it('should handle location options', () => {
      const location = {
        start: { line: 1, column: 1 },
        end: { line: 1, column: 10 },
      };

      const node = NodeFactory.createIdentifier('test', { location });
      expect(node.location).toEqual(location);
    });

    it('should work without location options', () => {
      const node = NodeFactory.createIdentifier('test');
      expect(node.location).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      const node = NodeFactory.createStringLiteral('');
      expect(node.value).toBe('');
    });

    it('should handle zero', () => {
      const node = NodeFactory.createNumberLiteral(0);
      expect(node.value).toBe(0);
    });

    it('should handle negative numbers', () => {
      const node = NodeFactory.createNumberLiteral(-42);
      expect(node.value).toBe(-42);
    });

    it('should handle decimal numbers', () => {
      const node = NodeFactory.createNumberLiteral(3.14);
      expect(node.value).toBe(3.14);
    });

    it('should handle long method names', () => {
      const longName = 'a'.repeat(100);
      const node = NodeFactory.createMethodCallExpression(longName, []);
      expect(node.methodName).toBe(longName);
    });

    it('should handle unicode identifiers', () => {
      const node = NodeFactory.createIdentifier('变量名');
      expect(node.name).toBe('变量名');
    });
  });
});
