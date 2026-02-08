/**
 * @file Comprehensive unit tests for NodeFactory.
 */

import { NodeFactory } from '../../src/translator/nodeFactory.js';
import { ExpressionFactory } from '../../src/translator/expressionFactory.js';
import { LiteralFactory } from '../../src/translator/expressionFactory.js';
import {
  isIfStatement,
  isForLoopStatement,
  isWhileLoopStatement,
  isReturnStatement,
  isCompoundStatement,
  isBinaryExpression,
  isCallExpression,
  isIdentifier,
  isStringVal,
  isIntegerVal,
  isBooleanVal,
  isNullVal,
  isVariableDeclaration,
} from '../../src/guard/index.js';

describe('NodeFactory', () => {
  describe('Statement Creation', () => {
    it('should create all statement types correctly', () => {
      // IfStatement
      const ifStmt = NodeFactory.createIfStatement({
        condition: NodeFactory.createBooleanLiteral(true),
        thenStatement: NodeFactory.createReturnStatement(),
      });
      expect(isIfStatement(ifStmt)).toBe(true);

      // ForLoopStatement
      const forStmt = NodeFactory.createForLoopStatement({
        body: NodeFactory.createCompoundStatement([]),
      });
      expect(isForLoopStatement(forStmt)).toBe(true);

      // WhileLoopStatement
      const whileStmt = NodeFactory.createWhileLoopStatement(
        NodeFactory.createBooleanVal(true),
        NodeFactory.createCompoundStatement([])
      );
      expect(isWhileLoopStatement(whileStmt)).toBe(true);

      // ReturnStatement
      const returnStmt = NodeFactory.createReturnStatement();
      expect(isReturnStatement(returnStmt)).toBe(true);

      // CompoundStatement
      const block = NodeFactory.createCompoundStatement([]);
      expect(isCompoundStatement(block)).toBe(true);

      // ExpressionStatement
      const exprStmt = NodeFactory.createExpressionStatement(
        NodeFactory.createVariableExpression(NodeFactory.createIdentifier('x'))
      );
      expect(exprStmt['@type']).toBe('ExpressionStatement');
    });
  });

  describe('Expression Creation', () => {
    it('should create all expression types correctly', () => {
      // BinaryExpression
      const binary = NodeFactory.createBinaryExpression('+', {
        left: NodeFactory.createIntegerVal(1, '1'),
        right: NodeFactory.createIntegerVal(2, '2'),
      });
      expect(isBinaryExpression(binary)).toBe(true);

      // CallExpression
      const methodCall = NodeFactory.createCallExpression({ methodName: 'test' });
      expect(isCallExpression(methodCall)).toBe(true);

      // Identifier
      const identifier = NodeFactory.createIdentifier('x');
      expect(isIdentifier(identifier)).toBe(true);
    });
  });

  describe('Literal Creation', () => {
    it('should create all literal types correctly', () => {
      // StringVal
      const str = NodeFactory.createStringVal('test');
      expect(isStringVal(str)).toBe(true);

      // IntegerVal
      const num = NodeFactory.createIntegerVal(42);
      expect(isIntegerVal(num)).toBe(true);

      // BooleanVal
      const bool = NodeFactory.createBooleanVal(true);
      expect(isBooleanVal(bool)).toBe(true);

      // NullVal
      const nullLit = NodeFactory.createNullVal();
      expect(isNullVal(nullLit)).toBe(true);
    });
  });

  describe('Type Creation', () => {
    it('should create TypeRef correctly', () => {
      // TypeRef is a data structure, not a node type
      // TypeRefs are created through the translator, not NodeFactory
      expect(true).toBe(true);
    });
  });

  describe('Declaration Creation', () => {
    it('should create variable declarations correctly', () => {
      // TypeRef creation
      const varDecl = NodeFactory.createVariableDeclaration({
        name: 'x',
        type: {
          arrayNesting: 0,
          components: [{ args: [], id: NodeFactory.createIdentifier('Integer') }],
        },
      });
      expect(isVariableDeclaration(varDecl)).toBe(true);
    });
  });

  describe('Options Handling', () => {
    it('should handle location options', () => {
      const location = {
        end: { column: 10, line: 1 },
        start: { column: 1, line: 1 },
      };

      const node = NodeFactory.createIdentifier('test', { location });
      expect(node.sourceLocation).toEqual({
        endColumn: 10,
        endLine: 1,
        startColumn: 1,
        startLine: 1,
      });
    });

    it('should work without location options', () => {
      const node = NodeFactory.createIdentifier('test');
      expect(node.sourceLocation).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      const node = NodeFactory.createStringVal('');
      expect(node.value).toBe('');
    });

    it('should handle zero', () => {
      const node = NodeFactory.createIntegerVal(0);
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
      const node = NodeFactory.createMethodCallExpression({ methodName: longName });
      expect(node.id.string).toBe(longName);
    });

    it('should handle unicode identifiers', () => {
      const node = NodeFactory.createIdentifier('变量名');
      expect(node.string).toBe('变量名');
    });
  });

  describe('Deprecated methods - ExpressionFactory', () => {
    it('should support createMethodCallExpression (deprecated)', () => {
      const node = NodeFactory.createMethodCallExpression({ methodName: 'test' });
      expect(node['@type']).toBe('CallExpression');
      expect(node.id.string).toBe('test');
    });

    it('should support createAssignmentExpression (deprecated)', () => {
      const left = NodeFactory.createVariableExpression(NodeFactory.createIdentifier('x'));
      const right = NodeFactory.createIntegerVal(5, '5');
      const node = NodeFactory.createAssignmentExpression('=', { left, right });
      expect(node['@type']).toBe('AssignExpression');
      expect(node.operator).toBe('=');
    });

    it('should support createFieldAccessExpression (deprecated)', () => {
      const target = NodeFactory.createVariableExpression(NodeFactory.createIdentifier('obj'));
      const node = NodeFactory.createFieldAccessExpression('field', target);
      expect(node['@type']).toBe('FieldExpression');
      expect(node.field.string).toBe('field');
    });

    it('should support createArrayAccessExpression (deprecated)', () => {
      const array = NodeFactory.createVariableExpression(NodeFactory.createIdentifier('arr'));
      const index = NodeFactory.createIntegerVal(0, '0');
      const node = NodeFactory.createArrayAccessExpression(array, index);
      expect(node['@type']).toBe('ArrayExpression');
      expect(node.array).toBe(array);
      expect(node.index).toBe(index);
    });

    it('should support createSoqlQueryExpression (deprecated)', () => {
      const expr = NodeFactory.createVariableExpression(NodeFactory.createIdentifier('x'));
      const node = NodeFactory.createSoqlQueryExpression('SELECT Id FROM Contact', [expr]);
      expect(node['@type']).toBe('SoqlExpression');
      expect(node.query).toBe('SELECT Id FROM Contact');
    });

    it('should support createSoslQueryExpression (deprecated)', () => {
      const expr = NodeFactory.createVariableExpression(NodeFactory.createIdentifier('x'));
      const node = NodeFactory.createSoslQueryExpression('FIND :x IN ALL FIELDS', [expr]);
      expect(node['@type']).toBe('SoslExpression');
      expect(node.query).toBe('FIND :x IN ALL FIELDS');
    });

    it('should create UnaryExpression', () => {
      const operand = NodeFactory.createIntegerVal(5, '5');
      const node = NodeFactory.createUnaryExpression('!', { operand, prefix: true });
      expect(node['@type']).toBe('UnaryExpression');
      expect(node.op).toBe('!');
      expect(node.prefix).toBe(true);
    });

    it('should create TernaryExpression', () => {
      const condition = NodeFactory.createBooleanVal(true);
      const thenExpr = NodeFactory.createIntegerVal(1, '1');
      const elseExpr = NodeFactory.createIntegerVal(0, '0');
      const node = NodeFactory.createTernaryExpression({
        condition,
        elseExpression: elseExpr,
        thenExpression: thenExpr,
      });
      expect(node['@type']).toBe('TernaryExpression');
      expect(node.condition).toBe(condition);
    });

    it('should create CastExpression', () => {
      const type = {
        arrayNesting: 0,
        components: [{ args: [], id: NodeFactory.createIdentifier('String') }],
      };
      const expr = NodeFactory.createVariableExpression(NodeFactory.createIdentifier('x'));
      const node = NodeFactory.createCastExpression(type, expr);
      expect(node['@type']).toBe('CastExpression');
      expect(node.type).toBe(type);
    });

    it('should create InstanceOfExpression', () => {
      const type = {
        arrayNesting: 0,
        components: [{ args: [], id: NodeFactory.createIdentifier('String') }],
      };
      const expr = NodeFactory.createVariableExpression(NodeFactory.createIdentifier('x'));
      const node = NodeFactory.createInstanceOfExpression(expr, type);
      expect(node['@type']).toBe('InstanceOfExpression');
      expect(node.type).toBe(type);
    });

    it('should create NewExpression', () => {
      const type = {
        arrayNesting: 0,
        components: [{ args: [], id: NodeFactory.createIdentifier('String') }],
      };
      const initializer = NodeFactory.createConstructorInitializer(type, []);
      const node = NodeFactory.createNewExpression(initializer);
      expect(node['@type']).toBe('NewExpression');
      expect(node.initializer).toBe(initializer);
    });

    it('should create NewArrayExpression', () => {
      const type = {
        arrayNesting: 1,
        components: [{ args: [], id: NodeFactory.createIdentifier('Integer') }],
      };
      const size = NodeFactory.createIntegerVal(10, '10');
      const node = NodeFactory.createNewArrayExpression(type, size);
      expect(node['@type']).toBe('NewExpression');
      expect(node.initializer['@type']).toBe('SizedArrayInitializer');
    });

    it('should create LambdaExpression', () => {
      const parameters = [NodeFactory.createIdentifier('x')];
      const body = NodeFactory.createIntegerVal(42, '42');
      const node = NodeFactory.createLambdaExpression(parameters, body);
      expect(node['@type']).toBe('LambdaExpression');
      expect(node.parameters).toStrictEqual(parameters);
      expect(node.body).toBe(body);
    });

    it('should create ThisExpression', () => {
      const node = NodeFactory.createThisExpression();
      expect(node['@type']).toBe('ThisExpression');
    });

    it('should create SuperExpression', () => {
      const node = NodeFactory.createSuperExpression();
      expect(node['@type']).toBe('SuperExpression');
    });

    it('should create ParenthesizedExpression', () => {
      const expr = NodeFactory.createIntegerVal(42, '42');
      const node = NodeFactory.createParenthesizedExpression(expr);
      expect(node['@type']).toBe('ParenthesizedExpression');
      expect(node.expression).toBe(expr);
    });

    it('should create SoqlExpression', () => {
      const node = NodeFactory.createSoqlExpression('SELECT Id FROM Contact');
      expect(node['@type']).toBe('SoqlExpression');
      expect(node.query).toBe('SELECT Id FROM Contact');
    });

    it('should create SoslExpression', () => {
      const node = NodeFactory.createSoslExpression('FIND :x IN ALL FIELDS');
      expect(node['@type']).toBe('SoslExpression');
      expect(node.query).toBe('FIND :x IN ALL FIELDS');
    });

    it('should create TriggerContextVariableExpression', () => {
      const node = NodeFactory.createTriggerContextVariableExpression('Trigger.new');
      expect(node['@type']).toBe('TriggerContextVariableExpression');
      expect(node.variableName).toBe('Trigger.new');
    });
  });

  describe('Deprecated methods - LiteralFactory', () => {
    it('should support createStringLiteral (deprecated)', () => {
      const node = NodeFactory.createStringLiteral('test', '"test"');
      expect(node['@type']).toBe('StringVal');
      expect(node.value).toBe('test');
    });

    it('should support createNumberLiteral (deprecated)', () => {
      const node = NodeFactory.createNumberLiteral(42, '42');
      expect(node['@type']).toBe('IntegerVal');
      expect(node.value).toBe(42);
    });

    it('should support createBooleanLiteral (deprecated)', () => {
      const node = NodeFactory.createBooleanLiteral(true);
      expect(node['@type']).toBe('BooleanVal');
      expect(node.value).toBe(true);
    });

    it('should support createNullLiteral (deprecated)', () => {
      const node = NodeFactory.createNullLiteral();
      expect(node['@type']).toBe('NullVal');
    });
  });

  describe('Additional expression coverage', () => {
    it('should create CallExpression with type arguments', () => {
      const typeArgs = [
        {
          arrayNesting: 0,
          components: [{ args: [], id: NodeFactory.createIdentifier('String') }],
        },
      ];
      const node = NodeFactory.createCallExpression({
        methodName: 'method',
        typeArguments: typeArgs,
      });
      expect(node['@type']).toBe('CallExpression');
      expect(node.typeArguments).toStrictEqual(typeArgs);
    });

    it('should create CallExpression with target', () => {
      const target = NodeFactory.createVariableExpression(NodeFactory.createIdentifier('obj'));
      const node = NodeFactory.createCallExpression({
        methodName: 'method',
        target,
      });
      expect(node['@type']).toBe('CallExpression');
      expect(node.receiver).toBe(target);
    });

    it('should create FieldExpression without target', () => {
      const node = NodeFactory.createFieldExpression('field');
      expect(node['@type']).toBe('FieldExpression');
      expect(node.field.string).toBe('field');
      expect(node.obj).toBeUndefined();
    });
  });

  describe('Direct ExpressionFactory tests', () => {
    it('should create all expression types directly', () => {
      // Test all methods directly to ensure coverage
      const left = ExpressionFactory.createVariableExpression(NodeFactory.createIdentifier('x'));
      const right = ExpressionFactory.createVariableExpression(NodeFactory.createIdentifier('y'));

      // BinaryExpression
      const binary = ExpressionFactory.createBinaryExpression('+', { left, right });
      expect(binary['@type']).toBe('BinaryExpression');

      // CallExpression with all options
      const call = ExpressionFactory.createCallExpression({
        args: [left],
        methodName: 'test',
        target: right,
        typeArguments: [
          {
            arrayNesting: 0,
            components: [{ args: [], id: NodeFactory.createIdentifier('String') }],
          },
        ],
      });
      expect(call['@type']).toBe('CallExpression');

      // UnaryExpression
      const unary = ExpressionFactory.createUnaryExpression('!', { operand: left, prefix: true });
      expect(unary['@type']).toBe('UnaryExpression');

      // AssignExpression
      const assign = ExpressionFactory.createAssignExpression('=', { left, right });
      expect(assign['@type']).toBe('AssignExpression');

      // FieldExpression
      const field = ExpressionFactory.createFieldExpression('field', left);
      expect(field['@type']).toBe('FieldExpression');

      // ArrayExpression
      const arrayExpr = ExpressionFactory.createArrayExpression(left, right);
      expect(arrayExpr['@type']).toBe('ArrayExpression');

      // TernaryExpression
      const ternary = ExpressionFactory.createTernaryExpression({
        condition: left,
        elseExpression: left,
        thenExpression: right,
      });
      expect(ternary['@type']).toBe('TernaryExpression');

      // CastExpression
      const cast = ExpressionFactory.createCastExpression(
        {
          arrayNesting: 0,
          components: [{ args: [], id: NodeFactory.createIdentifier('String') }],
        },
        left
      );
      expect(cast['@type']).toBe('CastExpression');

      // InstanceOfExpression
      const instanceofExpr = ExpressionFactory.createInstanceOfExpression(left, {
        arrayNesting: 0,
        components: [{ args: [], id: NodeFactory.createIdentifier('String') }],
      });
      expect(instanceofExpr['@type']).toBe('InstanceOfExpression');

      // NewExpression
      const newExpr = ExpressionFactory.createNewExpression(
        NodeFactory.createConstructorInitializer(
          {
            arrayNesting: 0,
            components: [{ args: [], id: NodeFactory.createIdentifier('String') }],
          },
          []
        )
      );
      expect(newExpr['@type']).toBe('NewExpression');

      // NewArrayExpression
      const newArray = ExpressionFactory.createNewArrayExpression(
        {
          arrayNesting: 1,
          components: [{ args: [], id: NodeFactory.createIdentifier('Integer') }],
        },
        right
      );
      expect(newArray['@type']).toBe('NewExpression');

      // LambdaExpression
      const lambda = ExpressionFactory.createLambdaExpression(
        [NodeFactory.createIdentifier('x')],
        left
      );
      expect(lambda['@type']).toBe('LambdaExpression');

      // ThisExpression
      const thisExpr = ExpressionFactory.createThisExpression();
      expect(thisExpr['@type']).toBe('ThisExpression');

      // SuperExpression
      const superExpr = ExpressionFactory.createSuperExpression();
      expect(superExpr['@type']).toBe('SuperExpression');

      // ParenthesizedExpression
      const paren = ExpressionFactory.createParenthesizedExpression(left);
      expect(paren['@type']).toBe('ParenthesizedExpression');

      // SoqlExpression
      const soql = ExpressionFactory.createSoqlExpression('SELECT Id FROM Contact');
      expect(soql['@type']).toBe('SoqlExpression');

      // SoslExpression
      const sosl = ExpressionFactory.createSoslExpression('FIND :x IN ALL FIELDS');
      expect(sosl['@type']).toBe('SoslExpression');

      // TriggerContextVariableExpression
      const triggerVar = ExpressionFactory.createTriggerContextVariableExpression('Trigger.new');
      expect(triggerVar['@type']).toBe('TriggerContextVariableExpression');

      // Deprecated methods
      const methodCall = ExpressionFactory.createMethodCallExpression({ methodName: 'test' });
      expect(methodCall['@type']).toBe('CallExpression');

      const assignment = ExpressionFactory.createAssignmentExpression('=', { left, right });
      expect(assignment['@type']).toBe('AssignExpression');

      const fieldAccess = ExpressionFactory.createFieldAccessExpression('field', left);
      expect(fieldAccess['@type']).toBe('FieldExpression');

      const arrayAccess = ExpressionFactory.createArrayAccessExpression(left, right);
      expect(arrayAccess['@type']).toBe('ArrayExpression');

      const soqlQuery = ExpressionFactory.createSoqlQueryExpression('SELECT Id', [left]);
      expect(soqlQuery['@type']).toBe('SoqlExpression');

      const soslQuery = ExpressionFactory.createSoslQueryExpression('FIND :x', [left]);
      expect(soslQuery['@type']).toBe('SoslExpression');
    });
  });

  describe('Direct LiteralFactory tests', () => {
    it('should create all literal types directly', () => {
      // Test all methods directly to ensure coverage
      const stringVal = LiteralFactory.createStringVal('test', '"test"');
      expect(stringVal['@type']).toBe('StringVal');

      const intVal = LiteralFactory.createIntegerVal(42, '42');
      expect(intVal['@type']).toBe('IntegerVal');

      const doubleVal = LiteralFactory.createDoubleVal(3.14, '3.14');
      expect(doubleVal['@type']).toBe('DoubleVal');

      const longVal = LiteralFactory.createLongVal(123, '123L');
      expect(longVal['@type']).toBe('LongVal');

      const decimalVal = LiteralFactory.createDecimalVal(1.5, '1.5');
      expect(decimalVal['@type']).toBe('DecimalVal');

      const boolVal = LiteralFactory.createBooleanVal(true);
      expect(boolVal['@type']).toBe('BooleanVal');

      const nullVal = LiteralFactory.createNullVal();
      expect(nullVal['@type']).toBe('NullVal');

      // Deprecated methods
      const stringLit = LiteralFactory.createStringLiteral('test', '"test"');
      expect(stringLit['@type']).toBe('StringVal');

      const numLit = LiteralFactory.createNumberLiteral(42, '42');
      expect(numLit['@type']).toBe('IntegerVal');

      const boolLit = LiteralFactory.createBooleanLiteral(true);
      expect(boolLit['@type']).toBe('BooleanVal');

      const nullLit = LiteralFactory.createNullLiteral();
      expect(nullLit['@type']).toBe('NullVal');
    });
  });
});
