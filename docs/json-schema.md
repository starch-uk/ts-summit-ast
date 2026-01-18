# JSON Schema for AST Serialization

This document describes the JSON schema used for serializing and deserializing AST nodes.

## Overview

The JSON representation of AST nodes follows a consistent structure:
- Every node has an `@type` property indicating its type (matching summit-ast format)
- Optional `location` property for source location information
- Node-specific properties based on the node type

## Common Properties

### `@type` (required)
A string identifying the node type. Examples: `"IfStatement"`, `"CallExpression"`, `"StringVal"`, etc.

**Note**: This field is named `@type` to match the original summit-ast JSON format. The deserializer also supports `kind` for backward compatibility.

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
  "@type": "IfStatement",
  "condition": { /* Expression */ },
  "thenStatement": { /* Statement */ },
  "elseStatement": { /* Statement */ }  // optional
}
```

#### ForLoopStatement
```json
{
  "@type": "ForLoopStatement",
  "init": { /* Statement */ },      // optional
  "condition": { /* Expression */ }, // optional
  "update": { /* Expression */ },    // optional
  "body": { /* Statement */ }
}
```

#### WhileLoopStatement
```json
{
  "@type": "WhileLoopStatement",
  "condition": { /* Expression */ },
  "body": { /* Statement */ }
}
```

#### ReturnStatement
```json
{
  "@type": "ReturnStatement",
  "expression": { /* Expression */ }  // optional
}
```

#### CompoundStatement
```json
{
  "@type": "CompoundStatement",
  "statements": [
    { /* Statement */ },
    { /* Statement */ }
  ]
}
```

#### ExpressionStatement
```json
{
  "@type": "ExpressionStatement",
  "expression": { /* Expression */ }
}
```

#### VariableDeclarationStatement
```json
{
  "@type": "VariableDeclarationStatement",
  "declaration": { /* VariableDeclaration */ }
}
```

### Expression Nodes

#### BinaryExpression
```json
{
  "@type": "BinaryExpression",
  "operator": "+",  // or "-", "*", "/", "==", "!=", "<", ">", "&&", "||", etc.
  "left": { /* Expression */ },
  "right": { /* Expression */ }
}
```

#### CallExpression
```json
{
  "@type": "CallExpression",
  "methodName": "doSomething",
  "target": { /* Expression */ },  // optional
  "arguments": [
    { /* Expression */ },
    { /* Expression */ }
  ],
  "typeArguments": [  // optional (TypeRef data structures, not node types)
    { /* TypeRef */ }
  ]
}
```

#### VariableExpression
```json
{
  "@type": "VariableExpression",
  "id": { /* Identifier */ }
}
```

#### Identifier
```json
{
  "@type": "Identifier",
  "name": "variableName"
}
```
**Note**: Identifier is a helper node type, not an expression type. Use VariableExpression for variable references in expressions.

### Literal Nodes

#### StringVal
```json
{
  "@type": "StringVal",
  "value": "hello world",
  "raw": "\"hello world\""
}
```

#### IntegerVal
```json
{
  "@type": "IntegerVal",
  "value": 42,
  "raw": "42"
}
```

#### DoubleVal
```json
{
  "@type": "DoubleVal",
  "value": 3.14,
  "raw": "3.14"
}
```

#### LongVal
```json
{
  "@type": "LongVal",
  "value": 123,
  "raw": "123L"
}
```

#### DecimalVal
```json
{
  "@type": "DecimalVal",
  "value": 123.45,
  "raw": "123.45d"
}
```

#### BooleanVal
```json
{
  "@type": "BooleanVal",
  "value": true
}
```

#### NullVal
```json
{
  "@type": "NullVal"
}
```

### Type References

**Note**: TypeRef is a data structure (not a node type), so it does NOT have an `@type` field.

#### TypeRef
```json
{
  "components": [
    {
      "id": { /* Identifier */ },
      "args": [ /* TypeRef[] */ ]  // optional type arguments
    }
  ],
  "arrayNesting": 0  // number of array dimensions
}
```

Example:
```json
{
  "components": [
    {
      "id": { "@type": "Identifier", "name": "List" },
      "args": [
        {
          "components": [{ "id": { "@type": "Identifier", "name": "String" }, "args": [] }],
          "arrayNesting": 0
        }
      ]
    }
  ],
  "arrayNesting": 1
}
```
This represents `List<String>[]`.

### Declaration Nodes

#### VariableDeclaration
```json
{
  "@type": "VariableDeclaration",
  "name": "myVariable",
  "type": { /* TypeRef */ },  // TypeRef data structure, not a node type
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
  "@type": "Modifier",
  "keyword": "public"  // or "private", "static", "final", etc.
}
```

## Example: Complete AST

```json
{
  "@type": "IfStatement",
  "location": {
    "start": { "line": 10, "column": 5 },
    "end": { "line": 12, "column": 1 }
  },
  "condition": {
    "@type": "BinaryExpression",
    "operator": ">",
    "left": {
      "@type": "VariableExpression",
      "id": {
        "@type": "Identifier",
        "name": "x"
      }
    },
    "right": {
      "@type": "IntegerVal",
      "value": 0,
      "raw": "0"
    }
  },
  "thenStatement": {
    "@type": "CompoundStatement",
    "statements": [
      {
        "@type": "ReturnStatement",
        "expression": {
          "@type": "StringVal",
          "value": "positive",
          "raw": "\"positive\""
        }
      }
    ]
  },
  "elseStatement": {
    "@type": "ReturnStatement",
    "expression": {
      "@type": "StringVal",
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
