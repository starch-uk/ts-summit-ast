/**
 * @file SummitResolver - Resolves symbols in Summit ASTs.
 * Port of com.google.summit.symbols.SummitResolver.
 */

import type { CompilationUnit } from '../ast/declaration.js';
import { resolveClassesAndMethods, type ClassSymbol } from './classResolver.js';

/** If true, resolve() will print debugging information. */
const PRINT_DEBUG = false;

const SORT_INDEX_KEY = 0;

/**
 * Prints all classes and their methods (debug output).
 * @param classMap - Map from qualified class name to ClassSymbol.
 */
function printClassesAndMethods(
  /* eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- classMap is not mutated. */
  classMap: ReadonlyMap<string, ClassSymbol>
): void {
  const sorted = [...classMap.entries()].sort(
    (a: readonly [string, ClassSymbol], b: readonly [string, ClassSymbol]) =>
      a[SORT_INDEX_KEY].localeCompare(b[SORT_INDEX_KEY])
  );

  for (const [, symbol] of sorted) {
    const { classDeclaration, methodDeclarations } = symbol;
    const className = typeof classDeclaration.name === 'string' ? classDeclaration.name : 'Unknown';
    console.log(`\nClass: ${className}`);

    const methodsByQualified = new Map<string, (typeof methodDeclarations)[number]>();
    for (const m of methodDeclarations) {
      const methodName = typeof m.name === 'string' ? m.name : 'Unknown';
      methodsByQualified.set(`${className}.${methodName}`, m);
    }

    const methodEntries = [...methodsByQualified.entries()].sort(
      (
        a: readonly [string, (typeof methodDeclarations)[number]],
        b: readonly [string, (typeof methodDeclarations)[number]]
      ) => a[SORT_INDEX_KEY].localeCompare(b[SORT_INDEX_KEY])
    );
    for (const [qn, methodDecl] of methodEntries) {
      const paramsList = methodDecl.parameters ?? [];
      const params = paramsList
        /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- debug output; p.type/p.name may be omitted. */
        .map((p) => `${p.type != null ? 'TypeRef' : '?'} ${p.name ?? '?'}`)
        .join(', ');
      const isCtor = methodDecl.isConstructor === true;
      /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- debug output. */
      const returnPart = isCtor ? '' : `: ${methodDecl.returnType != null ? 'TypeRef' : '?'}`;
      console.log(`* ${qn}(${params})${returnPart}`);
    }
  }
}

/**
 * Resolves symbols in a list of compilation units.
 * @param allAsts - List of CompilationUnit ASTs to resolve.
 */
export function resolve(allAsts: readonly CompilationUnit[]): void {
  const classMap = resolveClassesAndMethods(allAsts);
  /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- debug flag may be toggled at build time. */
  if (PRINT_DEBUG) {
    printClassesAndMethods(classMap);
  }
}

export type { ClassSymbol };
