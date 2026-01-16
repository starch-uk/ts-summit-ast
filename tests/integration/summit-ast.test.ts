/**
 * Tests for SummitAST parsing functionality
 * Ported from com.google.summit.SummitASTTest
 */

import { describe, it, expect } from 'vitest';
import { parseApexCode } from '../../src/utils/apex-parser.js';

describe('SummitAST Parsing', () => {
  const classString = 'global with sharing interface Test { }';
  const triggerString = 'trigger MyTrigger on MyObject(before update, after delete) { }';

  it('parse string valid implicit class', () => {
    const result = parseApexCode(classString);
    expect(result.ast).toBeDefined();
    expect(result.errors.length).toBe(0);
  });

  it('parse string valid implicit trigger', () => {
    const result = parseApexCode(triggerString);
    expect(result.ast).toBeDefined();
    expect(result.errors.length).toBe(0);
  });

  // Note: The original tests check for explicit compilation types (CLASS/TRIGGER)
  // Our parser auto-detects the type, so we don't have explicit type specification.
  // However, we can verify that parsing works correctly for both types.
  it('parse class string produces valid AST', () => {
    const result = parseApexCode(classString);
    expect(result.ast).toBeDefined();
    if (result.ast) {
      // parseApexCode returns a CompilationUnit containing declarations
      expect(result.ast.kind).toBe('CompilationUnit');
      if (result.ast.kind === 'CompilationUnit') {
        expect(result.ast.declarations).toBeDefined();
        expect(result.ast.declarations.length).toBeGreaterThan(0);
        // The classString is actually an interface, so check for InterfaceDeclaration
        expect(result.ast.declarations[0].kind).toBe('InterfaceDeclaration');
      }
    }
  });

  it('parse trigger string produces valid AST', () => {
    const result = parseApexCode(triggerString);
    expect(result.ast).toBeDefined();
    // Note: Triggers might be translated differently, so we just check it's valid
    expect(result.errors.length).toBe(0);
  });

  // Note: The original test checks that parsing a class as a trigger throws an error.
  // Since our parser auto-detects, this test doesn't apply directly.
  // However, we can verify that invalid trigger syntax produces errors.
  it('parse invalid trigger syntax produces errors', () => {
    const invalidTrigger = 'trigger MyTrigger on { }'; // Missing object name
    const result = parseApexCode(invalidTrigger);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
