/**
 * @file Type guard functions for ApexDoc AST nodes.
 * TypeScript type guard functions for checking ApexDoc node types at runtime.
 */

import type { ASTNode } from '../ast/baseNode.js';
import type {
  ApexDocComment,
  ApexDocBlockTag,
  ApexDocInlineTag,
  ApexDocParam,
  ApexDocReturn,
  ApexDocGroup,
  ApexDocCode,
} from '../ast/apexDoc.js';

/**
 * Type guard for ApexDocComment nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocComment.
 */
export function isApexDocComment(node: ASTNode): node is ApexDocComment {
  return 'kind' in node && node.kind === 'ApexDocComment';
}

/**
 * Type guard for ApexDocBlockTag nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocBlockTag.
 */
export function isApexDocBlockTag(node: ASTNode): node is ApexDocBlockTag {
  return (
    'kind' in node &&
    typeof node.kind === 'string' &&
    [
      'ApexDocParam',
      'ApexDocReturn',
      'ApexDocAuthor',
      'ApexDocDeprecated',
      'ApexDocExample',
      'ApexDocGroup',
      'ApexDocSee',
      'ApexDocSince',
      'ApexDocThrows',
      'ApexDocVersion',
    ].includes(node.kind)
  );
}

/**
 * Type guard for ApexDocInlineTag nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocInlineTag.
 */
export function isApexDocInlineTag(node: ASTNode): node is ApexDocInlineTag {
  return (
    'kind' in node &&
    typeof node.kind === 'string' &&
    ['ApexDocCode', 'ApexDocHidden', 'ApexDocLink', 'ApexDocLiteral'].includes(node.kind)
  );
}

/**
 * Type guard for ApexDocParam nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocParam.
 */
export function isApexDocParam(node: ASTNode): node is ApexDocParam {
  return 'kind' in node && node.kind === 'ApexDocParam';
}

/**
 * Type guard for ApexDocReturn nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocReturn.
 */
export function isApexDocReturn(node: ASTNode): node is ApexDocReturn {
  return 'kind' in node && node.kind === 'ApexDocReturn';
}

/**
 * Type guard for ApexDocGroup nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocGroup.
 */
export function isApexDocGroup(node: ASTNode): node is ApexDocGroup {
  return 'kind' in node && node.kind === 'ApexDocGroup';
}

/**
 * Type guard for ApexDocCode nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocCode.
 */
export function isApexDocCode(node: ASTNode): node is ApexDocCode {
  return 'kind' in node && node.kind === 'ApexDocCode';
}
