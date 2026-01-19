/**
 * @file Utility functions for AST manipulation and analysis.
 * Main export file for utility functions.
 */

// Re-export ASTVisitor from ast for convenience (the one from utils is ASTWalkVisitor)
export type { ASTVisitor } from '../ast/base.js';

// All type exports
export type { Position, SourceTextOptions } from './source-extraction.js';
export type { ASTWalkVisitor } from './traversal.js';
export type {
  NodeAtPositionResult,
  FindNodeAtPositionOptions,
  NodePath,
  NodeMetadata,
  NodesInRangeResult,
  FindNodesInRangeOptions,
} from './node-finder.js';
export type {
  CommentInfo,
  CommentPattern,
  AssociatedNodeResult,
  FindAssociatedNodeOptions,
  ExtractedComment,
  ExtractCommentsOptions,
} from './comment-utils.js';
export type {
  RuleMatchResult,
  WouldTriggerRuleOptions,
  RuleMatch,
  FindRuleMatchesOptions,
  XPathValidationResult,
  XPathFeatureSupport,
} from './rule-matching.js';
export type { ApexParseError, ApexParseOptions, ApexParseResult } from './apex-parser.js';
export type { ApexDocParseOptions } from './apexdoc-parser.js';
export type { ASTValidationResult, ASTComparisonResult, ASTStatistics } from './ast-validation.js';

// All value exports
export * from './source-extraction.js';
export * from './traversal.js';
export * from './node-finder.js';
export * from './comment-utils.js';
export * from './rule-matching.js';
export * from './apex-parser.js';
export * from './apexdoc-parser.js';
export * from './ast-validation.js';
