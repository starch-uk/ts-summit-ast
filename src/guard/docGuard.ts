/**
 * @file Type guard functions for ApexDoc AST nodes.
 * TypeScript type guard functions for checking ApexDoc node types at runtime.
 */

import type { ASTNode } from '../ast/baseNode.js';
import type {
  ApexDocAuthor,
  ApexDocCode,
  ApexDocComment,
  ApexDocDeprecated,
  ApexDocExample,
  ApexDocGroup,
  ApexDocHidden,
  ApexDocLink,
  ApexDocLiteral,
  ApexDocParam,
  ApexDocReturn,
  ApexDocSee,
  ApexDocSince,
  ApexDocThrows,
  ApexDocVersion,
} from '../ast/apexDoc.js';

/**
 * Type guard for ApexDocComment nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocComment.
 */
function isApexDocComment(node: ASTNode): node is ApexDocComment {
  return '@type' in node && node['@type'] === 'ApexDocComment';
}

/**
 * Type guard for ApexDocBlockTag nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocBlockTag.
 */
function isApexDocBlockTag(
  node: ASTNode
): node is
  | ApexDocAuthor
  | ApexDocDeprecated
  | ApexDocExample
  | ApexDocGroup
  | ApexDocParam
  | ApexDocReturn
  | ApexDocSee
  | ApexDocSince
  | ApexDocThrows
  | ApexDocVersion {
  return (
    '@type' in node &&
    typeof node['@type'] === 'string' &&
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
    ].includes(node['@type'])
  );
}

/**
 * Type guard for ApexDocInlineTag nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocInlineTag.
 */
function isApexDocInlineTag(
  node: ASTNode
): node is ApexDocCode | ApexDocHidden | ApexDocLink | ApexDocLiteral {
  return (
    '@type' in node &&
    typeof node['@type'] === 'string' &&
    ['ApexDocCode', 'ApexDocHidden', 'ApexDocLink', 'ApexDocLiteral'].includes(node['@type'])
  );
}

/**
 * Type guard for ApexDocParam nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocParam.
 */
function isApexDocParam(node: ASTNode): node is ApexDocParam {
  return '@type' in node && node['@type'] === 'ApexDocParam';
}

/**
 * Type guard for ApexDocReturn nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocReturn.
 */
function isApexDocReturn(node: ASTNode): node is ApexDocReturn {
  return '@type' in node && node['@type'] === 'ApexDocReturn';
}

/**
 * Type guard for ApexDocGroup nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocGroup.
 */
function isApexDocGroup(node: ASTNode): node is ApexDocGroup {
  return '@type' in node && node['@type'] === 'ApexDocGroup';
}

/**
 * Type guard for ApexDocCode nodes.
 * @param node - The AST node to check.
 * @returns True if the node is an ApexDocCode.
 */
function isApexDocCode(node: ASTNode): node is ApexDocCode {
  return '@type' in node && node['@type'] === 'ApexDocCode';
}

export {
  isApexDocComment,
  isApexDocBlockTag,
  isApexDocInlineTag,
  isApexDocParam,
  isApexDocReturn,
  isApexDocGroup,
  isApexDocCode,
};
