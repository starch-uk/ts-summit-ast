# TypeScript Port of Summit-AST

## Overview

This document outlines the plan for porting [Summit-AST](https://github.com/google/summit-ast) from Kotlin to TypeScript. Summit-AST is a library that defines an abstract syntax tree (AST) data structure to represent Salesforce Apex source code and provides translation of a parse tree into its AST representation.

## Project Goals

- Port the Kotlin-based Summit-AST library to TypeScript
- Maintain functional parity with the original implementation
- Provide a modern TypeScript/JavaScript API for working with Apex ASTs
- Support Node.js and browser environments
- Enable JSON serialization/deserialization of AST structures

## Original Project Analysis

### Key Components (from original Kotlin implementation)

1. **AST Data Structures**: Core node types representing Apex language constructs
2. **Parse Tree Translation**: Logic to convert parse trees to AST nodes (parser-agnostic)
3. **SummitTool**: CLI tool for processing Apex files and generating ASTs (requires external parser)
4. **JSON Serialization**: Ability to serialize ASTs to JSON format

### Technology Stack (Original)
- **Language**: Kotlin (96.2%)
- **Build System**: Bazel
- **Parser**: apex-parser (ANTLR4 grammar) - used internally but not required for TypeScript port
- **Dependencies**: Managed through Bazel

## TypeScript Port Architecture

### Technology Stack (Target)

- **Language**: TypeScript
- **Build System**: 
  - Primary: npm/pnpm with TypeScript compiler
  - Alternative: Consider esbuild or tsup for faster builds
- **Parser**: 
  - **No 3rd party runtime dependencies**: The library will accept parse trees from external sources
  - Parse trees must be provided by the consumer or generated externally
  - Focus on AST data structures and translation logic only
- **Package Manager**: npm or pnpm
- **Testing**: Jest or Vitest
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier

### Project Structure

```
ts-summit-ast/
├── src/
│   ├── ast/                    # AST node type definitions
│   │   ├── nodes/              # Individual AST node types
│   │   │   ├── Statement.ts
│   │   │   ├── Expression.ts
│   │   │   ├── Declaration.ts
│   │   │   └── ...
│   │   ├── base.ts             # Base AST node interface/class
│   │   └── index.ts
│   ├── translator/             # Parse tree to AST translation
│   │   ├── ParseTreeVisitor.ts
│   │   ├── NodeFactory.ts
│   │   └── index.ts
│   ├── parser/                 # Parse tree interface/utilities
│   │   ├── ParseTreeTypes.ts   # Type definitions for parse tree nodes
│   │   └── index.ts
│   ├── serialization/          # JSON serialization/deserialization
│   │   ├── JsonSerializer.ts
│   │   ├── JsonDeserializer.ts
│   │   └── index.ts
│   ├── tool/                   # CLI tool (SummitTool equivalent)
│   │   ├── SummitTool.ts
│   │   └── index.ts
│   └── index.ts                # Main entry point
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── fixtures/               # Test Apex files
├── docs/                       # Documentation
├── examples/                   # Usage examples
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── README.md
└── PLAN.md
```

## Implementation Phases

### Phase 1: Project Setup and Infrastructure

**Tasks:**
- [ ] Initialize npm/pnpm project
- [ ] Set up TypeScript configuration
- [ ] Configure build tooling (tsc, esbuild, or tsup)
- [ ] Set up testing framework (Jest/Vitest)
- [ ] Configure ESLint and Prettier
- [ ] Set up CI/CD (GitHub Actions)
- [ ] Create basic project structure
- [ ] Define parse tree interface/types (no runtime dependencies)

**Deliverables:**
- Working build system
- Test framework configured
- Basic project structure in place

### Phase 2: AST Data Structure Definitions

**Tasks:**
- [ ] Analyze original Kotlin AST node definitions
- [ ] Define base AST node interface/abstract class
- [ ] Port all AST node types to TypeScript:
  - [ ] Statement nodes (if, for, while, etc.)
  - [ ] Expression nodes (binary, unary, method calls, etc.)
  - [ ] Declaration nodes (class, method, variable, etc.)
  - [ ] Type nodes
  - [ ] Literal nodes
  - [ ] Modifier nodes
- [ ] Implement visitor pattern for AST traversal
- [ ] Add type guards and utility functions
- [ ] Write unit tests for each node type

**Deliverables:**
- Complete AST type definitions
- Type-safe AST node hierarchy
- Visitor pattern implementation
- Comprehensive unit tests

### Phase 3: Parse Tree Translation

**Tasks:**
- [ ] Study original Kotlin translation logic
- [ ] Define parse tree node interface/types (generic, parser-agnostic)
- [ ] Implement parse tree visitor interface
- [ ] Port translation logic for each AST node type:
  - [ ] Map parse tree nodes to AST nodes (parser-agnostic)
  - [ ] Handle context and position information
  - [ ] Preserve source location data
- [ ] Create adapter utilities for common parse tree formats
- [ ] Handle edge cases and error scenarios
- [ ] Write integration tests with mock parse trees

**Deliverables:**
- Working parse tree to AST translator (parser-agnostic)
- Generic parse tree interface
- Integration tests with sample parse tree structures
- Error handling for malformed input

### Phase 4: JSON Serialization

**Tasks:**
- [ ] Design JSON schema for AST serialization
- [ ] Implement JSON serializer
- [ ] Implement JSON deserializer
- [ ] Ensure round-trip compatibility (AST → JSON → AST)
- [ ] Write tests for serialization/deserialization
- [ ] Document JSON schema

**Deliverables:**
- JSON serialization/deserialization
- Schema documentation
- Round-trip tests

### Phase 5: CLI Tool (SummitTool)

**Tasks:**
- [ ] Port SummitTool functionality
- [ ] Implement file/directory traversal
- [ ] Add command-line argument parsing
- [ ] Support `.cls` and `.trigger` file extensions
- [ ] Note: CLI tool will require consumers to provide parse trees or use external parser
- [ ] Implement JSON output option
- [ ] Add error reporting
- [ ] Create executable entry point
- [ ] Document parser requirements/options for CLI usage

**Deliverables:**
- Working CLI tool (with parser integration instructions)
- Command-line interface matching original functionality
- Documentation for usage and parser setup

### Phase 6: Documentation and Polish

**Tasks:**
- [ ] Write comprehensive README
- [ ] Create API documentation (TypeDoc)
- [ ] Add usage examples
- [ ] Document migration notes from Kotlin version
- [ ] Performance optimization
- [ ] Code review and refactoring
- [ ] Final testing and validation

**Deliverables:**
- Complete documentation
- Optimized codebase
- Production-ready release

## Key Technical Considerations

### Parser-Agnostic Design

**Approach**: The library will be parser-agnostic and accept parse trees from external sources.

**Design Decisions:**
1. **No runtime parser dependencies**: Consumers must provide parse trees from their chosen parser
2. **Generic parse tree interface**: Define a minimal interface that any parse tree structure can implement
3. **Adapter pattern**: Provide utilities/adapters for common parse tree formats if needed
4. **Focus on AST**: Core value is in AST data structures and translation logic, not parsing

**Benefits:**
- Zero runtime dependencies
- Flexible integration with any parser
- Smaller bundle size
- Clear separation of concerns

### Type System Mapping

**Kotlin → TypeScript:**
- `sealed class` → `union types` or `discriminated unions`
- `data class` → `interface` or `type` with object literals
- `enum class` → `enum` or `const` with union types
- `nullable types` → `| null` or `| undefined`
- `generics` → TypeScript generics (similar)

### Source Location Tracking

**Requirement**: Preserve source location (line, column) information in AST nodes.

**Implementation**: Add `Location` or `SourceRange` interface to all AST nodes.

### Visitor Pattern

**Requirement**: Support AST traversal and transformation.

**Implementation**: 
- Define `ASTVisitor<T>` interface
- Implement accept methods on all nodes
- Provide default implementations for common traversal patterns

### Error Handling

**Approach**:
- Use TypeScript's type system for compile-time safety
- Throw descriptive errors for parse failures
- Provide error recovery where possible
- Include source location in error messages

## Testing Strategy

### Unit Tests
- Test each AST node type individually
- Test serialization/deserialization
- Test visitor pattern implementations
- Test utility functions

### Integration Tests
- Parse real Apex files from Salesforce projects
- Compare output with original Kotlin implementation
- Test edge cases and error scenarios
- Performance benchmarks

### Test Data
- Collect sample Apex files (`.cls`, `.trigger`)
- Create minimal test cases for each language construct
- Include malformed input for error handling tests

## Dependencies

### Runtime Dependencies
- **None**: Zero runtime dependencies for core library
- CLI tool may use Node.js built-in modules (fs, path) for file operations

### Dev Dependencies
- TypeScript
- Testing framework (Jest or Vitest)
- ESLint
- Prettier
- Build tool (esbuild, tsup, or tsc)
- TypeDoc (for documentation)

## Build and Distribution

### Build Output
- CommonJS (`lib/`)
- ES Modules (`esm/`)
- Type definitions (`lib/*.d.ts`)
- Potentially: Browser bundle

### Package.json Scripts
```json
{
  "scripts": {
    "build": "tsc && tsc --project tsconfig.esm.json",
    "test": "jest",
    "lint": "eslint src",
    "format": "prettier --write src",
    "docs": "typedoc src"
  }
}
```

## Migration Approach

### Incremental Development
1. Start with core AST types (Phase 2)
2. Build translation layer (Phase 3)
3. Add serialization (Phase 4)
4. Complete with CLI tool (Phase 5)

### Validation
- Compare AST output with original Kotlin version
- Use same test Apex files
- Verify JSON serialization matches original format (if compatible)

## Success Criteria

- [ ] All AST node types ported and tested
- [ ] Parse tree translation works for all Apex constructs
- [ ] JSON serialization/deserialization functional
- [ ] CLI tool matches original functionality
- [ ] Comprehensive test coverage (>80%)
- [ ] Full TypeScript type safety
- [ ] Documentation complete
- [ ] Performance comparable to original (or acceptable)

## Risks and Mitigations

### Risk 1: Parse Tree Interface Design
**Mitigation**: Design generic interface early, test with multiple parse tree formats, provide clear documentation

### Risk 2: Type System Differences
**Mitigation**: Careful mapping, extensive testing, type guards

### Risk 3: Performance Concerns
**Mitigation**: Benchmark early, optimize hot paths, consider WebAssembly if needed

### Risk 4: Maintaining Parity
**Mitigation**: Continuous comparison with original, shared test suite

## Timeline Estimate

- **Phase 1**: 1-2 weeks
- **Phase 2**: 3-4 weeks
- **Phase 3**: 4-6 weeks
- **Phase 4**: 2-3 weeks
- **Phase 5**: 2-3 weeks
- **Phase 6**: 2-3 weeks

**Total**: ~14-21 weeks (3.5-5 months) for a single developer

## Next Steps

1. Clone and study the original Kotlin repository
2. Set up TypeScript project infrastructure
3. Design parser-agnostic parse tree interface
4. Begin Phase 1 implementation

## References

- [Original Summit-AST Repository](https://github.com/google/summit-ast)
- [Salesforce Apex Language Reference](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/)
