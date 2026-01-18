/**
 * @file AST traversal utilities.
 * Utilities for traversing AST trees with visitor patterns.
 */

import type { ASTNode } from '../ast/base.js';

/**
 * Visitor interface for AST traversal
 * Note: This is different from ASTVisitor in ast/visitor.ts
 * This one is for walkAST utility, the other is for the visitor pattern.
 */
export interface ASTWalkVisitor {
  /**
   * Called when entering a node.
   * Return false to skip visiting children of this node.
   */
  enterNode?: (node: ASTNode) => boolean | void;

  /**
   * Called when exiting a node.
   */
  exitNode?: (node: ASTNode) => void;
}

/**
 * Walk the AST tree with a visitor.
 * @param ast - The AST node to walk.
 * @param visitor - The visitor to use for traversal.
 */
export function walkAST(ast: ASTNode, visitor: ASTWalkVisitor): void {
  const shouldContinue = visitor.enterNode?.(ast);
  if (shouldContinue === false) {
    visitor.exitNode?.(ast);
    return;
  }

  // Visit children
  visitChildren(ast, visitor);

  visitor.exitNode?.(ast);
}

/**
 * Visit children of a node.
 * @param node - The AST node whose children to visit.
 * @param visitor - The visitor to use for traversal.
 */
function visitChildren(node: ASTNode, visitor: ASTWalkVisitor): void {
  // Extract children based on node type
  const children = getNodeChildren(node);

  for (const child of children) {
    walkAST(child, visitor);
  }
}

/**
 * Get all children of a node.
 * @param node - The AST node to get children from.
 * @returns An array of child AST nodes.
 */
