/**
 * Tests for type guard functions
 */

import { describe, it, expect } from 'vitest';
import {
  isStatement,
  isExpression,
  isLiteral,
  isType,
  isDeclaration,
  isIfStatement,
  isIdentifier,
  isStringLiteral,
  isClassDeclaration,
} from '../../../src/ast/type-guards.js';
import type { ASTNode } from '../../../src/ast/base.js';

describe('Type Guards', () => {
  describe('isStatement', () => {
    it('should identify statement nodes', () => {
      const node: ASTNode = {
        kind: 'IfStatement',
      };

      expect(isStatement(node)).toBe(true);
    });

    it('should reject non-statement nodes', () => {
      const node: ASTNode = {
        kind: 'Identifier',
      };

      expect(isStatement(node)).toBe(false);
    });
  });

  describe('isExpression', () => {
    it('should identify expression nodes', () => {
      const node: ASTNode = {
        kind: 'Identifier',
      };

      expect(isExpression(node)).toBe(true);
    });

    it('should identify literal nodes as expressions', () => {
      const node: ASTNode = {
        kind: 'StringLiteral',
      };

      expect(isExpression(node)).toBe(true);
    });
  });

  describe('isLiteral', () => {
    it('should identify literal nodes', () => {
      const node: ASTNode = {
        kind: 'StringLiteral',
      };

      expect(isLiteral(node)).toBe(true);
    });
  });

  describe('isType', () => {
    it('should identify type nodes', () => {
      const node: ASTNode = {
        kind: 'ClassType',
      };

      expect(isType(node)).toBe(true);
    });
  });

  describe('isDeclaration', () => {
    it('should identify declaration nodes', () => {
      const node: ASTNode = {
        kind: 'ClassDeclaration',
      };

      expect(isDeclaration(node)).toBe(true);
    });
  });

  describe('Specific type guards', () => {
    it('isIfStatement should identify if statements', () => {
      const node: ASTNode = {
        kind: 'IfStatement',
      };

      expect(isIfStatement(node)).toBe(true);
    });

    it('isIdentifier should identify identifiers', () => {
      const node: ASTNode = {
        kind: 'Identifier',
      };

      expect(isIdentifier(node)).toBe(true);
    });

    it('isStringLiteral should identify string literals', () => {
      const node: ASTNode = {
        kind: 'StringLiteral',
      };

      expect(isStringLiteral(node)).toBe(true);
    });

    it('isClassDeclaration should identify class declarations', () => {
      const node: ASTNode = {
        kind: 'ClassDeclaration',
      };

      expect(isClassDeclaration(node)).toBe(true);
    });
  });
});
