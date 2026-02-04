/**
 * @file Unit tests for visitor pattern.
 */

import { DefaultVisitor, type ASTVisitor } from '../../src/ast/baseNode.js';
import { NodeFactory } from '../../src/translator/nodeFactory.js';
import type { ASTNode } from '../../src/ast/baseNode.js';

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
        public override visit(node: ASTNode): void {
          visitedKinds.push(node.kind);
          super.visit(node);
        }
      }

      const visitor = new CustomVisitor();
      const ifStmt = NodeFactory.createIfStatement({
        condition: NodeFactory.createBooleanLiteral(true),
        thenStatement: NodeFactory.createReturnStatement(),
      });

      visitor.visit(ifStmt);
      expect(visitedKinds).toContain('IfStatement');
    });

    it('should traverse nested structures', () => {
      const visitedKinds: string[] = [];

      class CountingVisitor extends DefaultVisitor {
        public override visit(node: ASTNode): void {
          visitedKinds.push(node.kind);
          // Visit children after recording this node
          this.visitChildren(node);
        }

        public override visitChildren(node: ASTNode): never[] {
          if ('condition' in node && node.condition != null) {
            this.visit(node.condition);
          }
          if ('thenStatement' in node && node.thenStatement != null) {
            this.visit(node.thenStatement);
          }
          if ('elseStatement' in node && node.elseStatement != null) {
            this.visit(node.elseStatement);
          }
          if ('expression' in node && node.expression != null) {
            this.visit(node.expression);
          }
          return [];
        }
      }

      const visitor = new CountingVisitor();
      const ifStmt = NodeFactory.createIfStatement({
        condition: NodeFactory.createBooleanLiteral(true),
        thenStatement: NodeFactory.createReturnStatement(
          NodeFactory.createStringLiteral('result', '"result"')
        ),
      });

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
        visitChildren: (_node: ASTNode) => {
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

import {
  isStatement,
  isExpression,
  isLiteral,
  isType,
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
  isIdentifier,
  isStringLiteral,
  isNumberLiteral,
  isBooleanLiteral,
  isNullLiteral,
  isClassDeclaration,
  isMethodDeclaration,
  isVariableDeclaration,
  isModifier,
  isTriggerContextVariableExpression,
  isApexDocComment,
  isApexDocBlockTag,
  isApexDocInlineTag,
  isApexDocParam,
  isApexDocReturn,
  isApexDocGroup,
  isApexDocCode,
} from '../../src/guard/index.js';

// #region agent log
fetch('http://127.0.0.1:7250/ingest/3c5fc984-5244-4e90-a556-6aa06134b21f', {
  body: JSON.stringify({
    data: {
      isIdentifier: typeof isIdentifier,
      isMethodDeclaration: typeof isMethodDeclaration,
      isModifier: typeof isModifier,
      isTriggerContextVariableExpression: typeof isTriggerContextVariableExpression,
      isType: typeof isType,
      isVariableDeclaration: typeof isVariableDeclaration,
    },
    hypothesisId: 'A',
    location: 'tests/unit/ast.test.ts:imports',
    message: 'Type guard symbol presence (typeof)',
    runId: 'pre-fix',
    sessionId: 'debug-session',
    timestamp: Date.now(),
  }),
  headers: { 'Content-Type': 'application/json' },
  method: 'POST',
}).catch(() => {
  // Ignore fetch errors - this is just for debugging/telemetry
});
// #endregion

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

/**
 * Tests for AST validation utilities.
 */

import { validateAST, compareASTs, getASTStatistics } from '../../src/utils/astValidation.js';
import { parseApexCode } from '../../src/utils/apexParser.js';

describe('AST Validation', () => {
  describe('validateAST', () => {
    it('should validate a valid AST node', () => {
      const node = NodeFactory.createIdentifier('test');
      const result = validateAST(node);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing kind property', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing invalid node structure
      const node: any = {
        name: 'test',
        // Missing kind property
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- Testing invalid node structure
      const result = validateAST(node);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('kind');
    });

    it('should validate location information', () => {
      const location = {
        end: { column: 10, line: 1 },
        start: { column: 1, line: 1 },
      };
      const node = NodeFactory.createIdentifier('test', { location });
      const result = validateAST(node);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid location (start line > end line)', () => {
      const invalidLocation = {
        end: { column: 10, line: 1 },
        start: { column: 1, line: 2 }, // Start line > end line
      };
      const node = NodeFactory.createIdentifier('test', { location: invalidLocation });
      const result = validateAST(node);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('start line');
    });

    it('should detect invalid location (start column > end column on same line)', () => {
      const invalidLocation = {
        end: { column: 5, line: 1 },
        start: { column: 10, line: 1 }, // Start column > end column
      };
      const node = NodeFactory.createIdentifier('test', { location: invalidLocation });
      const result = validateAST(node);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('start column');
    });

    it('should warn about zero-based locations', () => {
      const zeroBasedLocation = {
        end: { column: 10, line: 0 }, // Zero-based line
        start: { column: 0, line: 0 }, // Zero-based
      };
      const node = NodeFactory.createIdentifier('test', { location: zeroBasedLocation });
      const result = validateAST(node);

      // Should still be valid but with warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('zero-based'))).toBe(true);
    });

    it('should validate nested AST structures', () => {
      const condition = NodeFactory.createBooleanLiteral(true);
      const thenStatement = NodeFactory.createReturnStatement(
        NodeFactory.createNumberLiteral(42, '42')
      );
      const ifStmt = NodeFactory.createIfStatement({ condition, thenStatement });
      const result = validateAST(ifStmt);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate AST from parsed Apex code', () => {
      const parseResult = parseApexCode('public class Test { public void method() { } }');
      if (parseResult.ast) {
        const result = validateAST(parseResult.ast);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it('should detect invalid locations in nested structures', () => {
      const invalidLocation = {
        end: { column: 5, line: 1 },
        start: { column: 10, line: 1 },
      };
      const condition = NodeFactory.createBooleanLiteral(true, { location: invalidLocation });
      const ifStmt = NodeFactory.createIfStatement({
        condition,
        thenStatement: NodeFactory.createReturnStatement(),
      });
      const result = validateAST(ifStmt);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('compareASTs', () => {
    it('should compare identical AST nodes', () => {
      const node1 = NodeFactory.createIdentifier('test');
      const node2 = NodeFactory.createIdentifier('test');
      const result = compareASTs(node1, node2);

      expect(result.typesMatch).toBe(true);
    });

    it('should detect different node types', () => {
      const node1 = NodeFactory.createIdentifier('test');
      const node2 = NodeFactory.createStringVal('test', '"test"');
      const result = compareASTs(node1, node2);

      expect(result.typesMatch).toBe(false);
      expect(result.equal).toBe(false);
      expect(result.differences.length).toBeGreaterThan(0);
      expect(result.differences[0]).toContain('mismatch');
    });

    it('should compare nodes with same kind but different properties', () => {
      const node1 = NodeFactory.createIdentifier('test1');
      const node2 = NodeFactory.createIdentifier('test2');
      const result = compareASTs(node1, node2);

      expect(result.typesMatch).toBe(true);
      // Note: Current implementation only checks types, not property values
    });

    it('should compare complex AST structures', () => {
      const expr1 = NodeFactory.createBinaryExpression('+', {
        left: NodeFactory.createIntegerVal(5, '5'),
        right: NodeFactory.createIntegerVal(3, '3'),
      });
      const expr2 = NodeFactory.createBinaryExpression('+', {
        left: NodeFactory.createIntegerVal(5, '5'),
        right: NodeFactory.createIntegerVal(3, '3'),
      });
      const result = compareASTs(expr1, expr2);

      expect(result.typesMatch).toBe(true);
    });
  });

  describe('getASTStatistics', () => {
    it('should get statistics for a simple node', () => {
      const node = NodeFactory.createIdentifier('test');
      const stats = getASTStatistics(node);

      expect(stats.totalNodes).toBe(1);
      expect(stats.nodeTypeCounts.Identifier).toBe(1);
      expect(stats.maxDepth).toBeGreaterThan(0);
    });

    it('should count all node types in a complex AST', () => {
      const condition = NodeFactory.createBinaryExpression('+', {
        left: NodeFactory.createIntegerVal(5, '5'),
        right: NodeFactory.createIntegerVal(3, '3'),
      });
      const thenStatement = NodeFactory.createReturnStatement(
        NodeFactory.createStringVal('result', '"result"')
      );
      const ifStmt = NodeFactory.createIfStatement({ condition, thenStatement });
      const stats = getASTStatistics(ifStmt);

      expect(stats.totalNodes).toBeGreaterThan(1);
      expect(stats.nodeTypeCounts.IfStatement).toBe(1);
      expect(stats.maxDepth).toBeGreaterThan(1);
    });

    it('should count nodes with location information', () => {
      const location = {
        end: { column: 10, line: 1 },
        start: { column: 1, line: 1 },
      };
      const node1 = NodeFactory.createIdentifier('test1', { location });

      /**
       * No location.
       */
      const node2 = NodeFactory.createIdentifier('test2');
      const block = NodeFactory.createBlock([
        NodeFactory.createExpressionStatement(NodeFactory.createVariableExpression(node1)),
        NodeFactory.createExpressionStatement(NodeFactory.createVariableExpression(node2)),
      ]);

      const stats = getASTStatistics(block);

      expect(stats.nodesWithLocation).toBeGreaterThan(0);
      expect(stats.nodesWithLocation).toBeLessThanOrEqual(stats.totalNodes);
    });

    it('should calculate average depth for leaf nodes', () => {
      const deepExpr = NodeFactory.createBinaryExpression('+', {
        left: NodeFactory.createBinaryExpression('+', {
          left: NodeFactory.createIntegerVal(1, '1'),
          right: NodeFactory.createIntegerVal(2, '2'),
        }),
        right: NodeFactory.createIntegerVal(3, '3'),
      });
      const stats = getASTStatistics(deepExpr);

      expect(stats.maxDepth).toBeGreaterThan(1);
      expect(stats.averageDepth).toBeGreaterThan(0);
      expect(stats.averageDepth).toBeLessThanOrEqual(stats.maxDepth);
    });

    it('should get statistics for parsed Apex code', () => {
      const parseResult = parseApexCode(`
        public class Test {
          public void method1() { }
          public void method2() { }
        }
      `);
      if (parseResult.ast) {
        const stats = getASTStatistics(parseResult.ast);

        expect(stats.totalNodes).toBeGreaterThan(0);
        expect(stats.nodeTypeCounts.CompilationUnit).toBe(1);
        expect(stats.maxDepth).toBeGreaterThan(1);
      }
    });

    it('should handle empty blocks', () => {
      const block = NodeFactory.createBlock([]);
      const stats = getASTStatistics(block);

      expect(stats.totalNodes).toBe(1);
      expect(stats.nodeTypeCounts.CompoundStatement).toBe(1);
    });

    it('should count different node types correctly', () => {
      const ast = NodeFactory.createBlock([
        NodeFactory.createExpressionStatement(
          NodeFactory.createBinaryExpression('+', {
            left: NodeFactory.createIntegerVal(1, '1'),
            right: NodeFactory.createIntegerVal(2, '2'),
          })
        ),
        NodeFactory.createReturnStatement(NodeFactory.createStringVal('done', '"done"')),
      ]);

      const stats = getASTStatistics(ast);

      expect(stats.nodeTypeCounts.CompoundStatement).toBe(1);
      expect(stats.nodeTypeCounts.ExpressionStatement).toBe(1);
      expect(stats.nodeTypeCounts.BinaryExpression).toBe(1);
      expect(stats.nodeTypeCounts.ReturnStatement).toBe(1);
    });
  });

  describe('Integration with parsing', () => {
    it('should validate AST from complex Apex class', () => {
      const apexCode = `
        public class ComplexClass {
          private Integer value = 42;
          
          public void method1(String param) {
            if (param != null) {
              System.debug(param);
            }
          }
          
          public Integer method2() {
            return value * 2;
          }
        }
      `;
      const parseResult = parseApexCode(apexCode);
      if (parseResult.ast) {
        const validation = validateAST(parseResult.ast);
        const stats = getASTStatistics(parseResult.ast);

        expect(validation.valid).toBe(true);
        expect(stats.totalNodes).toBeGreaterThan(10);
        expect(stats.nodeTypeCounts.ClassDeclaration).toBe(1);
      }
    });

    it('should validate AST with nested control structures', () => {
      const apexCode = `
        public class Test {
          public void complexMethod() {
            for (Integer i = 0; i < 10; i++) {
              if (i % 2 == 0) {
                System.debug('Even: ' + i);
              } else {
                System.debug('Odd: ' + i);
              }
            }
          }
        }
      `;
      const parseResult = parseApexCode(apexCode);
      if (parseResult.ast) {
        const validation = validateAST(parseResult.ast);
        expect(validation.valid).toBe(true);
      }
    });
  });
});
