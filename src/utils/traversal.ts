/**
 * @file AST traversal utilities.
 * Utilities for traversing AST trees with visitor patterns.
 */

import type { ASTNode } from '../ast/baseNode.js';
import {
  isIfStatement,
  isForLoopStatement,
  isEnhancedForLoopStatement,
  isWhileLoopStatement,
  isReturnStatement,
  isCompoundStatement,
  isExpressionStatement,
  isVariableDeclarationStatement,
  isDmlStatement,
  isThrowStatement,
  isSwitchCase,
  isSwitchStatement,
} from '../guard/statementGuard.js';
import { isSoqlExpression, isSoslExpression } from '../guard/expressionGuard.js';
import {
  isBinaryExpression,
  isCallExpression,
  isFieldExpression,
  isArrayExpression,
  isNewExpression,
  isCastExpression,
  isParenthesizedExpression,
  isTernaryExpression,
} from '../guard/expressionGuard.js';
import {
  isVariableDeclaration,
  isClassDeclaration,
  isMethodDeclaration,
  isTypeRef,
  isAnnotationArgument,
  isFieldDeclarationGroup,
} from '../guard/declarationGuard.js';
import {
  isConstructorInitializer,
  isValuesInitializer,
  isSizedArrayInitializer,
  isMapInitializer,
  isExpressionElementValue,
  isAnnotationElementValue,
  isArrayElementValue,
  isSoqlOrSoslBinding,
} from '../guard/initGuard.js';

// ============================================================================
// Traversal Functions
// ============================================================================

/**
 * Visitor interface for AST traversal
 * Note: This is different from ASTVisitor in ast/visitor.ts
 * This one is for walkAST utility, the other is for the visitor pattern.
 */
interface ASTWalkVisitor {
  /**
   * Called when entering a node.
   * Return false to skip visiting children of this node.
   */
  enterNode?: (node: Readonly<ASTNode>) => boolean | undefined;

  /**
   * Called when exiting a node.
   */
  exitNode?: (node: Readonly<ASTNode>) => void;
}

/**
 * Type guard for values that look like AST nodes (have '@type' property).
 * @param obj - Value to check.
 * @returns True if obj has shape of AST node.
 */
function looksLikeASTNode(obj: unknown): obj is ASTNode {
  return obj !== null && typeof obj === 'object' && '@type' in obj;
}

/**
 * Find children generically by inspecting object properties.
 * @param node - The AST node to find children for.
 * @returns An array of child AST nodes.
 */
function findGenericChildren(node: Readonly<ASTNode>): ASTNode[] {
  const children: ASTNode[] = [];
  const record: Record<string, unknown> = { ...node };

  for (const key in record) {
    if (
      key === '@type' ||
      key === 'sourceLocation' ||
      key === 'parent' ||
      key === 'qualifiedName'
    ) {
      continue;
    }

    const value = record[key];
    if (value === null || value === undefined) {
      continue;
    }

    if (looksLikeASTNode(value)) {
      children.push(value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (looksLikeASTNode(item)) {
          children.push(item);
        }
      }
    }
  }

  return children;
}

/**
 * Get all children of a node.
 * @param node - The AST node to get children from.
 * @returns An array of child AST nodes.
 */
