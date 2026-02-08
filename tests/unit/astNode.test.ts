/**
 * @file Unit tests for base AST types and node creation.
 */

import type { ASTNode, SourceLocation, SourceRange } from '../../src/ast/baseNode.js';
import { NodeFactory } from '../../src/translator/nodeFactory.js';
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
  isVariableDeclaration,
} from '../../src/guard/index.js';
import {
  spanOf,
  UNKNOWN_SOURCE_LOCATION,
  isUnknownLocation,
} from '../../src/utils/sourceExtraction.js';

describe('AST Base Types', () => {
  describe('SourceLocation', () => {
    it('should have line and column properties', () => {
      const location: SourceLocation = {
        column: 5,
        line: 10,
      };

      expect(location.line).toBe(10);
      expect(location.column).toBe(5);
    });

    it('should optionally have offset', () => {
      const location: SourceLocation = {
        column: 5,
        line: 10,
        offset: 150,
      };

      expect(location.offset).toBe(150);
    });
  });

  describe('SourceRange', () => {
    it('should have start and end locations', () => {
      const range: SourceRange = {
        end: { column: 10, line: 1 },
        start: { column: 1, line: 1 },
      };

      expect(range.start.line).toBe(1);
      expect(range.end.line).toBe(1);
    });
  });

  describe('ASTNode', () => {
    it('should have @type property', () => {
      const node: ASTNode = {
        '@type': 'TestNode',
      };

      expect(node['@type']).toBe('TestNode');
    });

    it('should optionally have sourceLocation', () => {
      const node: ASTNode = {
        '@type': 'TestNode',
        sourceLocation: {
          endColumn: 10,
          endLine: 1,
          startColumn: 1,
          startLine: 1,
        },
      };

      expect(node.sourceLocation).toBeDefined();
      expect(node.sourceLocation?.startLine).toBe(1);
    });
  });
});

