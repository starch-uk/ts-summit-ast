/**
 * Utility functions for AST manipulation and analysis
 */

// Position utilities
export * from './position.js';
export type { Position } from './position.js';

// Traversal utilities
export * from './traversal.js';
export type { ASTWalkVisitor } from './traversal.js';

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

// Comment mapping utilities
export * from './comment-mapping.js';
export type {
  CommentInfo,
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
} from './rule-matching.js';

// Re-export ASTVisitor from ast for convenience (the one from utils is ASTWalkVisitor)
export type { ASTVisitor } from '../ast/visitor.js';

// Apex parsing utilities
export * from './apex-parser.js';
export type { ApexParseError, ApexParseOptions, ApexParseResult } from './apex-parser.js';
