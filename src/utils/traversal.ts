/**
 * AST traversal utilities
 */

import type { ASTNode } from '../ast/base.js';

/**
 * Visitor interface for AST traversal
 * Note: This is different from ASTVisitor in ast/visitor.ts
 * This one is for walkAST utility, the other is for the visitor pattern
 */
export interface ASTWalkVisitor {
  /**
   * Called when entering a node.
   * Return false to skip visiting children of this node.
   */
  enterNode?: (node: ASTNode) => void | boolean;

  /**
   * Called when exiting a node.
   */
  exitNode?: (node: ASTNode) => void;
}

/**
 * Walk the AST tree with a visitor
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
 * Visit children of a node
 */
function visitChildren(node: ASTNode, visitor: ASTWalkVisitor): void {
  // Extract children based on node type
  const children = getNodeChildren(node);

  for (const child of children) {
    walkAST(child, visitor);
  }
}

/**
 * Get all children of a node
 */
function getNodeChildren(node: ASTNode): ASTNode[] {
  const children: ASTNode[] = [];

  // Handle different node types
  switch (node.kind) {
    // Statements
    case 'IfStatement': {
      const stmt = node as any;
      if (stmt.condition) children.push(stmt.condition);
      if (stmt.thenBody) children.push(stmt.thenBody);
      if (stmt.elseBody) children.push(stmt.elseBody);
      break;
    }
    case 'ForStatement': {
      const stmt = node as any;
      if (stmt.init) children.push(stmt.init);
      if (stmt.condition) children.push(stmt.condition);
      if (stmt.update) children.push(stmt.update);
      if (stmt.body) children.push(stmt.body);
      break;
    }
    case 'WhileStatement': {
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
    case 'Block': {
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

    // Expressions
    case 'BinaryExpression': {
      const expr = node as any;
      if (expr.left) children.push(expr.left);
      if (expr.right) children.push(expr.right);
      break;
    }
    case 'MethodCallExpression': {
      const expr = node as any;
      if (expr.target) children.push(expr.target);
      if (expr.arguments) {
        children.push(...expr.arguments);
      }
      if (expr.typeArguments) {
        children.push(...expr.typeArguments);
      }
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
      if (decl.type) children.push(decl.type);
      if (decl.initializer) children.push(decl.initializer);
      break;
    }
    case 'ClassDeclaration': {
      const decl = node as any;
      if (decl.extendsClause) children.push(decl.extendsClause);
      if (decl.implementsClause) {
        children.push(...decl.implementsClause);
      }
      if (decl.members) {
        children.push(...decl.members);
      }
      break;
    }
    case 'MethodDeclaration': {
      const decl = node as any;
      if (decl.returnType) children.push(decl.returnType);
      if (decl.parameters) {
        children.push(...decl.parameters);
      }
      if (decl.body) children.push(decl.body);
      break;
    }

    // Types
    case 'ArrayType': {
      const type = node as any;
      if (type.elementType) children.push(type.elementType);
      break;
    }
    case 'GenericType': {
      const type = node as any;
      if (type.baseType) children.push(type.baseType);
      if (type.typeArguments) {
        children.push(...type.typeArguments);
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
 * Find children generically by inspecting object properties
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
 * Get parent node mapping (requires building parent map first)
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
 * Get all ancestors of a node
 */
export function getAncestors(
  node: ASTNode,
  root: ASTNode
): ASTNode[] {
  const parentMap = buildParentMap(root);
  const ancestors: ASTNode[] = [];
  let current: ASTNode | null | undefined = node;

  while (current) {
    ancestors.unshift(current);
    current = parentMap.get(current) || null;
  }

  return ancestors;
}
