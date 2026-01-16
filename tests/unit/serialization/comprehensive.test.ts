/**
 * Comprehensive serialization tests for all node types
 */

import { describe, it, expect } from 'vitest';
import { JsonSerializer, JsonDeserializer } from '../../../src/serialization/index.js';
import { NodeFactory } from '../../../src/translator/NodeFactory.js';
import {
  isForStatement,
  isWhileStatement,
  isBinaryExpression,
  isIdentifier,
  isClassType,
  isVariableDeclaration,
} from '../../../src/ast/type-guards.js';

describe('Comprehensive Serialization', () => {
  const serializer = new JsonSerializer();
  const deserializer = new JsonDeserializer();

  describe('All Statement Types', () => {
    it('should serialize and deserialize ForStatement', () => {
      const node = NodeFactory.createForStatement(
        NodeFactory.createBlock([]),
        NodeFactory.createExpressionStatement(NodeFactory.createIdentifier('i')),
        NodeFactory.createBooleanLiteral(true),
        NodeFactory.createIdentifier('i')
      );

      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(isForStatement(deserialized)).toBe(true);
    });

    it('should serialize and deserialize WhileStatement', () => {
      const node = NodeFactory.createWhileStatement(
        NodeFactory.createBooleanLiteral(true),
        NodeFactory.createBlock([])
      );

      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(isWhileStatement(deserialized)).toBe(true);
    });

    it('should serialize and deserialize ExpressionStatement', () => {
      const node = NodeFactory.createExpressionStatement(
        NodeFactory.createIdentifier('x')
      );

      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(deserialized.kind).toBe('ExpressionStatement');
    });

    it('should serialize and deserialize VariableDeclarationStatement', () => {
      const decl = NodeFactory.createVariableDeclaration(
        'x',
        NodeFactory.createPrimitiveType('Integer')
      );
      const node = NodeFactory.createVariableDeclarationStatement(decl);

      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(deserialized.kind).toBe('VariableDeclarationStatement');
    });
  });

  describe('All Expression Types', () => {
    it('should serialize and deserialize all binary operators', () => {
      const operators = ['+', '-', '*', '/', '%', '==', '!=', '<', '>', '<=', '>=', '&&', '||'] as const;
      const left = NodeFactory.createNumberLiteral(5, '5');
      const right = NodeFactory.createNumberLiteral(3, '3');

      for (const op of operators) {
        const node = NodeFactory.createBinaryExpression(op, left, right);
        const json = serializer.serialize(node);
        const deserialized = deserializer.deserialize(json);

        expect(isBinaryExpression(deserialized)).toBe(true);
        if (isBinaryExpression(deserialized)) {
          expect(deserialized.operator).toBe(op);
        }
      }
    });

    it('should serialize and deserialize MethodCallExpression with all properties', () => {
      const target = NodeFactory.createIdentifier('obj');
      const args = [
        NodeFactory.createStringLiteral('arg1', '"arg1"'),
        NodeFactory.createNumberLiteral(42, '42'),
      ];
      const typeArgs = [NodeFactory.createPrimitiveType('String')];
      const node = NodeFactory.createMethodCallExpression('method', args, target, typeArgs);

      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(deserialized.kind).toBe('MethodCallExpression');
    });
  });

  describe('All Type Types', () => {
    it('should serialize and deserialize ClassType', () => {
      const node = NodeFactory.createClassType('MyClass', 'com.example');

      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(isClassType(deserialized)).toBe(true);
      if (isClassType(deserialized)) {
        expect(deserialized.name).toBe('MyClass');
        expect(deserialized.packageName).toBe('com.example');
      }
    });

    it('should serialize and deserialize PrimitiveType', () => {
      const types = ['String', 'Integer', 'Boolean', 'Double', 'Object'];
      for (const typeName of types) {
        const node = NodeFactory.createPrimitiveType(typeName);
        const json = serializer.serialize(node);
        const deserialized = deserializer.deserialize(json);

        expect(deserialized.kind).toBe('PrimitiveType');
      }
    });
  });

  describe('All Declaration Types', () => {
    it('should serialize and deserialize VariableDeclaration with all properties', () => {
      const type = NodeFactory.createPrimitiveType('String');
      const initializer = NodeFactory.createStringLiteral('default', '"default"');
      const node = NodeFactory.createVariableDeclaration('var', type, initializer);

      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(isVariableDeclaration(deserialized)).toBe(true);
      if (isVariableDeclaration(deserialized)) {
        expect(deserialized.name).toBe('var');
        expect(deserialized.initializer).toBeDefined();
      }
    });
  });

  describe('Complex Nested Structures', () => {
    it('should serialize and deserialize deeply nested AST', () => {
      const nested = NodeFactory.createIfStatement(
        NodeFactory.createBinaryExpression(
          '>',
          NodeFactory.createIdentifier('x'),
          NodeFactory.createNumberLiteral(0, '0')
        ),
        NodeFactory.createBlock([
          NodeFactory.createIfStatement(
            NodeFactory.createBinaryExpression(
              '>',
              NodeFactory.createIdentifier('y'),
              NodeFactory.createNumberLiteral(0, '0')
            ),
            NodeFactory.createReturnStatement(
              NodeFactory.createStringLiteral('both positive', '"both positive"')
            )
          ),
        ])
      );

      const json = serializer.serialize(nested);
      const deserialized = deserializer.deserialize(json);

      expect(deserialized.kind).toBe('IfStatement');
    });

    it('should serialize and deserialize method call chain', () => {
      const chain = NodeFactory.createMethodCallExpression(
        'c',
        [],
        NodeFactory.createMethodCallExpression(
          'b',
          [],
          NodeFactory.createMethodCallExpression('a', [])
        )
      );

      const json = serializer.serialize(chain);
      const deserialized = deserializer.deserialize(json);

      expect(deserialized.kind).toBe('MethodCallExpression');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays', () => {
      const block = NodeFactory.createBlock([]);
      const json = serializer.serialize(block);
      const deserialized = deserializer.deserialize(json);

      expect(deserialized.kind).toBe('Block');
      if (deserialized.kind === 'Block') {
        expect(deserialized.statements).toHaveLength(0);
      }
    });

    it('should handle undefined optional properties', () => {
      const returnStmt = NodeFactory.createReturnStatement();
      const json = serializer.serialize(returnStmt);
      const parsed = JSON.parse(json);

      expect(parsed.expression).toBeUndefined();
    });

    it('should preserve location in all node types', () => {
      const location = {
        start: { line: 10, column: 5 },
        end: { line: 10, column: 15 },
      };

      const node = NodeFactory.createIdentifier('test', { location });
      const json = serializer.serialize(node);
      const deserialized = deserializer.deserialize(json);

      expect(deserialized.location).toEqual(location);
    });
  });
});
