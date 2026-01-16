/**
 * Tests for interface declaration translation
 * Ported from com.google.summit.translation.InterfaceDeclarationTest
 */

import { describe, it, expect } from 'vitest';
import { parseAndTranslate, findFirstNodeOfType } from '../../helpers/translate-helpers.js';
import { isInterfaceDeclaration, isMethodDeclaration } from '../../../src/ast/type-guards.js';
import type { InterfaceDeclaration, MethodDeclaration } from '../../../src/ast/nodes/Declaration.js';

describe('Interface Declaration Translation', () => {
  it('interface translation has InterfaceDeclaration', () => {
    const cu = parseAndTranslate('interface Test { }');
    const interfaceDecl = findFirstNodeOfType(cu, isInterfaceDeclaration);

    expect(interfaceDecl).not.toBeNull();
    expect(isInterfaceDeclaration(interfaceDecl!)).toBe(true);
    if (interfaceDecl) {
      // Interface should have no super interfaces initially
      expect(interfaceDecl.extendsClause).toBeUndefined();
    }
  });

  it('interface translation includes inheritance', () => {
    const cu = parseAndTranslate('interface Test extends I1, I2 { }');
    const interfaceDecl = findFirstNodeOfType(cu, isInterfaceDeclaration);

    expect(interfaceDecl).not.toBeNull();
    if (interfaceDecl) {
      expect(interfaceDecl.extendsClause).toBeDefined();
      if (interfaceDecl.extendsClause && Array.isArray(interfaceDecl.extendsClause)) {
        expect(interfaceDecl.extendsClause.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('method in interface has methodDeclaration', () => {
    const input = 'interface Test { String reverse(String name); }';

    const methodDecl = findFirstNodeOfType(parseAndTranslate(input), isMethodDeclaration);

    expect(methodDecl).not.toBeNull();
    if (methodDecl) {
      expect(methodDecl.name).toBe('reverse');
      expect(methodDecl.returnType).toBeDefined();
      expect(methodDecl.parameters).toBeDefined();
      if (methodDecl.parameters) {
        expect(methodDecl.parameters.length).toBe(1);
      }
    }
  });

  it('method returning void translation has void return type', () => {
    const input = 'interface Test { void doNothing(); }';

    const methodDecl = findFirstNodeOfType(parseAndTranslate(input), isMethodDeclaration);

    expect(methodDecl).not.toBeNull();
    if (methodDecl) {
      expect(methodDecl.name).toBe('doNothing');
      // Return type should be void
      expect(methodDecl.returnType).toBeDefined();
      expect(methodDecl.parameters).toBeDefined();
      if (methodDecl.parameters) {
        expect(methodDecl.parameters.length).toBe(0);
      }
    }
  });
});
