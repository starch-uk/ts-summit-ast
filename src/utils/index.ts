/**
 * @file Utility functions for AST manipulation and analysis.
 * Main export file for utility functions.
 */

// Note: do not re-export ASTVisitor here; it is already exported from ../ast/index.js

// All type exports
export type { Position, SourceTextOptions } from './sourceExtraction.js';
export type { ASTWalkVisitor } from './traversal.js';
export type {
  NodeAtPositionResult,
  FindNodeAtPositionOptions,
  NodePath,
  NodeMetadata,
  NodesInRangeResult,
  FindNodesInRangeOptions,
} from './nodeFinder.js';
export type {
  CommentInfo,
  CommentPattern,
  AssociatedNodeResult,
  FindAssociatedNodeOptions,
  ExtractedComment,
  ExtractCommentsOptions,
} from './commentUtils.js';
export type {
  RuleMatchResult,
  WouldTriggerRuleOptions,
  RuleMatch,
  FindRuleMatchesOptions,
  XPathValidationResult,
  XPathFeatureSupport,
} from './ruleMatching.js';
export type { ApexParseError, ApexParseOptions, ApexParseResult } from './apexParser.js';
export type { ApexDocParseOptions } from './apexdocParser.js';
export type { ASTValidationResult, ASTComparisonResult, ASTStatistics } from './astValidation.js';

// All value exports
export * from './sourceExtraction.js';
export * from './traversal.js';
export * from './nodeFinder.js';
export * from './commentUtils.js';
export * from './ruleMatching.js';
export * from './apexParser.js';
export * from './apexdocParser.js';
export * from './astValidation.js';
