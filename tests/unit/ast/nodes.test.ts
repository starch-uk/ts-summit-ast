/**
 * Comprehensive tests for all AST node types
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

describe('AST Node Creation', () => {
  describe('Statement Nodes', () => {
    it('should create IfStatement with all properties', () => {
      const condition = NodeFactory.createBooleanLiteral(true);
      const thenBody = NodeFactory.createReturnStatement();
      const elseBody = NodeFactory.createReturnStatement(
        NodeFactory.createNumberLiteral(0, '0')
      );

      const node = NodeFactory.createIfStatement(condition, thenBody, elseBody);

      expect(isIfStatement(node)).toBe(true);
      expect(node.condition).toBe(condition);
      expect(node.thenBody).toBe(thenBody);
      expect(node.elseBody).toBe(elseBody);
    });

    it('should create IfStatement without else body', () => {
      const condition = NodeFactory.createBooleanLiteral(true);
      const thenBody = NodeFactory.createReturnStatement();

      const node = NodeFactory.createIfStatement(condition, thenBody);

      expect(isIfStatement(node)).toBe(true);
      expect(node.elseBody).toBeUndefined();
    });

    it('should create ForStatement', () => {
      const body = NodeFactory.createBlock([]);
      const init = NodeFactory.createExpressionStatement(
        NodeFactory.createIdentifier('i')
      );
      const condition = NodeFactory.createBinaryExpression(
        '<',
        NodeFactory.createIdentifier('i'),
        NodeFactory.createNumberLiteral(10, '10')
      );
      const update = NodeFactory.createBinaryExpression(
        '++',
        NodeFactory.createIdentifier('i'),
        NodeFactory.createNumberLiteral(1, '1')
      );

      const node = NodeFactory.createForStatement(body, init, condition, update);

      expect(isForStatement(node)).toBe(true);
      expect(node.body).toBe(body);
      expect(node.init).toBe(init);
      expect(node.condition).toBe(condition);
      expect(node.update).toBe(update);
    });

    it('should create ForStatement with optional parts', () => {
      const body = NodeFactory.createBlock([]);

      const node = NodeFactory.createForStatement(body);

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
      expect(node.expression).toBe(expr);
    });

    it('should create ReturnStatement without expression', () => {
      const node = NodeFactory.createReturnStatement();

      expect(isReturnStatement(node)).toBe(true);
      expect(node.expression).toBeUndefined();
    });

    it('should create Block with statements', () => {
      const stmt1 = NodeFactory.createReturnStatement();
      const stmt2 = NodeFactory.createReturnStatement(
        NodeFactory.createNumberLiteral(1, '1')
      );
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

      expect(node.kind).toBe('ExpressionStatement');
      expect(node.expression).toBe(expr);
    });
  });

  describe('Expression Nodes', () => {
    it('should create BinaryExpression with all operators', () => {
      const left = NodeFactory.createNumberLiteral(5, '5');
      const right = NodeFactory.createNumberLiteral(3, '3');

      const operators = ['+', '-', '*', '/', '%', '==', '!=', '<', '>', '<=', '>=', '&&', '||'] as const;

      for (const op of operators) {
        const node = NodeFactory.createBinaryExpression(op, left, right);
        expect(isBinaryExpression(node)).toBe(true);
        expect(node.operator).toBe(op);
        expect(node.left).toBe(left);
        expect(node.right).toBe(right);
      }
    });

    it('should create MethodCallExpression without target', () => {
      const args = [
        NodeFactory.createStringLiteral('arg1', '"arg1"'),
        NodeFactory.createNumberLiteral(42, '42'),
      ];
      const node = NodeFactory.createMethodCallExpression('doSomething', args);

      expect(isMethodCallExpression(node)).toBe(true);
      expect(node.methodName).toBe('doSomething');
      expect(node.target).toBeUndefined();
      expect(node.arguments).toHaveLength(2);
    });

    it('should create MethodCallExpression with target', () => {
      const target = NodeFactory.createIdentifier('obj');
      const args: never[] = [];
      const node = NodeFactory.createMethodCallExpression('method', args, target);

      expect(isMethodCallExpression(node)).toBe(true);
      expect(node.target).toBe(target);
    });

    it('should create MethodCallExpression with type arguments', () => {
      const typeArgs = [
        NodeFactory.createPrimitiveType('String'),
        NodeFactory.createPrimitiveType('Integer'),
      ];
      const node = NodeFactory.createMethodCallExpression(
        'genericMethod',
        [],
        undefined,
        typeArgs
      );

      expect(isMethodCallExpression(node)).toBe(true);
      expect(node.typeArguments).toHaveLength(2);
    });

    it('should create Identifier', () => {
      const node = NodeFactory.createIdentifier('myVariable');

      expect(isIdentifier(node)).toBe(true);
      expect(node.name).toBe('myVariable');
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

  describe('Type Nodes', () => {
    it('should create PrimitiveType', () => {
      const node = NodeFactory.createPrimitiveType('String');

      expect(isPrimitiveType(node)).toBe(true);
      expect(node.name).toBe('String');
    });

    it('should create ClassType without package', () => {
      const node = NodeFactory.createClassType('MyClass');

      expect(isClassType(node)).toBe(true);
      expect(node.name).toBe('MyClass');
      expect(node.packageName).toBeUndefined();
    });

    it('should create ClassType with package', () => {
      const node = NodeFactory.createClassType('MyClass', 'com.example');

      expect(isClassType(node)).toBe(true);
      expect(node.packageName).toBe('com.example');
    });
  });

  describe('Declaration Nodes', () => {
    it('should create VariableDeclaration without initializer', () => {
      const type = NodeFactory.createPrimitiveType('String');
      const node = NodeFactory.createVariableDeclaration('myVar', type);

      expect(isVariableDeclaration(node)).toBe(true);
      expect(node.name).toBe('myVar');
      expect(node.type).toBe(type);
      expect(node.initializer).toBeUndefined();
    });

    it('should create VariableDeclaration with initializer', () => {
      const type = NodeFactory.createPrimitiveType('String');
      const initializer = NodeFactory.createStringLiteral('value', '"value"');
      const node = NodeFactory.createVariableDeclaration('myVar', type, initializer);

      expect(isVariableDeclaration(node)).toBe(true);
      expect(node.initializer).toBe(initializer);
    });

    it('should create VariableDeclarationStatement', () => {
      const decl = NodeFactory.createVariableDeclaration(
        'x',
        NodeFactory.createPrimitiveType('Integer')
      );
      const node = NodeFactory.createVariableDeclarationStatement(decl);

      expect(node.kind).toBe('VariableDeclarationStatement');
      expect(node.declaration).toBe(decl);
    });
  });

  describe('Location Information', () => {
    it('should preserve location in all node types', () => {
      const location = {
        start: { line: 10, column: 5 },
        end: { line: 10, column: 15 },
      };

      const identifier = NodeFactory.createIdentifier('test', { location });
      expect(identifier.location).toEqual(location);

      const literal = NodeFactory.createStringLiteral('test', '"test"', { location });
      expect(literal.location).toEqual(location);

      const stmt = NodeFactory.createReturnStatement(undefined, { location });
      expect(stmt.location).toEqual(location);
    });
  });
});