export function getNodeChildren(node: ASTNode): ASTNode[] {
  const children: ASTNode[] = [];

  // Handle different node types
  switch (node.kind) {
    // Statements
    case 'IfStatement': {
      const stmt = node as any;
      if (stmt.condition) children.push(stmt.condition);
      if (stmt.thenStatement) children.push(stmt.thenStatement);
      if (stmt.elseStatement) children.push(stmt.elseStatement);
      break;
    }
    case 'ForLoopStatement': {
      const stmt = node as any;
      if (stmt.init) children.push(stmt.init);
      if (stmt.condition) children.push(stmt.condition);
      if (stmt.update) children.push(stmt.update);
      if (stmt.body) children.push(stmt.body);
      break;
    }
    case 'WhileLoopStatement': {
      const stmt = node as any;
      if (stmt.condition) children.push(stmt.condition);
      if (stmt.body) children.push(stmt.body);
      break;
    }
    case 'ReturnStatement': {
      const stmt = node as any;
      if (stmt.expression) children.push(stmt.expression);
      break;
    }
    case 'CompoundStatement': {
      const stmt = node as any;
      if (stmt.statements) {
        children.push(...stmt.statements);
      }
      break;
    }
    case 'ExpressionStatement': {
      const stmt = node as any;
      if (stmt.expression) children.push(stmt.expression);
      break;
    }
    case 'VariableDeclarationStatement': {
      const stmt = node as any;
      if (stmt.declaration) children.push(stmt.declaration);
      break;
    }
    case 'BreakStatement':
    case 'ContinueStatement': {
      // Break and continue statements have no children (label is a string, not an AST node)
      break;
    }
    case 'DmlStatement': {
      const stmt = node as any;
      if (stmt.target) children.push(stmt.target);
      break;
    }
    case 'ThrowStatement': {
      const stmt = node as any;
      if (stmt.expression) children.push(stmt.expression);
      break;
    }
    case 'SwitchStatement': {
      const stmt = node as any;
      if (stmt.expression) children.push(stmt.expression);
      if (stmt.cases) children.push(...stmt.cases);
      if (stmt.defaultCase) children.push(stmt.defaultCase);
      break;
    }
    case 'SwitchCase': {
      const c = node as any;
      if (c.value) children.push(c.value);
      if (c.statements) children.push(...c.statements);
      break;
    }

    // Expressions
    case 'BinaryExpression': {
      const expr = node as any;
      if (expr.left) children.push(expr.left);
      if (expr.right) children.push(expr.right);
      break;
    }
    case 'CallExpression': {
      const expr = node as any;
      if (expr.target) children.push(expr.target);
      if (expr.arguments) {
        children.push(...expr.arguments);
      }
      // TypeRef is not a node type, so we don't traverse typeArguments
      break;
    }
    case 'FieldExpression': {
      const expr = node as any;
      if (expr.target) children.push(expr.target);
      if (expr.fieldName != null) {
        children.push({ kind: 'Identifier', name: expr.fieldName } as ASTNode);
      }
      break;
    }
    case 'ArrayExpression': {
      const expr = node as any;
      if (expr.array) children.push(expr.array);
      if (expr.index) children.push(expr.index);
      break;
    }
    case 'NewExpression': {
      const expr = node as any;
      if (expr.initializer) {
        children.push(expr.initializer);
      }
      break;
    }
    case 'CastExpression': {
      const expr = node as any;
      if (expr.type) children.push(expr.type);
      if (expr.expression) children.push(expr.expression);
      break;
    }
    case 'ParenthesizedExpression': {
      const expr = node as any;
      if (expr.expression) children.push(expr.expression);
      break;
    }
    case 'TernaryExpression': {
      const expr = node as any;
      if (expr.condition) children.push(expr.condition);
      if (expr.thenExpression) children.push(expr.thenExpression);
      if (expr.elseExpression) children.push(expr.elseExpression);
      break;
    }

    // Declarations
    case 'VariableDeclaration': {
      const decl = node as any;
      // TypeRef is not a node type, so we don't traverse it
      if (decl.modifiers && Array.isArray(decl.modifiers)) {
        children.push(...decl.modifiers);
      }
      if (decl.annotations && Array.isArray(decl.annotations)) {
        children.push(...decl.annotations);
      }
      if (decl.initializer) children.push(decl.initializer);
      break;
    }
    case 'ClassDeclaration': {
      const decl = node as any;
      // TypeRef is not a node type, so we don't traverse extendsClause or implementsClause
      if (decl.modifiers && Array.isArray(decl.modifiers)) {
        children.push(...decl.modifiers);
      }
      if (decl.annotations && Array.isArray(decl.annotations)) {
        children.push(...decl.annotations);
      }
      if (decl.members) {
        children.push(...decl.members);
      }
      break;
    }
    case 'MethodDeclaration': {
      const decl = node as any;
      if (decl.modifiers && Array.isArray(decl.modifiers)) {
        children.push(...decl.modifiers);
      }
      if (decl.annotations && Array.isArray(decl.annotations)) {
        children.push(...decl.annotations);
      }
      if (decl.parameters) {
        children.push(...decl.parameters);
      }
      if (decl.body) children.push(decl.body);
      break;
    }
    case 'TypeRef': {
      const typeRef = node as any;
      // TypeRef children are: identifiers from all components + type arguments from all components
      if (typeRef.components) {
        for (const comp of typeRef.components) {
          if (comp.id) children.push(comp.id);
          if (comp.args) {
            for (const arg of comp.args) {
              if (arg && typeof arg === 'object' && 'kind' in arg) {
                children.push(arg);
              }
            }
          }
        }
      }
      break;
    }
    case 'ConstructorInitializer': {
      const init = node as any;
      if (init.type) children.push(init.type);
      if (init.args) {
        children.push(...init.args);
      }
      break;
    }
    case 'ValuesInitializer': {
      const init = node as any;
      if (init.type) children.push(init.type);
      if (init.values) {
        children.push(...init.values);
      }
      break;
    }
    case 'SizedArrayInitializer': {
      const init = node as any;
      if (init.type) children.push(init.type);
      if (init.size) children.push(init.size);
      break;
    }
    case 'MapInitializer': {
      const init = node as any;
      if (init.type) children.push(init.type);
      if (init.pairs) {
        for (const pair of init.pairs) {
          if (pair.key) children.push(pair.key);
          if (pair.value) children.push(pair.value);
        }
      }
      break;
    }
    case 'ExpressionElementValue': {
      const elem = node as any;
      if (elem.value) children.push(elem.value);
      break;
    }
    case 'AnnotationElementValue': {
      const elem = node as any;
      if (elem.value) children.push(elem.value);
      break;
    }
    case 'ArrayElementValue': {
      const elem = node as any;
      if (elem.values) {
        children.push(...elem.values);
      }
      break;
    }
    case 'AnnotationArgument': {
      const arg = node as any;
      if (arg.value) children.push(arg.value);
      break;
    }
    case 'SoqlOrSoslBinding': {
      const binding = node as any;
      if (binding.expr) children.push(binding.expr);
      break;
    }
    case 'SoqlExpression':
    case 'SoslExpression': {
      const expr = node as any;
      if (expr.bindings) {
        children.push(...expr.bindings);
      }
      break;
    }

    default:
      // For unknown node types, try to find children generically
      const genericChildren = findGenericChildren(node);
      children.push(...genericChildren);
      break;
  }

  return children;
}

