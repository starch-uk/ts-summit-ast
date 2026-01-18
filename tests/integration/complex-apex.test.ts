/**
 * Integration tests for complex Apex code parsing.
 * Tests end-to-end parsing scenarios with complex Apex constructs.
 */

import { describe, it, expect } from 'vitest';
import { parseApexCode } from '../../src/utils/apex-parser.js';
import { findFirstNodeOfType, parseAndTranslate } from '../translate-helpers.js';
import {
  isClassDeclaration,
  isMethodDeclaration,
  isVariableDeclaration,
  isIfStatement,
  isForLoopStatement,
  isWhileLoopStatement,
  isTryStatement,
  isBinaryExpression,
  isCallExpression,
  isNewExpression,
  isTernaryExpression,
  isLambdaExpression,
} from '../../src/ast/type-guards.js';

describe('Complex Apex Code Parsing', () => {
  describe('Complex Classes', () => {
    it('should parse class with multiple methods and fields', () => {
      const apexCode = `
        public class ComplexClass {
          private Integer field1 = 42;
          private String field2 = 'test';
          public static final Integer CONSTANT = 100;
          
          public void method1() {
            System.debug('Method 1');
          }
          
          public Integer method2(Integer param) {
            return param * 2;
          }
          
          private void method3(String param1, Integer param2) {
            if (param1 != null && param2 > 0) {
              System.debug(param1 + param2);
            }
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);

      if (result.ast) {
        const classDecl = findFirstNodeOfType(result.ast, isClassDeclaration);
        expect(classDecl).not.toBeNull();
      }
    });

    it('should parse class with inheritance and interfaces', () => {
      const apexCode = `
        public class ChildClass extends ParentClass implements Interface1, Interface2 {
          public override void method1() {
            super.method1();
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.ast).toBeDefined();
      if (result.ast) {
        const classDecl = findFirstNodeOfType(result.ast, isClassDeclaration);
        expect(classDecl).not.toBeNull();
        if (classDecl) {
          expect(classDecl.extendsClause).toBeDefined();
          expect(classDecl.implementsClause).toBeDefined();
        }
      }
    });

    it('should parse class with inner classes', () => {
      const apexCode = `
        public class OuterClass {
          public class InnerClass {
            public void innerMethod() { }
          }
          
          public interface InnerInterface {
            void interfaceMethod();
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Complex Methods', () => {
    it('should parse method with complex control flow', () => {
      const apexCode = `
        public class Test {
          public void complexMethod(Integer x, Integer y) {
            if (x > 0 && y > 0) {
              for (Integer i = 0; i < x; i++) {
                while (y > 0) {
                  System.debug(i + y);
                  y--;
                }
              }
            } else if (x < 0) {
              System.debug('Negative');
            } else {
              System.debug('Zero');
            }
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should parse method with try-catch-finally', () => {
      const apexCode = `
        public class Test {
          public void methodWithExceptionHandling() {
            try {
              Integer result = 10 / 0;
            } catch (MathException e) {
              System.debug('Math error: ' + e.getMessage());
            } catch (Exception e) {
              System.debug('General error: ' + e.getMessage());
            } finally {
              System.debug('Cleanup');
            }
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.ast).toBeDefined();

      if (result.ast) {
        const tryStmt = findFirstNodeOfType(result.ast, isTryStatement);
        expect(tryStmt).not.toBeNull();
        if (tryStmt) {
          expect(tryStmt.catchClauses).toBeDefined();
          expect(tryStmt.catchClauses?.length).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it('should parse method with switch statement', () => {
      const apexCode = `
        public class Test {
          public void methodWithSwitch(Integer value) {
            switch on value {
              when 1 {
                System.debug('One');
              }
              when 2, 3 {
                System.debug('Two or Three');
              }
              when else {
                System.debug('Other');
              }
            }
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should parse method with enhanced for loop', () => {
      const apexCode = `
        public class Test {
          public void methodWithEnhancedFor() {
            List<String> items = new List<String>{'a', 'b', 'c'};
            for (String item : items) {
              System.debug(item);
            }
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Complex Expressions', () => {
    it('should parse nested binary expressions', () => {
      const apexCode = `
        public class Test {
          public void method() {
            Integer result = (a + b) * (c - d) / (e % f);
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should parse ternary expressions', () => {
      const apexCode = `
        public class Test {
          public void method() {
            String result = (x > 0) ? 'positive' : 'non-positive';
            Integer value = (a > b) ? a : (b > c) ? b : c;
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.ast).toBeDefined();

      if (result.ast) {
        const ternary = findFirstNodeOfType(result.ast, isTernaryExpression);
        expect(ternary).not.toBeNull();
      }
    });

    it('should parse method call chains', () => {
      const apexCode = `
        public class Test {
          public void method() {
            String result = obj.method1().method2().method3();
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should parse array and field access chains', () => {
      const apexCode = `
        public class Test {
          public void method() {
            String value = items[0].field1.field2[1];
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should parse new expressions with complex initializers', () => {
      const apexCode = `
        public class Test {
          public void method() {
            List<String> list1 = new List<String>{'a', 'b', 'c'};
            Map<String, Integer> map1 = new Map<String, Integer>{'a' => 1, 'b' => 2};
            MyClass obj = new MyClass(param1, param2);
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.ast).toBeDefined();

      if (result.ast) {
        const newExpr = findFirstNodeOfType(result.ast, isNewExpression);
        expect(newExpr).not.toBeNull();
      }
    });
  });

  describe('SOQL and SOSL Queries', () => {
    it('should parse complex SOQL query', () => {
      const apexCode = `
        public class Test {
          public void method() {
            List<Account> accounts = [
              SELECT Id, Name, (SELECT Id FROM Contacts)
              FROM Account
              WHERE Name LIKE :searchTerm
                AND CreatedDate > :startDate
              ORDER BY Name
              LIMIT :maxRecords
            ];
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should parse complex SOSL query', () => {
      const apexCode = `
        public class Test {
          public void method() {
            List<List<SObject>> results = [
              FIND :searchTerm IN ALL FIELDS
              RETURNING Account(Id, Name WHERE Name LIKE :filter),
                       Contact(Id, Email)
              WITH DIVISION = 'MyDivision'
              LIMIT 100
            ];
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('DML Statements', () => {
    it('should parse multiple DML operations', () => {
      const apexCode = `
        public class Test {
          public void method() {
            insert new List<Account>{new Account(Name='Test')};
            update accounts;
            delete oldAccounts;
            upsert accounts Id;
            merge account1 account2;
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Real-world Examples', () => {
    it('should parse a complete service class', () => {
      const apexCode = `
        public with sharing class AccountService {
          private static final String DEFAULT_NAME = 'Unknown';
          
          public static Account createAccount(String name) {
            if (String.isBlank(name)) {
              name = DEFAULT_NAME;
            }
            
            Account acc = new Account(Name = name);
            try {
              insert acc;
              return acc;
            } catch (DmlException e) {
              System.debug('Error creating account: ' + e.getMessage());
              throw new AccountServiceException('Failed to create account', e);
            }
          }
          
          public static List<Account> findAccounts(String searchTerm) {
            return [
              SELECT Id, Name, BillingCity
              FROM Account
              WHERE Name LIKE :searchTerm
              LIMIT 100
            ];
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);

      if (result.ast) {
        const classDecl = findFirstNodeOfType(result.ast, isClassDeclaration);
        expect(classDecl).not.toBeNull();
        if (classDecl && classDecl.members) {
          const methods = classDecl.members.filter((m) => isMethodDeclaration(m));
          expect(methods.length).toBeGreaterThanOrEqual(2);
        }
      }
    });

    it('should parse a trigger with multiple event handlers', () => {
      const apexCode = `
        trigger AccountTrigger on Account (before insert, before update, after insert, after update) {
          if (Trigger.isBefore) {
            if (Trigger.isInsert) {
              AccountTriggerHandler.handleBeforeInsert(Trigger.new);
            } else if (Trigger.isUpdate) {
              AccountTriggerHandler.handleBeforeUpdate(Trigger.new, Trigger.oldMap);
            }
          } else {
            if (Trigger.isInsert) {
              AccountTriggerHandler.handleAfterInsert(Trigger.new);
            } else if (Trigger.isUpdate) {
              AccountTriggerHandler.handleAfterUpdate(Trigger.new, Trigger.oldMap);
            }
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });
  });
});