function getNodeChildren(node: Readonly<ASTNode>): ASTNode[] {
  const children: ASTNode[] = [];

  // Handle different node types with type guards
  if (isIfStatement(node)) {
    children.push(node.condition);
    children.push(node.thenStatement);
    if (node.elseStatement) children.push(node.elseStatement);
  } else if (isForLoopStatement(node)) {
    if (node.init) children.push(node.init);
    if (node.condition) children.push(node.condition);
    if (node.update) children.push(node.update);
    children.push(node.body);
  } else if (isEnhancedForLoopStatement(node)) {
    children.push(node.variable);
    children.push(node.iterable);
    children.push(node.body);
  } else if (isWhileLoopStatement(node)) {
    children.push(node.condition);
    children.push(node.body);
  } else if (isReturnStatement(node)) {
    if (node.value) children.push(node.value);
  } else if (isCompoundStatement(node)) {
    children.push(...node.statements);
  } else if (isExpressionStatement(node)) {
    children.push(node.expression);
  } else if (isVariableDeclarationStatement(node)) {
    children.push(node.group.type);
    for (const d of node.group.declarations) {
      children.push(d.id);
      if (d.initializer) children.push(d.initializer);
    }
    children.push(...node.group.modifiers);
  } else if (node['@type'] === 'BreakStatement' || node['@type'] === 'ContinueStatement') {
    // No children
  } else if (isDmlStatement(node)) {
    children.push(node.value);
  } else if (isThrowStatement(node)) {
    children.push(node.expression);
  } else if (isSwitchStatement(node)) {
    children.push(node.expression);
    children.push(...node.cases);
    if (node.defaultCase) children.push(node.defaultCase);
  } else if (isSwitchCase(node)) {
    if (node.value) children.push(node.value);
    children.push(...node.statements);
  } else if (isBinaryExpression(node)) {
    children.push(node.left);
    children.push(node.right);
  } else if (isCallExpression(node)) {
    if (node.receiver) children.push(node.receiver);
    children.push(...node.args);
  } else if (isFieldExpression(node)) {
    if (node.obj) children.push(node.obj);
    children.push(node.field);
  } else if (isArrayExpression(node)) {
    children.push(node.array);
    children.push(node.index);
  } else if (isNewExpression(node)) {
    children.push(node.initializer);
  } else if (isCastExpression(node)) {
    children.push(node.type);
    children.push(node.value);
  } else if (isParenthesizedExpression(node)) {
    children.push(node.expression);
  } else if (isTernaryExpression(node)) {
    children.push(node.condition);
    children.push(node.thenValue);
    children.push(node.elseValue);
  } else if (isVariableDeclaration(node)) {
    if (node.modifiers) children.push(...node.modifiers);
    if (node.annotations) children.push(...node.annotations);
    if (node.initializer) children.push(node.initializer);
  } else if (isFieldDeclarationGroup(node)) {
    children.push(node.type);
    children.push(...node.modifiers);
    for (const d of node.declarations) {
      children.push(d.id);
      if (d.initializer) children.push(d.initializer);
    }
  } else if (isClassDeclaration(node)) {
    children.push(...node.modifiers);
    if (node.annotations) children.push(...node.annotations);
    children.push(...node.bodyDeclarations);
  } else if (isMethodDeclaration(node)) {
    children.push(...node.modifiers);
    if (node.annotations) children.push(...node.annotations);
    const params =
      node.parameterDeclarations ?? (node as { parameters?: readonly unknown[] }).parameters ?? [];
    children.push(...params);
    if (node.body) children.push(node.body);
  } else if (isTypeRef(node)) {
    for (const comp of node.components) {
      children.push(comp.id);
      for (const arg of comp.args) {
        children.push(arg);
      }
    }
  } else if (isConstructorInitializer(node)) {
    children.push(node.type);
    children.push(...node.args);
  } else if (isValuesInitializer(node)) {
    children.push(node.type);
    children.push(...node.values);
  } else if (isSizedArrayInitializer(node)) {
    children.push(node.type);
    children.push(node.size);
  } else if (isMapInitializer(node)) {
    children.push(node.type);
    for (const pair of node.pairs) {
      children.push(pair.first);
      children.push(pair.second);
    }
  } else if (isExpressionElementValue(node)) {
    children.push(node.value);
  } else if (isAnnotationElementValue(node)) {
    children.push(node.value);
  } else if (isArrayElementValue(node)) {
    children.push(...node.values);
  } else if (isAnnotationArgument(node)) {
    children.push(node.value);
  } else if (isSoqlOrSoslBinding(node)) {
    children.push(node.expr);
  } else if (isSoqlExpression(node) || isSoslExpression(node)) {
    children.push(...node.bindings);
  } else {
    children.push(...findGenericChildren(node));
  }

  return children;
}

/**
 * Forward declaration for mutual recursion with visitChildren.
 * @param _ast - Unused; stub never called before assignment.
 * @param _visitor - Unused; stub never called before assignment.
 */
