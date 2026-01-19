/**
 * @file Unit tests for AST validation utilities.
 */

import { validateAST, compareASTs, getASTStatistics } from '../../src/utils/ast-validation.js';
import { NodeFactory } from '../../src/translator/NodeFactory.js';
import { parseApexCode } from '../../src/utils/apex-parser.js';

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
      const ifStmt = NodeFactory.createIfStatement(condition, thenStatement);
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
      const ifStmt = NodeFactory.createIfStatement(condition, NodeFactory.createReturnStatement());
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
      const expr1 = NodeFactory.createBinaryExpression(
        '+',
        NodeFactory.createIntegerVal(5, '5'),
        NodeFactory.createIntegerVal(3, '3')
      );
      const expr2 = NodeFactory.createBinaryExpression(
        '+',
        NodeFactory.createIntegerVal(5, '5'),
        NodeFactory.createIntegerVal(3, '3')
      );
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
      const condition = NodeFactory.createBinaryExpression(
        '+',
        NodeFactory.createIntegerVal(5, '5'),
        NodeFactory.createIntegerVal(3, '3')
      );
      const thenStatement = NodeFactory.createReturnStatement(
        NodeFactory.createStringVal('result', '"result"')
      );
      const ifStmt = NodeFactory.createIfStatement(condition, thenStatement);
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
      const deepExpr = NodeFactory.createBinaryExpression(
        '+',
        NodeFactory.createBinaryExpression(
          '+',
          NodeFactory.createIntegerVal(1, '1'),
          NodeFactory.createIntegerVal(2, '2')
        ),
        NodeFactory.createIntegerVal(3, '3')
      );
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
          NodeFactory.createBinaryExpression(
            '+',
            NodeFactory.createIntegerVal(1, '1'),
            NodeFactory.createIntegerVal(2, '2')
          )
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
