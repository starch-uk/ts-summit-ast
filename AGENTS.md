# AGENTS.md — ts-summit-ast

TypeScript port of [google/summit-ast](https://github.com/google/summit-ast). We maintain output compatibility with the original Kotlin library and pass all equivalent unit tests, while extending functionality (ApexDoc parsing, exact source positioning, comment mapping, rule matching, etc.).

## Mandatory Workflow

**Every change must pass all five gates in order.** Do not skip steps.

```
pnpm format        → reformat all touched files
pnpm typecheck     → zero errors on any .ts change
pnpm lint          → zero problems (warnings + errors) on any .ts change
pnpm test:coverage → 100% coverage, all tests green
pnpm test:mutation → mutation testing passes (Stryker + Vitest)
```

### Lint Rules — No Workarounds

Fix lint problems by complying with the rule's intent:

- **Never** edit ESLint/TSConfig to weaken rules.
- **Never** use inline disable comments (`// eslint-disable-next-line`).
- **Never** use `Readonly<T>` — it is a shallow mapped type and will not satisfy the strict readonly rules. Make properties genuinely `readonly` at the declaration.
- If a rule flags something, change the code to satisfy the rule properly.

### Coverage — No Dead Code

Target is 100% line, branch, and function coverage.

- Prefer **removing unreachable code** over adding tests for it.
- If a coverage gap looks like it could be legitimate, run mutation testing (`pnpm test:mutation`, or a scoped run) on the uncovered branch to confirm it is actually reachable and worth testing.
- Do not add `istanbul ignore` comments.

### Mutation testing (Stryker)

[Mutation testing](https://stryker-mutator.io/docs/stryker-js/introduction/) is used to check test quality: Stryker mutates production code and expects tests to fail. Use it to validate that uncovered or borderline code is actually testable and worth covering.

- **Command:** `pnpm test:mutation`
- **Config:** `stryker.config.json` (Vitest runner via `@stryker-mutator/vitest-runner`, mutates `src/**/*.ts`, `coverageAnalysis: perTest`).
- **Dry run:** `pnpm test:mutation --dryRunOnly` to verify setup without running mutations.
- **Report:** HTML report at `reports/mutation/mutation.html`.

Mandatory: every change must pass mutation testing before merge.

## Reference Implementation

Clone the original for comparison when needed:

```bash
git clone https://github.com/google/summit-ast.git /tmp/summit-ast
```

Use it to verify output compatibility. Our AST JSON output for equivalent Apex input must match the original's structure. All original unit test scenarios must pass in our port.

## Project Structure

```
src/
├── ast/            # Node type definitions, base interfaces (baseNode, declaration, statement, expression, literal, apexDoc, initializer)
├── guard/          # Type guards (literalGuard, docGuard, initGuard, declarationGuard, statementGuard, expressionGuard)
├── parser/         # Parse tree types, lexer, Apex parser (parseTree, apexParser, apexLexer, declarationParser, expressionParser, statementParser)
├── translator/     # ASTTranslator, NodeFactory, declaration/statement/expression factories and translators
├── serialization/  # JsonSerializer, JsonDeserializer, ast/declaration/expression (de)serializers
├── symbols/        # Symbol resolution (summitResolver, classResolver)
├── tool/           # CLI (summitTool, cli)
├── utils/          # Utility modules:
│   ├── apexParser.ts      # Built-in Apex→AST parser
│   ├── apexdocParser.ts   # ApexDoc comment→structured AST
│   ├── astValidation.ts   # Validate/compare ASTs
│   ├── commentUtils.ts   # Comment extraction & node association
│   ├── declarationUtils.ts
│   ├── nodeFinder.ts     # Position→node lookup
│   ├── ruleMatching.ts   # XPath-like pattern matching
│   ├── sourceExtraction.ts  # Source text from AST nodes
│   └── traversal.ts     # walkAST, node path/metadata
├── constants.ts
└── index.ts        # Public API surface
tests/
├── unit/           # Unit tests (*.test.ts)
├── integration/    # Integration tests
├── fixtures/       # Test fixtures (e.g. fixtures/upstream/*.cls, *.json)
└── translateHelpers.ts
```

## Key Architecture Decisions

- **Parser-agnostic core.** The translator works with any parser via the `ParseTreeNode` interface. The built-in Apex parser is a convenience layer.
- **Zero runtime dependencies.**
- **Immutable nodes.** All AST node properties are `readonly`.
- **Discriminated unions.** Node types use a `kind` discriminant. Use the provided type guards (`isIfStatement`, `isBinaryExpression`, etc.) rather than casting.
- **TypeRef is a data structure, not a node.** It carries type information but does not appear in the AST node hierarchy.
- **Identifier is a helper node.** It is not an expression — it is used within other nodes.

## Node Categories

| Category | Examples |
|---|---|
| Statements | `IfStatement`, `ForLoopStatement`, `WhileLoopStatement`, `SwitchStatement`, `TryStatement`, `ReturnStatement`, `CompoundStatement`, `ExpressionStatement`, `VariableDeclarationStatement` |
| Expressions | `BinaryExpression`, `CallExpression`, `FieldExpression`, `NewExpression`, `CastExpression`, `TernaryExpression`, `LambdaExpression`, `VariableExpression`, `SoqlExpression`, `SoslExpression` |
| Literals | `StringVal`, `IntegerVal`, `DoubleVal`, `LongVal`, `DecimalVal`, `BooleanVal`, `NullVal` |
| Declarations | `ClassDeclaration`, `InterfaceDeclaration`, `MethodDeclaration`, `VariableDeclaration`, `PropertyDeclaration`, `EnumDeclaration` |

## Common Tasks

### Adding a new AST node type

1. Define the interface in `src/ast/nodes/`, extending the appropriate base.
2. Add a type guard in `src/ast/type-guards.ts`.
3. Add a factory method in `src/translator/NodeFactory.ts`.
4. Add translation logic in `src/translator/ASTTranslator.ts`.
5. Update `src/serialization/` for round-trip JSON support.
6. Export from `src/index.ts`.
7. Add unit tests covering creation, translation, serialization, and type guard.

### Modifying the translator

Any change to `ASTTranslator` must preserve compatibility with the original summit-ast output. Compare against the reference repo's test fixtures.

### Working with source positions

Location data flows through `SourceRange` objects on nodes when `includeLocation: true`. The `node-finder` and `source-extraction` utilities depend on accurate location data — test position edge cases (start of file, end of file, multi-line nodes).

## Testing Conventions

- Unit tests live next to what they test: `tests/unit/` mirrors `src/`.
- Integration tests in `tests/integration/` exercise end-to-end parse→AST→JSON flows.
- Use descriptive test names that state the expected behaviour.
- Test error/edge cases, not just happy paths.
- 675+ tests currently; new features must include proportional test coverage.
- Mutation testing: Stryker + Vitest (`pnpm test:mutation`); config in `stryker.config.json`.

## Build Outputs

```bash
pnpm build
```

Produces CommonJS in `lib/`, ESM in `esm/`, and type declarations in `lib/*.d.ts`.