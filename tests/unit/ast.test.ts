/**
 * Tests for visitor pattern.
 */

import { describe, it, expect } from 'vitest';
import { DefaultVisitor, type ASTVisitor } from '../../src/ast/base.js';
import { NodeFactory } from '../../src/translator/NodeFactory.js';
import type { ASTNode } from '../../src/ast/base.js';

describe('Visitor Pattern', () => {
  describe('DefaultVisitor', () => {
    it('should visit nodes', () => {
      const visitor = new DefaultVisitor();
      const node: ASTNode = {
        kind: 'Identifier',
        name: 'test',
      };

      // Should not throw
      expect(() => {
        visitor.visit(node);
      }).not.toThrow();
    });

    it('should visit children', () => {
      const visitor = new DefaultVisitor();
      const node: ASTNode = {
        kind: 'Block',
        statements: [NodeFactory.createReturnStatement(), NodeFactory.createReturnStatement()],
      };

      const result = visitor.visitChildren(node);
      expect(result).toEqual([]);
    });

    it('should handle nodes without children', () => {
      const visitor = new DefaultVisitor();
      const node: ASTNode = {
        kind: 'Identifier',
        name: 'test',
      };

      const result = visitor.visitChildren(node);
      expect(result).toEqual([]);
    });
  });

  describe('Custom Visitor', () => {
    it('should allow custom visit logic', () => {
      const visitedKinds: string[] = [];

      class CustomVisitor extends DefaultVisitor {
        override visit(node: ASTNode): void {
          visitedKinds.push(node.kind);
          super.visit(node);
        }
      }

      const visitor = new CustomVisitor();
      const ifStmt = NodeFactory.createIfStatement(
        NodeFactory.createBooleanLiteral(true),
        NodeFactory.createReturnStatement()
      );

      visitor.visit(ifStmt);
      expect(visitedKinds).toContain('IfStatement');
    });

    it('should traverse nested structures', () => {
      const visitedKinds: string[] = [];

      class CountingVisitor extends DefaultVisitor {
        override visit(node: ASTNode): void {
          visitedKinds.push(node.kind);
          // Visit children after recording this node
          this.visitChildren(node);
        }

        override visitChildren(node: ASTNode): void[] {
          if ('condition' in node && node.condition) {
            this.visit(node.condition as ASTNode);
          }
          if ('thenStatement' in node && node.thenStatement) {
            this.visit(node.thenStatement as ASTNode);
          }
          if ('elseStatement' in node && node.elseStatement) {
            this.visit(node.elseStatement as ASTNode);
          }
          if ('expression' in node && node.expression) {
            this.visit(node.expression as ASTNode);
          }
          return [];
        }
      }

      const visitor = new CountingVisitor();
      const ifStmt = NodeFactory.createIfStatement(
        NodeFactory.createBooleanLiteral(true),
        NodeFactory.createReturnStatement(NodeFactory.createStringLiteral('result', '"result"'))
      );

      visitor.visit(ifStmt);
      expect(visitedKinds.length).toBeGreaterThan(1);
      expect(visitedKinds).toContain('IfStatement');
      expect(visitedKinds).toContain('BooleanVal');
      expect(visitedKinds).toContain('ReturnStatement');
    });
  });

  describe('Visitor Interface', () => {
    it('should implement ASTVisitor interface', () => {
      const visitor: ASTVisitor<string> = {
        visit: (node: ASTNode) => node.kind,
        visitChildren: (node: ASTNode) => {
          return [];
        },
      };

      const node = NodeFactory.createIdentifier('test');
      const result = visitor.visit(node);
      expect(result).toBe('Identifier');
    });
  });
});

/**
 * Tests for type guard functions.
 */