describe('AST Node Creation', () => {
  describe('Statement Nodes', () => {
    it('should create IfStatement with all properties', () => {
      const condition = NodeFactory.createBooleanLiteral(true);
      const thenStatement = NodeFactory.createReturnStatement();
      const elseStatement = NodeFactory.createReturnStatement(
        NodeFactory.createNumberLiteral(0, '0')
      );

      const node = NodeFactory.createIfStatement({
        condition,
        elseStatement,
        thenStatement,
      });

      expect(isIfStatement(node)).toBe(true);
      expect(node.condition).toBe(condition);
      expect(node.thenStatement).toBe(thenStatement);
      expect(node.elseStatement).toBe(elseStatement);
    });

    it('should create IfStatement without else body', () => {
      const condition = NodeFactory.createBooleanLiteral(true);
      const thenStatement = NodeFactory.createReturnStatement();

      const node = NodeFactory.createIfStatement({
        condition,
        thenStatement,
      });

      expect(isIfStatement(node)).toBe(true);
      expect(node.elseStatement).toBeUndefined();
    });

    it('should create ForStatement', () => {
      const body = NodeFactory.createBlock([]);
      const init = NodeFactory.createExpressionStatement(NodeFactory.createIdentifier('i'));
      const condition = NodeFactory.createBinaryExpression('<', {
        left: NodeFactory.createIdentifier('i'),
        right: NodeFactory.createNumberLiteral(10, '10'),
      });
      const update = NodeFactory.createBinaryExpression('+', {
        left: NodeFactory.createIdentifier('i'),
        right: NodeFactory.createNumberLiteral(1, '1'),
      });

      const node = NodeFactory.createForStatement({
        body,
        condition,
        init,
        update,
      });

      expect(isForStatement(node)).toBe(true);
      expect(node.body).toBe(body);
      expect(node.init).toBe(init);
      expect(node.condition).toBe(condition);
      expect(node.update).toBe(update);
    });

    it('should create ForStatement with optional parts', () => {
      const body = NodeFactory.createBlock([]);

      const node = NodeFactory.createForStatement({ body });

      expect(isForStatement(node)).toBe(true);
      expect(node.init).toBeUndefined();
      expect(node.condition).toBeUndefined();
      expect(node.update).toBeUndefined();
    });

    it('should create WhileStatement', () => {
      const condition = NodeFactory.createBooleanLiteral(true);
      const body = NodeFactory.createBlock([]);

      const node = NodeFactory.createWhileStatement(condition, body);

      expect(isWhileStatement(node)).toBe(true);
      expect(node.condition).toBe(condition);
      expect(node.body).toBe(body);
    });

    it('should create ReturnStatement with expression', () => {
      const expr = NodeFactory.createNumberLiteral(42, '42');
      const node = NodeFactory.createReturnStatement(expr);

      expect(isReturnStatement(node)).toBe(true);
      expect(node.value).toBe(expr);
    });

    it('should create ReturnStatement without expression', () => {
      const node = NodeFactory.createReturnStatement();

      expect(isReturnStatement(node)).toBe(true);
      expect(node.value).toBeUndefined();
    });

    it('should create Block with statements', () => {
      const stmt1 = NodeFactory.createReturnStatement();
      const stmt2 = NodeFactory.createReturnStatement(NodeFactory.createNumberLiteral(1, '1'));
      const node = NodeFactory.createBlock([stmt1, stmt2]);

      expect(isBlock(node)).toBe(true);
      expect(node.statements).toHaveLength(2);
      expect(node.statements[0]).toBe(stmt1);
      expect(node.statements[1]).toBe(stmt2);
    });

    it('should create Block with empty statements', () => {
      const node = NodeFactory.createBlock([]);

      expect(isBlock(node)).toBe(true);
      expect(node.statements).toHaveLength(0);
    });

    it('should create ExpressionStatement', () => {
      const expr = NodeFactory.createIdentifier('x');
      const node = NodeFactory.createExpressionStatement(expr);

      expect(node['@type']).toBe('ExpressionStatement');
      expect(node.expression).toBe(expr);
    });
  });

  describe('Expression Nodes', () => {
    it('should create BinaryExpression with all operators', () => {
      const left = NodeFactory.createNumberLiteral(5, '5');
      const right = NodeFactory.createNumberLiteral(3, '3');

      const operators = [
        '+',
        '-',
        '*',
        '/',
        '%',
        '==',
        '!=',
        '<',
        '>',
        '<=',
        '>=',
        '&&',
        '||',
      ] as const;

      for (const op of operators) {
        const node = NodeFactory.createBinaryExpression(op, { left, right });
        expect(isBinaryExpression(node)).toBe(true);
        expect(node.op).toBe(op);
        expect(node.left).toBe(left);
        expect(node.right).toBe(right);
      }
    });

    it('should create MethodCallExpression without target', () => {
      const args = [
        NodeFactory.createStringLiteral('arg1', '"arg1"'),
        NodeFactory.createNumberLiteral(42, '42'),
      ];
      const node = NodeFactory.createMethodCallExpression({ args, methodName: 'doSomething' });

      expect(isMethodCallExpression(node)).toBe(true);
      expect(node.id.string).toBe('doSomething');
      expect(node.receiver).toBeUndefined();
      expect(node.args).toHaveLength(2);
    });

    it('should create MethodCallExpression with target', () => {
      const target = NodeFactory.createIdentifier('obj');
      const args: never[] = [];
      const node = NodeFactory.createMethodCallExpression({
        args,
        methodName: 'method',
        target,
      });

      expect(isMethodCallExpression(node)).toBe(true);
      expect(node.receiver).toBe(target);
    });

    it('should create MethodCallExpression with type arguments', () => {
      const typeArgs = [
        NodeFactory.createSimpleTypeRef('String'),
        NodeFactory.createSimpleTypeRef('Integer'),
      ];
      const node = NodeFactory.createMethodCallExpression({
        methodName: 'genericMethod',
        typeArguments: typeArgs,
      });

      expect(isMethodCallExpression(node)).toBe(true);
      expect(node.typeArguments).toHaveLength(2);
    });

    it('should create Identifier', () => {
      const node = NodeFactory.createIdentifier('myVariable');

      expect(isIdentifier(node)).toBe(true);
      expect(node.string).toBe('myVariable');
    });
  });

  describe('Literal Nodes', () => {
    it('should create StringLiteral', () => {
      const node = NodeFactory.createStringLiteral('hello', '"hello"');

      expect(isStringLiteral(node)).toBe(true);
      expect(node.value).toBe('hello');
      expect(node.raw).toBe('"hello"');
    });

    it('should create StringLiteral with auto-generated raw', () => {
      const node = NodeFactory.createStringLiteral('world');

      expect(isStringLiteral(node)).toBe(true);
      expect(node.raw).toBe('"world"');
    });

    it('should create NumberLiteral', () => {
      const node = NodeFactory.createNumberLiteral(42, '42');

      expect(isNumberLiteral(node)).toBe(true);
      expect(node.value).toBe(42);
      expect(node.raw).toBe('42');
    });

    it('should create NumberLiteral with auto-generated raw', () => {
      const node = NodeFactory.createNumberLiteral(123.45);

      expect(isNumberLiteral(node)).toBe(true);
      expect(node.raw).toBe('123.45');
    });

    it('should create BooleanLiteral true', () => {
      const node = NodeFactory.createBooleanLiteral(true);

      expect(isBooleanLiteral(node)).toBe(true);
      expect(node.value).toBe(true);
    });

    it('should create BooleanLiteral false', () => {
      const node = NodeFactory.createBooleanLiteral(false);

      expect(isBooleanLiteral(node)).toBe(true);
      expect(node.value).toBe(false);
    });

    it('should create NullLiteral', () => {
      const node = NodeFactory.createNullLiteral();

      expect(isNullLiteral(node)).toBe(true);
    });
  });

  describe('TypeRef (not a node type)', () => {
    it('should create simple TypeRef', () => {
      const typeRef = NodeFactory.createSimpleTypeRef('String');

      expect(typeRef.components).toHaveLength(1);
      expect(typeRef.components[0].id.string).toBe('String');
      expect(typeRef.arrayNesting).toBe(0);
    });

    it('should create TypeRef with array nesting', () => {
      const typeRef = NodeFactory.createSimpleTypeRef('MyClass', 2);

      expect(typeRef.components).toHaveLength(1);
      expect(typeRef.components[0].id.string).toBe('MyClass');
      expect(typeRef.arrayNesting).toBe(2);
    });

    it('should create TypeRef with package', () => {
      const typeRef = NodeFactory.createTypeRef([
        { id: NodeFactory.createIdentifier('com') },
        { id: NodeFactory.createIdentifier('example') },
        { id: NodeFactory.createIdentifier('MyClass') },
      ]);

      expect(typeRef.components).toHaveLength(3);
      expect(typeRef.components[2].id.string).toBe('MyClass');
    });
  });

  describe('Declaration Nodes', () => {
    it('should create VariableDeclaration without initializer', () => {
      const type = NodeFactory.createSimpleTypeRef('String');
      const node = NodeFactory.createVariableDeclaration({ name: 'myVar', type });

      expect(isVariableDeclaration(node)).toBe(true);
      expect(node.id.string).toBe('myVar');
      expect(node.type).toBe(type);
      expect(node.initializer).toBeUndefined();
    });

    it('should create VariableDeclaration with initializer', () => {
      const type = NodeFactory.createSimpleTypeRef('String');
      const initializer = NodeFactory.createStringLiteral('value', '"value"');
      const node = NodeFactory.createVariableDeclaration({
        initializer,
        name: 'myVar',
        type,
      });

      expect(isVariableDeclaration(node)).toBe(true);
      expect(node.initializer).toBe(initializer);
    });

    it('should create VariableDeclarationStatement', () => {
      const decl = NodeFactory.createVariableDeclaration({
        name: 'x',
        type: NodeFactory.createSimpleTypeRef('Integer'),
      });
      const node = NodeFactory.createVariableDeclarationStatement(decl);

      expect(node['@type']).toBe('VariableDeclarationStatement');
      expect(node.group.declarations).toHaveLength(1);
      expect(node.group.declarations[0].id.string).toBe('x');
    });
  });

  describe('Location Information', () => {
    it('should preserve sourceLocation in all node types', () => {
      const location = {
        end: { column: 15, line: 10 },
        start: { column: 5, line: 10 },
      };

      const identifier = NodeFactory.createIdentifier('test', { location });
      expect(identifier.sourceLocation).toEqual({
        endColumn: 15,
        endLine: 10,
        startColumn: 5,
        startLine: 10,
      });

      const literal = NodeFactory.createStringLiteral('test', '"test"', { location });
      expect(literal.sourceLocation).toBeDefined();

      const stmt = NodeFactory.createReturnStatement(undefined, { location });
      expect(stmt.sourceLocation).toBeDefined();
    });
  });
});

