# ts-summit-ast

TypeScript port of [Summit-AST](https://github.com/google/summit-ast) - an abstract syntax tree (AST) data structure to represent Salesforce Apex source code.

## Overview

This library provides:
- **AST node type definitions** for Apex language constructs
- **Parser-agnostic translation** from parse trees to AST nodes
- **JSON serialization/deserialization** of AST structures
- **Zero runtime dependencies** - works with any parser that provides parse trees

## Installation

```bash
npm install ts-summit-ast
```

## Features

- ✅ Complete AST type definitions for Apex language constructs
- ✅ **Built-in Apex parser** - Direct parsing of Apex source code to AST
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
- ✅ **ApexDoc parsing** - Parse ApexDoc comments into structured AST
- ✅ **Rule matching** - XPath-like pattern matching for AST nodes
- ✅ **Node metadata** - Comprehensive node information and path tracking
- ✅ **AST validation** - Validate AST structure and compare AST nodes
- ✅ **CLI tool** - Command-line interface for processing Apex files

## Usage

### Basic Example

#### Using Built-in Parser (Recommended)

```typescript
import { parseApexCode } from 'ts-summit-ast';

// Parse Apex source code directly to AST
const sourceCode = `
  public class Test {
    public void method() {
      if (x > 0) {
        return "positive";
      }
    }
  }
`;

const result = parseApexCode(sourceCode, {
  includeLocation: true,
  includeComments: true,
});

if (result.ast) {
  console.log('AST kind:', result.ast.kind);
  // Output: AST kind: ClassDeclaration
}

if (result.errors.length > 0) {
  console.error('Parse errors:', result.errors);
}
```

#### Using Parse Tree Translation (Parser-Agnostic)

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

// Create an identifier (helper node)
const identifier = NodeFactory.createIdentifier('myVariable');

// Create a variable expression (for variable references in expressions)
const varExpr = NodeFactory.createVariableExpression(identifier);

// Create a binary expression
const left = NodeFactory.createIntegerVal(5, '5');
const right = NodeFactory.createIntegerVal(3, '3');
const binaryExpr = NodeFactory.createBinaryExpression('+', left, right);

// Create an if statement
const condition = NodeFactory.createBooleanVal(true);
const thenBody = NodeFactory.createReturnStatement(
  NodeFactory.createStringVal('success', '"success"')
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

### ApexDoc Parsing

```typescript
import { parseApexDocComment, parseApexCode, extractComments } from 'ts-summit-ast';

// Parse ApexDoc comment directly
const apexDoc = `
  /**
   * This is a test method.
   * @param value The value to test
   * @return True if successful
   */
`;

const docAst = parseApexDocComment(apexDoc); // location is optional
if (docAst) {
  console.log('Description:', docAst.description);
  console.log('Params:', docAst.params);
  console.log('Return:', docAst.returns);
}

// Or extract and parse ApexDoc comments from source code
const result = parseApexCode(sourceCode, {
  includeComments: true,
});

if (result.ast) {
  const comments = extractComments(result.ast, sourceCode, {
    parseApexDoc: true, // Parse ApexDoc comments into AST
    associateNodes: true, // Associate comments with their nodes
  });
  
  for (const comment of comments) {
    if (comment.apexDoc) {
      console.log('ApexDoc:', comment.apexDoc);
    }
  }
}
```

### AST Validation

```typescript
import { validateAST, compareASTs, getASTStatistics } from 'ts-summit-ast';

// Validate AST structure
const validation = validateAST(ast);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  console.warn('Warnings:', validation.warnings);
}

// Compare two ASTs
const comparison = compareASTs(ast1, ast2);
console.log('Are equal:', comparison.equal);
if (!comparison.equal) {
  console.log('Differences:', comparison.differences);
}

// Get AST statistics
const stats = getASTStatistics(ast);
console.log('Total nodes:', stats.totalNodes);
console.log('Node counts:', stats.nodeCounts);
console.log('Depth:', stats.maxDepth);
```

### Batch Processing

```typescript
import { parseMultipleFiles, extractCommentsBatch } from 'ts-summit-ast';

// Parse multiple source files
const sources = [
  'public class Class1 { }',
  'public class Class2 { }',
  'public class Class3 { }',
];

const results = parseMultipleFiles(sources, {
  includeLocation: true,
});

// Extract comments from multiple files
const commentResults = extractCommentsBatch(
  sources.map((s) => ({ source: s, ast: parseApexCode(s).ast! })),
  {
    associateNodes: true,
  }
);
```

### Command Line Interface

```bash
# Process a single file
npx summit-tool path/to/file.cls

# Process a directory
npx summit-tool path/to/directory --json

# Output JSON with location information
npx summit-tool path/to/file.cls --json --include-location

# Verbose output
npx summit-tool path/to/file.cls --verbose
```

## API Reference

### Core Types

- **ASTNode** - Base interface for all AST nodes
- **Statement** - Statement node types (If, ForLoop, WhileLoop, Return, etc.)
- **Expression** - Expression node types (Binary, Call, VariableExpression, etc.)
- **Declaration** - Declaration node types (Class, Method, Variable, etc.)
- **TypeRef** - Type reference data structure (not a node type - used for type information)
- **Literal** - Literal node types (StringVal, IntegerVal, DoubleVal, LongVal, DecimalVal, BooleanVal, NullVal)
- **Identifier** - Helper node type (not an expression - used within other nodes)

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
- `getParentNode(node, root)` - Get parent node of a given node
- `getChildNodesByType(ast, nodeType)` - Find all child nodes of a specific type
- `findNodesByType(ast, nodeType)` - Find all nodes of a specific type

#### Apex Parsing

- `parseApexCode(source, options)` - Parse Apex source code to AST
- `parseApexSource(source)` - Parse Apex source code to parse tree
- `parseMultipleFiles(sources, options)` - Parse multiple source files

#### ApexDoc Parsing

- `parseApexDocComment(comment, location, options)` - Parse ApexDoc comment to structured AST

#### AST Validation

- `validateAST(ast)` - Validate AST structure
- `compareASTs(ast1, ast2)` - Compare two ASTs for equality
- `getASTStatistics(ast)` - Get statistics about AST structure

#### Batch Processing

- `parseMultipleFiles(sources, options)` - Parse multiple source files
- `extractCommentsBatch(fileData, options)` - Extract comments from multiple files

## Command Line Tool

The library includes a CLI tool (`summit-tool`) for processing Apex files from the command line.

### Installation

The CLI tool is available when you install the package:

```bash
npm install ts-summit-ast
```

Or use it directly with npx:

```bash
npx summit-tool [options] <file-or-directory>
```

### Usage

```bash
# Process a single file
npx summit-tool path/to/file.cls

# Process a directory recursively
npx summit-tool path/to/directory

# Output as JSON
npx summit-tool path/to/file.cls --json

# Include location information
npx summit-tool path/to/file.cls --json --include-location

# Verbose output
npx summit-tool path/to/file.cls --verbose
```

### Options

- `--json` - Output results as JSON
- `--include-location` - Include source location information in output
- `--verbose` - Enable verbose output
- `--help` - Show help message

### Programmatic Usage

You can also use the SummitTool class programmatically:

```typescript
import { SummitTool } from 'ts-summit-ast';

const tool = new SummitTool({
  json: true,
  includeLocation: true,
  verbose: false,
});

// Process a file
const result = await tool.processFile('path/to/file.cls');

// Process a directory
const results = await tool.processDirectory('path/to/directory');
```

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
- npm or pnpm

### Setup

```bash
npm install
# or
pnpm install
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

Run tests with coverage:

```bash
npm run test:coverage
```

**Test Status**: 675 tests passing across 14 test files

### Code Quality

This project maintains high code quality standards with:

- **Strict TypeScript compliance** - Full type safety with strict compiler options
- **Comprehensive ESLint rules** - All TypeScript ESLint recommended, strict, and type-checked rules enabled
- **JSDoc documentation** - Complete JSDoc coverage with strict validation
- **Explicit null/undefined handling** - Uses strict boolean expressions and nullish coalescing for robustness
- **Zero lint errors** - All code passes strict linting rules

### Lint

```bash
npm run lint
```

Fix linting issues automatically:

```bash
npm run lint:fix
```

The project uses:
- **TypeScript ESLint** - All recommended, strict, stylistic, and type-checked rules
- **JSDoc ESLint** - Comprehensive JSDoc validation and documentation requirements
- **Import/Export linting** - Ensures proper module organization
- **Code style rules** - Consistent formatting and naming conventions

### Type Checking

```bash
npm run typecheck
```

Runs TypeScript compiler in check-only mode to verify type safety without generating output.

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

All public APIs are fully documented with JSDoc comments, including:
- Function/method descriptions
- Parameter documentation with types and descriptions
- Return value documentation
- Thrown error documentation
- Template type parameters
- File-level overview comments

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
│   ├── tool/             # CLI tool
│   │   ├── SummitTool.ts
│   │   └── cli.ts
│   ├── utils/            # Utility functions
│   │   ├── apex-parser.ts
│   │   ├── apexdoc-parser.ts
│   │   ├── ast-validation.ts
│   │   ├── comment-utils.ts
│   │   ├── node-finder.ts
│   │   ├── rule-matching.ts
│   │   ├── source-extraction.ts
│   │   └── traversal.ts
│   └── index.ts          # Main entry point
├── tests/
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── docs/                 # Documentation
│   └── json-schema.md    # JSON schema documentation
└── README.md
```

## Key Design Decisions

- **Parser-agnostic**: Works with any parser that provides parse trees. Includes built-in parser for convenience.
- **Zero runtime dependencies**: Core library has no external runtime dependencies.
- **Type-safe**: Full TypeScript type safety throughout with discriminated unions and strict compiler options.
- **Immutable**: AST nodes are immutable (readonly properties).
- **Extensible**: Easy to add new node types or extend existing ones.
- **Robust error handling**: Explicit null/undefined checks and strict boolean expressions throughout.
- **Comprehensive documentation**: Full JSDoc coverage with strict validation for all public APIs.
- **High code quality**: Strict linting rules, comprehensive test coverage (675 tests), and zero lint errors.

## Supported AST Node Types

### Statements
- IfStatement, ForLoopStatement, EnhancedForLoopStatement, WhileLoopStatement, DoWhileLoopStatement
- SwitchStatement, TryStatement
- ReturnStatement, BreakStatement, ContinueStatement, ThrowStatement
- CompoundStatement, ExpressionStatement, VariableDeclarationStatement

### Expressions
- BinaryExpression, UnaryExpression, AssignExpression
- CallExpression, FieldExpression, ArrayExpression
- NewExpression, CastExpression, InstanceOfExpression, TernaryExpression
- LambdaExpression, VariableExpression, ThisExpression, SuperExpression
- ParenthesizedExpression
- SoqlExpression, SoslExpression
- TriggerContextVariableExpression

### Literals
- StringVal, IntegerVal, DoubleVal, LongVal, DecimalVal, BooleanVal, NullVal, CharacterLiteral

### Types
- **TypeRef** - Data structure (not a node type) for type references with components and array nesting

### Declarations
- ClassDeclaration, InterfaceDeclaration, MethodDeclaration (with isConstructor flag for constructors)
- VariableDeclaration, PropertyDeclaration, EnumDeclaration
- EnumValue (not a declaration type - used within EnumDeclaration)

## JSON Schema

See [docs/json-schema.md](./docs/json-schema.md) for complete JSON schema documentation.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

When contributing, please ensure:

1. **All tests pass**: Run `npm test` before submitting
2. **No lint errors**: Run `npm run lint` and fix any issues
3. **Type checking passes**: Run `npm run typecheck` to verify type safety
4. **Code is formatted**: Run `npm run format` to ensure consistent formatting
5. **JSDoc is complete**: All public functions, methods, and classes must have complete JSDoc documentation
6. **Follow strict TypeScript practices**: Use explicit null checks, nullish coalescing, and strict boolean expressions

### Code Quality Standards

- Use explicit null/undefined checks instead of truthy/falsy checks
- Use nullish coalescing (`??`) instead of logical OR (`||`) for default values
- Use strict boolean expressions (explicit comparisons) in conditionals
- Avoid variable shadowing
- Prefer destructuring for array/object access
- Complete JSDoc documentation for all public APIs

## License

Apache-2.0

## References

- [Original Summit-AST Repository](https://github.com/google/summit-ast)
- [Salesforce Apex Language Reference](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/)

## Acknowledgments

This project is a TypeScript port of the original Kotlin-based Summit-AST library by Google.
