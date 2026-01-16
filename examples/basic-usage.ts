/**
 * Basic usage examples for ts-summit-ast
 */

import { NodeFactory, ASTTranslator, JsonSerializer, JsonDeserializer } from '../src/index.js';
import type { ParseTreeNode } from '../src/index.js';

// Example 1: Creating AST nodes directly
console.log('=== Example 1: Creating AST Nodes ===');

const identifier = NodeFactory.createIdentifier('myVariable');
console.log('Identifier:', identifier);

const numberLiteral = NodeFactory.createNumberLiteral(42, '42');
console.log('Number literal:', numberLiteral);

const binaryExpr = NodeFactory.createBinaryExpression(
  '+',
  NodeFactory.createNumberLiteral(5, '5'),
  NodeFactory.createNumberLiteral(3, '3')
);
console.log('Binary expression:', binaryExpr);

// Example 2: Creating a simple if statement
console.log('\n=== Example 2: Creating If Statement ===');

const condition = NodeFactory.createBooleanLiteral(true);
const thenBody = NodeFactory.createReturnStatement(
  NodeFactory.createStringLiteral('success', '"success"')
);
const ifStmt = NodeFactory.createIfStatement(condition, thenBody);
console.log('If statement:', ifStmt);

// Example 3: Translating from parse tree
console.log('\n=== Example 3: Translating Parse Tree ===');

const parseTree: ParseTreeNode = {
  type: 'if_statement',
  condition: {
    type: 'binary_expression',
    operator: '>',
    left: { type: 'identifier', text: 'x' },
    right: { type: 'number_literal', text: '0' },
  },
  thenBody: {
    type: 'return_statement',
    expression: { type: 'string_literal', text: '"positive"' },
  },
};

const translator = new ASTTranslator();
const result = translator.translate(parseTree);

if (result.ast) {
  console.log('Translated AST kind:', result.ast.kind);
} else {
  console.log('Translation errors:', result.errors);
}

// Example 4: JSON serialization
console.log('\n=== Example 4: JSON Serialization ===');

const serializer = new JsonSerializer({ compact: false });
const json = serializer.serialize(ifStmt);
console.log('JSON:', json);

// Example 5: JSON deserialization
console.log('\n=== Example 5: JSON Deserialization ===');

const deserializer = new JsonDeserializer();
const deserialized = deserializer.deserialize(json);
console.log('Deserialized AST kind:', deserialized.kind);

// Example 6: Round-trip test
console.log('\n=== Example 6: Round-Trip Test ===');

const original = NodeFactory.createMethodCallExpression(
  'doSomething',
  [
    NodeFactory.createStringLiteral('arg1', '"arg1"'),
    NodeFactory.createNumberLiteral(42, '42'),
  ]
);

const serialized = serializer.serialize(original);
const roundTrip = deserializer.deserialize(serialized);

console.log('Original kind:', original.kind);
console.log('Round-trip kind:', roundTrip.kind);
console.log('Match:', original.kind === roundTrip.kind);
