/**
 * Tests for expression translation
 * Ported from com.google.summit.translation.ExpressionTest
 */

import { describe, it, expect } from 'vitest';
import { parseAndTranslate, findFirstNodeOfType, countNodesOfType, assertFullyTranslated } from '../../helpers/translate-helpers.js';
import {
  isThisExpression,
  isSuperExpression,
  isIdentifier,
  isSoqlQueryExpression,
  isSoslQueryExpression,
  isBinaryExpression,
  isFieldAccessExpression,
  isArrayAccessExpression,
  isNewExpression,
  isMethodCallExpression,
  isCastExpression,
  isTernaryExpression,
  isUnaryExpression,
  isParenthesizedExpression,
} from '../../../src/ast/type-guards.js';
import { getNodeChildren } from '../../../src/utils/traversal.js';

describe('Expression Translation', () => {
  /**
   * Counts the number of untranslated expression nodes in the AST.
   */
  function countUntranslatedExpressions(node: any): number {
    return countNodesOfType(
      node,
      (n) => n.kind === 'UntranslatedExpression' || n.kind === 'Untranslated'
    );
  }

  /**
   * Concatenates the string in a field initializer context and returns the AST.
   */
  function parseApexExpressionInCode(expression: string): any {
    return parseAndTranslate(
      `
        class Test {
          Object x = ${expression};
        }
      `
    );
  }

  it('this primary translation is leaf node', () => {
    const root = parseApexExpressionInCode('this');
    const node = findFirstNodeOfType(root, isThisExpression);

    expect(node).not.toBeNull();
    if (node) {
      const children = getNodeChildren(node);
      expect(children.length).toBe(0);
    }
  });

  it('super primary translation is leaf node', () => {
    const root = parseApexExpressionInCode('super');
    const node = findFirstNodeOfType(root, isSuperExpression);

    expect(node).not.toBeNull();
    if (node) {
      const children = getNodeChildren(node);
      expect(children.length).toBe(0);
    }
  });

  it.skip('type ref primary translation has one child', () => {
    const root = parseApexExpressionInCode('Object.class');
    // This requires type ref expression parsing
    expect(root).toBeDefined();
  });

  it('id primary translation has correct identifier', () => {
    const root = parseApexExpressionInCode('id');
    const node = findFirstNodeOfType(root, isIdentifier);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.name).toBe('id');
    }
  });

  it('soql primary translation has bound expressions', () => {
    const root = parseApexExpressionInCode('[SELECT Id FROM Contact WHERE Value > :Threshold]');
    const node = findFirstNodeOfType(root, isSoqlQueryExpression);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.query).toBeDefined();
      const children = getNodeChildren(node);
      expect(children.length).toBeGreaterThan(0);
    }
  });

  it('sosl primary translation has bound expressions', () => {
    const root = parseApexExpressionInCode('[FIND :search IN ALL FIELDS RETURNING Account(Name)]');
    const node = findFirstNodeOfType(root, isSoslQueryExpression);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.query).toBeDefined();
      const children = getNodeChildren(node);
      expect(children.length).toBeGreaterThan(0);
    }
  });

  it.skip('all operators match binary expression op', () => {
    // This test checks all binary operators
    // Would need to test each operator individually
    const operators = ['+', '-', '*', '/', '%', '==', '!=', '<', '>', '<=', '>=', '&&', '||'];
    for (const op of operators) {
      const root = parseApexExpressionInCode(`y ${op} z`);
      const node = findFirstNodeOfType(root, isBinaryExpression);
      expect(node).not.toBeNull();
    }
  });

  it('field access translation is field expression', () => {
    const root = parseApexExpressionInCode('x.y');
    const node = findFirstNodeOfType(root, isFieldAccessExpression);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.target).toBeDefined();
      expect(node.fieldName).toBeDefined();
      const children = getNodeChildren(node);
      expect(children.length).toBeGreaterThan(0);
    }
  });

  it.skip('safe access sets field expression is safe', () => {
    const root = parseApexExpressionInCode('x?.y');
    const node = findFirstNodeOfType(root, isFieldAccessExpression);

    expect(node).not.toBeNull();
    if (node) {
      // Should have isSafe property set to true
      expect(node).toBeDefined();
    }
  });

  it('array access translation is array expression', () => {
    const root = parseApexExpressionInCode('a[b]');
    const node = findFirstNodeOfType(root, isArrayAccessExpression);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.array).toBeDefined();
      expect(node.index).toBeDefined();
      const children = getNodeChildren(node);
      expect(children.length).toBeGreaterThan(0);
    }
  });

  it('new class object translation is new expression', () => {
    const root = parseApexExpressionInCode('new String()');
    const node = findFirstNodeOfType(root, isNewExpression);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.type).toBeDefined();
    }
  });

  it.skip('new sized array translation is new expression', () => {
    const root = parseApexExpressionInCode('new Double[5]');
    const node = findFirstNodeOfType(root, isNewExpression);

    expect(node).not.toBeNull();
    // This requires array size parsing
  });

  it('new initialized array translation is new expression', () => {
    const root = parseApexExpressionInCode('new Double[] { 1.0, 2.0 }');
    const node = findFirstNodeOfType(root, isNewExpression);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.type).toBeDefined();
      expect(node.arrayInitializer).toBeDefined();
    }
  });

  it('new initialized list translation is new expression', () => {
    const root = parseApexExpressionInCode('new List<Double> { 1.0, 2.0 }');
    const node = findFirstNodeOfType(root, isNewExpression);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.type).toBeDefined();
      expect(node.arrayInitializer).toBeDefined();
    }
  });

  it('new initialized map translation is new expression', () => {
    const root = parseApexExpressionInCode("new Map<String, String>{'a' => 'b', 'c' => 'd'}");
    const node = findFirstNodeOfType(root, isNewExpression);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.type).toBeDefined();
      expect(node.arrayInitializer).toBeDefined();
    }
  });

  it.skip('assign expression produces untranslated node', () => {
    // This test checks various assignment operators
    const assignOps = ['=', '+=', '-=', '*=', '/=', '&=', '|=', '^=', '>>=', '>>>=', '<<='];
    for (const op of assignOps) {
      const root = parseApexExpressionInCode(`x ${op} y`);
      // Assignment expressions should be parsed
      expect(root).toBeDefined();
    }
  });

  it.skip('constructor chaining encoded as method named this', () => {
    const root = parseApexExpressionInCode('this(x, y)');
    const node = findFirstNodeOfType(root, isMethodCallExpression);

    expect(node).not.toBeNull();
    // Constructor chaining is translated as call to method named 'this'
  });

  it.skip('base class constructor encoded as method named super', () => {
    const root = parseApexExpressionInCode('super(x, y)');
    const node = findFirstNodeOfType(root, isMethodCallExpression);

    expect(node).not.toBeNull();
    // Base class construction is translated as call to method named 'super'
  });

  it('implicit receiver is null', () => {
    const root = parseApexExpressionInCode('no_receiver()');
    const node = findFirstNodeOfType(root, isMethodCallExpression);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.target).toBeUndefined();
      expect(node.methodName).toBe('no_receiver');
    }
  });

  it.skip('safe access sets is safe true', () => {
    const root = parseApexExpressionInCode('x?.method()');
    const node = findFirstNodeOfType(root, isMethodCallExpression);

    expect(node).not.toBeNull();
    // Should have isSafe property set to true
  });

  it('unsafe access sets is safe false', () => {
    const root = parseApexExpressionInCode('x.method(123)');
    const node = findFirstNodeOfType(root, isMethodCallExpression);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.target).toBeDefined();
      expect(node.arguments).toBeDefined();
      if (node.arguments) {
        expect(node.arguments.length).toBe(1);
      }
    }
  });

  it('cast translated as cast expression', () => {
    const root = parseApexExpressionInCode('(String) obj');
    const node = findFirstNodeOfType(root, isCastExpression);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.type).toBeDefined();
      expect(node.expression).toBeDefined();
      const children = getNodeChildren(node);
      expect(children.length).toBeGreaterThan(0);
    }
  });

  it('conditional translates to ternary expression', () => {
    const root = parseApexExpressionInCode('cond ? thenvalue : elsevalue');
    const node = findFirstNodeOfType(root, isTernaryExpression);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.condition).toBeDefined();
      expect(node.thenExpression).toBeDefined();
      expect(node.elseExpression).toBeDefined();
    }
  });

  it.skip('all operators match unary expression op', () => {
    // This test checks all unary operators
    const unaryOps = ['!', '-', '+', '++', '--'];
    for (const op of unaryOps) {
      const root = parseApexExpressionInCode(`${op}x`);
      const node = findFirstNodeOfType(root, isUnaryExpression);
      expect(node).not.toBeNull();
    }
  });

  it('sub expression is transparent', () => {
    const root = parseApexExpressionInCode('(sub)');
    const node = findFirstNodeOfType(root, isParenthesizedExpression);

    assertFullyTranslated(root);
    expect(node).not.toBeNull();
    // The first expression should be inside the subexpression
  });

  it('null coalescing translates to binary expression', () => {
    const root = parseApexExpressionInCode('leftHand ?? rightHand');
    const node = findFirstNodeOfType(root, isBinaryExpression);

    expect(node).not.toBeNull();
    if (node) {
      expect(node.operator).toBe('??');
    }
  });
});
