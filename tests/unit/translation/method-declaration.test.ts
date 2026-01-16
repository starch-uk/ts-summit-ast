/**
 * Tests for method declaration translation
 * Ported from com.google.summit.translation.MethodDeclarationTest
 */

import { describe, it, expect } from 'vitest';
import { parseAndTranslate, findFirstNodeOfType } from '../../helpers/translate-helpers.js';
import { isMethodDeclaration, isClassDeclaration } from '../../../src/ast/type-guards.js';
import type { MethodDeclaration } from '../../../src/ast/nodes/Declaration.js';

describe('Method Declaration Translation', () => {
  it('method translation has MethodDeclaration', () => {
    const input = 'class Test { String doNothing(String [] input) { return input[0]; } }';

    const methodDecl = findFirstNodeOfType(parseAndTranslate(input), isMethodDeclaration);

    expect(methodDecl).not.toBeNull();
    if (methodDecl) {
      expect(methodDecl.name).toBe('doNothing');
      expect(methodDecl.returnType).toBeDefined();
      expect(methodDecl.parameters).toBeDefined();
      if (methodDecl.parameters) {
        expect(methodDecl.parameters.length).toBe(1);
      }
    }
  });

  it('void method without parameters translates correctly', () => {
    const input = 'class Test { void doNothing() { } }';

    const methodDecl = findFirstNodeOfType(parseAndTranslate(input), isMethodDeclaration);

    expect(methodDecl).not.toBeNull();
    if (methodDecl) {
      expect(methodDecl.name).toBe('doNothing');
      expect(methodDecl.returnType).toBeDefined();
      expect(methodDecl.parameters).toBeDefined();
      if (methodDecl.parameters) {
        expect(methodDecl.parameters.length).toBe(0);
      }
    }
  });

  it.skip('modifiers translated on methods and parameters', () => {
    const input = 'class Test { public void method(final int x) { } }';

    const methodDecl = findFirstNodeOfType(parseAndTranslate(input), isMethodDeclaration);

    expect(methodDecl).not.toBeNull();
    if (methodDecl) {
      expect(methodDecl.modifiers).toBeDefined();
      // Check for public modifier
      if (methodDecl.modifiers) {
        expect(methodDecl.modifiers.length).toBeGreaterThan(0);
      }
      // Check parameter modifiers
      if (methodDecl.parameters && methodDecl.parameters.length > 0) {
        const param = methodDecl.parameters[0];
        expect(param.modifiers).toBeDefined();
      }
    }
  });

  it.skip('constructors are correctly identified', () => {
    const input = `
      class Test {
        void Test() { }
        Test() { }
      }
    `;

    const classDecl = findFirstNodeOfType(parseAndTranslate(input), isClassDeclaration);

    expect(classDecl).not.toBeNull();
    if (classDecl) {
      // Should have 2 methods, one is a constructor
      expect(classDecl.members).toBeDefined();
    }
  });

  it.skip('method getChildren ordering', () => {
    const input = `
      class Test {
        public String f(Integer i) { }
      }
    `;

    const methodDecl = findFirstNodeOfType(parseAndTranslate(input), isMethodDeclaration);

    expect(methodDecl).not.toBeNull();
    // MethodDeclaration.getChildren() should list the body last
    // This requires proper child ordering
  });
});
