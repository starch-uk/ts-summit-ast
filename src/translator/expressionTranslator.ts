/**
 * @file Expression translation helpers.
 * Translates parse tree expression nodes to AST expression nodes.
 */

import type { ParseTreeNode } from '../parser/parseTree.js';
import type {
  Expression,
  LambdaParameter,
  BinaryExpression,
  UnaryExpression,
  AssignExpression,
  FieldExpression,
  NewExpression,
} from '../ast/expression.js';
import type { TypeRef } from '../ast/baseNode.js';
import type { TranslateContext } from './translateUtil.js';
import { TranslationError } from './translateUtil.js';
import { NodeFactory } from './nodeFactory.js';

/**
 * @param ctx
 * @param node
 */
export function translateStringVal(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  const text = ctx.getText(node) ?? '';
  // Remove quotes if present
  const value = text.replace(/^["']|["']$/g, '');
  return NodeFactory.createStringVal(value, text, ctx.getLocationOption(node));
}

/**
 * @param ctx
 * @param node
 */
export function translateIntegerVal(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  const text = ctx.getText(node) ?? '0';
  const opts = ctx.getLocationOption(node);
  if (/[Dd]$/.test(text)) {
    const numText = text.replace(/[Dd]$/, '');
    const value = parseFloat(numText);
    return NodeFactory.createDoubleVal(value, text, opts);
  }
  if (/[Ll]$/.test(text)) {
    const numText = text.replace(/[Ll]$/, '');
    const value = parseFloat(numText);
    return NodeFactory.createLongVal(value, text, opts);
  }
  if (text.includes('.')) {
    const value = parseFloat(text);
    return NodeFactory.createDecimalVal(value, text, opts);
  }
  const value = parseFloat(text);
  return NodeFactory.createIntegerVal(value, text, opts);
}

/**
 * @param ctx
 * @param node
 */
export function translateBooleanVal(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  const text = ctx.getText(node)?.toLowerCase() ?? 'false';
  const value = text === 'true';
  return NodeFactory.createBooleanVal(value, ctx.getLocationOption(node));
}

/**
 * @param ctx
 * @param node
 */
export function translateMethodCall(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  // Parser creates method_call_expression with children: [expr, { type: 'arguments', children: args }]
  // where expr is:
  //   - identifier (method name) if no target: no_receiver()
  //   - field_access_expression (target.method) if there's a target: x.method()
  const children = ctx.getChildren(node);
  let target: Expression | undefined = undefined;
  let methodName = '';
  let argsNode: ParseTreeNode | null = null;
  let isSafeFromTarget: boolean | undefined = undefined;

  // Try to get from named properties first (for integration tests)
  const targetFromProp = ctx.getChildExpression(node, 'target', true);
  if (targetFromProp) {
    target = targetFromProp;
  }

  const methodNameFromProp = ctx.getProperty<string>(node, 'methodName', 'name');

  if (typeof methodNameFromProp === 'string' && methodNameFromProp.length > 0) {
    methodName = methodNameFromProp;
  }

  // Try to get arguments from named property first (for integration tests)
  if (node.arguments !== null && node.arguments !== undefined && Array.isArray(node.arguments)) {
    // arguments is a named property (integration test)
    argsNode = { children: node.arguments, type: 'arguments' };
  } else {
    argsNode = ctx.getChild(node, 'arguments', 'args');
  }

  // If not found as named properties, try positional children (parser output)

  const minimumChildrenForMethodCall = 2;
  if (!methodName && children.length >= minimumChildrenForMethodCall) {
    const firstChildIndex = 0;

    const secondChildIndex = 1;

    const firstChild = children[firstChildIndex];

    const secondChild = children[secondChildIndex];

    // Second child should be arguments
    if (secondChild.type === 'arguments' || secondChild.type === 'args') {
      argsNode = secondChild;
    }

    // First child is either:
    //   - identifier: method name (no target)
    //   - field_access_expression: target.method (has target)
    //   - super_expression or this_expression: super(x, y) or this(x, y) (constructor chaining)
    if (firstChild.type === 'identifier') {
      // No target, first child is the method name
      methodName = ctx.getText(firstChild) ?? ctx.getProperty<string>(firstChild, 'name') ?? '';
    } else if (firstChild.type === 'super_expression' || firstChild.type === 'this_expression') {
      // Constructor chaining: super(x, y) or this(x, y)
      // Extract the method name from the expression text
      methodName =
        ctx.getText(firstChild) ?? (firstChild.type === 'super_expression' ? 'super' : 'this');
    } else if (
      firstChild.type === 'field_access_expression' ||
      firstChild.type === 'field_access'
    ) {
      // Has target, first child is field access expression
      const fieldAccess = ctx.tryTranslateExpression(firstChild, firstChild.type.toLowerCase());
      if (fieldAccess?.kind === 'FieldExpression') {
        const fieldExpr = fieldAccess as FieldExpression;

        ({ target, fieldName: methodName, isSafe: isSafeFromTarget } = fieldExpr);
      }
    } else {
      // Try to translate as expression - might be a complex target
      const firstExpr = ctx.tryTranslateExpression(firstChild, firstChild.type.toLowerCase());
      if (firstExpr?.kind === 'FieldExpression') {
        const fieldExpr = firstExpr as FieldExpression;

        ({ target, fieldName: methodName, isSafe: isSafeFromTarget } = fieldExpr);
      } else if (
        firstExpr &&
        'name' in firstExpr &&
        typeof (firstExpr as { name?: unknown }).name === 'string'
      ) {
        // Could be an Identifier node (not an expression)
        methodName = (firstExpr as { name: string }).name;
      } else if (firstChild.type === 'super_expression' || firstChild.type === 'this_expression') {
        // Fallback: extract from text
        methodName =
          ctx.getText(firstChild) ?? (firstChild.type === 'super_expression' ? 'super' : 'this');
      }
    }
  }

  if (!methodName) {
    throw new TranslationError('Method call requires a method name', node);
  }

  const args: Expression[] = [];
  if (argsNode) {
    const argChildren = ctx.getChildren(argsNode);
    for (const argChild of argChildren) {
      const expr = ctx.tryTranslateExpression(argChild, argChild.type.toLowerCase());
      if (expr) {
        args.push(expr);
      }
    }
  }

  const callExpr = NodeFactory.createCallExpression(
    methodName,
    args,
    target,
    undefined,
    ctx.getLocationOption(node)
  );

  // Check for safe navigation flag from parse tree, or from target when it's a FieldExpression (e.g. x?.method())
  const isSafe = ctx.getProperty<boolean>(node, 'isSafe') ?? isSafeFromTarget ?? false;
  (callExpr as { isSafe?: boolean }).isSafe = isSafe;

  return callExpr;
}

/**
 * @param ctx
 * @param node
 */
export function translateBinaryExpression(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  const operator = ctx.getProperty<string>(node, 'operator', 'op') ?? '==';
  // Try to get left and right as optional first (to allow fallback)
  let left = ctx.getChildExpression(node, 'left', true);
  let right = ctx.getChildExpression(node, 'right', true);

  if (!left || !right) {
    // Try children array (parser uses positional children: [left, right])
    const children = ctx.getChildren(node);

    const minimumChildrenForBinary = 2;
    if (children.length >= minimumChildrenForBinary) {
      const firstChildIndex = 0;

      const secondChildIndex = 1;
      const leftExpr = ctx.tryTranslateExpression(
        children[firstChildIndex],
        children[firstChildIndex].type.toLowerCase()
      );
      const rightExpr = ctx.tryTranslateExpression(
        children[secondChildIndex],
        children[secondChildIndex].type.toLowerCase()
      );
      if (leftExpr && rightExpr) {
        const validOperators: BinaryExpression['operator'][] = [
          '-',
          '!=',
          '!==',
          '*',
          '/',
          '&',
          '&&',
          '%',
          '^',
          '+',
          '<',
          '<<',
          '<=',
          '==',
          '===',
          '>',
          '>=',
          '>>',
          '>>>',
          '|',
          '||',
          'instanceof',
        ];
        const validOperator = validOperators.includes(operator as BinaryExpression['operator'])
          ? (operator as BinaryExpression['operator'])
          : '==';
        return NodeFactory.createBinaryExpression(
          validOperator,
          leftExpr,
          rightExpr,
          ctx.getLocationOption(node)
        );
      }
    }
    throw new TranslationError('Binary expression requires both left and right operands', node);
  }

  return NodeFactory.createBinaryExpression(
    operator as BinaryExpression['operator'],
    left,
    right,
    ctx.getLocationOption(node)
  );
}

/**
 * @param ctx
 * @param node
 */
export function translateUnaryExpression(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  const operator = ctx.getProperty<string>(node, 'operator', 'op') ?? '!';
  const prefix = ctx.getProperty<boolean>(node, 'prefix') ?? true;
  const operand = ctx.getChildExpression(node, 'operand', true);
  if (!operand) {
    // Try to get from children array
    const children = ctx.getChildren(node);
    const emptyArrayLength = 0;
    if (children.length > emptyArrayLength) {
      const firstChildIndex = 0;
      const firstChild = children[firstChildIndex];
      const expr = ctx.tryTranslateExpression(firstChild, firstChild.type.toLowerCase());
      if (expr) {
        return NodeFactory.createUnaryExpression(
          operator as UnaryExpression['operator'],
          expr,
          prefix,
          ctx.getLocationOption(node)
        );
      }
    }
    throw new TranslationError('Unary expression requires an operand', node);
  }

  return NodeFactory.createUnaryExpression(
    operator as UnaryExpression['operator'],
    operand,
    prefix,
    ctx.getLocationOption(node)
  );
}

/**
 * @param ctx
 * @param node
 */
export function translateAssignExpression(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  const operator = ctx.getProperty<string>(node, 'operator', 'op') ?? '=';
  const left = ctx.getChildExpression(node, 'left');
  const right = ctx.getChildExpression(node, 'right');

  if (!left || !right) {
    throw new TranslationError('Assignment expression requires both left and right operands', node);
  }

  return NodeFactory.createAssignExpression(
    operator as AssignExpression['operator'],
    left,
    right,
    ctx.getLocationOption(node)
  );
}

/**
 * @param ctx
 * @param node
 */
export function translateFieldAccess(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  // Parser creates field_access_expression with children: [target, { type: 'field', text: fieldName }]
  const children = ctx.getChildren(node);
  let target: Expression | undefined = undefined;
  let fieldName = '';

  // Try to get target from named property first
  const targetFromProp = ctx.getChildExpression(node, 'target', true);
  if (targetFromProp) {
    target = targetFromProp;
  } else {
    const minimumChildrenForTarget = 2;
    if (children.length >= minimumChildrenForTarget) {
      // First child is the target expression
      const firstChildIndex = 0;
      const targetNode = children[firstChildIndex];
      target = ctx.tryTranslateExpression(targetNode, targetNode.type.toLowerCase()) ?? undefined;
    }
  }

  // Try to get field name from named property or second child
  const fieldNode = ctx.getChild(node, 'field');
  if (fieldNode) {
    fieldName =
      ctx.getText(fieldNode) ??
      ctx.getProperty<string>(fieldNode, 'name') ??
      ctx.getProperty<string>(fieldNode, 'text') ??
      '';
  } else {
    const minimumChildrenForField = 2;
    if (children.length >= minimumChildrenForField) {
      // Second child is the field node
      const secondChildIndex = 1;
      const fieldChild = children[secondChildIndex];
      fieldName =
        ctx.getText(fieldChild) ??
        ctx.getProperty<string>(fieldChild, 'name') ??
        ctx.getProperty<string>(fieldChild, 'text') ??
        '';
    }
  }

  if (!fieldName) {
    throw new TranslationError('Field access requires a field name', node);
  }

  const fieldExpr = NodeFactory.createFieldExpression(
    fieldName,
    target,
    ctx.getLocationOption(node)
  );

  // Check for safe navigation flag from parse tree
  const isSafe = ctx.getProperty<boolean>(node, 'isSafe') ?? false;
  (fieldExpr as { isSafe?: boolean }).isSafe = isSafe;

  return fieldExpr;
}

/**
 * @param ctx
 * @param node
 */
export function translateArrayAccess(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  // Try to get array and index as optional first (to allow fallback)
  const array = ctx.getChildExpression(node, 'array', true);
  if (!array) {
    // Try first child
    const children = ctx.getChildren(node);
    const minimumChildrenForArrayAccess = 2;
    if (children.length >= minimumChildrenForArrayAccess) {
      const firstChildIndex = 0;
      const secondChildIndex = 1;
      const arrayChild = children[firstChildIndex];
      const indexChild = children[secondChildIndex];
      const arrExpr = ctx.tryTranslateExpression(arrayChild, arrayChild.type.toLowerCase());
      const idxExpr = ctx.tryTranslateExpression(indexChild, indexChild.type.toLowerCase());
      if (arrExpr && idxExpr) {
        return NodeFactory.createArrayExpression(arrExpr, idxExpr, ctx.getLocationOption(node));
      }
    }
    throw new TranslationError('Array access requires array and index', node);
  }
  const index = ctx.getChildExpression(node, 'index', true);
  if (!index) {
    // Try second child if index not found
    const children = ctx.getChildren(node);
    const minimumChildrenForIndex = 2;
    if (children.length >= minimumChildrenForIndex) {
      const secondChildIndex = 1;
      const indexChild = children[secondChildIndex];
      const idxExpr = ctx.tryTranslateExpression(indexChild, indexChild.type.toLowerCase());
      if (idxExpr) {
        return NodeFactory.createArrayExpression(array, idxExpr, ctx.getLocationOption(node));
      }
    }
    throw new TranslationError('Array access requires an index', node);
  }

  return NodeFactory.createArrayExpression(array, index, ctx.getLocationOption(node));
}

/**
 * @param ctx
 * @param node
 */
export function translateTernaryExpression(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  // Try to get condition, then, and else as optional first (to allow fallback)
  const condition = ctx.getChildExpression(node, 'condition', true);
  const thenExpr = ctx.getChildExpression(node, 'thenExpression', true, 'then');
  const elseExpr = ctx.getChildExpression(node, 'elseExpression', true, 'else');

  if (!condition || !thenExpr || !elseExpr) {
    // Try children array
    const children = ctx.getChildren(node);
    const minimumChildrenForTernary = 3;
    if (children.length >= minimumChildrenForTernary) {
      const conditionIndex = 0;
      const thenIndex = 1;
      const elseIndex = 2;
      const conditionChild = children[conditionIndex];
      const thenChild = children[thenIndex];
      const elseChild = children[elseIndex];
      const cond = ctx.tryTranslateExpression(conditionChild, conditionChild.type.toLowerCase());
      const then = ctx.tryTranslateExpression(thenChild, thenChild.type.toLowerCase());
      const els = ctx.tryTranslateExpression(elseChild, elseChild.type.toLowerCase());
      if (cond && then && els) {
        return NodeFactory.createTernaryExpression(cond, then, els, ctx.getLocationOption(node));
      }
    }
    throw new TranslationError(
      'Ternary expression requires condition, then, and else expressions',
      node
    );
  }

  return NodeFactory.createTernaryExpression(
    condition,
    thenExpr,
    elseExpr,
    ctx.getLocationOption(node)
  );
}

/**
 * @param ctx
 * @param node
 */
export function translateCastExpression(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  // Parser creates cast_expression with children: [type, expression]
  const children = ctx.getChildren(node);
  let typeNode = ctx.getChild(node, 'type');
  const emptyArrayLength = 0;
  if (!typeNode && children.length > emptyArrayLength) {
    // First child is the type
    const firstChildIndex = 0;
    typeNode = children[firstChildIndex];
  }
  const type = typeNode ? ctx.tryTranslateType(typeNode) : null;
  if (!type) {
    throw new TranslationError('Cast expression requires a type', node);
  }

  // Try to get expression
  let expression = ctx.getChildExpression(node, 'expression', true);
  const minimumChildrenForExpression = 2;
  if (!expression && children.length >= minimumChildrenForExpression) {
    // Second child is the expression
    const secondChildIndex = 1;
    const expressionChild = children[secondChildIndex];
    expression =
      ctx.tryTranslateExpression(expressionChild, expressionChild.type.toLowerCase()) ?? undefined;
  }
  if (!expression) {
    throw new TranslationError('Cast expression requires an expression', node);
  }

  return NodeFactory.createCastExpression(type, expression, ctx.getLocationOption(node));
}

/**
 * @param ctx
 * @param node
 */
export function translateInstanceOfExpression(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  // Try to get expression as optional first (to allow fallback)
  const expression = ctx.getChildExpression(node, 'expression', true);
  const typeNode = ctx.getChild(node, 'type');
  const type = typeNode ? ctx.tryTranslateType(typeNode) : null;

  if (!expression || !type) {
    // Try children array
    const children = ctx.getChildren(node);
    const minimumChildrenForCast = 2;
    if (children.length >= minimumChildrenForCast) {
      const expressionIndex = 0;
      const typeIndex = 1;
      const expressionChild = children[expressionIndex];
      const typeChild = children[typeIndex];
      const expr = ctx.tryTranslateExpression(expressionChild, expressionChild.type.toLowerCase());
      const t = ctx.tryTranslateType(typeChild);
      if (expr && t) {
        return NodeFactory.createInstanceOfExpression(expr, t, ctx.getLocationOption(node));
      }
    }
    throw new TranslationError('Instanceof expression requires expression and type', node);
  }

  return NodeFactory.createInstanceOfExpression(expression, type, ctx.getLocationOption(node));
}

/**
 * @param ctx
 * @param node
 */
export function translateNewExpression(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  // Parser creates new_expression with children: [type, arguments?, arrayInitializer?]
  const children = ctx.getChildren(node);
  let typeNode = ctx.getChild(node, 'type');
  const emptyArrayLength = 0;
  if (!typeNode && children.length > emptyArrayLength) {
    // First child is the type
    const firstChildIndex = 0;
    typeNode = children[firstChildIndex];
  }
  const type = typeNode ? ctx.tryTranslateType(typeNode) : null;
  if (!type) {
    throw new TranslationError('New expression requires a type', node);
  }

  // Look for arguments node
  let argsNode = ctx.getChild(node, 'arguments', 'args');
  if (!argsNode) {
    // Check if any child is an 'arguments' node
    const childNodes = ctx.getChildren(node);
    argsNode = childNodes.find((c) => c.type === 'arguments' || c.type === 'args') ?? null;
  }
  const args: Expression[] = [];
  if (argsNode) {
    const argChildren = ctx.getChildren(argsNode);
    for (const argChild of argChildren) {
      const expr = ctx.tryTranslateExpression(argChild, argChild.type.toLowerCase());
      if (expr) {
        args.push(expr);
      }
    }
  }

  // Look for arrayInitializer node
  let arrayInitNode = ctx.getChild(node, 'arrayInitializer', 'arrayInit');
  if (!arrayInitNode) {
    // Check if any child is an 'arrayInitializer' node
    const childNodes = ctx.getChildren(node);
    arrayInitNode =
      childNodes.find((c) => c.type === 'arrayInitializer' || c.type === 'arrayInit') ?? null;
  }
  const arrayInit: Expression[] = [];
  // Check if we have an arrayInitializer node (even if empty)
  if (arrayInitNode) {
    const initChildren = ctx.getChildren(arrayInitNode);
    for (const initChild of initChildren) {
      // Handle map entries specially - they have type 'map_entry' with children [key, value]
      // For now, we'll just add both key and value as separate expressions
      // The actual map entry structure would need a special node type
      if (initChild.type === 'map_entry' || initChild.type.toLowerCase() === 'map_entry') {
        const mapEntryChildren = ctx.getChildren(initChild);
        if (mapEntryChildren.length >= 2) {
          const [firstChild, secondChild] = mapEntryChildren;
          const keyExpr = ctx.tryTranslateExpression(firstChild, firstChild.type.toLowerCase());
          const valueExpr = ctx.tryTranslateExpression(secondChild, secondChild.type.toLowerCase());
          if (keyExpr && valueExpr) {
            // For map entries, we'll add them as a pair - this is a simplification
            // In a full implementation, we'd want a MapEntryExpression or similar
            arrayInit.push(keyExpr);
            arrayInit.push(valueExpr);
          }
        }
      } else {
        const expr = ctx.tryTranslateExpression(initChild, initChild.type.toLowerCase());
        if (expr) {
          arrayInit.push(expr);
        }
      }
    }
  }

  // Create the appropriate Initializer based on what's present
  let initializer;
  const locationOption = ctx.getLocationOption(node);

  if (arrayInitNode !== null) {
    // Check if this is a map (has map_entry children) or a list/set/array
    const hasMapEntries = arrayInit.some(
      (_item: Expression, i: number) => i % 2 === 0 && i + 1 < arrayInit.length
    );
    // For now, we'll check if we have pairs (even number of expressions that look like key-value)
    // A better approach would be to check the parse tree structure
    if (hasMapEntries && arrayInit.length % 2 === 0) {
      // Create MapInitializer with pairs
      const pairs: { key: Expression; value: Expression }[] = [];
      for (let i = 0; i < arrayInit.length; i += 2) {
        if (i + 1 < arrayInit.length) {
          pairs.push({ key: arrayInit[i], value: arrayInit[i + 1] });
        }
      }
      initializer = NodeFactory.createMapInitializer(type, pairs, locationOption);
    } else {
      // Create ValuesInitializer for lists/sets/arrays
      initializer = NodeFactory.createValuesInitializer(type, arrayInit, locationOption);
    }
  } else if (args.length > 0) {
    // Create ConstructorInitializer
    initializer = NodeFactory.createConstructorInitializer(type, args, locationOption);
  } else {
    // Default to ConstructorInitializer with no args
    initializer = NodeFactory.createConstructorInitializer(type, [], locationOption);
  }

  const newExpr = NodeFactory.createNewExpression(initializer, locationOption);

  // Add convenience properties for backward compatibility with tests
  // These properties provide direct access to initializer data
  const exprWithProps = newExpr as NewExpression & {
    type?: TypeRef;
    arguments?: Expression[];
    arrayInitializer?: Expression[];
  };
  exprWithProps.type = type; // Type is always available from the initializer

  if (initializer.kind === 'ConstructorInitializer') {
    exprWithProps.arguments = initializer.args;
  }

  // Set arrayInitializer for all initializer types that use it
  if (arrayInitNode !== null) {
    // For ValuesInitializer, MapInitializer - use the parsed arrayInit
    exprWithProps.arrayInitializer = arrayInit;
  } else if (initializer.kind === 'ValuesInitializer' || initializer.kind === 'MapInitializer') {
    // If we created a ValuesInitializer or MapInitializer but arrayInitNode was null,
    // use the values from the initializer
    if (initializer.kind === 'ValuesInitializer') {
      exprWithProps.arrayInitializer = initializer.values;
    } else {
      // MapInitializer: flatten pairs into array
      const flattened: Expression[] = [];
      for (const pair of initializer.pairs) {
        flattened.push(pair.key, pair.value);
      }
      exprWithProps.arrayInitializer = flattened;
    }
  } else {
    // For ConstructorInitializer or other types, set empty array if not already set
    exprWithProps.arrayInitializer = [];
  }

  return newExpr;
}

/**
 * @param ctx
 * @param node
 */
export function translateNewArrayExpression(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  // Parser creates new_array_expression with children: [type, size]
  const children = ctx.getChildren(node);
  let typeNode = ctx.getChild(node, 'type');
  if (!typeNode && children.length > 0) {
    // First child is the type
    [typeNode] = children;
  }
  const type = typeNode ? ctx.tryTranslateType(typeNode) : null;
  if (!type) {
    throw new TranslationError('New array expression requires a type', node);
  }

  // Second child is the size expression
  let size: Expression | undefined = undefined;
  // Try named property first
  size = ctx.getChildExpression(node, 'size', true);
  // If not found, try positional children
  if (!size && children.length >= 2) {
    // Try to translate the second child as an expression
    const [, sizeChild] = children;
    // Try translating as expression first
    size = ctx.tryTranslateExpression(sizeChild, sizeChild.type.toLowerCase()) ?? undefined;
    // If that fails and it's a number literal, translate it directly
    if (!size && (sizeChild.type === 'number_literal' || sizeChild.type === 'number')) {
      // translateIntegerVal is a method on ASTTranslator, not TranslateContext
      // Use tryTranslateExpression instead which should handle number literals
      size = ctx.tryTranslateExpression(sizeChild, sizeChild.type.toLowerCase()) ?? undefined;
    }
  }
  if (!size) {
    // Provide more helpful error message
    const childTypes = children.map((c) => c.type).join(', ');
    throw new TranslationError(
      `New array expression requires a size. Found ${children.length} children with types: ${childTypes}`,
      node
    );
  }

  // NewArrayExpression is represented as NewExpression with arrayInitializer containing the size
  // Create SizedArrayInitializer and wrap in NewExpression
  const locationOption = ctx.getLocationOption(node);
  const initializer = NodeFactory.createSizedArrayInitializer(type, size, locationOption);
  return NodeFactory.createNewExpression(initializer, locationOption);
}

/**
 * @param ctx
 * @param node
 */
export function translateLambdaExpression(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  const paramsNode = ctx.getChild(node, 'parameters', 'params');
  const parameters: LambdaParameter[] = [];
  if (paramsNode) {
    const parameterNodes = ctx.getChildren(paramsNode);
    for (const paramNode of parameterNodes) {
      const name = ctx.getText(paramNode) ?? ctx.getProperty<string>(paramNode, 'name') ?? '';
      const typeNode = ctx.getChild(paramNode, 'type');
      const type = typeNode ? ctx.tryTranslateType(typeNode) : undefined;
      parameters.push({
        kind: 'LambdaParameter',
        location: paramNode.location,
        name,
        type: type ?? undefined,
      });
    }
  }
  const bodyNode = ctx.getChild(node, 'body');
  if (!bodyNode) {
    throw new TranslationError('Lambda expression requires a body', node);
  }
  const bodyExpr = ctx.tryTranslateExpression(bodyNode, bodyNode.type.toLowerCase());
  const bodyStmt = bodyExpr
    ? undefined
    : ctx.tryTranslateStatement(bodyNode, bodyNode.type.toLowerCase());
  if (!bodyExpr && !bodyStmt) {
    throw new TranslationError('Lambda body must be an expression or statement', bodyNode);
  }

  const body = bodyExpr ?? bodyStmt;
  if (!body) {
    throw new TranslationError('Lambda body must be an expression or statement', bodyNode);
  }

  return NodeFactory.createLambdaExpression(parameters, body, ctx.getLocationOption(node));
}

/**
 * @param ctx
 * @param node
 */
export function translateParenthesizedExpression(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  // Try to get expression as optional first (to allow fallback)
  const expression = ctx.getChildExpression(node, 'expression', true);
  if (!expression) {
    // Try first child
    const children = ctx.getChildren(node);
    if (children.length > 0) {
      const [firstChild] = children;
      const expr = ctx.tryTranslateExpression(firstChild, firstChild.type.toLowerCase());
      if (expr) {
        return NodeFactory.createParenthesizedExpression(expr, ctx.getLocationOption(node));
      }
    }
    throw new TranslationError('Parenthesized expression requires an expression', node);
  }

  return NodeFactory.createParenthesizedExpression(expression, ctx.getLocationOption(node));
}

/**
 * @param ctx
 * @param node
 */
export function translateSoqlQuery(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  const query = ctx.getText(node) ?? ctx.getProperty<string>(node, 'query') ?? '';
  // Extract bound expressions from children
  const boundExpressions: Expression[] = [];
  const boundExpressionsNode = ctx.getChild(node, 'bound_expressions');
  if (boundExpressionsNode) {
    const boundChildren = ctx.getChildren(boundExpressionsNode);
    for (const boundChild of boundChildren) {
      const expr = ctx.tryTranslateExpression(boundChild, boundChild.type.toLowerCase());
      if (expr) {
        boundExpressions.push(expr);
      }
    }
  }
  // Convert bound expressions to SoqlOrSoslBinding nodes
  const bindings = boundExpressions.map((expr) =>
    NodeFactory.createSoqlOrSoslBinding(expr, ctx.getLocationOption(node))
  );
  return NodeFactory.createSoqlExpression(query, bindings, ctx.getLocationOption(node));
}

/**
 * @param ctx
 * @param node
 */
export function translateSoslQuery(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  const query = ctx.getText(node) ?? ctx.getProperty<string>(node, 'query') ?? '';
  // Extract bound expressions from children
  const boundExpressions: Expression[] = [];
  const boundExpressionsNode = ctx.getChild(node, 'bound_expressions');
  if (boundExpressionsNode) {
    const boundChildren = ctx.getChildren(boundExpressionsNode);
    for (const boundChild of boundChildren) {
      const expr = ctx.tryTranslateExpression(boundChild, boundChild.type.toLowerCase());
      if (expr) {
        boundExpressions.push(expr);
      }
    }
  }
  // Convert bound expressions to SoqlOrSoslBinding nodes
  const bindings = boundExpressions.map((expr) =>
    NodeFactory.createSoqlOrSoslBinding(expr, ctx.getLocationOption(node))
  );
  return NodeFactory.createSoslExpression(query, bindings, ctx.getLocationOption(node));
}

/**
 * @param ctx
 * @param node
 */
export function translateTriggerContextVariable(
  ctx: TranslateContext,
  node: Readonly<ParseTreeNode>
): Expression {
  // Extract variable name from text like "Trigger.new" -> "new"
  const text = ctx.getText(node) ?? ctx.getProperty<string>(node, 'text') ?? '';
  const variableName = text.replace(/^Trigger\./i, '');
  return NodeFactory.createTriggerContextVariableExpression(
    variableName,
    ctx.getLocationOption(node)
  );
}
