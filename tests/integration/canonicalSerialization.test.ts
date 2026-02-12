/**
 * @file Integration tests for Summit-AST canonical format.
 * Parses complex Apex (class with inner types, SOQL, DML, etc.) and asserts
 * expected node types and structure. Serialization with summit-ast format uses
 * the canonical property names (typeDeclaration, value, group, sourceLocation, op, etc.).
 */

import { parseAndTranslate, findFirstNodeOfType } from '../translateHelpers.js';
import { JsonSerializer } from '../../src/serialization/index.js';
import {
  isClassDeclaration,
  isEnumDeclaration,
  isInterfaceDeclaration,
  isMethodDeclaration,
  isVariableDeclarationStatement,
  isSoqlExpression,
  isTryStatement,
  isWhileLoopStatement,
  isIfStatement,
  isReturnStatement,
  isNewExpression,
  isMapInitializer,
  isDmlStatement,
} from '../../src/guard/index.js';
import type { MethodDeclaration } from '../../src/ast/Declaration.js';

/**
 * Type guard for plain objects (excludes null, arrays).
 * @param x - Value to check.
 * @returns True if x is a plain object.
 */
function isRecord(x: unknown): x is Record<string, unknown> {
  return x != null && typeof x === 'object' && !Array.isArray(x);
}

/**
 * Recursively find first object in JSON tree with `@type` === kind.
 * @param obj - The JSON value to search.
 * @param kind - The `@type` value to match.
 * @returns The first matching object or null.
 */
function findInJson(obj: unknown, kind: string): Record<string, unknown> | null {
  if (obj == null || typeof obj !== 'object') return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findInJson(item, kind);
      if (found) return found;
    }
    return null;
  }
  if (!isRecord(obj)) return null;
  const node = obj;
  if (node['@type'] === kind) return node;
  for (const key of Object.keys(node)) {
    const found = findInJson(node[key], kind);
    if (found) return found;
  }
  return null;
}

