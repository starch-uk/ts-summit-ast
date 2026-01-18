/**
 * @file AST traversal utilities.
 * Utilities for traversing AST trees with visitor patterns.
 */

import type { ASTNode } from '../ast/base.js';
import type {
  IfStatement,
  ForLoopStatement,
  WhileLoopStatement,
  ReturnStatement,
  CompoundStatement,
  ExpressionStatement,
  VariableDeclarationStatement,
  DmlStatement,
  ThrowStatement,
  SwitchStatement,
  SwitchCase,
} from '../ast/Statement.js';
import type {
  BinaryExpression,
  CallExpression,
  FieldExpression,
  ArrayExpression,
  NewExpression,
  CastExpression,
  ParenthesizedExpression,
  TernaryExpression,
  SoqlExpression,
  SoslExpression,
} from '../ast/Expression.js';
import type {
  VariableDeclaration,
  ClassDeclaration,
  MethodDeclaration,
} from '../ast/Declaration.js';
import type { TypeRef } from '../ast/Type.js';
import type {
  ConstructorInitializer,
  ValuesInitializer,
  SizedArrayInitializer,
  MapInitializer,
} from '../ast/Initializer.js';
import type {
  ExpressionElementValue,
  AnnotationElementValue,
  ArrayElementValue,
} from '../ast/ElementValue.js';
import type { AnnotationArgument } from '../ast/Declaration.js';
import type { SoqlOrSoslBinding } from '../ast/SoqlOrSoslBinding.js';

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
  enterNode?: (node: Readonly<ASTNode>) => boolean | undefined;

  /**
   * Called when exiting a node.
   */
  exitNode?: (node: Readonly<ASTNode>) => void;
}

/**
 * Get all children of a node.
 * @param node - The AST node to get children from.
 * @returns An array of child AST nodes.
 */
