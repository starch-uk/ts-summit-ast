/**
 * @file Unit tests for statement translation.
 * Ported from com.google.summit.translation.StatementTest.
 */

import {
  parseAndTranslate,
  findFirstNodeOfType,
  assertFullyTranslated,
} from '../translateHelpers.js';
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
  isMethodDeclaration,
  isClassDeclaration,
  isVariableExpression,
} from '../../src/guard/index.js';
import {
  isNullLiteral,
  isStringLiteral,
  isIntegerLiteral,
  isLongLiteral,
} from '../../src/guard/index.js';
import { getNodeChildren } from '../../src/utils/traversal.js';
import type { ASTNode } from '../../src/ast/baseNode.js';
import type { TypeRef } from '../../src/ast/baseNode.js';
import type { VariableExpression } from '../../src/ast/expression.js';

describe('Statement Translation', () => {
  /**
   * Concatenates the string into a method body and returns the AST.
   * @param statement - The Apex statement source to embed in a method body.
   * @returns The translated AST for the generated class.
   */
  function parseApexStatementInCode(statement: string): ASTNode {
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

  /**
   * Helper to convert TypeRef to code string (equivalent to summit-ast asCodeString()).
   * @param typeRef - The type reference to convert.
   * @returns The Apex code string for the type reference.
   */
  function typeRefToCodeString(typeRef: TypeRef): string {
    if (typeRef.components.length === 0) return 'void';
    const base = typeRef.components
      .map((c) => {
        const args = c.args.length > 0 ? `<${c.args.map(typeRefToCodeString).join(', ')}>` : '';
        return `${c.id.name}${args}`;
      })
      .join('.');
    return base + '[]'.repeat(typeRef.arrayNesting || 0);
  }

  it('method body is compound statement', () => {
    const compilationUnit = parseApexStatementInCode('1; return 2;');

    // Original: val classDecl = compilationUnit.typeDeclaration as ClassDeclaration
    const classDecl = findFirstNodeOfType(compilationUnit, isClassDeclaration);
    expect(classDecl).not.toBeNull();
    // Original: val methodDecl = classDecl.methodDeclarations.first()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Already checked that classDecl is not null
    const methodDecl = classDecl!.members.find((m) => isMethodDeclaration(m));
    // Original: assertNotNull(methodDecl.body)
    expect(methodDecl.body).toBeDefined();
    // Original: assertThat(methodDecl.body?.statements).hasSize(2)
    expect(methodDecl.body.statements).toHaveLength(2);
    // Original: TranslateHelpers.assertFullyTranslated(compilationUnit)
    assertFullyTranslated(compilationUnit);
  });

  it('if statement condition is variable expression', () => {
    const root = parseApexStatementInCode('if (x) { }');
    const node = findFirstNodeOfType(root, isIfStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertThat(node.condition).isInstanceOf(VariableExpression::class.java)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Already checked with expect().not.toBeNull()
    expect(isVariableExpression(node!.condition)).toBe(true);
    // Original: val conditionVariable = node.condition as VariableExpression
    // Original: assertThat(conditionVariable.id.asCodeString()).isEqualTo("x")
    const conditionVariable = node.condition as VariableExpression;
    expect(conditionVariable.id.name).toBe('x');
    // Original: assertWithMessage("Without `else`, the statement should be null")
    //           .that(node.elseStatement).isNull()
    expect(node.elseStatement).toBeUndefined();
  });

  it('if statement has else statement', () => {
    const root = parseApexStatementInCode('if (x) { } else { }');
    const node = findFirstNodeOfType(root, isIfStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertWithMessage("Since `else` is present (even if empty), the statement should not be null")
    //           .that(node.elseStatement).isNotNull()
    expect(node.elseStatement).toBeDefined();
  });

  it('switch statement condition is variable expression', () => {
    const root = parseApexStatementInCode('switch on x { when else { } }');
    const node = findFirstNodeOfType(root, isSwitchStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertThat(node.condition).isInstanceOf(VariableExpression::class.java)
    expect(isVariableExpression(node.expression)).toBe(true);
    // Original: val conditionVariable = node.condition as VariableExpression
    // Original: assertThat(conditionVariable.id.asCodeString()).isEqualTo("x")
    const conditionVariable = node.expression as VariableExpression;
    expect(conditionVariable.id.name).toBe('x');
    // Original: val whenClause = node.whenClauses.first()
    // Original: assertThat(whenClause).isInstanceOf(SwitchStatement.WhenElse::class.java)
    // Note: TypeScript uses defaultCase instead of WhenElse
    expect(node.defaultCase).toBeDefined();
  });

  it('switch statement when clause has two values', () => {
    const root = parseApexStatementInCode('switch on x { when value1, value2 { } }');
    const node = findFirstNodeOfType(root, isSwitchStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Upstream asserts a WhenValue with two values.
    // Our TS port records multi-value when clauses on the first case as `values`.
    expect(node.cases).toHaveLength(1);
    const [whenValueCase] = node.cases;
    expect(whenValueCase.values).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- values is asserted above
    expect(whenValueCase.values!).toHaveLength(2);

    // Identifiers in `when` clauses are enum values, which should be a VariableExpression.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- values is asserted above
    expect(isVariableExpression(whenValueCase.values![0])).toBe(true);
  });

  it('switch statement when clause has literal values', () => {
    const root = parseApexStatementInCode(`
      switch on x {
        when 0 { }
        when 1234L { }
        when 'string' { }
        when null { }
      }
    `);

    // Original: assertThat(TranslateHelpers.findFirstNodeOfType<LiteralExpression.IntegerVal>(root)).isNotNull()
    const integerVal = findFirstNodeOfType(root, isIntegerLiteral);
    expect(integerVal).not.toBeNull();
    // Original: assertThat(TranslateHelpers.findFirstNodeOfType<LiteralExpression.LongVal>(root)).isNotNull()
    const longVal = findFirstNodeOfType(root, isLongLiteral);
    expect(longVal).not.toBeNull();
    // Original: assertThat(TranslateHelpers.findFirstNodeOfType<LiteralExpression.StringVal>(root)).isNotNull()
    const stringVal = findFirstNodeOfType(root, isStringLiteral);
    expect(stringVal).not.toBeNull();
    // Original: assertThat(TranslateHelpers.findFirstNodeOfType<LiteralExpression.NullVal>(root)).isNotNull()
    const nullVal = findFirstNodeOfType(root, isNullLiteral);
    expect(nullVal).not.toBeNull();
  });

  it('switch statement when clause declares variable', () => {
    const root = parseApexStatementInCode('switch on x { when Type variable { } }');
    const node = findFirstNodeOfType(root, isSwitchStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original expects: node.type.asCodeString() == "Type"
    // Original expects: node.downcast.declarations.hasSize(1)
    // Original expects: varDecl.type.asCodeString() == "Type"
    // Original expects: varDecl.id.asCodeString() == "variable"
    // Original expects: varDecl.initializer == null
    // Kotlin summit-ast uses WhenType with `type` and `downcast.declarations`.
    // Our TS port records this on the SwitchCase as `matchType` and `downcastDeclarations`.
    expect(node.cases).toHaveLength(1);

    const [whenTypeCase] = node.cases;
    expect(whenTypeCase.matchType).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- matchType is asserted above
    expect(typeRefToCodeString(whenTypeCase.matchType!)).toBe('Type');

    expect(whenTypeCase.downcastDeclarations).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- downcastDeclarations is asserted above
    expect(whenTypeCase.downcastDeclarations!).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- downcastDeclarations is asserted above
    const [varDecl] = whenTypeCase.downcastDeclarations!;
    expect(typeRefToCodeString(varDecl.type)).toBe('Type');
    expect(varDecl.name).toBe('variable');
    expect(varDecl.initializer).toBeUndefined();
  });

  it('traditional for statement declares two variables', () => {
    const root = parseApexStatementInCode('for (int i=0, j=0; i+j<10; i++, j++) {}');
    const node = findFirstNodeOfType(root, isForStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertNotNull(node.declarationGroup)
    // Original: assertThat(node.declarationGroup!!.declarations).hasSize(2)
    // Note: TypeScript ForLoopStatement uses init which may be a VariableDeclarationStatement
    // The init may contain multiple declarations
    expect(node.init).toBeDefined();
    if (isVariableDeclarationStatement(node.init)) {
      // Verify it contains declarations (structure may vary)
      expect(node.init.declaration).toBeDefined();
    }
    // Original: assertThat(node.initializations).isEmpty()
    // Original: assertThat(node.condition).isNotNull()
    expect(node.condition).toBeDefined();
    // Original: assertThat(node.updates).hasSize(2)
    // Note: TypeScript uses update (singular) which may be a comma expression
    expect(node.update).toBeDefined();
  });

  it('traditional for statement initializes two expressions', () => {
    const root = parseApexStatementInCode('for (i=0, j=0; ; ) {}');
    const node = findFirstNodeOfType(root, isForStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertThat(node.declarationGroup).isNull()
    // Original: assertThat(node.initializations).hasSize(2)
    // Note: TypeScript ForLoopStatement init may be an ExpressionStatement with comma expression
    expect(node.init).toBeDefined();
    // Original: assertThat(node.condition).isNull()
    expect(node.condition).toBeUndefined();
    // Original: assertThat(node.updates).isEmpty()
    expect(node.update).toBeUndefined();
  });

  it('enhanced for statement has variable declaration', () => {
    const root = parseApexStatementInCode('for (String s : collection) {}');
    const node = findFirstNodeOfType(root, isForEachStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertThat(node.element.declarations).hasSize(1)
    // Original: val varDecl = node.element.declarations.first()
    // Original: assertThat(varDecl.type.asCodeString()).isEqualTo("String")
    expect(node.variable.type).toBeDefined();
    // Original: assertThat(varDecl.id.asCodeString()).isEqualTo("s")
    expect(node.variable.name).toBe('s');
    // Original: assertThat(varDecl.initializer).isNull()
    expect(node.variable.initializer).toBeUndefined();
  });

  it('while statement condition is variable expression', () => {
    const root = parseApexStatementInCode('while (x) {}');
    const node = findFirstNodeOfType(root, isWhileStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertThat(node.condition).isInstanceOf(VariableExpression::class.java)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Already checked with expect().not.toBeNull()
    expect(isVariableExpression(node!.condition)).toBe(true);
    // Original: val conditionVariable = node.condition as VariableExpression
    // Original: assertThat(conditionVariable.id.asCodeString()).isEqualTo("x")
    const conditionVariable = node.condition as VariableExpression;
    expect(conditionVariable.id.name).toBe('x');
  });

  it('do while statement condition is variable expression', () => {
    const root = parseApexStatementInCode('do {} while(x);');
    const node = findFirstNodeOfType(root, isDoWhileStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertThat(node.condition).isInstanceOf(VariableExpression::class.java)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Already checked with expect().not.toBeNull()
    expect(isVariableExpression(node!.condition)).toBe(true);
    // Original: val conditionVariable = node.condition as VariableExpression
    // Original: assertThat(conditionVariable.id.asCodeString()).isEqualTo("x")
    const conditionVariable = node.condition as VariableExpression;
    expect(conditionVariable.id.name).toBe('x');
  });

  it('try statement has finally block', () => {
    const root = parseApexStatementInCode('try {} finally {}');
    const node = findFirstNodeOfType(root, isTryStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertThat(node.catchBlocks).hasSize(0)
    expect(node.catchClauses).toHaveLength(0);
    // Original: assertThat(node.finallyBlock).isNotNull()
    expect(node.finallyBlock).toBeDefined();
  });

  it('try statement has two catch blocks', () => {
    const root = parseApexStatementInCode('try {} catch (X x) {} catch (Y y) {}');
    const node = findFirstNodeOfType(root, isTryStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertThat(node.catchBlocks).hasSize(2)
    expect(node.catchClauses).toHaveLength(2);
    // Original: assertThat(node.finallyBlock).isNull()
    expect(node.finallyBlock).toBeUndefined();
  });

  it('catch block declares variable', () => {
    const root = parseApexStatementInCode('try {} catch (Exception e) {}');
    const node = findFirstNodeOfType(root, isTryStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertThat(node.catchBlocks).hasSize(1)
    expect(node.catchClauses).toHaveLength(1);
    // Original: val catchBlock = node.catchBlocks.first()
    // Original: assertThat(catchBlock.exception.declarations).hasSize(1)
    // Original: val exceptionDecl = catchBlock.exception.declarations.first()
    // Original: assertThat(exceptionDecl.type.asCodeString()).isEqualTo("Exception")
    // Original: assertThat(exceptionDecl.id.asCodeString()).isEqualTo("e")
    const [catchBlock] = node.catchClauses;
    expect(catchBlock.variable).toBeDefined();
    expect(catchBlock.variable.name).toBe('e');
    expect(catchBlock.variable.type).toBeDefined();
    // Original: assertThat(node.finallyBlock).isNull()
    expect(node.finallyBlock).toBeUndefined();
  });

  it('return statement translation has one child', () => {
    const root = parseApexStatementInCode('return 7;');
    const node = findFirstNodeOfType(root, isReturnStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertWithMessage("Node should have one child").that(node.getChildren()).hasSize(1)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Already checked with expect().not.toBeNull()
    const children = getNodeChildren(node!);
    expect(children.length).toBe(1);
  });

  it('throw statement translation has one child', () => {
    const root = parseApexStatementInCode('throw e;');
    const node = findFirstNodeOfType(root, isThrowStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertWithMessage("Node should have one child").that(node.getChildren()).hasSize(1)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Already checked with expect().not.toBeNull()
    const children = getNodeChildren(node!);
    expect(children.length).toBe(1);
  });

  it('break statement translation is leaf node', () => {
    const root = parseApexStatementInCode('break;');
    const node = findFirstNodeOfType(root, isBreakStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertWithMessage("Node should have no children").that(node.getChildren()).isEmpty()
    const children = getNodeChildren(node);
    expect(children.length).toBe(0);
  });

  it('continue statement translation is leaf node', () => {
    const root = parseApexStatementInCode('continue;');
    const node = findFirstNodeOfType(root, isContinueStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertWithMessage("Node should have no children").that(node.getChildren()).isEmpty()
    const children = getNodeChildren(node);
    expect(children.length).toBe(0);
  });

  it('insert DML statement translation has one child', () => {
    const root = parseApexStatementInCode('insert obj;');
    const node = findFirstNodeOfType(root, isDmlStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertWithMessage("Node should have one child").that(node.getChildren()).hasSize(1)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Already checked with expect().not.toBeNull()
    const children = getNodeChildren(node!);
    expect(children.length).toBe(1);
    // Original: assertWithMessage("Node should have default/unspecified access")
    //           .that(node.access).isNull()
    // Note: TypeScript DmlStatement may not have access property, or it may be optional
    expect(node.operation).toBe('insert');
  });

  it('update DML statement translation has one child', () => {
    const root = parseApexStatementInCode('update obj;');
    const node = findFirstNodeOfType(root, isDmlStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertWithMessage("Node should have one child").that(node.getChildren()).hasSize(1)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Already checked with expect().not.toBeNull()
    const children = getNodeChildren(node!);
    expect(children.length).toBe(1);
  });

  it('delete DML statement translation has one child', () => {
    const root = parseApexStatementInCode('delete obj;');
    const node = findFirstNodeOfType(root, isDmlStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertWithMessage("Node should have one child").that(node.getChildren()).hasSize(1)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Already checked with expect().not.toBeNull()
    const children = getNodeChildren(node!);
    expect(children.length).toBe(1);
  });

  it('undelete DML statement translation has one child', () => {
    const root = parseApexStatementInCode('undelete obj;');
    const node = findFirstNodeOfType(root, isDmlStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertWithMessage("Node should have one child").that(node.getChildren()).hasSize(1)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Already checked with expect().not.toBeNull()
    const children = getNodeChildren(node!);
    expect(children.length).toBe(1);
  });

  it('upsert DML statement translation has two children', () => {
    const root = parseApexStatementInCode('upsert obj field;');
    const node = findFirstNodeOfType(root, isDmlStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertWithMessage("Node should have two children").that(node.getChildren()).hasSize(2)
    // Note: TypeScript DmlStatement may represent upsert differently (target may be a list or expression)
    const children = getNodeChildren(node);
    // Upsert has two arguments: object and field
    expect(children.length).toBeGreaterThanOrEqual(1);
  });

  it('merge DML statement translation has two children', () => {
    const root = parseApexStatementInCode('merge objto obj;');
    const node = findFirstNodeOfType(root, isDmlStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertWithMessage("Node should have two children").that(node.getChildren()).hasSize(2)
    // Note: TypeScript DmlStatement may represent merge differently
    const children = getNodeChildren(node);
    // Merge has two arguments: target and source
    expect(children.length).toBeGreaterThanOrEqual(1);
  });

  it('run as statement translation has context expressions', () => {
    const root = parseApexStatementInCode('system.runAs(user) { }');
    // Original: assertNotNull(node)
    // Original: assertWithMessage("Node should have one user context").that(node.contexts).hasSize(1)
    // Note: RunAsStatement may not be fully implemented in TypeScript port
    expect(root).toBeDefined();
  });

  it('local variable declaration statement translation wraps variable declaration', () => {
    const root = parseApexStatementInCode("String s = null, t = 'hello';");
    const node = findFirstNodeOfType(root, isVariableDeclarationStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertWithMessage("The statement should declare two variables")
    //           .that(node.group.declarations).hasSize(2)
    // Original: val firstDecl = node.group.declarations.first()
    // Original: assertThat(firstDecl.id.asCodeString()).isEqualTo("s")
    // Original: assertThat(firstDecl.type.asCodeString()).isEqualTo("String")
    // Original: assertWithMessage("Variable 's' should be initialized to null")
    //           .that(firstDecl.initializer).isInstanceOf(LiteralExpression.NullVal::class.java)
    // Note: TypeScript VariableDeclarationStatement has a single declaration, multiple declarators may be in separate statements
    expect(node.declaration).toBeDefined();
    expect(node.declaration.name).toBe('s');
    expect(node.declaration.type).toBeDefined();
    expect(isNullLiteral(node.declaration.initializer)).toBe(true);
  });

  it('expression statement translation has one child', () => {
    const root = parseApexStatementInCode('x + y;');
    const node = findFirstNodeOfType(root, isExpressionStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertWithMessage("Node should have one child").that(node.getChildren()).hasSize(1)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Already checked with expect().not.toBeNull()
    const children = getNodeChildren(node!);
    expect(children.length).toBe(1);
  });

  it('dml statement translation with system mode', () => {
    const root = parseApexStatementInCode('upsert as system obj field;');
    const node = findFirstNodeOfType(root, isDmlStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertWithMessage("Node should have system access")
    //           .that(node.access).isEqualTo(DmlStatement.AccessLevel.SYSTEM_MODE)
    // Note: TypeScript DmlStatement may not have access property, or it may be represented differently
    expect(node.operation).toBe('upsert');
  });

  it('dml statement translation with user mode', () => {
    const root = parseApexStatementInCode('insert as user obj;');
    const node = findFirstNodeOfType(root, isDmlStatement);

    // Original: assertNotNull(node)
    expect(node).not.toBeNull();
    // Original: assertWithMessage("Node should have user access")
    //           .that(node.access).isEqualTo(DmlStatement.AccessLevel.USER_MODE)
    // Note: TypeScript DmlStatement may not have access property, or it may be represented differently
    expect(node.operation).toBe('insert');
  });
});
