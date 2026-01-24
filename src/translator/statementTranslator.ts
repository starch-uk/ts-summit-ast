/**
 * @file Statement translation helpers.
 * Translates parse tree statement nodes to AST statement nodes.
 */

import type { ParseTreeNode } from '../parser/parseTree.js';
import type {
  Statement,
  CompoundStatement,
  SwitchCase,
  CatchClause,
  ExpressionStatement,
  VariableDeclarationStatement,
} from '../ast/statement.js';
import type { Expression } from '../ast/expression.js';
import type { VariableDeclaration } from '../ast/declaration.js';
import type { TypeRef } from '../ast/baseNode.js';
import type { TranslateContext } from './translateUtil.js';
import { TranslationError } from './translateUtil.js';
import { NodeFactory } from './nodeFactory.js';

/**
 * @param ctx
 * @param node
 */
export function translateIfStatement(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Statement {
  // Try to get named properties first (for integration tests)
  let condition = ctx.getChildExpression(node, 'condition', true);
  let thenStatement = ctx.getChildStatement(node, 'thenStatement', 'thenBody', true);
  let elseStatement = ctx.getChildStatement(node, 'elseStatement', 'elseBody', true);

  // If named properties not found, try positional children (for parser output)
  if (!condition || !thenStatement) {
    const children = ctx.getChildren(node);

    const minimumChildrenCount = 2;
    if (children.length < minimumChildrenCount) {
      throw new TranslationError('If statement requires at least condition and then body', node);
    }

    if (!condition) {
      const zeroIndex = 0;
      const conditionChild = children[zeroIndex];
      const cond = ctx.tryTranslateExpression(conditionChild, conditionChild.type.toLowerCase());
      if (!cond) {
        throw new TranslationError('If statement requires a condition', node);
      }
      condition = cond;
    }

    if (!thenStatement) {
      const secondChildIndex = 1;
      const thenChild = children[secondChildIndex];
      const then = ctx.tryTranslateStatement(thenChild, thenChild.type.toLowerCase());
      if (!then) {
        throw new TranslationError('If statement requires a then body', node);
      }
      thenStatement = then;
    }

    const elseChildIndex = 2;
    if (!elseStatement && children.length > elseChildIndex) {
      const elseChild = children[elseChildIndex];
      const els = ctx.tryTranslateStatement(elseChild, elseChild.type.toLowerCase());
      elseStatement = els ?? undefined;
    }
  }

  return NodeFactory.createIfStatement(
    condition,
    thenStatement,
    elseStatement,
    ctx.getLocationOption(node)
  );
}

/**
 * @param ctx
 * @param node
 */
export function translateWhileLoopStatement(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Statement {
  // While statement has children: [condition, body]
  const children = ctx.getChildren(node);

  const zeroIndex = 0;
  const conditionChild = children[zeroIndex];
  const condition = ctx.tryTranslateExpression(conditionChild, conditionChild.type.toLowerCase());
  if (!condition) {
    throw new TranslationError('While statement requires a condition', node);
  }

  const secondChildIndex = 1;
  const bodyChild = children[secondChildIndex];
  const body = ctx.tryTranslateStatement(bodyChild, bodyChild.type.toLowerCase());
  if (!body) {
    throw new TranslationError('While statement requires a body', node);
  }

  return NodeFactory.createWhileLoopStatement(condition, body, ctx.getLocationOption(node));
}

/**
 * @param ctx
 * @param node
 */
export function translateReturnStatement(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Statement {
  // Return statement has children: [expression?]
  const children = ctx.getChildren(node);

  const emptyArrayLength = 0;
  const zeroIndex = 0;
  const expression =
    children.length > emptyArrayLength
      ? (() => {
          const returnChild = children[zeroIndex];
          return (
            ctx.tryTranslateExpression(returnChild, returnChild.type.toLowerCase()) ?? undefined
          );
        })()
      : undefined;

  return NodeFactory.createReturnStatement(expression, ctx.getLocationOption(node));
}

/**
 * @param ctx
 * @param node
 */
export function translateCompoundStatement(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Statement {
  const statements = ctx
    .getChildren(node)
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Callback parameter is effectively readonly
    .filter((child: Readonly<ParseTreeNode>) => {
      // Filter out type-related structural nodes that shouldn't be translated as statements
      const childType = child.type.toLowerCase();
      return (
        childType !== 'base_type' &&
        childType !== 'array_dimensions' &&
        childType !== 'type_arguments' &&
        childType !== 'type_parameters'
      );
    })
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Callback parameter is effectively readonly
    .map((child: Readonly<ParseTreeNode>) => {
      try {
        const translated = ctx.translateNode(child);
        if (
          translated.kind === 'IfStatement' ||
          translated.kind === 'ForLoopStatement' ||
          translated.kind === 'EnhancedForLoopStatement' ||
          translated.kind === 'WhileLoopStatement' ||
          translated.kind === 'DoWhileLoopStatement' ||
          translated.kind === 'SwitchStatement' ||
          translated.kind === 'TryStatement' ||
          translated.kind === 'ReturnStatement' ||
          translated.kind === 'BreakStatement' ||
          translated.kind === 'ContinueStatement' ||
          translated.kind === 'ThrowStatement' ||
          translated.kind === 'CompoundStatement' ||
          translated.kind === 'ExpressionStatement' ||
          translated.kind === 'VariableDeclarationStatement' ||
          translated.kind === 'DmlStatement'
        ) {
          return translated as Statement;
        }
        return null;
      } catch {
        // If translation fails, try to translate as statement or expression
        const childReadonly = child;
        const stmt = ctx.tryTranslateStatement(childReadonly, childReadonly.type.toLowerCase());
        if (stmt) return stmt;
        const expr = ctx.tryTranslateExpression(childReadonly, childReadonly.type.toLowerCase());
        if (expr) {
          return NodeFactory.createExpressionStatement(expr, ctx.getLocationOption(child));
        }
        // Skip nodes that can't be translated
        return null;
      }
    })
    .filter((stmt): stmt is Statement => stmt !== null);

  return NodeFactory.createCompoundStatement(statements, ctx.getLocationOption(node));
}

/**
 * @param ctx
 * @param node
 */
export function translateExpressionStatement(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Statement {
  // Expression statement has children: [expression]
  const children = ctx.getChildren(node);

  const emptyArrayLength = 0;
  if (children.length === emptyArrayLength) {
    throw new TranslationError('Expression statement requires an expression', node);
  }

  const [firstChild] = children;
  const firstChildReadonly = firstChild;
  const expression = ctx.tryTranslateExpression(
    firstChildReadonly,
    firstChildReadonly.type.toLowerCase()
  );
  if (!expression) {
    throw new TranslationError('Expression statement requires an expression', node);
  }

  return NodeFactory.createExpressionStatement(expression, ctx.getLocationOption(node));
}

/**
 * @param ctx
 * @param node
 */
export function translateForLoopStatement(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Statement {
  // Try positional children first (parser output structure: [init?, condition?, update?, body])
  const children = ctx.getChildren(node);
  let init: Statement | undefined = undefined;
  let condition: Expression | undefined = undefined;
  let update: Expression | undefined = undefined;
  let body: Statement | undefined = undefined;

  // Parse structure: [init?, condition?, update?, body]
  // Body is always the last child

  const emptyArrayLength = 0;
  if (children.length > emptyArrayLength) {
    const lastElementOffset = 1;
    const lastChild = children[children.length - lastElementOffset];
    const stmt = ctx.tryTranslateStatement(lastChild, lastChild.type.toLowerCase());
    if (stmt) {
      body = stmt;
    }
  }

  // Init is first child (if present and not body)
  // Try to get init as expression first (for comma expressions like i=0, j=0)
  // Then fall back to statement translation

  const minimumChildrenForInit = 2;
  if (children.length >= minimumChildrenForInit) {
    const [initChild] = children;
    const initChildReadonly = initChild;
    // First try as expression (for comma-separated assignments)
    const initExpr = ctx.tryTranslateExpression(
      initChildReadonly,
      initChildReadonly.type.toLowerCase()
    );
    if (initExpr) {
      init = NodeFactory.createExpressionStatement(
        initExpr,
        ctx.getLocationOption(initChildReadonly)
      );
    } else {
      // Fall back to statement translation
      const initStmt = ctx.tryTranslateStatement(
        initChildReadonly,
        initChildReadonly.type.toLowerCase()
      );
      if (initStmt) {
        init = initStmt;
      }
    }
  }

  // Condition is second child (if present)

  const minimumChildrenForCondition = 3;
  if (children.length >= minimumChildrenForCondition) {
    const secondChildIndex = 1;
    const conditionChild = children[secondChildIndex];
    condition =
      ctx.tryTranslateExpression(conditionChild, conditionChild.type.toLowerCase()) ?? undefined;
  }

  // Update is third child (if present)

  const minimumChildrenForUpdate = 4;
  if (children.length >= minimumChildrenForUpdate) {
    const thirdChildIndex = 2;
    const updateChild = children[thirdChildIndex];
    update = ctx.tryTranslateExpression(updateChild, updateChild.type.toLowerCase()) ?? undefined;
  }

  // Fallback to named properties if positional didn't work
  init ??= ctx.getChildStatement(node, 'init', undefined, true);
  condition ??= ctx.getChildExpression(node, 'condition', true);
  update ??= ctx.getChildExpression(node, 'update', true);
  // When update is a block (multiple expressions like i++, j++), tryTranslateExpression returns null.
  // Extract the first expression from the block's expression_statement children.

  const minimumChildrenForUpdateFallback = 4;
  if (!update && children.length >= minimumChildrenForUpdateFallback) {
    const [, , updateNode] = children;

    if ((updateNode as { type?: string }).type === 'block') {
      const blockChildren = ctx.getChildren(updateNode);
      for (const c of blockChildren) {
        const cReadonly = c;
        const stmtChildren = ctx.getChildren(cReadonly);

        const emptyArrayLengthLocal = 0;
        if (stmtChildren.length > emptyArrayLengthLocal) {
          const [inner] = stmtChildren;
          const innerReadonly = inner;
          const expr = ctx.tryTranslateExpression(
            innerReadonly,
            (innerReadonly as { type?: string }).type?.toLowerCase() ?? ''
          );
          if (expr) {
            update = expr;
            break;
          }
        }
      }
    }
  }
  body ??= ctx.getChildStatement(node, 'body', undefined, false);

  if (!body) {
    throw new TranslationError('For statement requires a body', node);
  }

  let initStatement: ExpressionStatement | VariableDeclarationStatement | undefined = undefined;
  if (init) {
    if (init.kind === 'ExpressionStatement') {
      initStatement = init as ExpressionStatement;
    } else if (init.kind === 'VariableDeclarationStatement') {
      initStatement = init as VariableDeclarationStatement;
    } else if (init.kind === 'CompoundStatement') {
      // If init is a CompoundStatement, try to extract the first ExpressionStatement or VariableDeclarationStatement from it
      // This handles cases where the parser wraps comma-separated expressions or declarations in a block
      const compoundInit = init as CompoundStatement;
      if (compoundInit.statements.length > 0) {
        const [firstStmt] = compoundInit.statements;
        if (firstStmt.kind === 'ExpressionStatement') {
          initStatement = firstStmt as ExpressionStatement;
        } else if (firstStmt.kind === 'VariableDeclarationStatement') {
          initStatement = firstStmt as VariableDeclarationStatement;
        }
      }
    }
  }
  return NodeFactory.createForLoopStatement(
    body,
    initStatement,
    condition,
    update,
    ctx.getLocationOption(node)
  );
}

/**
 * @param ctx
 * @param node
 */
export function translateEnhancedForLoopStatement(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Statement {
  // Try to get named properties first (for integration tests)
  let variable = ctx.getChild(node, 'variable');
  let iterable = ctx.getChildExpression(node, 'iterable', true);
  let body = ctx.getChildStatement(node, 'body', undefined, true);

  // If named properties not found, try positional children (for parser output)
  // Parser structure: [type, name, iterable, body]
  if (!variable || !iterable || !body) {
    const children = ctx.getChildren(node);

    const minimumChildrenForForEach = 4;
    if (children.length < minimumChildrenForForEach) {
      throw new TranslationError(
        'For-each statement requires type, name, iterable, and body',
        node
      );
    }

    // First child is type, second is name, third is iterable, fourth is body

    const [typeNode, nameNode, iterableNode, bodyNode] = children;

    if (!variable) {
      // Construct variable declaration from type and name
      const varType = ctx.tryTranslateType(typeNode);
      if (!varType) {
        throw new TranslationError('For-each statement requires a valid type', typeNode);
      }
      const varName = ctx.getText(nameNode) ?? ctx.getProperty<string>(nameNode, 'name') ?? '';
      if (!varName) {
        throw new TranslationError('For-each statement requires a variable name', nameNode);
      }
      variable = {
        children: [typeNode, nameNode],
        location: nameNode.location,
        type: 'variable_declaration',
      };
    }

    if (!iterable) {
      const iterableExpr = ctx.tryTranslateExpression(
        iterableNode,
        iterableNode.type.toLowerCase()
      );
      if (!iterableExpr) {
        throw new TranslationError('For-each statement requires an iterable', iterableNode);
      }
      iterable = iterableExpr;
    }

    if (!body) {
      const bodyStmt = ctx.tryTranslateStatement(bodyNode, bodyNode.type.toLowerCase());
      if (!bodyStmt) {
        throw new TranslationError('For-each statement requires a body', bodyNode);
      }
      body = bodyStmt;
    }
  }

  // Translate variable declaration if we have it
  let varDecl: VariableDeclaration | null = null;
  const variableReadonly = variable;
  const decl = ctx.tryTranslateDeclaration(variableReadonly, variableReadonly.type.toLowerCase());
  if (decl?.kind === 'VariableDeclaration') {
    varDecl = decl as VariableDeclaration;
  } else {
    // If translation failed, try to construct from children
    const varChildren = ctx.getChildren(variableReadonly);

    const minimumChildrenForVariable = 2;
    if (varChildren.length >= minimumChildrenForVariable) {
      const [typeChild, varNameNode] = varChildren;
      const varType = ctx.tryTranslateType(typeChild);
      const varName =
        ctx.getText(varNameNode) ?? ctx.getProperty<string>(varNameNode, 'name') ?? '';
      if (varType && varName) {
        varDecl = NodeFactory.createVariableDeclaration(
          varName,
          varType,
          undefined,
          undefined,
          ctx.getLocationOption(varNameNode)
        );
      }
    }
  }

  if (!varDecl) {
    throw new TranslationError('For-each statement requires a variable', node);
  }

  return NodeFactory.createEnhancedForLoopStatement(
    varDecl,
    iterable,
    body,
    ctx.getLocationOption(node)
  );
}

/**
 * @param ctx
 * @param node
 */
export function translateDoWhileLoopStatement(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Statement {
  // Do-while statement has children: [body, condition]
  const children = ctx.getChildren(node);

  const minimumChildrenForDoWhile = 2;
  if (children.length < minimumChildrenForDoWhile) {
    throw new TranslationError('Do-while statement requires body and condition', node);
  }

  const [bodyNode, conditionNode] = children;

  const body = ctx.tryTranslateStatement(bodyNode, bodyNode.type.toLowerCase());

  if (!body) {
    throw new TranslationError('Do-while statement requires a body', node);
  }

  const condition = ctx.tryTranslateExpression(conditionNode, conditionNode.type.toLowerCase());
  if (!condition) {
    throw new TranslationError('Do-while statement requires a condition', node);
  }

  return NodeFactory.createDoWhileLoopStatement(body, condition, ctx.getLocationOption(node));
}

/**
 * @param ctx
 * @param node
 */
export function translateSwitchStatement(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Statement {
  let expression = ctx.getChildExpression(node, 'expression', true);
  if (!expression) {
    // Try positional children: switch statement has [expression, cases?, defaultCase?]
    const children = ctx.getChildren(node);
    const emptyArrayLength = 0;
    if (children.length > emptyArrayLength) {
      const firstChild = children[0];
      expression =
        ctx.tryTranslateExpression(firstChild, firstChild.type.toLowerCase()) ?? undefined;
    }
  }
  if (!expression) {
    throw new TranslationError('Switch statement requires an expression', node);
  }
  const casesNode = ctx.getChild(node, 'cases');
  const cases: SwitchCase[] = [];
  if (casesNode) {
    const caseChildren = ctx.getChildren(casesNode);
    for (const caseNode of caseChildren) {
      const caseNodeReadonly = caseNode;
      // Apex supports both `when <expr>` and `when <Type> <variable>` (type match / downcast).
      // For `type_match`, the parse tree contains a `type_match` child with `type` and `name`.
      let matchType: TypeRef | undefined = undefined;
      let downcastDeclarations: VariableDeclaration[] | undefined = undefined;

      // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Callback parameter is effectively readonly
      const typeMatchNode = ctx.getChildren(caseNodeReadonly).find((c) => c.type === 'type_match');
      if (typeMatchNode) {
        // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Callback parameter is effectively readonly
        const typeNode = ctx.getChildren(typeMatchNode).find((c) => c.type === 'type') ?? null;
        // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Callback parameter is effectively readonly
        const nameNode = ctx.getChildren(typeMatchNode).find((c) => c.type === 'name') ?? null;

        if (typeNode) {
          matchType = ctx.tryTranslateType(typeNode) ?? undefined;
        }

        const varName = nameNode ? (ctx.getText(nameNode) ?? undefined) : undefined;
        if (matchType && typeof varName === 'string' && varName.length > 0) {
          downcastDeclarations = [
            NodeFactory.createVariableDeclaration(
              varName,
              matchType,
              undefined,
              undefined,
              ctx.getLocationOption(typeMatchNode)
            ),
          ];
        }
      }

      let values: Expression[] | undefined = undefined;
      let value = ctx.getChildExpression(caseNodeReadonly, 'value', true);
      // Apex "when value" puts the value expression(s) as first children before the 'statements' node
      if (!value) {
        const ch = ctx.getChildren(caseNodeReadonly);

        const valueNodes = ch.filter(
          (c: Readonly<ParseTreeNode>) => (c as { type?: string }).type !== 'statements'
        );
        if (valueNodes.length > 0) {
          const translatedValues = valueNodes
            // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Callback parameter is effectively readonly
            .map((vn) => {
              const valueTypeProperty = (vn as { type?: string }).type;
              const valueType =
                typeof valueTypeProperty === 'string' ? valueTypeProperty.toLowerCase() : '';
              return ctx.tryTranslateExpression(vn, valueType);
            })
            .filter((v): v is Expression => v !== null);

          if (translatedValues.length > 0) {
            if (translatedValues.length === 1) {
              [value] = translatedValues;
            } else {
              values = translatedValues;
              [value] = translatedValues;
            }
          }
        }
      }
      // Get statements - try property first, then look for child with type 'statements'
      let statementsNode = ctx.getChild(caseNodeReadonly, 'statements');
      if (!statementsNode) {
        // Look for a child with type 'statements' in the children array
        const children = ctx.getChildren(caseNodeReadonly);

        statementsNode =
          children.find((child: Readonly<ParseTreeNode>) => child.type === 'statements') ?? null;
      }
      const statements = statementsNode
        ? ctx
            .getChildren(statementsNode)
            // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Callback parameter is effectively readonly
            .map((child: Readonly<ParseTreeNode>) => {
              const translated = ctx.translateNode(child);
              if (
                translated.kind === 'IfStatement' ||
                translated.kind === 'ForLoopStatement' ||
                translated.kind === 'WhileLoopStatement' ||
                translated.kind === 'DoWhileLoopStatement' ||
                translated.kind === 'SwitchStatement' ||
                translated.kind === 'TryStatement' ||
                translated.kind === 'ReturnStatement' ||
                translated.kind === 'BreakStatement' ||
                translated.kind === 'ContinueStatement' ||
                translated.kind === 'ThrowStatement' ||
                translated.kind === 'CompoundStatement' ||
                translated.kind === 'ExpressionStatement' ||
                translated.kind === 'VariableDeclarationStatement' ||
                translated.kind === 'DmlStatement'
              ) {
                return translated as Statement;
              }
              return null;
            })
            .filter((stmt): stmt is Statement => stmt !== null)
        : [];
      cases.push({
        downcastDeclarations,
        kind: 'SwitchCase',
        location: caseNode.location,
        matchType,
        statements,
        value,
        values,
      });
    }
  }
  let defaultNode = ctx.getChild(node, 'defaultCase', 'default');
  let defaultCase: SwitchCase | undefined = undefined;
  if (!defaultNode) {
    // Try positional children: switch statement has [expression, cases?, defaultCase?]
    const children = ctx.getChildren(node);
    // Default case is the last child if it's a switch_case node
    if (children.length > 0) {
      const lastChild = children[children.length - 1];
      if (lastChild.type === 'switch_case') {
        // Check if it's a default case (no value expressions, just statements)
        const caseChildren = ctx.getChildren(lastChild);
        const hasValueExpressions = caseChildren.some(
          (c) => c.type !== 'statements' && c.type !== 'type_match'
        );
        if (!hasValueExpressions) {
          defaultNode = lastChild;
        }
      }
    }
  }
  if (defaultNode) {
    // Get statements - try property first, then look for child with type 'statements'
    let statementsNode = ctx.getChild(defaultNode, 'statements');
    if (!statementsNode) {
      // Look for a child with type 'statements' in the children array
      const children = ctx.getChildren(defaultNode);

      statementsNode =
        children.find((child: Readonly<ParseTreeNode>) => child.type === 'statements') ?? null;
    }
    const statements = statementsNode
      ? ctx
          .getChildren(statementsNode)
          // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Callback parameter is effectively readonly
          .map((child: Readonly<ParseTreeNode>) => {
            const translated = ctx.translateNode(child);
            if (
              translated.kind === 'IfStatement' ||
              translated.kind === 'ForLoopStatement' ||
              translated.kind === 'WhileLoopStatement' ||
              translated.kind === 'DoWhileLoopStatement' ||
              translated.kind === 'SwitchStatement' ||
              translated.kind === 'TryStatement' ||
              translated.kind === 'ReturnStatement' ||
              translated.kind === 'BreakStatement' ||
              translated.kind === 'ContinueStatement' ||
              translated.kind === 'ThrowStatement' ||
              translated.kind === 'CompoundStatement' ||
              translated.kind === 'ExpressionStatement' ||
              translated.kind === 'VariableDeclarationStatement' ||
              translated.kind === 'DmlStatement'
            ) {
              return translated as Statement;
            }
            return null;
          })
          .filter((stmt): stmt is Statement => stmt !== null)
      : [];
    defaultCase = {
      kind: 'SwitchCase',
      location: defaultNode.location,
      statements,
      value: undefined,
    };
  }

  return NodeFactory.createSwitchStatement(
    expression,
    cases,
    defaultCase,
    ctx.getLocationOption(node)
  );
}

/**
 * @param ctx
 * @param node
 */
export function translateTryStatement(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Statement {
  // Try to get named properties first (for integration tests)
  let tryBlock = ctx.getChild(node, 'tryBlock', 'try');
  let catchClausesNode = ctx.getChild(node, 'catch_clauses', 'catchClauses');
  let finallyBlock = ctx.getChild(node, 'finallyBlock', 'finally');

  // If named properties not found, try positional children (for parser output)
  // Parser structure: [tryBlock, catch_clauses?, finallyBlock?]
  if (!tryBlock) {
    const children = ctx.getChildren(node);

    const emptyArrayLength = 0;
    if (children.length === emptyArrayLength) {
      throw new TranslationError('Try statement requires a try block', node);
    }

    const firstChildIndex = 0;

    tryBlock = children[firstChildIndex];

    // Find catch_clauses and finallyBlock in remaining children

    const secondChildIndex = 1;
    for (let i = secondChildIndex; i < children.length; i++) {
      const child = children[i];
      if (child.type === 'catch_clauses' && !catchClausesNode) {
        catchClausesNode = child;
      } else if (child.type === 'block' && !finallyBlock) {
        const lastChildIndex = 1;
        if (i === children.length - lastChildIndex) {
          // Last block child is likely the finally block
          finallyBlock = child;
        }
      }
    }
  }

  const tryBlockStmtResult = translateCompoundStatement(ctx, tryBlock);
  if (tryBlockStmtResult.kind !== 'CompoundStatement') {
    throw new TranslationError('Try statement requires a CompoundStatement for try block', node);
  }
  const tryBlockStmt = tryBlockStmtResult as CompoundStatement;

  const catchClauses: CatchClause[] = [];
  if (catchClausesNode) {
    const catchChildren = ctx.getChildren(catchClausesNode);
    for (const catchNode of catchChildren) {
      const catchNodeReadonly = catchNode;
      // Catch clause structure: [exceptionType, name, block]
      const catchNodeChildren = ctx.getChildren(catchNodeReadonly);
      let exceptionTypeExpr: Expression | undefined = undefined;
      let exceptionType: TypeRef | undefined = undefined;
      let varDecl: VariableDeclaration | undefined = undefined;
      let block: ParseTreeNode | null = null;

      // Try named properties first
      // CatchClause.exceptionType should be an Expression, not a TypeRef
      const exceptionTypeExprNode = ctx.getChildExpression(catchNode, 'exceptionType', true);
      if (exceptionTypeExprNode) {
        exceptionTypeExpr = exceptionTypeExprNode;
      }
      // Also try getting as type and convert (for compatibility)
      const exceptionTypeNode = ctx.getChild(catchNodeReadonly, 'exceptionType');
      if (!exceptionTypeExpr && exceptionTypeNode) {
        // Try translating as expression first
        const exceptionTypeNodeReadonly = exceptionTypeNode;
        const expr = ctx.tryTranslateExpression(
          exceptionTypeNodeReadonly,
          exceptionTypeNodeReadonly.type.toLowerCase()
        );
        if (expr) {
          exceptionTypeExpr = expr;
        }
      }

      const variable = ctx.getChild(catchNodeReadonly, 'variable', 'name');
      if (variable) {
        const variableReadonly = variable;
        const decl = ctx.tryTranslateDeclaration(
          variableReadonly,
          variableReadonly.type.toLowerCase()
        );
        if (decl?.kind === 'VariableDeclaration') {
          varDecl = decl as VariableDeclaration;
        }
      }
      block = ctx.getChild(catchNodeReadonly, 'block');

      // If not found, try positional children

      const minimumChildrenForException = 1;
      if (!exceptionTypeExpr && catchNodeChildren.length >= minimumChildrenForException) {
        const firstChildIndex = 0;

        const firstChild = catchNodeChildren[firstChildIndex];
        const expr = ctx.tryTranslateExpression(firstChild, firstChild.type.toLowerCase());
        if (expr) {
          exceptionTypeExpr = expr;
        }
      }

      // Also get the type for variable declaration (if not already set)
      if (catchNodeChildren.length >= minimumChildrenForException) {
        const firstChildIndex = 0;
        const firstChildForType = catchNodeChildren[firstChildIndex];
        const typeRef = ctx.tryTranslateType(firstChildForType) ?? undefined;
        if (typeRef) {
          exceptionType = typeRef;
        }
      }

      const minimumChildrenForVariable = 2;
      if (!varDecl && catchNodeChildren.length >= minimumChildrenForVariable) {
        const secondChildIndex = 1;

        const nameNode = catchNodeChildren[secondChildIndex];
        if (nameNode.type === 'name') {
          const name = ctx.getText(nameNode) ?? ctx.getProperty<string>(nameNode, 'name') ?? '';
          if (name && exceptionType) {
            // Create a variable declaration for the catch parameter
            varDecl = NodeFactory.createVariableDeclaration(
              name,
              exceptionType,
              undefined,
              undefined,
              ctx.getLocationOption(nameNode)
            );
          }
        }
      }

      const thirdChildIndex = 3;
      if (!block && catchChildren.length >= thirdChildIndex) {
        const thirdChildIndexOffset = 2;

        block = catchChildren[thirdChildIndexOffset];
      }

      if (!block) {
        throw new TranslationError('Catch clause requires a block', catchNodeReadonly);
      }
      const blockStmt = translateCompoundStatement(ctx, block as Readonly<ParseTreeNode>);
      if (blockStmt.kind !== 'CompoundStatement') {
        throw new TranslationError(
          'Catch clause block must be a CompoundStatement',
          catchNodeReadonly
        );
      }
      catchClauses.push({
        block: blockStmt as CompoundStatement,
        exceptionType: exceptionTypeExpr,
        kind: 'CatchClause',
        location: catchNodeReadonly.location,
        variable: varDecl,
      });
    }
  }

  let finallyBlockStmt: CompoundStatement | undefined = undefined;
  if (finallyBlock) {
    const finallyBlockResult = translateCompoundStatement(ctx, finallyBlock);
    if (finallyBlockResult.kind !== 'CompoundStatement') {
      throw new TranslationError('Finally block must be a CompoundStatement', node);
    }
    finallyBlockStmt = finallyBlockResult as CompoundStatement;
  }

  return NodeFactory.createTryStatement(
    tryBlockStmt,
    catchClauses,
    finallyBlockStmt,
    ctx.getLocationOption(node)
  );
}

/**
 * @param ctx
 * @param node
 */
export function translateBreakStatement(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Statement {
  const label = ctx.getProperty<string>(node, 'label');
  return NodeFactory.createBreakStatement(label, ctx.getLocationOption(node));
}

/**
 * @param ctx
 * @param node
 */
export function translateContinueStatement(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Statement {
  const label = ctx.getProperty<string>(node, 'label');
  return NodeFactory.createContinueStatement(label, ctx.getLocationOption(node));
}

/**
 * @param ctx
 * @param node
 */
export function translateThrowStatement(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Statement {
  // Try to get named property first (for integration tests)
  let expression = ctx.getChildExpression(node, 'expression', true);

  // If not found, try positional children (for parser output)
  // Parser structure: [expression]
  if (!expression) {
    const children = ctx.getChildren(node);

    const emptyArrayLength = 0;
    if (children.length > emptyArrayLength) {
      const firstChildIndex = 0;

      const expr = ctx.tryTranslateExpression(
        children[firstChildIndex],
        children[firstChildIndex].type.toLowerCase()
      );
      if (expr) {
        expression = expr;
      }
    }
  }

  if (!expression) {
    throw new TranslationError('Throw statement requires an expression', node);
  }
  return NodeFactory.createThrowStatement(expression, ctx.getLocationOption(node));
}

/**
 * @param ctx
 * @param node
 */
export function translateVariableDeclarationStatement(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Statement {
  // Try to get declaration child (wrapper) or variable_declaration directly
  let declaration = ctx.getChild(node, 'declaration');
  // Try direct variable_declaration child
  declaration ??= ctx.getChild(node, 'variable_declaration');
  if (!declaration) {
    // Try first child if it's a variable_declaration
    const children = ctx.getChildren(node);

    const emptyArrayLength = 0;

    const firstChildIndex = 0;
    if (
      children.length > emptyArrayLength &&
      children[firstChildIndex].type === 'variable_declaration'
    ) {
      declaration = children[firstChildIndex];
    }
  }
  if (!declaration) {
    throw new TranslationError('Variable declaration statement requires a declaration', node);
  }
  const varDecl = ctx.tryTranslateDeclaration(declaration, declaration.type.toLowerCase());
  if (varDecl?.kind !== 'VariableDeclaration') {
    throw new TranslationError(
      'Variable declaration statement requires a variable declaration',
      declaration
    );
  }
  return NodeFactory.createVariableDeclarationStatement(
    varDecl as VariableDeclaration,
    ctx.getLocationOption(node)
  );
}

/**
 * @param ctx
 * @param node
 */
export function translateDmlStatement(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Statement {
  // DML statement has: text = operation, children = [target]
  const operation = (
    ctx.getText(node) ??
    ctx.getProperty<string>(node, 'text') ??
    'insert'
  ).toLowerCase() as 'delete' | 'insert' | 'merge' | 'undelete' | 'update' | 'upsert';
  const children = ctx.getChildren(node);
  if (children.length === 0) {
    throw new TranslationError('DML statement requires a target expression', node);
  }

  const [firstChild] = children;
  const target = ctx.tryTranslateExpression(firstChild, firstChild.type.toLowerCase());
  if (!target) {
    throw new TranslationError('DML statement requires a target expression', node);
  }

  return NodeFactory.createDmlStatement(operation, target, ctx.getLocationOption(node));
}
