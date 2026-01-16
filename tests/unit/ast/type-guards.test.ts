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
  isApexDocComment,
  isApexDocBlockTag,
  isApexDocInlineTag,
  isApexDocParamTag,
  isApexDocReturnTag,
  isApexDocGroupTag,
  isApexDocCodeTag,
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

  describe('ApexDoc Type Guards', () => {
    it('isApexDocComment should identify ApexDoc comments', () => {
      const node: ASTNode = {
        kind: 'ApexDocComment',
        mainDescription: 'Test',
        blockTags: [],
      };

      expect(isApexDocComment(node)).toBe(true);
    });

    it('isApexDocBlockTag should identify block tags', () => {
      const paramTag: ASTNode = {
        kind: 'ApexDocParamTag',
        paramName: 'x',
        description: [],
      };

      expect(isApexDocBlockTag(paramTag)).toBe(true);

      const returnTag: ASTNode = {
        kind: 'ApexDocReturnTag',
        description: [],
      };

      expect(isApexDocBlockTag(returnTag)).toBe(true);
    });

    it('isApexDocInlineTag should identify inline tags', () => {
      const codeTag: ASTNode = {
        kind: 'ApexDocCodeTag',
        text: 'Integer x',
      };

      expect(isApexDocInlineTag(codeTag)).toBe(true);
    });

    it('isApexDocParamTag should identify param tags', () => {
      const node: ASTNode = {
        kind: 'ApexDocParamTag',
        paramName: 'x',
        description: [],
      };

      expect(isApexDocParamTag(node)).toBe(true);
    });

    it('isApexDocReturnTag should identify return tags', () => {
      const node: ASTNode = {
        kind: 'ApexDocReturnTag',
        description: [],
      };

      expect(isApexDocReturnTag(node)).toBe(true);
    });

    it('isApexDocGroupTag should identify group tags', () => {
      const node: ASTNode = {
        kind: 'ApexDocGroupTag',
        groupName: 'Utilities',
        description: [],
      };

      expect(isApexDocGroupTag(node)).toBe(true);
    });

    it('isApexDocCodeTag should identify code tags', () => {
      const node: ASTNode = {
        kind: 'ApexDocCodeTag',
        text: 'Integer x = 42;',
      };

      expect(isApexDocCodeTag(node)).toBe(true);
    });

    it('should reject non-ApexDoc nodes', () => {
      const node: ASTNode = {
        kind: 'Identifier',
      };

      expect(isApexDocComment(node)).toBe(false);
      expect(isApexDocBlockTag(node)).toBe(false);
      expect(isApexDocInlineTag(node)).toBe(false);
    });
  });
});