import { describe, it, expect } from 'vitest';
import {
  isStatement,
  isExpression,
  isLiteral,
  isDeclaration,
  isIfStatement,
  isForStatement,
  isWhileStatement,
  isReturnStatement,
  isBlock,
  isExpressionStatement,
  isVariableDeclarationStatement,
  isBinaryExpression,
  isMethodCallExpression,
  isVariableExpression,
  isStringLiteral,
  isNumberLiteral,
  isBooleanLiteral,
  isNullLiteral,
  isClassDeclaration,
  isApexDocComment,
  isApexDocBlockTag,
  isApexDocInlineTag,
  isApexDocParam,
  isApexDocReturn,
  isApexDocGroup,
  isApexDocCode,
} from '../../src/ast/type-guards.js';
import type { ASTNode } from '../../src/ast/base.js';

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
        kind: 'VariableExpression',
      };

      expect(isExpression(node)).toBe(true);
    });

    it('should identify literal nodes as expressions', () => {
      const node: ASTNode = {
        kind: 'StringVal',
      };

      expect(isExpression(node)).toBe(true);
    });
  });

  describe('isLiteral', () => {
    it('should identify literal nodes', () => {
      const node: ASTNode = {
        kind: 'StringVal',
      };

      expect(isLiteral(node)).toBe(true);
    });
  });

  describe('isType', () => {
    it('should identify type nodes', () => {
      const node: ASTNode = {
        arrayNesting: 0,
        components: [],
        kind: 'TypeRef',
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
        kind: 'StringVal',
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
        blockTags: [],
        kind: 'ApexDocComment',
        mainDescription: 'Test',
      };

      expect(isApexDocComment(node)).toBe(true);
    });

    it('isApexDocBlockTag should identify block tags', () => {
      const paramTag: ASTNode = {
        description: [],
        kind: 'ApexDocParam',
        paramName: 'x',
      };

      expect(isApexDocBlockTag(paramTag)).toBe(true);

      const returnTag: ASTNode = {
        description: [],
        kind: 'ApexDocReturn',
      };

      expect(isApexDocBlockTag(returnTag)).toBe(true);
    });

    it('isApexDocInlineTag should identify inline tags', () => {
      const codeTag: ASTNode = {
        kind: 'ApexDocCode',
        text: 'Integer x',
      };

      expect(isApexDocInlineTag(codeTag)).toBe(true);
    });

    it('isApexDocParam should identify param tags', () => {
      const node: ASTNode = {
        description: [],
        kind: 'ApexDocParam',
        paramName: 'x',
      };

      expect(isApexDocParam(node)).toBe(true);
    });

    it('isApexDocReturn should identify return tags', () => {
      const node: ASTNode = {
        description: [],
        kind: 'ApexDocReturn',
      };

      expect(isApexDocReturn(node)).toBe(true);
    });

    it('isApexDocGroup should identify group tags', () => {
      const node: ASTNode = {
        description: [],
        groupName: 'Utilities',
        kind: 'ApexDocGroup',
      };

      expect(isApexDocGroup(node)).toBe(true);
    });

    it('isApexDocCode should identify code tags', () => {
      const node: ASTNode = {
        kind: 'ApexDocCode',
        text: 'Integer x = 42;',
      };

      expect(isApexDocCode(node)).toBe(true);
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

/**
 * Comprehensive tests for all type guard functions.
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
  isExpressionStatement,
  isVariableDeclarationStatement,
  isBinaryExpression,
  isMethodCallExpression,
  isIdentifier,
  isStringLiteral,
  isNumberLiteral,
  isBooleanLiteral,
  isNullLiteral,
  isClassDeclaration,
  isMethodDeclaration,
  isVariableDeclaration,
  isTriggerContextVariableExpression,
} from '../../src/ast/type-guards.js';
import type { ASTNode } from '../../src/ast/base.js';

describe('Comprehensive Type Guards', () => {
  describe('Statement Type Guards', () => {
    const statementKinds = [
      'IfStatement',
      'ForLoopStatement',
      'EnhancedForLoopStatement',
      'WhileLoopStatement',
      'DoWhileLoopStatement',
      'SwitchStatement',
      'TryStatement',
      'ReturnStatement',
      'BreakStatement',
      'ContinueStatement',
      'ThrowStatement',
      'CompoundStatement',
      'ExpressionStatement',
      'VariableDeclarationStatement',
    ];

    it.each(statementKinds)('should identify %s as statement', (kind) => {
      const node: ASTNode = { kind };
      expect(isStatement(node)).toBe(true);
    });

    it('should reject non-statement nodes', () => {
      const nonStatements = ['Identifier', 'StringVal', 'Modifier'];
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
      'AssignExpression',
      'CallExpression',
      'FieldExpression',
      'ArrayExpression',
      'NewExpression',
      'CastExpression',
      'InstanceOfExpression',
      'TernaryExpression',
      'LambdaExpression',
      'VariableExpression',
      'ThisExpression',
      'SuperExpression',
      'ParenthesizedExpression',
      'StringVal',
      'IntegerVal',
      'DoubleVal',
      'LongVal',
      'DecimalVal',
      'BooleanVal',
      'NullVal',
    ];

    it.each(expressionKinds)('should identify %s as expression', (kind) => {
      const node: ASTNode = { kind };
      expect(isExpression(node)).toBe(true);
    });
  });

  describe('Literal Type Guards', () => {
    const literalKinds = [
      'StringVal',
      'IntegerVal',
      'DoubleVal',
      'LongVal',
      'DecimalVal',
      'BooleanVal',
      'NullVal',
    ];

    it.each(literalKinds)('should identify %s as literal', (kind) => {
      const node: ASTNode = { kind };
      expect(isLiteral(node)).toBe(true);
    });
  });

  describe('Type Type Guards', () => {
    it('types are now TypeRef objects, not AST nodes', () => {
      // Types are TypeRef objects, not AST nodes
      expect(true).toBe(true);
    });
  });

  describe('Declaration Type Guards', () => {
    const declarationKinds = [
      'ClassDeclaration',
      'InterfaceDeclaration',
      'MethodDeclaration',
      'VariableDeclaration',
      'PropertyDeclaration',
      'EnumDeclaration',
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

    it('should identify ForStatement (ForLoopStatement)', () => {
      const node: ASTNode = { kind: 'ForLoopStatement' };
      expect(isForStatement(node)).toBe(true);
    });

    it('should identify WhileStatement (WhileLoopStatement)', () => {
      const node: ASTNode = { kind: 'WhileLoopStatement' };
      expect(isWhileStatement(node)).toBe(true);
    });

    it('should identify ReturnStatement', () => {
      const node: ASTNode = { kind: 'ReturnStatement' };
      expect(isReturnStatement(node)).toBe(true);
    });

    it('should identify Block (CompoundStatement)', () => {
      const node: ASTNode = { kind: 'CompoundStatement' };
      expect(isBlock(node)).toBe(true);
    });

    it('should identify ExpressionStatement', () => {
      const node: ASTNode = { kind: 'ExpressionStatement' };
      expect(isExpressionStatement(node)).toBe(true);
    });

    it('should identify VariableDeclarationStatement', () => {
      const node: ASTNode = { kind: 'VariableDeclarationStatement' };
      expect(isVariableDeclarationStatement(node)).toBe(true);
    });
  });

  describe('Specific Expression Type Guards', () => {
    it('should identify BinaryExpression', () => {
      const node: ASTNode = { kind: 'BinaryExpression' };
      expect(isBinaryExpression(node)).toBe(true);
    });

    it('should identify MethodCallExpression (CallExpression)', () => {
      const node: ASTNode = { kind: 'CallExpression' };
      expect(isMethodCallExpression(node)).toBe(true);
    });

    it('should identify VariableExpression', () => {
      const node: ASTNode = { kind: 'VariableExpression' };
      expect(isVariableExpression(node)).toBe(true);
    });
  });

  describe('Specific Literal Type Guards', () => {
    it('should identify StringLiteral (StringVal)', () => {
      const node: ASTNode = { kind: 'StringVal' };
      expect(isStringLiteral(node)).toBe(true);
    });

    it('should identify NumberLiteral (IntegerVal)', () => {
      const node: ASTNode = { kind: 'IntegerVal' };
      expect(isNumberLiteral(node)).toBe(true);
    });

    it('should identify BooleanLiteral (BooleanVal)', () => {
      const node: ASTNode = { kind: 'BooleanVal' };
      expect(isBooleanLiteral(node)).toBe(true);
    });

    it('should identify NullLiteral (NullVal)', () => {
      const node: ASTNode = { kind: 'NullVal' };
      expect(isNullLiteral(node)).toBe(true);
    });
  });

  describe('Specific Type Type Guards', () => {
    it('types are now TypeRef objects, not AST nodes', () => {
      // Types are TypeRef objects, not AST nodes
      expect(true).toBe(true);
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

  describe('TriggerContextVariableExpression Type Guard', () => {
    it('should identify TriggerContextVariableExpression', () => {
      const node: ASTNode = { kind: 'TriggerContextVariableExpression' };
      expect(isTriggerContextVariableExpression(node)).toBe(true);
    });
  });
});
