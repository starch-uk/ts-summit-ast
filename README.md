# ts-summit-ast

TypeScript port of [Summit-AST](https://github.com/google/summit-ast) - an abstract syntax tree (AST) data structure to represent Salesforce Apex source code.

## Overview

This library provides:
- **AST node type definitions** for Apex language constructs
- **Parser-agnostic translation** from parse trees to AST nodes
- **JSON serialization/deserialization** of AST structures
- **Zero runtime dependencies** - works with any parser that provides parse trees

## Status

🚧 **Work in Progress** - Core functionality is implemented and tested. This is an active port from the original Kotlin implementation.

## Installation

```bash
npm install ts-summit-ast
```

## Features

- ✅ Complete AST type definitions for Apex language constructs
- ✅ Parser-agnostic parse tree interface
- ✅ AST translation from parse trees
- ✅ JSON serialization/deserialization
- ✅ Full TypeScript type safety
- ✅ Zero runtime dependencies
- ✅ Source location tracking
- ✅ Visitor pattern support
- ✅ **Position-to-node mapping** - Find AST nodes at specific source positions
- ✅ **Source code extraction** - Extract source text from AST nodes
- ✅ **Comment-to-node mapping** - Map comments to associated AST nodes
- ✅ **Rule matching** - XPath-like pattern matching for AST nodes
- ✅ **Node metadata** - Comprehensive node information and path tracking

## Usage

### Basic Example

```typescript
import { ASTTranslator, NodeFactory } from 'ts-summit-ast';
import type { ParseTreeNode } from 'ts-summit-ast';

// Create a parse tree (from your parser of choice)
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

// Translate to AST
const translator = new ASTTranslator();
const result = translator.translate(parseTree);

if (result.ast) {
  console.log('AST kind:', result.ast.kind);
  // Output: AST kind: IfStatement
}
```

### Creating AST Nodes Directly

```typescript
import { NodeFactory } from 'ts-summit-ast';

// Create an identifier
const identifier = NodeFactory.createIdentifier('myVariable');

// Create a binary expression
const left = NodeFactory.createNumberLiteral(5, '5');
const right = NodeFactory.createNumberLiteral(3, '3');
const binaryExpr = NodeFactory.createBinaryExpression('+', left, right);

// Create an if statement
const condition = NodeFactory.createBooleanLiteral(true);
const thenBody = NodeFactory.createReturnStatement(
  NodeFactory.createStringLiteral('success', '"success"')
);
const ifStmt = NodeFactory.createIfStatement(condition, thenBody);
```

### JSON Serialization

```typescript
import { JsonSerializer, JsonDeserializer } from 'ts-summit-ast';

// Serialize AST to JSON
const serializer = new JsonSerializer();
const jsonString = serializer.serialize(astNode);

// Deserialize JSON back to AST
const deserializer = new JsonDeserializer();
const astNode = deserializer.deserialize(jsonString);

// Round-trip compatibility is maintained
```

### Type Guards

```typescript
import { isIfStatement, isBinaryExpression, isIdentifier } from 'ts-summit-ast';

if (isIfStatement(node)) {
  console.log('Condition:', node.condition);
  console.log('Then body:', node.thenBody);
}

if (isBinaryExpression(node)) {
  console.log('Operator:', node.operator);
  console.log('Left:', node.left);
  console.log('Right:', node.right);
}
```

### Position-to-Node Mapping

```typescript
import { findNodeAtPosition, getSourceText } from 'ts-summit-ast';

// Find node at specific position
const position = { line: 5, column: 20 };
const result = findNodeAtPosition(ast, position);

if (result) {
  console.log('Node type:', result.nodeType);
  console.log('Location:', result.location);
  
  // Extract source code for the node
  const codeText = getSourceText(result.node, sourceCode);
  console.log('Code:', codeText);
}
```

### Comment-to-Node Mapping

```typescript
import { extractComments, findAssociatedNode } from 'ts-summit-ast';

// Extract all comments with associated nodes
const comments = extractComments(ast, sourceCode, {
  associateNodes: true,
});

for (const comment of comments) {
  if (comment.associatedNode) {
    console.log(`Comment "${comment.text}" applies to: ${comment.associatedNode.kind}`);
  }
}
```

### Rule Matching

```typescript
import { wouldTriggerRule, findRuleMatches } from 'ts-summit-ast';

// Check if a node matches a rule pattern
const xpath = "//BinaryExpression[@operator='+']";
const result = wouldTriggerRule(node, xpath);

if (result.matches) {
  console.log('Node matches rule pattern');
}

// Find all nodes matching a pattern
const matches = findRuleMatches(ast, xpath);
console.log(`Found ${matches.length} matches`);
```

### AST Traversal

```typescript
import { walkAST } from 'ts-summit-ast';

// Walk AST with custom visitor
walkAST(ast, {
  enterNode: (node) => {
    console.log('Entering:', node.kind);
    // Return false to skip children
  },
  exitNode: (node) => {
    console.log('Exiting:', node.kind);
  },
});
```

### Visitor Pattern

```typescript
import { ASTVisitor, DefaultVisitor } from 'ts-summit-ast';

class MyVisitor extends DefaultVisitor {
  visit(node: ASTNode): void {
    console.log('Visiting:', node.kind);
    super.visit(node);
  }
}

const visitor = new MyVisitor();
// Traverse AST with visitor
```

## API Reference

### Core Types

- **ASTNode** - Base interface for all AST nodes
- **Statement** - Statement node types (If, For, While, Return, etc.)
- **Expression** - Expression node types (Binary, MethodCall, Identifier, etc.)
- **Declaration** - Declaration node types (Class, Method, Variable, etc.)
- **Type** - Type node types (Primitive, Class, Array, etc.)
- **Literal** - Literal node types (String, Number, Boolean, Null)

### Main Classes

#### ASTTranslator

Translates parse trees to AST nodes.

```typescript
const translator = new ASTTranslator({
  includeLocation: true,
  continueOnError: false,
});

const result = translator.translate(parseTree);
// result.ast - The translated AST node
// result.errors - Array of translation errors
```

#### JsonSerializer

Serializes AST nodes to JSON.

```typescript
const serializer = new JsonSerializer({
  includeLocation: true,
  compact: false,
});

const json = serializer.serialize(astNode);
```

#### JsonDeserializer

Deserializes JSON to AST nodes.

```typescript
const deserializer = new JsonDeserializer({
  validate: true,
});

const astNode = deserializer.deserialize(jsonString);
```

#### NodeFactory

Factory methods for creating AST nodes.

```typescript
// Create various node types
NodeFactory.createIdentifier(name, options);
NodeFactory.createIfStatement(condition, thenBody, elseBody, options);
NodeFactory.createBinaryExpression(operator, left, right, options);
// ... and many more
```

### Utility Functions

#### Position and Node Finding

- `findNodeAtPosition(ast, position, options)` - Find node at specific position
- `findNodesInRange(ast, range, options)` - Find all nodes in a range
- `getSourceText(node, source, options)` - Extract source code text
- `getSourceRange(node)` - Get source location range

#### Comment Mapping

- `extractComments(ast, source, options)` - Extract all comments with node associations
- `findAssociatedNode(ast, comment, source, options)` - Find node associated with a comment

#### Rule Matching

- `wouldTriggerRule(node, xpathExpression, options)` - Check if node matches rule
- `findRuleMatches(ast, xpathExpression, options)` - Find all matching nodes

#### Node Information

- `getNodePath(node, root)` - Get path from root to node
- `getNodeMetadata(node, source?)` - Get comprehensive node metadata
- `walkAST(ast, visitor)` - Walk AST with visitor pattern
- `isNodeType(node, nodeType)` - Type guard for specific node type

## Parser Integration

Since this library is parser-agnostic, you need to provide parse trees from your chosen parser. The parse tree must conform to the `ParseTreeNode` interface:

```typescript
interface ParseTreeNode {
  readonly type: string;
  readonly location?: SourceRange;
  readonly text?: string;
  readonly children?: ParseTreeNode[];
  readonly [key: string]: unknown;
}
```

### Example: Integrating with a Parser

```typescript
import { ASTTranslator } from 'ts-summit-ast';
// import { YourParser } from 'your-parser-library';

// Parse source code with your parser
// const parseTree = yourParser.parse(sourceCode);

// Adapt to ParseTreeNode format if needed
const adaptedTree: ParseTreeNode = {
  type: parseTree.nodeType,
  children: parseTree.children?.map(adaptNode),
  // ... other properties
};

// Translate to AST
const translator = new ASTTranslator();
const result = translator.translate(adaptedTree);
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

This generates:
- CommonJS output in `lib/`
- ES Modules output in `esm/`
- Type definitions in `lib/*.d.ts`

### Test

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with UI:

```bash
npm run test:ui
```

### Lint

```bash
npm run lint
```

Fix linting issues:

```bash
npm run lint:fix
```

### Format

```bash
npm run format
```

Check formatting:

```bash
npm run format:check
```

### Documentation

Generate API documentation:

```bash
npm run docs
```

## Project Structure

```
ts-summit-ast/
├── src/
│   ├── ast/              # AST node type definitions
│   │   ├── nodes/        # Individual node types
│   │   ├── base.ts       # Base interfaces
│   │   ├── visitor.ts    # Visitor pattern
│   │   └── type-guards.ts
│   ├── parser/           # Parser-agnostic interfaces
│   │   └── ParseTreeTypes.ts
│   ├── translator/       # Parse tree to AST translation
│   │   ├── ASTTranslator.ts
│   │   ├── NodeFactory.ts
│   │   └── ParseTreeVisitor.ts
│   ├── serialization/    # JSON serialization
│   │   ├── JsonSerializer.ts
│   │   └── JsonDeserializer.ts
│   └── index.ts          # Main entry point
├── tests/
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── docs/                 # Documentation
│   └── json-schema.md    # JSON schema documentation
└── README.md
```

## Key Design Decisions

- **Parser-agnostic**: No runtime parser dependencies. Consumers provide parse trees from their chosen parser.
- **Zero runtime dependencies**: Core library has no external runtime dependencies.
- **Type-safe**: Full TypeScript type safety throughout with discriminated unions.
- **Immutable**: AST nodes are immutable (readonly properties).
- **Extensible**: Easy to add new node types or extend existing ones.

## Supported AST Node Types

### Statements
- IfStatement, ForStatement, ForEachStatement, WhileStatement, DoWhileStatement
- SwitchStatement, TryStatement
- ReturnStatement, BreakStatement, ContinueStatement, ThrowStatement
- Block, ExpressionStatement, VariableDeclarationStatement

### Expressions
- BinaryExpression, UnaryExpression, AssignmentExpression
- MethodCallExpression, FieldAccessExpression, ArrayAccessExpression
- NewExpression, CastExpression, InstanceOfExpression, TernaryExpression
- LambdaExpression, Identifier, ThisExpression, SuperExpression
- ParenthesizedExpression

### Literals
- StringLiteral, NumberLiteral, BooleanLiteral, NullLiteral, CharacterLiteral

### Types
- PrimitiveType, ClassType, InterfaceType, ArrayType, GenericType, VoidType, WildcardType

### Declarations
- ClassDeclaration, InterfaceDeclaration, MethodDeclaration, ConstructorDeclaration
- VariableDeclaration, PropertyDeclaration, EnumDeclaration, AnnotationDeclaration

## JSON Schema

See [docs/json-schema.md](./docs/json-schema.md) for complete JSON schema documentation.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Apache-2.0

## References

- [Original Summit-AST Repository](https://github.com/google/summit-ast)
- [Salesforce Apex Language Reference](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/)

## Acknowledgments

This project is a TypeScript port of the original Kotlin-based Summit-AST library by Google.
