/**
 * Utility functions for AST manipulation and analysis
 */

// Position utilities
export * from './position.js';
export type { Position } from './position.js';
export { isPositionInRange } from './position.js';

// Traversal utilities
export * from './traversal.js';
export type { ASTWalkVisitor } from './traversal.js';
export {
  findNodesByType,
  getParentNode,
  getChildNodesByType,
} from './traversal.js';

// Node finding utilities
export * from './node-finder.js';
export type {
  NodeAtPositionResult,
  FindNodeAtPositionOptions,
  NodesInRangeResult,
  FindNodesInRangeOptions,
} from './node-finder.js';

// Source extraction utilities
export * from './source-extraction.js';
export type { SourceTextOptions } from './source-extraction.js';
export { getSourceTextForRange, mergeSourceRanges } from './source-extraction.js';

// Comment mapping utilities
export * from './comment-mapping.js';
export type {
  CommentInfo,
  CommentPattern,
  AssociatedNodeResult,
  FindAssociatedNodeOptions,
  ExtractedComment,
  ExtractCommentsOptions,
} from './comment-mapping.js';

// Node information utilities
export * from './node-info.js';
export type { NodePath, NodeMetadata } from './node-info.js';

// Rule matching utilities
export * from './rule-matching.js';
export type {
  RuleMatchResult,
  WouldTriggerRuleOptions,
  RuleMatch,
  FindRuleMatchesOptions,
  XPathValidationResult,
  XPathFeatureSupport,
} from './rule-matching.js';
export { validateXPath, getXPathFeatureSupport } from './rule-matching.js';

// Re-export ASTVisitor from ast for convenience (the one from utils is ASTWalkVisitor)
export type { ASTVisitor } from '../ast/visitor.js';

// Apex parsing utilities
export * from './apex-parser.js';
export type { ApexParseError, ApexParseOptions, ApexParseResult } from './apex-parser.js';

// ApexDoc parsing utilities
export * from './apexdoc-parser.js';
export type { ApexDocParseOptions } from './apexdoc-parser.js';

// Batch processing utilities
export * from './batch-processing.js';
export { parseMultipleFiles, extractCommentsBatch } from './batch-processing.js';

// AST validation utilities
export * from './ast-validation.js';
export type {
  ASTValidationResult,
  ASTComparisonResult,
  ASTStatistics,
} from './ast-validation.js';
export { validateAST, compareASTs, getASTStatistics } from './ast-validation.js';
