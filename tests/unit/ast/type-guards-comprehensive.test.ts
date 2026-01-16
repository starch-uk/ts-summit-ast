/**
 * Comprehensive tests for all type guard functions
 */

import { describe, it, expect } from 'vitest';
import {
  isStatement,
  isExpression,
  isLiteral,
  isType,
  isDeclaration,
  isModifier,
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
  isClassType,
  isPrimitiveType,
  isClassDeclaration,
  isMethodDeclaration,
  isVariableDeclaration,
} from '../../../src/ast/type-guards.js';
import type { ASTNode } from '../../../src/ast/base.js';

describe('Comprehensive Type Guards', () => {
  describe('Statement Type Guards', () => {
    const statementKinds = [
      'IfStatement',
      'ForStatement',
      'ForEachStatement',
      'WhileStatement',
      'DoWhileStatement',
      'SwitchStatement',
      'TryStatement',
      'ReturnStatement',
      'BreakStatement',
      'ContinueStatement',
      'ThrowStatement',
      'Block',
      'ExpressionStatement',
      'VariableDeclarationStatement',
    ];

    it.each(statementKinds)('should identify %s as statement', (kind) => {
      const node: ASTNode = { kind };
      expect(isStatement(node)).toBe(true);
    });

    it('should reject non-statement nodes', () => {
      const nonStatements = ['Identifier', 'StringLiteral', 'ClassType', 'Modifier'];
      for (const kind of nonStatements) {
        const node: ASTNode = { kind };
        expect(isStatement(node)).toBe(false);
      }
    });
  });

  describe('Expression Type Guards', () => {
    const expressionKinds = [
      'BinaryExpression',
      'UnaryExpression',
      'AssignmentExpression',
      'MethodCallExpression',
      'FieldAccessExpression',
      'ArrayAccessExpression',
      'NewExpression',
      'CastExpression',
      'InstanceOfExpression',
      'TernaryExpression',
      'LambdaExpression',
      'Identifier',
      'ThisExpression',
      'SuperExpression',
      'ParenthesizedExpression',
      'StringLiteral',
      'NumberLiteral',
      'BooleanLiteral',
      'NullLiteral',
      'CharacterLiteral',
    ];

    it.each(expressionKinds)('should identify %s as expression', (kind) => {
      const node: ASTNode = { kind };
      expect(isExpression(node)).toBe(true);
    });
  });

  describe('Literal Type Guards', () => {
    const literalKinds = [
      'StringLiteral',
      'NumberLiteral',
      'BooleanLiteral',
      'NullLiteral',
      'CharacterLiteral',
    ];

    it.each(literalKinds)('should identify %s as literal', (kind) => {
      const node: ASTNode = { kind };
      expect(isLiteral(node)).toBe(true);
    });
  });

  describe('Type Type Guards', () => {
    const typeKinds = [
      'PrimitiveType',
      'ClassType',
      'InterfaceType',
      'ArrayType',
      'GenericType',
      'VoidType',
      'WildcardType',
    ];

    it.each(typeKinds)('should identify %s as type', (kind) => {
      const node: ASTNode = { kind };
      expect(isType(node)).toBe(true);
    });
  });

  describe('Declaration Type Guards', () => {
    const declarationKinds = [
      'ClassDeclaration',
      'InterfaceDeclaration',
      'MethodDeclaration',
      'ConstructorDeclaration',
      'VariableDeclaration',
      'PropertyDeclaration',
      'EnumDeclaration',
      'EnumConstantDeclaration',
      'AnnotationDeclaration',
    ];

    it.each(declarationKinds)('should identify %s as declaration', (kind) => {
      const node: ASTNode = { kind };
      expect(isDeclaration(node)).toBe(true);
    });
  });

  describe('Specific Statement Type Guards', () => {
    it('should identify IfStatement', () => {
      const node: ASTNode = { kind: 'IfStatement' };
      expect(isIfStatement(node)).toBe(true);
      expect(isIfStatement({ kind: 'ReturnStatement' })).toBe(false);
    });

    it('should identify ForStatement', () => {
      const node: ASTNode = { kind: 'ForStatement' };
      expect(isForStatement(node)).toBe(true);
    });

    it('should identify WhileStatement', () => {
      const node: ASTNode = { kind: 'WhileStatement' };
      expect(isWhileStatement(node)).toBe(true);
    });

    it('should identify ReturnStatement', () => {
      const node: ASTNode = { kind: 'ReturnStatement' };
      expect(isReturnStatement(node)).toBe(true);
    });

    it('should identify Block', () => {
      const node: ASTNode = { kind: 'Block' };
      expect(isBlock(node)).toBe(true);
    });
  });

  describe('Specific Expression Type Guards', () => {
    it('should identify BinaryExpression', () => {
      const node: ASTNode = { kind: 'BinaryExpression' };
      expect(isBinaryExpression(node)).toBe(true);
    });

    it('should identify MethodCallExpression', () => {
      const node: ASTNode = { kind: 'MethodCallExpression' };
      expect(isMethodCallExpression(node)).toBe(true);
    });

    it('should identify Identifier', () => {
      const node: ASTNode = { kind: 'Identifier' };
      expect(isIdentifier(node)).toBe(true);
    });
  });

  describe('Specific Literal Type Guards', () => {
    it('should identify StringLiteral', () => {
      const node: ASTNode = { kind: 'StringLiteral' };
      expect(isStringLiteral(node)).toBe(true);
    });

    it('should identify NumberLiteral', () => {
      const node: ASTNode = { kind: 'NumberLiteral' };
      expect(isNumberLiteral(node)).toBe(true);
    });

    it('should identify BooleanLiteral', () => {
      const node: ASTNode = { kind: 'BooleanLiteral' };
      expect(isBooleanLiteral(node)).toBe(true);
    });

    it('should identify NullLiteral', () => {
      const node: ASTNode = { kind: 'NullLiteral' };
      expect(isNullLiteral(node)).toBe(true);
    });
  });

  describe('Specific Type Type Guards', () => {
    it('should identify ClassType', () => {
      const node: ASTNode = { kind: 'ClassType' };
      expect(isClassType(node)).toBe(true);
    });

    it('should identify PrimitiveType', () => {
      const node: ASTNode = { kind: 'PrimitiveType' };
      expect(isPrimitiveType(node)).toBe(true);
    });
  });

  describe('Specific Declaration Type Guards', () => {
    it('should identify ClassDeclaration', () => {
      const node: ASTNode = { kind: 'ClassDeclaration' };
      expect(isClassDeclaration(node)).toBe(true);
    });

    it('should identify MethodDeclaration', () => {
      const node: ASTNode = { kind: 'MethodDeclaration' };
      expect(isMethodDeclaration(node)).toBe(true);
    });

    it('should identify VariableDeclaration', () => {
      const node: ASTNode = { kind: 'VariableDeclaration' };
      expect(isVariableDeclaration(node)).toBe(true);
    });
  });

  describe('Modifier Type Guard', () => {
    it('should identify Modifier', () => {
      const node: ASTNode = { kind: 'Modifier' };
      expect(isModifier(node)).toBe(true);
    });
  });
});
