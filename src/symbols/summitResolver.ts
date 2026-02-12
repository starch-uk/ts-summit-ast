/**
 * @file SummitResolver - Resolves symbols in Summit ASTs.
 * Port of com.google.summit.symbols.SummitResolver.
 */

import type { CompilationUnit } from '../ast/declaration.js';
import { resolveClassesAndMethods, type ClassSymbol } from './classResolver.js';

/** If true, resolve() will print debugging information. */
const PRINT_DEBUG = false;

/**
 * Resolves symbols in a list of compilation units.
 * @param allAsts - List of CompilationUnit ASTs to resolve.
 */
export function resolve(allAsts: readonly CompilationUnit[]): void {
  const classMap = resolveClassesAndMethods(allAsts);

  if (PRINT_DEBUG) {
    printClassesAndMethods(classMap);
  }
}

/**
 * Prints all classes and their methods (debug output).
 */
function printClassesAndMethods(classMap: Map<string, ClassSymbol>): void {
  const sorted = [...classMap.entries()].sort(([a], [b]) => a.localeCompare(b));

  for (const [, symbol] of sorted) {
    const { classDeclaration, methodDeclarations } = symbol;
    const className = classDeclaration.name ?? 'Unknown';
    console.log(`\nClass: ${className}`);

    const methodsByQualified = new Map<string, (typeof methodDeclarations)[number]>();
    for (const m of methodDeclarations) {
      const qn = `${className}.${m.name ?? 'Unknown'}`;
      methodsByQualified.set(qn, m);
    }

    for (const [qn, methodDecl] of [...methodsByQualified.entries()].sort(([a], [b]) =>
      a.localeCompare(b)
    )) {
      const params =
        methodDecl.parameters
          ?.map((p) => `${p.type ? 'TypeRef' : '?'} ${p.name ?? '?'}`)
          .join(', ') ?? '';
      const returnPart = methodDecl.isConstructor
        ? ''
        : `: ${methodDecl.returnType ? 'TypeRef' : '?'}`;
      console.log(`* ${qn}(${params})${returnPart}`);
    }
  }
}

export type { ClassSymbol };
