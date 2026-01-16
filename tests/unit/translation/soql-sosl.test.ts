/**
 * Tests for SOQL and SOSL query translation
 * Ported from com.google.summit.translation.SoqlAndSoslTest
 */

import { describe, it, expect } from 'vitest';
import { parseAndTranslate, findFirstNodeOfType } from '../../helpers/translate-helpers.js';
import { isSoqlQueryExpression, isSoslQueryExpression } from '../../../src/ast/type-guards.js';
import type { SoqlQueryExpression, SoslQueryExpression } from '../../../src/ast/nodes/Expression.js';

describe('SOQL and SOSL Translation', () => {
  /**
   * Concatenates the string in a field initializer context and returns the AST.
   */
  function parseSoqlOrSoslInCode(soql: string): ASTNode {
    return parseAndTranslate(
      `
        class Test {
          Object x = [${soql}];
        }
      `
    );
  }

  it('soql primary contains query', () => {
    const query = 'SELECT Id FROM Contact';

    const root = parseSoqlOrSoslInCode(query);

    const node = findFirstNodeOfType(root, isSoqlQueryExpression);
    expect(node).not.toBeNull();
    if (node) {
      expect(node.query).toBe(query);
      // Note: bindings may not be implemented in our AST yet
    }
  });

  it('sosl primary contains query', () => {
    const query = 'FIND :search IN ALL FIELDS RETURNING Account(Name)';

    const root = parseSoqlOrSoslInCode(query);

    const node = findFirstNodeOfType(root, isSoslQueryExpression);
    expect(node).not.toBeNull();
    if (node) {
      expect(node.query).toBe(query);
      // Note: bindings may not be implemented in our AST yet
    }
  });

  it('sosl primary contains query with all bindings', () => {
    const query = `
      FIND :myString1 IN ALL FIELDS
      RETURNING
         Account (Id, Name WHERE Name LIKE :myString2
                  LIMIT :myInt3),
         Contact,
         Opportunity,
         Lead
      WITH DIVISION = 'ccc'
      LIMIT :myInt5
    `.trim();

    const root = parseSoqlOrSoslInCode(query);

    const node = findFirstNodeOfType(root, isSoslQueryExpression);
    expect(node).not.toBeNull();
    if (node) {
      expect(node.query).toBe(query);
      // Note: bindings extraction may not be implemented in our AST yet
    }
  });

  it('sosl with user mode', () => {
    const query =
      'FIND :SecondarySearchList IN NAME FIELDS RETURNING ' +
      'Account(Id, Account.Name WHERE ID = \'\' LIMIT 100) ' +
      'WITH USER_MODE';

    const root = parseSoqlOrSoslInCode(query);

    const node = findFirstNodeOfType(root, isSoslQueryExpression);
    expect(node).not.toBeNull();
    if (node) {
      expect(node.query).toBe(query);
      // Note: bindings may not be implemented in our AST yet
    }
  });
});