/**
 * Find children generically by inspecting object properties.
 * @param node - The AST node to find children for.
 * @returns An array of child AST nodes.
 */
function findGenericChildren(node: ASTNode): ASTNode[] {
  const children: ASTNode[] = [];

  for (const key in node) {
    if (key === 'kind' || key === 'location') {
      continue;
    }

    const value = (node as any)[key];
    if (!value) {
      continue;
    }

    if (value && typeof value === 'object' && 'kind' in value) {
      // It's an AST node
      children.push(value);
    } else if (Array.isArray(value)) {
      // It's an array - check if it contains AST nodes
      for (const item of value) {
        if (item && typeof item === 'object' && 'kind' in item) {
          children.push(item);
        }
      }
    }
  }

  return children;
}

/**
 * Get parent node mapping (requires building parent map first).
 * @param root - The root AST node to build the parent map from.
 * @returns A map of child nodes to their parent nodes.
 */
export function buildParentMap(root: ASTNode): Map<ASTNode, ASTNode | null> {
  const parentMap = new Map<ASTNode, ASTNode | null>();
  parentMap.set(root, null);

  walkAST(root, {
    enterNode: (node) => {
      const children = getNodeChildren(node);
      for (const child of children) {
        parentMap.set(child, node);
      }
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
export function getAncestors(node: ASTNode, root: ASTNode): ASTNode[] {
  const parentMap = buildParentMap(root);
  const ancestors: ASTNode[] = [];
  let current: ASTNode | null | undefined = node;

  while (current) {
    ancestors.unshift(current);
    current = parentMap.get(current) || null;
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
export function findNodesByType(ast: ASTNode, nodeType: string): ASTNode[] {
  const results: ASTNode[] = [];

  walkAST(ast, {
    enterNode: (node) => {
      if (node.kind === nodeType) {
        results.push(node);
      }
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
export function getParentNode(root: ASTNode, node: ASTNode): ASTNode | null {
  const parentMap = buildParentMap(root);
  return parentMap.get(node) || null;
}

/**
 * Get all child nodes of a specific type.
 * @param node - The parent node.
 * @param nodeType - The node kind to filter by (e.g., 'VariableDeclaration', 'MethodDeclaration').
 * @returns Array of child nodes matching the specified type.
 * @example
 * const methods = getChildNodesByType(classNode, 'MethodDeclaration');
 */
export function getChildNodesByType(node: ASTNode, nodeType: string): ASTNode[] {
  const children = getNodeChildren(node);
  return children.filter((child) => child.kind === nodeType);
}