/** Complex class source: annotations, inner enum/interface, property, method with try/SOQL/DML. */
const MIXEDNODES_CLS = `@A
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

/** Single statement: Map declaration with initializer and method call. Wrapped in a method to parse. */
const VARDECL_STATEMENT = `Map<String, String> MyStrings = new Map<String, String>{'a' => 'b', 'c' => 'd'.toUpperCase()};`;

describe('Summit-AST canonical format', () => {
  describe('complex class (mixednodes)', () => {
    it('parses without errors and produces CompilationUnit with Main class', () => {
      const ast = parseAndTranslate(MIXEDNODES_CLS);
      expect(ast).not.toBeNull();
      expect(ast['@type']).toBe('CompilationUnit');
      if (ast['@type'] === 'CompilationUnit') {
        expect(ast.typeDeclaration).toBeDefined();
      }

      const classDecl = findFirstNodeOfType(ast, isClassDeclaration);
      expect(classDecl).not.toBeNull();
      if (classDecl) {
        expect(classDecl.name).toBe('Main');
      }
    });

    it('has inner enum E with values A, B, C', () => {
      const ast = parseAndTranslate(MIXEDNODES_CLS);
      const enumDecl = findFirstNodeOfType(ast, isEnumDeclaration);
      expect(enumDecl).not.toBeNull();
      if (enumDecl) {
        expect(enumDecl.name).toBe('E');
        if (Array.isArray(enumDecl.values)) {
          const names = enumDecl.values.map(
            (v: Readonly<{ id: Readonly<{ string: string }> }>) => v.id.string
          );
          expect(names).toEqual(['A', 'B', 'C']);
        }
      }
    });

    it('has inner interface I extending J with method foo', () => {
      const ast = parseAndTranslate(MIXEDNODES_CLS);
      const ifaceDecl = findFirstNodeOfType(ast, isInterfaceDeclaration);
      expect(ifaceDecl).not.toBeNull();
      if (ifaceDecl) {
        expect(ifaceDecl.name).toBe('I');
        const method = ifaceDecl.bodyDeclarations.find(
          (m): m is MethodDeclaration => isMethodDeclaration(m) && m.name === 'foo'
        );
        expect(method).toBeDefined();
      }
    });

    it('has method foo with try, while, SOQL ternary, Map initializer, update DML, if, return', () => {
      const ast = parseAndTranslate(MIXEDNODES_CLS);
      const method = findFirstNodeOfType(ast, isMethodDeclaration);
      expect(method).not.toBeNull();
      if (!method?.body) return;

      const { body } = method;
      expect(body['@type']).toBe('CompoundStatement');
      const tryStmt = findFirstNodeOfType(body, isTryStatement);
      expect(tryStmt).not.toBeNull();

      const whileStmt = findFirstNodeOfType(ast, isWhileLoopStatement);
      expect(whileStmt).not.toBeNull();

      const soqlExpr = findFirstNodeOfType(ast, isSoqlExpression);
      expect(soqlExpr).not.toBeNull();
      if (soqlExpr && 'query' in soqlExpr) {
        expect(soqlExpr.query).toContain('SELECT COUNT() FROM Account');
      }

      const mapInit = findFirstNodeOfType(ast, isMapInitializer);
      expect(mapInit).not.toBeNull();

      const dmlStmt = findFirstNodeOfType(ast, isDmlStatement);
      expect(dmlStmt).not.toBeNull();
      if (dmlStmt && 'operation' in dmlStmt) {
        expect(dmlStmt.operation).toBe('update');
      }

      const ifStmt = findFirstNodeOfType(ast, isIfStatement);
      expect(ifStmt).not.toBeNull();

      const returnStmt = findFirstNodeOfType(ast, isReturnStatement);
      expect(returnStmt).not.toBeNull();
    });
  });

  describe('variable declaration statement', () => {
    it('parses Map declaration with MapInitializer and toUpperCase call', () => {
      const wrapped = `
        class C {
          void f() {
            ${VARDECL_STATEMENT}
          }
        }
      `;
      const ast = parseAndTranslate(wrapped);
      expect(ast).not.toBeNull();

      const varStmt = findFirstNodeOfType(ast, isVariableDeclarationStatement);
      expect(varStmt).not.toBeNull();
      if (varStmt) {
        const { group } = varStmt;
        expect(group).toBeDefined();
        const [firstDecl] = group.declarations;
        expect(firstDecl.id.string).toBe('MyStrings');
        const typeName = group.type.components[0]?.id.string ?? '';
        expect(typeName).toBe('Map');
      }

      const newExpr = findFirstNodeOfType(ast, isNewExpression);
      expect(newExpr).not.toBeNull();

      const mapInit = findFirstNodeOfType(ast, isMapInitializer);
      expect(mapInit).not.toBeNull();
      if (mapInit && 'pairs' in mapInit) {
        expect(mapInit.pairs.length).toBe(2);
      }
    });
  });

  describe('Summit-AST JSON serialization', () => {
    it('emits typeDeclaration and sourceLocation for CompilationUnit', () => {
      const ast = parseAndTranslate(MIXEDNODES_CLS);
      const serializer = new JsonSerializer({ includeLocation: true });
      const json = serializer.serializeNode(ast) as Record<string, unknown>;

      expect(json.typeDeclaration).toBeDefined();
      expect(json.declarations).toBeUndefined();
      expect(json.sourceLocation).toBeDefined();
      expect(json.location).toBeUndefined();
    });

    it('emits value (not expression) for ReturnStatement', () => {
      const ast = parseAndTranslate(MIXEDNODES_CLS);
      const serializer = new JsonSerializer({ includeLocation: true });
      const json = serializer.serializeNode(ast);
      const returnNode = findInJson(json, 'ReturnStatement');
      expect(returnNode).not.toBeNull();
      expect(returnNode?.value).toBeDefined();
      expect(returnNode?.expression).toBeUndefined();
    });

    it('emits group (not declaration) for VariableDeclarationStatement', () => {
      const wrapped = `class C { void f() { ${VARDECL_STATEMENT} } }`;
      const ast = parseAndTranslate(wrapped);
      const serializer = new JsonSerializer({ includeLocation: true });
      const json = serializer.serializeNode(ast);
      const varStmt = findInJson(json, 'VariableDeclarationStatement');
      expect(varStmt).not.toBeNull();
      expect(varStmt?.group).toBeDefined();
      expect(varStmt?.declaration).toBeUndefined();
      const group = varStmt != null && isRecord(varStmt.group) ? varStmt.group : undefined;
      expect(group?.declarations).toBeDefined();
    });

    it('emits op (not operator) for BinaryExpression', () => {
      const ast = parseAndTranslate(MIXEDNODES_CLS);
      const serializer = new JsonSerializer({ includeLocation: true });
      const json = serializer.serializeNode(ast);
      const binNode = findInJson(json, 'BinaryExpression');
      expect(binNode).not.toBeNull();
      expect(binNode?.op).toBeDefined();
      const op = binNode != null && typeof binNode.op === 'string' ? binNode.op : undefined;
      expect(typeof op).toBe('string');
      expect(op != null ? op.length : 0).toBeGreaterThan(0);
      expect(op != null ? op.toUpperCase() : undefined).toBe(binNode?.op);
    });

    it('emits DML as @type Update/Insert/etc. with value (not target)', () => {
      const ast = parseAndTranslate(MIXEDNODES_CLS);
      const serializer = new JsonSerializer({ includeLocation: true });
      const json = serializer.serializeNode(ast);
      const updateNode = findInJson(json, 'Update');
      expect(updateNode).not.toBeNull();
      expect(updateNode?.value).toBeDefined();
      expect(updateNode?.target).toBeUndefined();
    });
  });
});
