/**
 * Tests for JSON serialization and deserialization
 */

import { describe, it, expect } from 'vitest';
import { JsonSerializer, JsonDeserializer } from '../../../src/serialization/index.js';
import { NodeFactory } from '../../../src/translator/NodeFactory.js';
import {
  isIdentifier,
  isStringLiteral,
  isNumberLiteral,
  isBooleanLiteral,
  isNullLiteral,
  isBinaryExpression,
  isMethodCallExpression,
  isIfStatement,
  isReturnStatement,
  isBlock,
} from '../../../src/ast/type-guards.js';

describe('JSON Serialization', () => {
  const serializer = new JsonSerializer();
  const deserializer = new JsonDeserializer();

  describe('Expression serialization', () => {
    it('should serialize and deserialize identifier', () => {
      const node = NodeFactory.createIdentifier('testVar');
      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(isIdentifier(deserialized)).toBe(true);
      if (isIdentifier(deserialized)) {
        expect(deserialized.name).toBe('testVar');
      }
    });

    it('should serialize and deserialize string literal', () => {
      const node = NodeFactory.createStringLiteral('hello', '"hello"');
      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(isStringLiteral(deserialized)).toBe(true);
      if (isStringLiteral(deserialized)) {
        expect(deserialized.value).toBe('hello');
        expect(deserialized.raw).toBe('"hello"');
      }
    });

    it('should serialize and deserialize number literal', () => {
      const node = NodeFactory.createNumberLiteral(42, '42');
      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(isNumberLiteral(deserialized)).toBe(true);
      if (isNumberLiteral(deserialized)) {
        expect(deserialized.value).toBe(42);
        expect(deserialized.raw).toBe('42');
      }
    });

    it('should serialize and deserialize boolean literal', () => {
      const node = NodeFactory.createBooleanLiteral(true);
      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(isBooleanLiteral(deserialized)).toBe(true);
      if (isBooleanLiteral(deserialized)) {
        expect(deserialized.value).toBe(true);
      }
    });

    it('should serialize and deserialize null literal', () => {
      const node = NodeFactory.createNullLiteral();
      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(isNullLiteral(deserialized)).toBe(true);
    });

    it('should serialize and deserialize binary expression', () => {
      const left = NodeFactory.createNumberLiteral(5, '5');
      const right = NodeFactory.createNumberLiteral(3, '3');
      const node = NodeFactory.createBinaryExpression('+', left, right);
      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(isBinaryExpression(deserialized)).toBe(true);
      if (isBinaryExpression(deserialized)) {
        expect(deserialized.operator).toBe('+');
      }
    });

    it('should serialize and deserialize method call', () => {
      const arg1 = NodeFactory.createStringLiteral('arg1', '"arg1"');
      const arg2 = NodeFactory.createNumberLiteral(42, '42');
      const node = NodeFactory.createMethodCallExpression('doSomething', [arg1, arg2]);
      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(isMethodCallExpression(deserialized)).toBe(true);
      if (isMethodCallExpression(deserialized)) {
        expect(deserialized.methodName).toBe('doSomething');
        expect(deserialized.arguments).toHaveLength(2);
      }
    });
  });

  describe('Statement serialization', () => {
    it('should serialize and deserialize return statement', () => {
      const expr = NodeFactory.createNumberLiteral(42, '42');
      const node = NodeFactory.createReturnStatement(expr);
      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(isReturnStatement(deserialized)).toBe(true);
      if (isReturnStatement(deserialized)) {
        expect(deserialized.expression).toBeDefined();
      }
    });

    it('should serialize and deserialize return statement without expression', () => {
      const node = NodeFactory.createReturnStatement();
      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(isReturnStatement(deserialized)).toBe(true);
      if (isReturnStatement(deserialized)) {
        expect(deserialized.expression).toBeUndefined();
      }
    });

    it('should serialize and deserialize if statement', () => {
      const condition = NodeFactory.createBooleanLiteral(true);
      const thenBody = NodeFactory.createReturnStatement(
        NodeFactory.createNumberLiteral(1, '1')
      );
      const elseBody = NodeFactory.createReturnStatement(
        NodeFactory.createNumberLiteral(0, '0')
      );
      const node = NodeFactory.createIfStatement(condition, thenBody, elseBody);
      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(isIfStatement(deserialized)).toBe(true);
      if (isIfStatement(deserialized)) {
        expect(deserialized.condition).toBeDefined();
        expect(deserialized.thenBody).toBeDefined();
        expect(deserialized.elseBody).toBeDefined();
      }
    });

    it('should serialize and deserialize block', () => {
      const stmt1 = NodeFactory.createReturnStatement(
        NodeFactory.createNumberLiteral(1, '1')
      );
      const stmt2 = NodeFactory.createReturnStatement(
        NodeFactory.createNumberLiteral(2, '2')
      );
      const node = NodeFactory.createBlock([stmt1, stmt2]);
      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(isBlock(deserialized)).toBe(true);
      if (isBlock(deserialized)) {
        expect(deserialized.statements).toHaveLength(2);
      }
    });
  });

  describe('Round-trip compatibility', () => {
    it('should maintain round-trip compatibility for complex AST', () => {
      // Create a complex AST structure
      const condition = NodeFactory.createBinaryExpression(
        '+',
        NodeFactory.createNumberLiteral(5, '5'),
        NodeFactory.createNumberLiteral(3, '3')
      );
      const thenBody = NodeFactory.createBlock([
        NodeFactory.createReturnStatement(NodeFactory.createStringLiteral('success', '"success"')),
      ]);
      const ifStmt = NodeFactory.createIfStatement(condition, thenBody);

      // Serialize and deserialize
      const json = serializer.serialize(ifStmt);
      const deserialized = deserializer.deserialize(json);

      // Verify structure is maintained
      expect(isIfStatement(deserialized)).toBe(true);
      if (isIfStatement(deserialized)) {
        expect(isBinaryExpression(deserialized.condition)).toBe(true);
        expect(isBlock(deserialized.thenBody)).toBe(true);
      }
    });
  });

  describe('Location preservation', () => {
    it('should preserve location information', () => {
      const location = {
        start: { line: 10, column: 5 },
        end: { line: 10, column: 15 },
      };
      const node = NodeFactory.createIdentifier('test', { location });
      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(deserialized.location).toBeDefined();
      expect(deserialized.location?.start.line).toBe(10);
      expect(deserialized.location?.start.column).toBe(5);
    });

    it('should work without location information', () => {
      const node = NodeFactory.createIdentifier('test');
      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(deserialized).toBeDefined();
      // Location is optional, so undefined is fine
    });
  });

  describe('Serialization options', () => {
    it('should support compact format', () => {
      const node = NodeFactory.createIdentifier('test');
      const compactSerializer = new JsonSerializer({ compact: true });
      const json = compactSerializer.serialize(node);

      // Compact format should not have newlines
      expect(json).not.toContain('\n');
    });

    it('should support excluding location', () => {
      const location = {
        start: { line: 10, column: 5 },
        end: { line: 10, column: 15 },
      };
      const node = NodeFactory.createIdentifier('test', { location });
      const noLocationSerializer = new JsonSerializer({ includeLocation: false });
      const json = noLocationSerializer.serialize(node);
      const parsed = JSON.parse(json);

      expect(parsed.location).toBeUndefined();
    });
  });
});