function getNodeChildren(node: Readonly<ASTNode>): ASTNode[] {
  const children: ASTNode[] = [];

  // Handle different node types
  switch (node.kind) {
    // Statements
    case 'IfStatement': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const stmt = node as IfStatement;
      children.push(stmt.condition);
      children.push(stmt.thenStatement);
      if (stmt.elseStatement) {
        children.push(stmt.elseStatement);
      }
      break;
    }
    case 'ForLoopStatement': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const stmt = node as ForLoopStatement;
      if (stmt.init) {
        children.push(stmt.init);
      }
      if (stmt.condition) {
        children.push(stmt.condition);
      }
      if (stmt.update) {
        children.push(stmt.update);
      }
      children.push(stmt.body);
      break;
    }
    case 'WhileLoopStatement': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const stmt = node as WhileLoopStatement;
      children.push(stmt.condition);
      children.push(stmt.body);
      break;
    }
    case 'ReturnStatement': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const stmt = node as ReturnStatement;
      if (stmt.expression) {
        children.push(stmt.expression);
      }
      break;
    }
    case 'CompoundStatement': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const stmt = node as CompoundStatement;
      children.push(...stmt.statements);
      break;
    }
    case 'ExpressionStatement': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const stmt = node as ExpressionStatement;
      children.push(stmt.expression);
      break;
    }
    case 'VariableDeclarationStatement': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const stmt = node as VariableDeclarationStatement;
      children.push(stmt.declaration);
      break;
    }
    case 'BreakStatement':
    case 'ContinueStatement': {
      // Break and continue statements have no children (label is a string, not an AST node)
      break;
    }
    case 'DmlStatement': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const stmt = node as DmlStatement;
      children.push(stmt.target);
      break;
    }
    case 'ThrowStatement': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const stmt = node as ThrowStatement;
      children.push(stmt.expression);
      break;
    }
    case 'SwitchStatement': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const stmt = node as SwitchStatement;
      children.push(stmt.expression);
      children.push(...stmt.cases);
      if (stmt.defaultCase) {
        children.push(stmt.defaultCase);
      }
      break;
    }
    case 'SwitchCase': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const c = node as SwitchCase;
      if (c.value) {
        children.push(c.value);
      }
      children.push(...c.statements);
      break;
    }

    // Expressions
    case 'BinaryExpression': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const expr = node as BinaryExpression;
      children.push(expr.left);
      children.push(expr.right);
      break;
    }
    case 'CallExpression': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const expr = node as CallExpression;
      if (expr.target) {
        children.push(expr.target);
      }
      children.push(...expr.arguments);
      // TypeRef is not a node type, so we don't traverse typeArguments
      break;
    }
    case 'FieldExpression': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const expr = node as FieldExpression;
      if (expr.target) {
        children.push(expr.target);
      }
      children.push(expr.field);
      break;
    }
    case 'ArrayExpression': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const expr = node as ArrayExpression;
      children.push(expr.array);
      children.push(expr.index);
      break;
    }
    case 'NewExpression': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const expr = node as NewExpression;
      if (expr.initializer) {
        children.push(expr.initializer);
      }
      break;
    }
    case 'CastExpression': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const expr = node as CastExpression;
      children.push(expr.type);
      children.push(expr.expression);
      break;
    }
    case 'ParenthesizedExpression': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const expr = node as ParenthesizedExpression;
      children.push(expr.expression);
      break;
    }
    case 'TernaryExpression': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const expr = node as TernaryExpression;
      children.push(expr.condition);
      children.push(expr.thenExpression);
      children.push(expr.elseExpression);
      break;
    }

    // Declarations
    case 'VariableDeclaration': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const decl = node as VariableDeclaration;
      // TypeRef is not a node type, so we don't traverse it
      if (decl.modifiers && Array.isArray(decl.modifiers)) {
        children.push(...decl.modifiers);
      }
      if (decl.annotations) {
        children.push(...decl.annotations);
      }
      if (decl.initializer) {
        children.push(decl.initializer);
      }
      break;
    }
    case 'ClassDeclaration': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const decl = node as ClassDeclaration;
      // TypeRef is not a node type, so we don't traverse extendsClause or implementsClause
      if (decl.modifiers && Array.isArray(decl.modifiers)) {
        children.push(...decl.modifiers);
      }
      if (decl.annotations) {
        children.push(...decl.annotations);
      }
      if (decl.members) {
        children.push(...decl.members);
      }
      break;
    }
    case 'MethodDeclaration': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const decl = node as MethodDeclaration;
      if (decl.modifiers && Array.isArray(decl.modifiers)) {
        children.push(...decl.modifiers);
      }
      if (decl.annotations) {
        children.push(...decl.annotations);
      }
      children.push(...decl.parameters);
      if (decl.body) {
        children.push(decl.body);
      }
      break;
    }
    case 'TypeRef': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const typeRef = node as TypeRef;
      // TypeRef children are: identifiers from all components + type arguments from all components
      for (const comp of typeRef.components) {
        children.push(comp.id);
        if (comp.args) {
          for (const arg of comp.args) {
            if (arg && typeof arg === 'object' && 'kind' in arg) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
              children.push(arg as ASTNode);
            }
          }
        }
      }
      break;
    }
    case 'ConstructorInitializer': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const init = node as ConstructorInitializer;
      children.push(init.type);
      children.push(...init.args);
      break;
    }
    case 'ValuesInitializer': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const init = node as ValuesInitializer;
      children.push(init.type);
      children.push(...init.values);
      break;
    }
    case 'SizedArrayInitializer': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const init = node as SizedArrayInitializer;
      children.push(init.type);
      children.push(init.size);
      break;
    }
    case 'MapInitializer': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const init = node as MapInitializer;
      children.push(init.type);
      for (const pair of init.pairs) {
        children.push(pair.key);
        children.push(pair.value);
      }
      break;
    }
    case 'ExpressionElementValue': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const elem = node as ExpressionElementValue;
      children.push(elem.value);
      break;
    }
    case 'AnnotationElementValue': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const elem = node as AnnotationElementValue;
      children.push(elem.value);
      break;
    }
    case 'ArrayElementValue': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const elem = node as ArrayElementValue;
      children.push(...elem.values);
      break;
    }
    case 'AnnotationArgument': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const arg = node as AnnotationArgument;
      children.push(arg.value);
      break;
    }
    case 'SoqlOrSoslBinding': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const binding = node as SoqlOrSoslBinding;
      children.push(binding.expr);
      break;
    }
    case 'SoqlExpression':
    case 'SoslExpression': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const expr = node as SoqlExpression | SoslExpression;
      children.push(...expr.bindings);
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
 * Visit children of a node.
 * @param node - The AST node whose children to visit.
 * @param visitor - The visitor to use for traversal.
 */
function visitChildren(node: Readonly<ASTNode>, visitor: ASTWalkVisitor): void {
  // Extract children based on node type
  const children = getNodeChildren(node);

  for (const child of children) {
    walkAST(child, visitor);
  }
}

/**
 * Walk the AST tree with a visitor.
 * @param ast - The AST node to walk.
 * @param visitor - The visitor to use for traversal.
 */
function walkAST(ast: Readonly<ASTNode>, visitor: ASTWalkVisitor): void {
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
 * Find children generically by inspecting object properties.
 * @param node - The AST node to find children for.
 * @returns An array of child AST nodes.
 */
function findGenericChildren(node: Readonly<ASTNode>): ASTNode[] {
  const children: ASTNode[] = [];

  for (const key in node) {
    if (key === 'kind' || key === 'location') {
      continue;
    }

    const value = (node as unknown as Record<string, unknown>)[key];
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'object' && 'kind' in value) {
      // It's an AST node
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      children.push(value as ASTNode);
    } else if (Array.isArray(value)) {
      // It's an array - check if it contains AST nodes
      for (const item of value) {
        if (item && typeof item === 'object' && 'kind' in item) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          children.push(item as ASTNode);
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
function buildParentMap(root: Readonly<ASTNode>): Map<ASTNode, ASTNode | null> {
  const parentMap = new Map<ASTNode, ASTNode | null>();
  parentMap.set(root, null);

  walkAST(root, {
    enterNode: (node): undefined => {
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
  return children.filter((child) => child.kind === nodeType);
}

export {
  walkAST,
  getNodeChildren,
  buildParentMap,
  getAncestors,
  findNodesByType,
  getParentNode,
  getChildNodesByType,
};
