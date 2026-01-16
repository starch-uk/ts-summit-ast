# JSON Schema for AST Serialization

This document describes the JSON schema used for serializing and deserializing AST nodes.

## Overview

The JSON representation of AST nodes follows a consistent structure:
- Every node has a `kind` property indicating its type
- Optional `location` property for source location information
- Node-specific properties based on the node type

## Common Properties

### `kind` (required)
A string identifying the node type. Examples: `"IfStatement"`, `"BinaryExpression"`, `"Identifier"`, etc.

### `location` (optional)
Source location information:
```json
{
  "start": {
    "line": 10,
    "column": 5,
    "offset": 150
  },
  "end": {
    "line": 10,
    "column": 15,
    "offset": 160
  }
}
```

## Node Types

### Statement Nodes

#### IfStatement
```json
{
  "kind": "IfStatement",
  "condition": { /* Expression */ },
  "thenBody": { /* Statement */ },
  "elseBody": { /* Statement */ }  // optional
}
```

#### ForStatement
```json
{
  "kind": "ForStatement",
  "init": { /* Statement */ },      // optional
  "condition": { /* Expression */ }, // optional
  "update": { /* Expression */ },    // optional
  "body": { /* Statement */ }
}
```

#### WhileStatement
```json
{
  "kind": "WhileStatement",
  "condition": { /* Expression */ },
  "body": { /* Statement */ }
}
```

#### ReturnStatement
```json
{
  "kind": "ReturnStatement",
  "expression": { /* Expression */ }  // optional
}
```

#### Block
```json
{
  "kind": "Block",
  "statements": [
    { /* Statement */ },
    { /* Statement */ }
  ]
}
```

#### ExpressionStatement
```json
{
  "kind": "ExpressionStatement",
  "expression": { /* Expression */ }
}
```

#### VariableDeclarationStatement
```json
{
  "kind": "VariableDeclarationStatement",
  "declaration": { /* VariableDeclaration */ }
}
```

### Expression Nodes

#### BinaryExpression
```json
{
  "kind": "BinaryExpression",
  "operator": "+",  // or "-", "*", "/", "==", "!=", "<", ">", "&&", "||", etc.
  "left": { /* Expression */ },
  "right": { /* Expression */ }
}
```

#### MethodCallExpression
```json
{
  "kind": "MethodCallExpression",
  "methodName": "doSomething",
  "target": { /* Expression */ },  // optional
  "arguments": [
    { /* Expression */ },
    { /* Expression */ }
  ],
  "typeArguments": [  // optional
    { /* Type */ }
  ]
}
```

#### Identifier
```json
{
  "kind": "Identifier",
  "name": "variableName"
}
```

### Literal Nodes

#### StringLiteral
```json
{
  "kind": "StringLiteral",
  "value": "hello world",
  "raw": "\"hello world\""
}
```

#### NumberLiteral
```json
{
  "kind": "NumberLiteral",
  "value": 42,
  "raw": "42"
}
```

#### BooleanLiteral
```json
{
  "kind": "BooleanLiteral",
  "value": true
}
```

#### NullLiteral
```json
{
  "kind": "NullLiteral"
}
```

### Type Nodes

#### PrimitiveType
```json
{
  "kind": "PrimitiveType",
  "name": "String"  // or "Integer", "Boolean", "Double", etc.
}
```

#### ClassType
```json
{
  "kind": "ClassType",
  "name": "MyClass",
  "packageName": "com.example"  // optional
}
```

### Declaration Nodes

#### VariableDeclaration
```json
{
  "kind": "VariableDeclaration",
  "name": "myVariable",
  "type": { /* Type */ },
  "initializer": { /* Expression */ },  // optional
  "modifiers": [  // optional
    { /* Modifier */ }
  ]
}
```

### Modifier Node

#### Modifier
```json
{
  "kind": "Modifier",
  "keyword": "public"  // or "private", "static", "final", etc.
}
```

## Example: Complete AST

```json
{
  "kind": "IfStatement",
  "location": {
    "start": { "line": 10, "column": 5 },
    "end": { "line": 12, "column": 1 }
  },
  "condition": {
    "kind": "BinaryExpression",
    "operator": ">",
    "left": {
      "kind": "Identifier",
      "name": "x"
    },
    "right": {
      "kind": "NumberLiteral",
      "value": 0,
      "raw": "0"
    }
  },
  "thenBody": {
    "kind": "Block",
    "statements": [
      {
        "kind": "ReturnStatement",
        "expression": {
          "kind": "StringLiteral",
          "value": "positive",
          "raw": "\"positive\""
        }
      }
    ]
  },
  "elseBody": {
    "kind": "ReturnStatement",
    "expression": {
      "kind": "StringLiteral",
      "value": "non-positive",
      "raw": "\"non-positive\""
    }
  }
}
```

## Usage

### Serialization

```typescript
import { JsonSerializer } from 'ts-summit-ast';

const serializer = new JsonSerializer();
const jsonString = serializer.serialize(astNode);
```

### Deserialization

```typescript
import { JsonDeserializer } from 'ts-summit-ast';

const deserializer = new JsonDeserializer();
const astNode = deserializer.deserialize(jsonString);
```

## Round-Trip Compatibility

The serializer and deserializer are designed to maintain round-trip compatibility:
- AST → JSON → AST should produce equivalent AST nodes
- Location information is preserved (if included)
- All node properties are preserved

## Notes

- The JSON schema is extensible - unknown node types will attempt to serialize all properties
- Arrays of AST nodes are automatically serialized recursively
- Optional properties are omitted from JSON when undefined
- The `raw` property in literals preserves the original source representation
