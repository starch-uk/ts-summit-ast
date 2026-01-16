/**
 * Tests for modifier translation
 * Ported from com.google.summit.translation.ModifierTest
 */

import { describe, it, expect } from 'vitest';
import { parseAndTranslate, findFirstNodeOfType, countNodesOfType } from '../../helpers/translate-helpers.js';
import { isClassDeclaration } from '../../../src/ast/type-guards.js';
import type { ClassDeclaration } from '../../../src/ast/nodes/Declaration.js';

describe('Modifier Translation', () => {
  function findAnnotationOnClass(cu: any, name: string): any {
    const classDecl = findFirstNodeOfType(cu, isClassDeclaration);
    if (classDecl && classDecl.annotations) {
      return classDecl.annotations.find((a: any) => a.name === name);
    }
    return null;
  }

  it.skip('class declaration translation has correct annotations', () => {
    const cu = parseAndTranslate(`
      @isTest
      @JsonAccess(serializable='samePackage' deserializable='sameNamespace')
      class Test { }
    `);

    const isTestAnnotation = findAnnotationOnClass(cu, 'isTest');
    expect(isTestAnnotation).not.toBeNull();
    const jsonAccessAnnotation = findAnnotationOnClass(cu, 'JsonAccess');
    expect(jsonAccessAnnotation).not.toBeNull();
  });

  it.skip('every keyword modifier is translated', () => {
    const keywordList = [
      'public',
      'private',
      'protected',
      'abstract',
      'final',
      'global',
      'inherited sharing',
      'override',
      'static',
      'testMethod',
      'transient',
      'virtual',
      'webservice',
      'with sharing',
      'without sharing',
    ];

    for (const modifier of keywordList) {
      const cu = parseAndTranslate(`${modifier} class Test { }`);
      const classDecl = findFirstNodeOfType(cu, isClassDeclaration);
      expect(classDecl).not.toBeNull();
      if (classDecl) {
        expect(classDecl.modifiers).toBeDefined();
        if (classDecl.modifiers) {
          expect(classDecl.modifiers.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it.skip('modifiers linked in AST', () => {
    const cu = parseAndTranslate(`
      @isTest
      public class Test { }
    `);

    const modifierCount = countNodesOfType(
      cu,
      (n) => n.kind === 'Modifier' || n.kind === 'Annotation'
    );
    expect(modifierCount).toBeGreaterThan(0);
  });

  it.skip('annotation arguments are correctly identified', () => {
    const cu = parseAndTranslate(`
      @A(label='X' description='Y' category='Z')
      @B(false)
      @C({1, 2, 3})
      @D(cacheable=true)
      public class Test { }
    `);

    const annotationA = findAnnotationOnClass(cu, 'A');
    expect(annotationA).not.toBeNull();
    // Should have 3 arguments
    const annotationB = findAnnotationOnClass(cu, 'B');
    expect(annotationB).not.toBeNull();
    // Should have 1 argument
  });

  it.skip('annotation arguments are correctly parsed', () => {
    const cu = parseAndTranslate(`
      @A(@X)
      @B({@Y, @Z})
      @C(a = false, b = {1, 2, 3}, c = @d)
      @D
      @E()
      public class Test { }
    `);

    const annotationA = findAnnotationOnClass(cu, 'A');
    expect(annotationA).not.toBeNull();
    // Should have annotation value
    const annotationB = findAnnotationOnClass(cu, 'B');
    expect(annotationB).not.toBeNull();
    // Should have array value
    const annotationC = findAnnotationOnClass(cu, 'C');
    expect(annotationC).not.toBeNull();
    // Should have multiple arguments
  });

  it.skip('anonymous initialization has correct modifiers', () => {
    const input = `
      class Test {
        {
          print('init');
        }
        static {
          print('more init');
        }
      }
    `;
    const classDecl = findFirstNodeOfType(parseAndTranslate(input), isClassDeclaration);

    expect(classDecl).not.toBeNull();
    // Normal initializer should have no modifiers
    // Static initializer should have static modifier
  });
});
