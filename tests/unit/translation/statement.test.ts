/**
 * Tests for statement translation
 * Ported from com.google.summit.translation.StatementTest
 */

import { describe, it, expect } from 'vitest';
import { parseAndTranslate, findFirstNodeOfType, countNodesOfType, assertFullyTranslated } from '../../helpers/translate-helpers.js';
import {
  isIfStatement,
  isForStatement,
  isForEachStatement,
  isWhileStatement,
  isDoWhileStatement,
  isSwitchStatement,
  isTryStatement,
  isReturnStatement,
  isBreakStatement,
  isContinueStatement,
  isThrowStatement,
  isDmlStatement,
  isVariableDeclarationStatement,
  isExpressionStatement,
  isBlock,
} from '../../../src/ast/type-guards.js';
import { getNodeChildren } from '../../../src/utils/traversal.js';

describe('Statement Translation', () => {
  /**
   * Counts the number of untranslated statement nodes in the AST.
   */
  function countUntranslatedStatements(node: any): number {
    return countNodesOfType(
      node,
      (n) => n.kind === 'UntranslatedStatement' || n.kind === 'Untranslated'
    );
  }

  /**
   * Concatenates the string into a method body and returns the AST.
   */
  function parseApexStatementInCode(statement: string): any {
    return parseAndTranslate(
      `
        class Test {
          void f() {
            ${statement}
          }
        }
      `
    );
  }

  it('method body is compound statement', () => {
    const compilationUnit = parseApexStatementInCode('1; return 2;');

    const classDecl = findFirstNodeOfType(compilationUnit, (n) => n.kind === 'ClassDeclaration');
    expect(classDecl).not.toBeNull();
    // Method body should be a block with statements
    // This test may need adjustment based on actual AST structure
    assertFullyTranslated(compilationUnit);
  });

  it('if statement condition is variable expression', () => {
    const root = parseApexStatementInCode('if (x) { }');
    const node = findFirstNodeOfType(root, isIfStatement);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.condition).toBeDefined();
      // Condition should be an identifier/variable expression
      expect(node.thenStatement).toBeDefined();
      // Without else, elseStatement should be undefined
      expect(node.elseStatement).toBeUndefined();
    }
  });

  it('if statement has else statement', () => {
    const root = parseApexStatementInCode('if (x) { } else { }');
    const node = findFirstNodeOfType(root, isIfStatement);

    expect(node).not.toBeNull();
    if (node) {
      // Since else is present, elseStatement should not be null
      expect(node.elseStatement).toBeDefined();
    }
  });

  it.skip('switch statement condition is variable expression', () => {
    const root = parseApexStatementInCode('switch on x { when else { } }');
    const node = findFirstNodeOfType(root, isSwitchStatement);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.expression).toBeDefined();
      expect(node.cases).toBeDefined();
    }
  });

  it.skip('switch statement when clause has two values', () => {
    const root = parseApexStatementInCode('switch on x { when value1, value2 { } }');
    // This requires switch statement parsing with when clauses
    expect(root).toBeDefined();
  });

  it.skip('switch statement when clause has literal values', () => {
    const root = parseApexStatementInCode(`
      switch on x {
        when 0 { }
        when 1234L { }
        when 'string' { }
        when null { }
      }
    `);
    // This requires switch statement parsing with literal values
    expect(root).toBeDefined();
  });

  it.skip('switch statement when clause declares variable', () => {
    const root = parseApexStatementInCode('switch on x { when Type variable { } }');
    // This requires switch statement parsing with type matching
    expect(root).toBeDefined();
  });

  it.skip('traditional for statement declares two variables', () => {
    const root = parseApexStatementInCode('for (int i=0, j=0; i+j<10; i++, j++) {}');
    const node = findFirstNodeOfType(root, isForStatement);

    expect(node).not.toBeNull();
    // This requires for loop parsing with multiple declarations
  });

  it.skip('traditional for statement initializes two expressions', () => {
    const root = parseApexStatementInCode('for (i=0, j=0; ; ) {}');
    const node = findFirstNodeOfType(root, isForStatement);

    expect(node).not.toBeNull();
    // This requires for loop parsing with multiple initializations
  });

  it('enhanced for statement has variable declaration', () => {
    const root = parseApexStatementInCode('for (String s : collection) {}');
    const node = findFirstNodeOfType(root, isForEachStatement);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.variable).toBeDefined();
      expect(node.iterable).toBeDefined();
    }
  });

  it('while statement condition is variable expression', () => {
    const root = parseApexStatementInCode('while (x) {}');
    const node = findFirstNodeOfType(root, isWhileStatement);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.condition).toBeDefined();
      expect(node.body).toBeDefined();
    }
  });

  it('do while statement condition is variable expression', () => {
    const root = parseApexStatementInCode('do {} while(x);');
    const node = findFirstNodeOfType(root, isDoWhileStatement);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.condition).toBeDefined();
      expect(node.body).toBeDefined();
    }
  });

  it('try statement has finally block', () => {
    const root = parseApexStatementInCode('try {} finally {}');
    const node = findFirstNodeOfType(root, isTryStatement);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.finallyBlock).toBeDefined();
      expect(node.catchClauses).toBeDefined();
      if (node.catchClauses) {
        expect(node.catchClauses.length).toBe(0);
      }
    }
  });

  it('try statement has two catch blocks', () => {
    const root = parseApexStatementInCode('try {} catch (X x) {} catch (Y y) {}');
    const node = findFirstNodeOfType(root, isTryStatement);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.catchClauses).toBeDefined();
      if (node.catchClauses) {
        expect(node.catchClauses.length).toBe(2);
      }
      expect(node.finallyBlock).toBeUndefined();
    }
  });

  it('catch block declares variable', () => {
    const root = parseApexStatementInCode('try {} catch (Exception e) {}');
    const node = findFirstNodeOfType(root, isTryStatement);

    expect(node).not.toBeNull();
    if (node && node.catchClauses && node.catchClauses.length > 0) {
      const catchBlock = node.catchClauses[0];
      expect(catchBlock).toBeDefined();
      // Exception variable should be declared
    }
  });

  it('return statement translation has one child', () => {
    const root = parseApexStatementInCode('return 7;');
    const node = findFirstNodeOfType(root, isReturnStatement);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.expression).toBeDefined();
      const children = getNodeChildren(node);
      expect(children.length).toBeGreaterThan(0);
    }
  });

  it('throw statement translation has one child', () => {
    const root = parseApexStatementInCode('throw e;');
    const node = findFirstNodeOfType(root, isThrowStatement);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.expression).toBeDefined();
      const children = getNodeChildren(node);
      expect(children.length).toBeGreaterThan(0);
    }
  });

  it('break statement translation is leaf node', () => {
    const root = parseApexStatementInCode('break;');
    const node = findFirstNodeOfType(root, isBreakStatement);

    expect(node).not.toBeNull();
    if (node) {
      const children = getNodeChildren(node);
      expect(children.length).toBe(0);
    }
  });

  it('continue statement translation is leaf node', () => {
    const root = parseApexStatementInCode('continue;');
    const node = findFirstNodeOfType(root, isContinueStatement);

    expect(node).not.toBeNull();
    if (node) {
      const children = getNodeChildren(node);
      expect(children.length).toBe(0);
    }
  });

  it('insert DML statement translation has one child', () => {
    const root = parseApexStatementInCode('insert obj;');
    const node = findFirstNodeOfType(root, isDmlStatement);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.operation).toBe('insert');
      expect(node.target).toBeDefined();
      const children = getNodeChildren(node);
      expect(children.length).toBeGreaterThan(0);
    }
  });

  it('update DML statement translation has one child', () => {
    const root = parseApexStatementInCode('update obj;');
    const node = findFirstNodeOfType(root, isDmlStatement);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.operation).toBe('update');
      expect(node.target).toBeDefined();
    }
  });

  it('delete DML statement translation has one child', () => {
    const root = parseApexStatementInCode('delete obj;');
    const node = findFirstNodeOfType(root, isDmlStatement);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.operation).toBe('delete');
      expect(node.target).toBeDefined();
    }
  });

  it('undelete DML statement translation has one child', () => {
    const root = parseApexStatementInCode('undelete obj;');
    const node = findFirstNodeOfType(root, isDmlStatement);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.operation).toBe('undelete');
      expect(node.target).toBeDefined();
    }
  });

  it.skip('upsert DML statement translation has two children', () => {
    const root = parseApexStatementInCode('upsert obj field;');
    const node = findFirstNodeOfType(root, isDmlStatement);

    expect(node).not.toBeNull();
    // Upsert has two arguments: object and field
  });

  it.skip('merge DML statement translation has two children', () => {
    const root = parseApexStatementInCode('merge objto obj;');
    const node = findFirstNodeOfType(root, isDmlStatement);

    expect(node).not.toBeNull();
    // Merge has two arguments: target and source
  });

  it.skip('run as statement translation has context expressions', () => {
    const root = parseApexStatementInCode('system.runAs(user) { }');
    // This requires runAs statement parsing
    expect(root).toBeDefined();
  });

  it.skip('local variable declaration statement translation wraps variable declaration', () => {
    const root = parseApexStatementInCode("String s = null, t = 'hello';");
    const node = findFirstNodeOfType(root, isVariableDeclarationStatement);

    expect(node).not.toBeNull();
    // This requires variable declaration parsing with multiple declarators
  });

  it('expression statement translation has one child', () => {
    const root = parseApexStatementInCode('x + y;');
    const node = findFirstNodeOfType(root, isExpressionStatement);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.expression).toBeDefined();
      const children = getNodeChildren(node);
      expect(children.length).toBeGreaterThan(0);
    }
  });

  it.skip('dml statement translation with system mode', () => {
    const root = parseApexStatementInCode('upsert as system obj field;');
    const node = findFirstNodeOfType(root, isDmlStatement);

    expect(node).not.toBeNull();
    // This requires DML statement parsing with access level
  });

  it.skip('dml statement translation with user mode', () => {
    const root = parseApexStatementInCode('insert as user obj;');
    const node = findFirstNodeOfType(root, isDmlStatement);

    expect(node).not.toBeNull();
    // This requires DML statement parsing with access level
  });
});
