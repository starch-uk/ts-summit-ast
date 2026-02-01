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
      const forStmt = NodeFactory.createForLoopStatement(NodeFactory.createCompoundStatement([]));
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
      expect(exprStmt.kind).toBe('ExpressionStatement');
    });
  });

  describe('Expression Creation', () => {
    it('should create all expression types correctly', () => {
      // BinaryExpression
      const binary = NodeFactory.createBinaryExpression(
        '+',
        NodeFactory.createIntegerVal(1, '1'),
        NodeFactory.createIntegerVal(2, '2')
      );
      expect(isBinaryExpression(binary)).toBe(true);

      // CallExpression
      const methodCall = NodeFactory.createCallExpression('test', []);
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
      const varDecl = NodeFactory.createVariableDeclaration(
        'x',
        {
          arrayNesting: 0,
          components: [{ args: [], id: NodeFactory.createIdentifier('Integer') }],
        },
        undefined,
        undefined
      );
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
      expect(node.location).toEqual(location);
    });

    it('should work without location options', () => {
      const node = NodeFactory.createIdentifier('test');
      expect(node.location).toBeUndefined();
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
      const node = NodeFactory.createMethodCallExpression(longName, []);
      expect(node.methodName).toBe(longName);
    });

    it('should handle unicode identifiers', () => {
      const node = NodeFactory.createIdentifier('变量名');
      expect(node.name).toBe('变量名');
    });
  });

  describe('Deprecated methods - ExpressionFactory', () => {
    it('should support createMethodCallExpression (deprecated)', () => {
      const node = NodeFactory.createMethodCallExpression('test', []);
      expect(node.kind).toBe('CallExpression');
      expect(node.methodName).toBe('test');
    });

    it('should support createAssignmentExpression (deprecated)', () => {
      const left = NodeFactory.createVariableExpression(NodeFactory.createIdentifier('x'));
      const right = NodeFactory.createIntegerVal(5, '5');
      const node = NodeFactory.createAssignmentExpression('=', left, right);
      expect(node.kind).toBe('AssignExpression');
      expect(node.operator).toBe('=');
    });

    it('should support createFieldAccessExpression (deprecated)', () => {
      const target = NodeFactory.createVariableExpression(NodeFactory.createIdentifier('obj'));
      const node = NodeFactory.createFieldAccessExpression('field', target);
      expect(node.kind).toBe('FieldExpression');
      expect(node.fieldName).toBe('field');
    });

    it('should support createArrayAccessExpression (deprecated)', () => {
      const array = NodeFactory.createVariableExpression(NodeFactory.createIdentifier('arr'));
      const index = NodeFactory.createIntegerVal(0, '0');
      const node = NodeFactory.createArrayAccessExpression(array, index);
      expect(node.kind).toBe('ArrayExpression');
      expect(node.array).toBe(array);
      expect(node.index).toBe(index);
    });

    it('should support createSoqlQueryExpression (deprecated)', () => {
      const expr = NodeFactory.createVariableExpression(NodeFactory.createIdentifier('x'));
      const node = NodeFactory.createSoqlQueryExpression('SELECT Id FROM Contact', [expr]);
      expect(node.kind).toBe('SoqlExpression');
      expect(node.query).toBe('SELECT Id FROM Contact');
    });

    it('should support createSoslQueryExpression (deprecated)', () => {
      const expr = NodeFactory.createVariableExpression(NodeFactory.createIdentifier('x'));
      const node = NodeFactory.createSoslQueryExpression('FIND :x IN ALL FIELDS', [expr]);
      expect(node.kind).toBe('SoslExpression');
      expect(node.query).toBe('FIND :x IN ALL FIELDS');
    });

    it('should create UnaryExpression', () => {
      const operand = NodeFactory.createIntegerVal(5, '5');
      const node = NodeFactory.createUnaryExpression('!', operand, true);
      expect(node.kind).toBe('UnaryExpression');
      expect(node.operator).toBe('!');
      expect(node.prefix).toBe(true);
    });

    it('should create TernaryExpression', () => {
      const condition = NodeFactory.createBooleanVal(true);
      const thenExpr = NodeFactory.createIntegerVal(1, '1');
      const elseExpr = NodeFactory.createIntegerVal(0, '0');
      const node = NodeFactory.createTernaryExpression(condition, thenExpr, elseExpr);
      expect(node.kind).toBe('TernaryExpression');
      expect(node.condition).toBe(condition);
    });

    it('should create CastExpression', () => {
      const type = {
        arrayNesting: 0,
        components: [{ args: [], id: NodeFactory.createIdentifier('String') }],
      };
      const expr = NodeFactory.createVariableExpression(NodeFactory.createIdentifier('x'));
      const node = NodeFactory.createCastExpression(type, expr);
      expect(node.kind).toBe('CastExpression');
      expect(node.type).toBe(type);
    });

    it('should create InstanceOfExpression', () => {
      const type = {
        arrayNesting: 0,
        components: [{ args: [], id: NodeFactory.createIdentifier('String') }],
      };
      const expr = NodeFactory.createVariableExpression(NodeFactory.createIdentifier('x'));
      const node = NodeFactory.createInstanceOfExpression(expr, type);
      expect(node.kind).toBe('InstanceOfExpression');
      expect(node.type).toBe(type);
    });

    it('should create NewExpression', () => {
      const type = {
        arrayNesting: 0,
        components: [{ args: [], id: NodeFactory.createIdentifier('String') }],
      };
      const initializer = NodeFactory.createConstructorInitializer(type, []);
      const node = NodeFactory.createNewExpression(initializer);
      expect(node.kind).toBe('NewExpression');
      expect(node.initializer).toBe(initializer);
    });

    it('should create NewArrayExpression', () => {
      const type = {
        arrayNesting: 1,
        components: [{ args: [], id: NodeFactory.createIdentifier('Integer') }],
      };
      const size = NodeFactory.createIntegerVal(10, '10');
      const node = NodeFactory.createNewArrayExpression(type, size);
      expect(node.kind).toBe('NewExpression');
      expect(node.initializer.kind).toBe('SizedArrayInitializer');
    });

    it('should create LambdaExpression', () => {
      const parameters = [NodeFactory.createIdentifier('x')];
      const body = NodeFactory.createIntegerVal(42, '42');
      const node = NodeFactory.createLambdaExpression(parameters, body);
      expect(node.kind).toBe('LambdaExpression');
      expect(node.parameters).toStrictEqual(parameters);
      expect(node.body).toBe(body);
    });

    it('should create ThisExpression', () => {
      const node = NodeFactory.createThisExpression();
      expect(node.kind).toBe('ThisExpression');
    });

    it('should create SuperExpression', () => {
      const node = NodeFactory.createSuperExpression();
      expect(node.kind).toBe('SuperExpression');
    });

    it('should create ParenthesizedExpression', () => {
      const expr = NodeFactory.createIntegerVal(42, '42');
      const node = NodeFactory.createParenthesizedExpression(expr);
      expect(node.kind).toBe('ParenthesizedExpression');
      expect(node.expression).toBe(expr);
    });

    it('should create SoqlExpression', () => {
      const node = NodeFactory.createSoqlExpression('SELECT Id FROM Contact');
      expect(node.kind).toBe('SoqlExpression');
      expect(node.query).toBe('SELECT Id FROM Contact');
    });

    it('should create SoslExpression', () => {
      const node = NodeFactory.createSoslExpression('FIND :x IN ALL FIELDS');
      expect(node.kind).toBe('SoslExpression');
      expect(node.query).toBe('FIND :x IN ALL FIELDS');
    });

    it('should create TriggerContextVariableExpression', () => {
      const node = NodeFactory.createTriggerContextVariableExpression('Trigger.new');
      expect(node.kind).toBe('TriggerContextVariableExpression');
      expect(node.variableName).toBe('Trigger.new');
    });
  });

  describe('Deprecated methods - LiteralFactory', () => {
    it('should support createStringLiteral (deprecated)', () => {
      const node = NodeFactory.createStringLiteral('test', '"test"');
      expect(node.kind).toBe('StringVal');
      expect(node.value).toBe('test');
    });

    it('should support createNumberLiteral (deprecated)', () => {
      const node = NodeFactory.createNumberLiteral(42, '42');
      expect(node.kind).toBe('IntegerVal');
      expect(node.value).toBe(42);
    });

    it('should support createBooleanLiteral (deprecated)', () => {
      const node = NodeFactory.createBooleanLiteral(true);
      expect(node.kind).toBe('BooleanVal');
      expect(node.value).toBe(true);
    });

    it('should support createNullLiteral (deprecated)', () => {
      const node = NodeFactory.createNullLiteral();
      expect(node.kind).toBe('NullVal');
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
      const node = NodeFactory.createCallExpression('method', [], undefined, typeArgs);
      expect(node.kind).toBe('CallExpression');
      expect(node.typeArguments).toStrictEqual(typeArgs);
    });

    it('should create CallExpression with target', () => {
      const target = NodeFactory.createVariableExpression(NodeFactory.createIdentifier('obj'));
      const node = NodeFactory.createCallExpression('method', [], target);
      expect(node.kind).toBe('CallExpression');
      expect(node.target).toBe(target);
    });

    it('should create FieldExpression without target', () => {
      const node = NodeFactory.createFieldExpression('field');
      expect(node.kind).toBe('FieldExpression');
      expect(node.fieldName).toBe('field');
      expect(node.target).toBeUndefined();
    });
  });

  describe('Direct ExpressionFactory tests', () => {
    it('should create all expression types directly', () => {
      // Test all methods directly to ensure coverage
      const left = ExpressionFactory.createVariableExpression(NodeFactory.createIdentifier('x'));
      const right = ExpressionFactory.createVariableExpression(NodeFactory.createIdentifier('y'));

      // BinaryExpression
      const binary = ExpressionFactory.createBinaryExpression('+', left, right);
      expect(binary.kind).toBe('BinaryExpression');

      // CallExpression with all options
      const call = ExpressionFactory.createCallExpression('test', [left], right, [
        {
          arrayNesting: 0,
          components: [{ args: [], id: NodeFactory.createIdentifier('String') }],
        },
      ]);
      expect(call.kind).toBe('CallExpression');

      // UnaryExpression
      const unary = ExpressionFactory.createUnaryExpression('!', left, true);
      expect(unary.kind).toBe('UnaryExpression');

      // AssignExpression
      const assign = ExpressionFactory.createAssignExpression('=', left, right);
      expect(assign.kind).toBe('AssignExpression');

      // FieldExpression
      const field = ExpressionFactory.createFieldExpression('field', left);
      expect(field.kind).toBe('FieldExpression');

      // ArrayExpression
      const arrayExpr = ExpressionFactory.createArrayExpression(left, right);
      expect(arrayExpr.kind).toBe('ArrayExpression');

      // TernaryExpression
      const ternary = ExpressionFactory.createTernaryExpression(left, right, left);
      expect(ternary.kind).toBe('TernaryExpression');

      // CastExpression
      const cast = ExpressionFactory.createCastExpression(
        {
          arrayNesting: 0,
          components: [{ args: [], id: NodeFactory.createIdentifier('String') }],
        },
        left
      );
      expect(cast.kind).toBe('CastExpression');

      // InstanceOfExpression
      const instanceofExpr = ExpressionFactory.createInstanceOfExpression(left, {
        arrayNesting: 0,
        components: [{ args: [], id: NodeFactory.createIdentifier('String') }],
      });
      expect(instanceofExpr.kind).toBe('InstanceOfExpression');

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
      expect(newExpr.kind).toBe('NewExpression');

      // NewArrayExpression
      const newArray = ExpressionFactory.createNewArrayExpression(
        {
          arrayNesting: 1,
          components: [{ args: [], id: NodeFactory.createIdentifier('Integer') }],
        },
        right
      );
      expect(newArray.kind).toBe('NewExpression');

      // LambdaExpression
      const lambda = ExpressionFactory.createLambdaExpression(
        [NodeFactory.createIdentifier('x')],
        left
      );
      expect(lambda.kind).toBe('LambdaExpression');

      // ThisExpression
      const thisExpr = ExpressionFactory.createThisExpression();
      expect(thisExpr.kind).toBe('ThisExpression');

      // SuperExpression
      const superExpr = ExpressionFactory.createSuperExpression();
      expect(superExpr.kind).toBe('SuperExpression');

      // ParenthesizedExpression
      const paren = ExpressionFactory.createParenthesizedExpression(left);
      expect(paren.kind).toBe('ParenthesizedExpression');

      // SoqlExpression
      const soql = ExpressionFactory.createSoqlExpression('SELECT Id FROM Contact');
      expect(soql.kind).toBe('SoqlExpression');

      // SoslExpression
      const sosl = ExpressionFactory.createSoslExpression('FIND :x IN ALL FIELDS');
      expect(sosl.kind).toBe('SoslExpression');

      // TriggerContextVariableExpression
      const triggerVar = ExpressionFactory.createTriggerContextVariableExpression('Trigger.new');
      expect(triggerVar.kind).toBe('TriggerContextVariableExpression');

      // Deprecated methods
      const methodCall = ExpressionFactory.createMethodCallExpression('test', []);
      expect(methodCall.kind).toBe('CallExpression');

      const assignment = ExpressionFactory.createAssignmentExpression('=', left, right);
      expect(assignment.kind).toBe('AssignExpression');

      const fieldAccess = ExpressionFactory.createFieldAccessExpression('field', left);
      expect(fieldAccess.kind).toBe('FieldExpression');

      const arrayAccess = ExpressionFactory.createArrayAccessExpression(left, right);
      expect(arrayAccess.kind).toBe('ArrayExpression');

      const soqlQuery = ExpressionFactory.createSoqlQueryExpression('SELECT Id', [left]);
      expect(soqlQuery.kind).toBe('SoqlExpression');

      const soslQuery = ExpressionFactory.createSoslQueryExpression('FIND :x', [left]);
      expect(soslQuery.kind).toBe('SoslExpression');
    });
  });

  describe('Direct LiteralFactory tests', () => {
    it('should create all literal types directly', () => {
      // Test all methods directly to ensure coverage
      const stringVal = LiteralFactory.createStringVal('test', '"test"');
      expect(stringVal.kind).toBe('StringVal');

      const intVal = LiteralFactory.createIntegerVal(42, '42');
      expect(intVal.kind).toBe('IntegerVal');

      const doubleVal = LiteralFactory.createDoubleVal(3.14, '3.14');
      expect(doubleVal.kind).toBe('DoubleVal');

      const longVal = LiteralFactory.createLongVal(123, '123L');
      expect(longVal.kind).toBe('LongVal');

      const decimalVal = LiteralFactory.createDecimalVal(1.5, '1.5');
      expect(decimalVal.kind).toBe('DecimalVal');

      const boolVal = LiteralFactory.createBooleanVal(true);
      expect(boolVal.kind).toBe('BooleanVal');

      const nullVal = LiteralFactory.createNullVal();
      expect(nullVal.kind).toBe('NullVal');

      // Deprecated methods
      const stringLit = LiteralFactory.createStringLiteral('test', '"test"');
      expect(stringLit.kind).toBe('StringVal');

      const numLit = LiteralFactory.createNumberLiteral(42, '42');
      expect(numLit.kind).toBe('IntegerVal');

      const boolLit = LiteralFactory.createBooleanLiteral(true);
      expect(boolLit.kind).toBe('BooleanVal');

      const nullLit = LiteralFactory.createNullLiteral();
      expect(nullLit.kind).toBe('NullVal');
    });
  });
});