describe('Source Location Utilities', () => {
  describe('spanOf', () => {
    // Ported from spanOf_chooses_nonNullValues
    // Original: val unknown = SourceLocation.UNKNOWN
    //           val withLinesOnly = SourceLocation(1, null, 3, null)
    //           val withLinesAndColumns = SourceLocation(withLinesOnly.startLine, 10, withLinesOnly.endLine, 10)
    //           assertThat(spanOf(unknown, unknown)).isEqualTo(unknown)
    //           assertThat(spanOf(withLinesOnly, unknown)).isEqualTo(withLinesOnly)
    //           assertThat(spanOf(unknown, withLinesOnly)).isEqualTo(withLinesOnly)
    //           assertThat(spanOf(withLinesOnly, withLinesAndColumns)).isEqualTo(withLinesAndColumns)
    //           assertThat(spanOf(withLinesAndColumns, withLinesOnly)).isEqualTo(withLinesAndColumns)
    // Original: Choose non-null source locations
    // Tests that spanOf prefers locations with more complete information (columns over lines only, lines over unknown)
    it('should choose non-null values', () => {
      // Original: val unknown = SourceLocation.UNKNOWN
      const unknown = UNKNOWN_SOURCE_LOCATION;
      // Original: val withLinesOnly = SourceLocation(1, null, 3, null)
      // In TypeScript, SourceLocation requires column, but spanOf handles undefined columns
      // We use a type assertion to test the behavior with missing column information
      const withLinesOnly: SourceRange = {
        end: { column: undefined as unknown as number, line: 3 }, // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion
        start: { column: undefined as unknown as number, line: 1 }, // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion
      };
      // Original: val withLinesAndColumns = SourceLocation(withLinesOnly.startLine, 10, withLinesOnly.endLine, 10)
      // Same start/end lines as withLinesOnly, but with columns
      const withLinesAndColumns: SourceRange = {
        end: { column: 10, line: 3 },
        start: { column: 10, line: 1 },
      };

      // Original: assertThat(spanOf(unknown, unknown)).isEqualTo(unknown)
      const result1 = spanOf(unknown, unknown);
      expect(result1).toEqual(unknown);
      expect(isUnknownLocation(result1)).toBe(true);

      // Original: assertThat(spanOf(withLinesOnly, unknown)).isEqualTo(withLinesOnly)
      const result2 = spanOf(withLinesOnly, unknown);
      expect(result2).toEqual(withLinesOnly);
      // Verify it prefers non-unknown over unknown
      expect(isUnknownLocation(result2)).toBe(false);

      // Original: assertThat(spanOf(unknown, withLinesOnly)).isEqualTo(withLinesOnly)
      const result3 = spanOf(unknown, withLinesOnly);
      expect(result3).toEqual(withLinesOnly);
      // Verify order doesn't matter (prefer non-unknown, order doesn't matter)
      expect(isUnknownLocation(result3)).toBe(false);

      // Original: assertThat(spanOf(withLinesOnly, withLinesAndColumns)).isEqualTo(withLinesAndColumns)
      const result4 = spanOf(withLinesOnly, withLinesAndColumns);
      expect(result4).toEqual(withLinesAndColumns);
      // Verify it prefers the one with columns (more complete information)
      expect(result4.start.column).toBe(10);
      expect(result4.end.column).toBe(10);

      // Original: assertThat(spanOf(withLinesAndColumns, withLinesOnly)).isEqualTo(withLinesAndColumns)
      const result5 = spanOf(withLinesAndColumns, withLinesOnly);
      expect(result5).toEqual(withLinesAndColumns);
      // Verify order doesn't matter (prefer the one with columns, order doesn't matter)
      expect(result5.start.column).toBe(10);
      expect(result5.end.column).toBe(10);
    });

    // Ported from spanOf_returns_newRange
    // Original: val lower = SourceLocation(1, 1, 2, 2)
    //           val upper = SourceLocation(2, 2, 3, 3)
    //           val expected = SourceLocation(lower.startLine, lower.startColumn, upper.endLine, upper.endColumn)
    //           assertThat(spanOf(lower, upper)).isEqualTo(expected)
    //           assertThat(spanOf(upper, lower)).isEqualTo(expected)
    // Original: Return new range spanning inputs
    // Tests that spanOf returns a new range from the earliest start to the latest end
    it('should return new range spanning all inputs', () => {
      // Original: val lower = SourceLocation(1, 1, 2, 2)
      // Starts at line 1, column 1, ends at line 2, column 2
      const lower: SourceRange = {
        end: { column: 2, line: 2 },
        start: { column: 1, line: 1 },
      };
      // Original: val upper = SourceLocation(2, 2, 3, 3)
      // Starts at line 2, column 2, ends at line 3, column 3
      const upper: SourceRange = {
        end: { column: 3, line: 3 },
        start: { column: 2, line: 2 },
      };

      // Original: val expected = SourceLocation(lower.startLine, lower.startColumn, upper.endLine, upper.endColumn)
      // Should span from lower's start (1, 1) to upper's end (3, 3)
      const expected: SourceRange = {
        end: { column: 3, line: 3 },
        start: { column: 1, line: 1 },
      };

      // Original: assertThat(spanOf(lower, upper)).isEqualTo(expected)
      const result1 = spanOf(lower, upper);
      expect(result1).toEqual(expected);
      expect(result1.start.line).toBe(1);
      expect(result1.start.column).toBe(1);
      expect(result1.end.line).toBe(3);
      expect(result1.end.column).toBe(3);

      // Original: assertThat(spanOf(upper, lower)).isEqualTo(expected)
      const result2 = spanOf(upper, lower);
      expect(result2).toEqual(expected);
      expect(result2.start.line).toBe(1);
      expect(result2.start.column).toBe(1);
      expect(result2.end.line).toBe(3);
      expect(result2.end.column).toBe(3);

      // Additional verification: the result should be a new object (not the same reference)
      // This ensures spanOf creates a new range rather than returning one of the inputs
      expect(result1).not.toBe(lower);
      expect(result1).not.toBe(upper);
      expect(result2).not.toBe(lower);
      expect(result2).not.toBe(upper);
      // Verify both results are equal (order doesn't matter)
      expect(result1).toEqual(result2);
    });

    // Ported from spanOf_is_idempotent
    // Original: val loc = SourceLocation(1, 3, 4, 2)
    //           assertThat(spanOf(loc)).isEqualTo(loc)
    //           assertThat(spanOf(loc, loc, loc)).isEqualTo(loc)
    //           assertThat(spanOf(loc, spanOf(loc, loc))).isEqualTo(loc)
    // Original: Idempotent behavior
    // Tests that spanOf with a single location returns that location, and multiple copies don't change the result
    it('should be idempotent', () => {
      // Original: val loc = SourceLocation(1, 3, 4, 2)
      // Starts at line 1, column 3, ends at line 4, column 2
      const loc: SourceRange = {
        end: { column: 2, line: 4 },
        start: { column: 3, line: 1 },
      };

      // Original: assertThat(spanOf(loc)).isEqualTo(loc)
      // Single argument returns the location itself (idempotent)
      const result1 = spanOf(loc);
      expect(result1).toEqual(loc);
      expect(result1.start.line).toBe(1);
      expect(result1.start.column).toBe(3);
      expect(result1.end.line).toBe(4);
      expect(result1.end.column).toBe(2);

      // Original: assertThat(spanOf(loc, loc, loc)).isEqualTo(loc)
      // Multiple copies don't change the result (idempotent)
      const result2 = spanOf(loc, loc, loc);
      expect(result2).toEqual(loc);
      expect(result2.start.line).toBe(1);
      expect(result2.start.column).toBe(3);
      expect(result2.end.line).toBe(4);
      expect(result2.end.column).toBe(2);

      // Original: assertThat(spanOf(loc, spanOf(loc, loc))).isEqualTo(loc)
      // Nested spanOf calls are idempotent
      const result3 = spanOf(loc, spanOf(loc, loc));
      expect(result3).toEqual(loc);
      expect(result3.start.line).toBe(1);
      expect(result3.start.column).toBe(3);
      expect(result3.end.line).toBe(4);
      expect(result3.end.column).toBe(2);

      // Additional verification: all results should be equal
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    // Ported from spanOf_ranks_lineOverColumn
    // Original: val widerLines = SourceLocation(1, 6, 10, 5)
    //           val widerColumns = SourceLocation(5, 1, 6, 10)
    //           assertThat(spanOf(widerLines, widerColumns)).isEqualTo(widerLines)
    //           assertThat(spanOf(widerColumns, widerLines)).isEqualTo(widerLines)
    // Original: Line takes precedence over column
    // Tests that when comparing ranges, line differences take precedence over column differences
    // A range spanning more lines (1-10) is considered "wider" than one spanning more columns (1-10) but fewer lines (5-6)
    it('should rank line over column', () => {
      // Original: val widerLines = SourceLocation(1, 6, 10, 5)
      // Spans lines 1-10 (9 lines), columns 6-5
      // This range spans more lines (1 to 10) even though columns are narrower
      const widerLines: SourceRange = {
        end: { column: 5, line: 10 },
        start: { column: 6, line: 1 },
      };
      // Original: val widerColumns = SourceLocation(5, 1, 6, 10)
      // Spans lines 5-6 (2 lines), columns 1-10
      // This range spans more columns (1 to 10) but fewer lines (5 to 6)
      const widerColumns: SourceRange = {
        end: { column: 10, line: 6 },
        start: { column: 1, line: 5 },
      };

      // Original: assertThat(spanOf(widerLines, widerColumns)).isEqualTo(widerLines)
      // Because widerLines spans more lines (1-10 vs 5-6), line differences take precedence
      // The result should span from the earliest start (1, 6) to the latest end (10, 5)
      const result1 = spanOf(widerLines, widerColumns);
      expect(result1).toEqual(widerLines);
      expect(result1.start.line).toBe(1);
      expect(result1.start.column).toBe(6);
      expect(result1.end.line).toBe(10);
      expect(result1.end.column).toBe(5);
      // Verify that line takes precedence: widerLines spans 9 lines (1-10), widerColumns spans 2 lines (5-6)
      // The result should use widerLines because it spans more lines

      // Original: assertThat(spanOf(widerColumns, widerLines)).isEqualTo(widerLines)
      // Order doesn't matter - line ranking takes precedence
      const result2 = spanOf(widerColumns, widerLines);
      expect(result2).toEqual(widerLines);
      expect(result2.start.line).toBe(1);
      expect(result2.start.column).toBe(6);
      expect(result2.end.line).toBe(10);
      expect(result2.end.column).toBe(5);

      // Additional verification: ensure the logic is correct
      // widerLines spans from line 1 to line 10 (9 lines)
      // widerColumns spans from line 5 to line 6 (2 lines)
      // The combined span should be from line 1 (earliest) to line 10 (latest)
      // Line differences take precedence over column differences
      expect(result1.start.line).toBeLessThan(widerColumns.start.line);
      expect(result1.end.line).toBeGreaterThan(widerColumns.end.line);
      expect(result1.start.line).toBe(widerLines.start.line);
      expect(result1.end.line).toBe(widerLines.end.line);
      // Verify both results are equal (order doesn't matter)
      expect(result1).toEqual(result2);
    });
  });
});
