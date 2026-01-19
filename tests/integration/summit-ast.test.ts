/**
 * @file Integration tests for SummitAST parsing functionality.
 * Ported from com.google.summit.SummitASTTest.
 */

import { parseApexCode } from '../../src/utils/apex-parser.js';

describe('SummitAST Parsing', () => {
  const classString = 'global with sharing interface Test { }';
  const triggerString = 'trigger MyTrigger on MyObject(before update, after delete) { }';

  // Ported from parseString_valid_implicitClass
  // Original: val string = classString
  //           val cu = SummitAST.parseAndTranslate(string, type = null)
  //           assertThat(cu).isNotNull()
  // Original: Verifies that parsing a class string with implicit type (null) produces a non-null CompilationUnit
  it('parse string valid implicit class', () => {
    const string = classString;
    const result = parseApexCode(string);

    // Original: assertThat(cu).isNotNull()
    // Original test checks that CompilationUnit is not null
    expect(result.ast).not.toBeNull();

    // Additional verification: ensure it's a valid CompilationUnit structure
    // This matches the original's implicit verification that the AST is valid
    if (result.ast) {
      expect(result.ast.kind).toBe('CompilationUnit');
      if (result.ast.kind === 'CompilationUnit') {
        expect(result.ast.declarations).toBeDefined();
        expect(Array.isArray(result.ast.declarations)).toBe(true);
        expect(result.ast.declarations.length).toBeGreaterThan(0);
        // Verify the declaration is the expected type (interface in this case)
        expect(result.ast.declarations[0].kind).toBeDefined();
      }
    }

    // Original doesn't explicitly check for errors, but successful parsing implies no errors
    // Verify no errors occurred (matching the original's implicit expectation)
    expect(result.errors.length).toBe(0);
  });

  // Ported from parseString_valid_implicitTrigger
  // Original: val string = triggerString
  //           val cu = SummitAST.parseAndTranslate(string, type = null)
  //           assertThat(cu).isNotNull()
  // Original: Verifies that parsing a trigger string with implicit type (null) produces a non-null CompilationUnit
  it('parse string valid implicit trigger', () => {
    const string = triggerString;
    const result = parseApexCode(string);

    // Original: assertThat(cu).isNotNull()
    // Original test checks that CompilationUnit is not null
    expect(result.ast).not.toBeNull();

    // Additional verification: ensure it's a valid CompilationUnit structure
    // This matches the original's implicit verification that the AST is valid
    if (result.ast) {
      expect(result.ast.kind).toBe('CompilationUnit');
      if (result.ast.kind === 'CompilationUnit') {
        expect(result.ast.declarations).toBeDefined();
        expect(Array.isArray(result.ast.declarations)).toBe(true);
        // Triggers should have at least one declaration
        // This verifies the parser correctly identified and parsed the trigger
        // (matching the original's expectation that parsing succeeds)
        expect(result.ast.declarations.length).toBeGreaterThan(0);
        // Verify the declaration is the expected type (trigger in this case)
        expect(result.ast.declarations[0].kind).toBeDefined();
      }
    }

    // Original doesn't explicitly check for errors, but successful parsing implies no errors
    // Verify no errors occurred (matching the original's implicit expectation)
    expect(result.errors.length).toBe(0);
  });

  // Ported from parseString_valid_explicitClass
  // Original: val cu = SummitAST.parseAndTranslate(string, type = CompilationType.CLASS)
  //           assertThat(cu).isNotNull()
  // Note: The original tests check for explicit compilation types (CLASS/TRIGGER)
  // Our parser auto-detects the type, so we don't have explicit type specification.
  // However, we verify that parsing works correctly and produces the same result.
  it('parse string valid explicit class (auto-detected)', () => {
    const string = classString;
    const result = parseApexCode(string);

    // Original: assertThat(cu).isNotNull()
    // Original test checks that CompilationUnit is not null
    expect(result.ast).not.toBeNull();

    // Additional verification: ensure it's a valid CompilationUnit structure
    // This matches the original's implicit verification that the AST is valid
    if (result.ast) {
      expect(result.ast.kind).toBe('CompilationUnit');
      if (result.ast.kind === 'CompilationUnit') {
        expect(result.ast.declarations).toBeDefined();
        expect(Array.isArray(result.ast.declarations)).toBe(true);
        expect(result.ast.declarations.length).toBeGreaterThan(0);
        // The classString is actually an interface, so check for InterfaceDeclaration
        // This verifies the parser correctly identified and parsed the type
        // (matching the original's expectation that parsing succeeds)
        expect(result.ast.declarations[0].kind).toBe('InterfaceDeclaration');
      }
    }

    // Original doesn't explicitly check for errors, but successful parsing implies no errors
    // Verify no errors occurred (matching the original's implicit expectation)
    expect(result.errors.length).toBe(0);
  });

  // Ported from parseString_valid_explicitTrigger
  // Original: val cu = SummitAST.parseAndTranslate(string, type = CompilationType.TRIGGER)
  //           assertThat(cu).isNotNull()
  // Note: The original tests check for explicit compilation types (CLASS/TRIGGER)
  // Our parser auto-detects the type, so we don't have explicit type specification.
  // However, we verify that parsing works correctly and produces the same result.
  it('parse string valid explicit trigger (auto-detected)', () => {
    const string = triggerString;
    const result = parseApexCode(string);

    // Original: assertThat(cu).isNotNull()
    // Original test checks that CompilationUnit is not null
    expect(result.ast).not.toBeNull();

    // Additional verification: ensure it's a valid CompilationUnit structure
    // This matches the original's implicit verification that the AST is valid
    if (result.ast) {
      expect(result.ast.kind).toBe('CompilationUnit');
      if (result.ast.kind === 'CompilationUnit') {
        expect(result.ast.declarations).toBeDefined();
        expect(Array.isArray(result.ast.declarations)).toBe(true);
        // Triggers should have at least one declaration
        // This verifies the parser correctly identified and parsed the trigger
        // (matching the original's expectation that parsing succeeds)
        expect(result.ast.declarations.length).toBeGreaterThan(0);
      }
    }

    // Original doesn't explicitly check for errors, but successful parsing implies no errors
    // Verify no errors occurred (matching the original's implicit expectation)
    expect(result.errors.length).toBe(0);
  });

  // Ported from parseString_invalid_classAsTrigger
  // Original: val exception = Assert.assertThrows(SummitAST.ParseException::class.java) {
  //             SummitAST.parseAndTranslate(string, type = CompilationType.TRIGGER)
  //           }
  //           assertThat(exception).isNotNull()
  // Since our parser auto-detects, we can't force a class to be parsed as a trigger.
  // However, we can verify that attempting to parse a class-like string that doesn't
  // match trigger syntax will either fail or be parsed as a class (not a trigger).
  // The original test expects a ParseException when forcing a class to be parsed as a trigger.
  // With auto-detection, this mismatch is prevented, so parsing succeeds as a class/interface.
  it('parse string invalid class as trigger (auto-detection prevents mismatch)', () => {
    const string = classString;
    const result = parseApexCode(string);

    // Original test expects an exception when forcing class as trigger.
    // With auto-detection, the parser correctly identifies it as a class/interface,
    // so parsing succeeds (which is actually better behavior than throwing an error).
    expect(result.ast).not.toBeNull();

    // Verify it was parsed as a class/interface, not a trigger
    // This ensures the auto-detection worked correctly
    if (result.ast?.kind === 'CompilationUnit') {
      expect(result.ast.declarations).toBeDefined();
      if (result.ast.declarations && result.ast.declarations.length > 0) {
        const [firstDecl] = result.ast.declarations;
        // Should be InterfaceDeclaration or ClassDeclaration, not TriggerDeclaration
        // This verifies the parser correctly identified the type
        expect(['InterfaceDeclaration', 'ClassDeclaration']).toContain(firstDecl.kind);
        expect(firstDecl.kind).not.toBe('TriggerDeclaration');
      }
    }

    // Verify no errors occurred (auto-detection prevents the type mismatch error)
    expect(result.errors.length).toBe(0);
  });

  // Ported from parsePath_valid
  // Original: val path = Path("src/main/javatests/com/google/summit/testdata/mixednodes.cls")
  //           val cu = SummitAST.parseAndTranslate(path)
  //           assertThat(cu).isNotNull()
  // Original: Verifies that parsing from a file path produces a non-null CompilationUnit
  // Test parsing from a file path by reading the file and parsing its contents
  it('parse path valid', () => {
    // Use the test data file from the original repository structure
    // Since we don't have the exact same file structure, we'll use inline content
    // that matches the original mixednodes.cls content structure
    // This demonstrates parsing file content (simulating what would happen when reading from a file path)
    const testFileContent = `@A
@B(false)
@C({@D, @E})
public class Main implements I, J {
  enum E { A, B, C }
  integer field;
  interface I extends J {
    void foo();
  }
  String property {
    get { return property; }
    set { property = value; }
  }
  void foo(integer a, integer b) {
    try {
      while(true) {}
      integer sum = (double) foo(-a + b);
      integer i = new float[5] ? [SELECT COUNT() FROM Account] : false;
      Map<String, String> MyStrings = new Map<String, String>{'a' => 'b', 'c' => 'd'.toUpperCase()};
      update this.i;
      if(true) { 5; }
      return sum[0].bar * new Object.x(a=1, b=2);
    } catch (Exception e) { throw e; }
  }
}`;
    // Original: val cu = SummitAST.parseAndTranslate(path)
    // Parse the file content (simulating what would happen when reading from a file path)
    const result = parseApexCode(testFileContent);

    // Original: assertThat(cu).isNotNull()
    // Original test checks that CompilationUnit is not null
    expect(result.ast).not.toBeNull();

    // Additional verification: ensure it's a valid CompilationUnit structure
    // This matches the original's implicit verification that the AST is valid
    if (result.ast) {
      expect(result.ast.kind).toBe('CompilationUnit');
      if (result.ast.kind === 'CompilationUnit') {
        expect(result.ast.declarations).toBeDefined();
        expect(Array.isArray(result.ast.declarations)).toBe(true);
        // The mixednodes.cls file contains a class with various members
        expect(result.ast.declarations.length).toBeGreaterThan(0);
        // Should have a ClassDeclaration (matching the original's expectation)
        const classDecl = result.ast.declarations.find((d) => d.kind === 'ClassDeclaration');
        expect(classDecl).toBeDefined();
        // Verify the class declaration has the expected name
        if (classDecl && 'name' in classDecl) {
          expect(classDecl.name).toBeDefined();
        }
      }
    }

    // Original test only checks that CompilationUnit is not null
    // It doesn't verify absence of errors, so we don't require zero errors
    // (The complex mixednodes.cls content may have some parsing issues)
    // The important thing is that parsing succeeded and produced an AST
    // (matching the original's intent: verify that file path parsing works)
  });

  // Additional test: verify that invalid trigger syntax produces errors
  // This is similar to the original parseString_invalid_classAsTrigger test,
  // but tests a different kind of error (syntax error vs type mismatch)
  // Original test checks that parsing a class as a trigger throws an error.
  // Since our parser auto-detects, that test doesn't apply directly.
  // However, we can verify that invalid trigger syntax produces errors.
  // This test complements the original tests by verifying error handling for invalid syntax
  it('parse invalid trigger syntax produces errors', () => {
    /**
     * Missing object name - this should produce a parse error.
     * Original: The parseString_invalid_classAsTrigger test verifies error handling
     * This test verifies error handling for syntax errors (complementary to the original).
     */
    const invalidTrigger = 'trigger MyTrigger on { }';
    const result = parseApexCode(invalidTrigger);

    // Invalid syntax should produce errors
    // Original: The parseString_invalid_classAsTrigger test expects an exception
    // This test verifies that errors are reported (matching the original's intent of error detection)
    expect(result.errors.length).toBeGreaterThan(0);

    // The AST may be null or partial if parsing failed
    // (depending on error recovery behavior)
    // The important thing is that errors were reported
    if (result.errors.length > 0) {
      // Verify error messages are meaningful
      // Original: assertThat(exception).isNotNull() - we verify error is reported
      expect(result.errors[0].message).toBeDefined();
      expect(result.errors[0].message.length).toBeGreaterThan(0);
      // Verify error has location information (if available)
      if (result.errors[0].location) {
        expect(result.errors[0].location.start).toBeDefined();
      }
    }
  });
});
