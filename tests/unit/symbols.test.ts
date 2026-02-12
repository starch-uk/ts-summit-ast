/**
 * @file Unit tests for symbol resolution (ClassResolver, SummitResolver).
 * Ports qualified name assertions from:
 * - ClassDeclarationTest.kt (innerTypes_have_enclosingType)
 * - MethodDeclarationTest.kt (method_translation_hasMethodDeclaration, methodReturningVoid)
 * - InterfaceDeclarationTest.kt (method qualified names - ClassResolver only resolves classes)
 */

import { describe, expect, it } from 'vitest';
import { parseAndTranslate } from '../../src/utils/apexParser.js';
import { parseApexSource } from '../../src/parser/index.js';
import { ASTTranslator } from '../../src/translator/astTranslator.js';
import { resolve, resolveClassesAndMethods } from '../../src/symbols/index.js';

describe('Symbol Resolution', () => {
  it('should resolve classes and methods from a compilation unit', () => {
    const ast = parseAndTranslate('tests/fixtures/upstream/mixednodes.cls');
    expect(ast['@type']).toBe('CompilationUnit');

    const classMap = resolveClassesAndMethods([ast]);
    expect(classMap.size).toBeGreaterThan(0);

    const mainClass = classMap.get('Main');
    expect(mainClass).toBeDefined();
    expect(mainClass!.classDeclaration.name).toBe('Main');
    expect(mainClass!.methodDeclarations.length).toBeGreaterThan(0);
  });

  it('should handle nested class qualified names', () => {
    const source = `
      public class Outer {
        public class Inner {
          public void innerMethod() {}
        }
      }
    `;
    const parseTree = parseApexSource(source);
    const result = new ASTTranslator().translate(parseTree!);
    expect(result.ast).toBeDefined();

    const classMap = resolveClassesAndMethods([result.ast!]);
    expect(classMap.has('Outer')).toBe(true);
    expect(classMap.has('Outer.Inner')).toBe(true);
    expect(classMap.get('Outer.Inner')!.methodDeclarations).toHaveLength(1);
  });

  // Ported from ClassDeclarationTest.innerTypes_have_enclosingType
  // Original: assertThat(enclosingClassDecl.qualifiedName).isEqualTo("EnclosingClass")
  //          assertThat(innerClassDecl.qualifiedName).isEqualTo("EnclosingClass.InnerClass")
  // ClassResolver only resolves classes (not interfaces/enums)
  it('should resolve EnclosingClass and EnclosingClass.InnerClass qualified names', () => {
    const source = `
      class EnclosingClass {
        class InnerClass { }
        interface InnerInterface { }
        enum InnerEnum { }
      }
    `;
    const parseTree = parseApexSource(source);
    const result = new ASTTranslator().translate(parseTree!);
    expect(result.ast).toBeDefined();

    const classMap = resolveClassesAndMethods([result.ast!]);
    expect(classMap.has('EnclosingClass')).toBe(true);
    expect(classMap.has('EnclosingClass.InnerClass')).toBe(true);
    expect(classMap.get('EnclosingClass')!.classDeclaration.name).toBe('EnclosingClass');
    expect(classMap.get('EnclosingClass.InnerClass')!.classDeclaration.name).toBe('InnerClass');
  });

  // Ported from MethodDeclarationTest.method_translation_hasMethodDeclaration
  // Original: assertThat(methodDecl.qualifiedName).isEqualTo("Test.doNothing")
  it('should resolve method Test.doNothing in class', () => {
    const source = 'class Test { String doNothing(String [] input) { return input[0]; } }';
    const parseTree = parseApexSource(source);
    const result = new ASTTranslator().translate(parseTree!);
    expect(result.ast).toBeDefined();

    const classMap = resolveClassesAndMethods([result.ast!]);
    const testClass = classMap.get('Test');
    expect(testClass).toBeDefined();
    const doNothingMethod = testClass!.methodDeclarations.find((m) => m.name === 'doNothing');
    expect(doNothingMethod).toBeDefined();
    expect(doNothingMethod!.name).toBe('doNothing');
  });

  // Ported from MethodDeclarationTest.voidMethodWithoutParameters_translates_correctly
  // Original: method in class Test { void doNothing() { } } - qualified name Test.doNothing
  it('should resolve void method Test.doNothing in class', () => {
    const source = 'class Test { void doNothing() { } }';
    const parseTree = parseApexSource(source);
    const result = new ASTTranslator().translate(parseTree!);
    expect(result.ast).toBeDefined();

    const classMap = resolveClassesAndMethods([result.ast!]);
    const testClass = classMap.get('Test');
    expect(testClass).toBeDefined();
    const doNothingMethod = testClass!.methodDeclarations.find((m) => m.name === 'doNothing');
    expect(doNothingMethod).toBeDefined();
  });

  // ClassResolver throws when duplicate class definitions are found (upstream behavior)
  it('should throw when duplicate class definitions are found', () => {
    const source1 = 'class Duplicate { void foo() {} }';
    const source2 = 'class Duplicate { void bar() {} }';
    const parseTree1 = parseApexSource(source1);
    const parseTree2 = parseApexSource(source2);
    const result1 = new ASTTranslator().translate(parseTree1!);
    const result2 = new ASTTranslator().translate(parseTree2!);
    expect(result1.ast).toBeDefined();
    expect(result2.ast).toBeDefined();

    expect(() => resolveClassesAndMethods([result1.ast!, result2.ast!])).toThrow(
      /Found \(at least\) two class definitions for Duplicate/
    );
  });

  // SummitResolver.resolve runs without throwing (integration smoke test)
  it('should run SummitResolver.resolve without throwing', () => {
    const ast = parseAndTranslate('tests/fixtures/upstream/mixednodes.cls');
    expect(() => resolve([ast])).not.toThrow();
  });
});