let walkAST: (ast: Readonly<ASTNode>, visitor: Readonly<ASTWalkVisitor>) => void = (
  _ast: Readonly<ASTNode>,
  _visitor: Readonly<ASTWalkVisitor>
): void => {
  /* Assigned below; never called before assignment */
};

/**
 * Visit children of a node and walk each with the visitor.
 * @param node - The AST node whose children to visit.
 * @param visitor - The visitor to use for traversal.
 */
function visitChildren(node: Readonly<ASTNode>, visitor: Readonly<ASTWalkVisitor>): void {
  const children = getNodeChildren(node);
  for (const child of children) {
    walkAST(child, visitor);
  }
}

walkAST = (ast: Readonly<ASTNode>, visitor: Readonly<ASTWalkVisitor>): void => {
  const shouldContinue = visitor.enterNode?.(ast);
  if (shouldContinue === false) {
    visitor.exitNode?.(ast);
    return;
  }

  visitChildren(ast, visitor);

  visitor.exitNode?.(ast);
};

/**
 * Get parent node mapping (requires building parent map first).
 * @param root - The root AST node to build the parent map from.
 * @returns A map of child nodes to their parent nodes.
 */
function buildParentMap(root: Readonly<ASTNode>): Map<ASTNode, ASTNode | null> {
  const parentMap = new Map<ASTNode, ASTNode | null>();
  parentMap.set(root, null);

  walkAST(root, {
    enterNode: (node): undefined => {
      const children = getNodeChildren(node);
      for (const child of children) {
        parentMap.set(child, node);
      }
      return undefined;
    },
  });

  return parentMap;
}

/**
 * Get all ancestors of a node.
 * @param node - The AST node to get ancestors for.
 * @param root - The root AST node.
 * @returns An array of ancestor AST nodes from root to parent.
 */
function getAncestors(node: Readonly<ASTNode>, root: Readonly<ASTNode>): ASTNode[] {
  const parentMap = buildParentMap(root);
  const ancestors: ASTNode[] = [];
  let current: ASTNode | null | undefined = node;

  while (current) {
    ancestors.unshift(current);
    current = parentMap.get(current) ?? null;
  }

  return ancestors;
}

/**
 * Find all nodes of a specific type in the AST.
 * @param ast - The root AST node to search from.
 * @param nodeType - The node kind to search for (e.g., 'MethodDeclaration', 'IfStatement').
 * @returns Array of all nodes matching the specified type.
 * @example
 * const methods = findNodesByType(ast, 'MethodDeclaration');
 */
function findNodesByType(ast: Readonly<ASTNode>, nodeType: string): ASTNode[] {
  const results: ASTNode[] = [];

  walkAST(ast, {
    enterNode: (node): undefined => {
      if (node['@type'] === nodeType) {
        results.push(node);
      }
      return undefined;
    },
  });

  return results;
}

/**
 * Get parent node for a given node.
 * @param root - The root AST node.
 * @param node - The node to find the parent of.
 * @returns The parent node, or null if node is the root or not found.
 * @example
 * const parent = getParentNode(ast, methodNode);
 */
function getParentNode(root: Readonly<ASTNode>, node: Readonly<ASTNode>): ASTNode | null {
  const parentMap = buildParentMap(root);
  return parentMap.get(node) ?? null;
}

/**
 * Get all child nodes of a specific type.
 * @param node - The parent node.
 * @param nodeType - The node kind to filter by (e.g., 'VariableDeclaration', 'MethodDeclaration').
 * @returns Array of child nodes matching the specified type.
 * @example
 * const methods = getChildNodesByType(classNode, 'MethodDeclaration');
 */
function getChildNodesByType(node: Readonly<ASTNode>, nodeType: string): ASTNode[] {
  const children = getNodeChildren(node);
  return children.filter((child) => child['@type'] === nodeType);
}

export type { ASTWalkVisitor };
export {
  walkAST,
  visitChildren,
  getNodeChildren,
  buildParentMap,
  getAncestors,
  findNodesByType,
  getParentNode,
  getChildNodesByType,
};
