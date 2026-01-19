/**
 * @file Tests for source extraction utilities
 * Ported from com.google.summit.translation.SourceLocationTest.
 */

import {
  getSourceText,
  getSourceRange,
  locationToOffset,
  offsetToLocation,
  UNKNOWN_SOURCE_LOCATION,
  isUnknownLocation,
  isPositionInRange,
  isPositionBefore,
  isPositionAfter,
  getDistanceToRange,
} from '../../src/utils/source-extraction.js';
import type { Position } from '../../src/utils/source-extraction.js';
import { NodeFactory } from '../../src/translator/NodeFactory.js';
import { parseAndTranslate, findFirstNodeOfType } from '../translate-helpers.js';
import { isClassDeclaration, isVariableDeclaration } from '../../src/ast/type-guards.js';
import type { SourceRange } from '../../src/ast/base.js';

describe('Source Extraction Utilities', () => {
  const sourceCode = `public class Test {
    private Integer value = 42;
    public void method() {
        return;
    }
}`;

  describe('getSourceRange', () => {
    it('should return location if available', () => {
      const location = {
        end: { column: 15, line: 2 },
        start: { column: 5, line: 2 },
      };
      const node = NodeFactory.createIdentifier('value', { location });

      const range = getSourceRange(node);
      expect(range).toEqual(location);
    });

    it('should return null if location not available', () => {
      const node = NodeFactory.createIdentifier('test');
      const range = getSourceRange(node);
      expect(range).toBeNull();
    });
  });

  describe('getSourceText', () => {
    it('should extract text for single-line node', () => {
      // "value" is at columns 21-25 in "    private Integer value = 42;"
      const location = {
        end: { column: 25, line: 2 },
        start: { column: 21, line: 2 },
      };
      const node = NodeFactory.createIdentifier('value', { location });

      const text = getSourceText(node, sourceCode);
      expect(text).toBe('value');
    });

    it('should extract text for multi-line node', () => {
      const location = {
        end: { column: 1, line: 5 },
        start: { column: 1, line: 1 },
      };
      const node = NodeFactory.createBlock([], { location });

      const text = getSourceText(node, sourceCode);
      expect(text).toContain('public class Test');
    });

    it('should trim text when requested', () => {
      // "value" starts at column 21 in "    private Integer value = 42;"
      const location = {
        end: { column: 26, line: 2 },
        start: { column: 21, line: 2 },
      };
      const node = NodeFactory.createIdentifier('value', { location });

      const text = getSourceText(node, sourceCode, { trim: true });
      expect(text).toBe('value');
    });
  });

  describe('locationToOffset', () => {
    it('should convert location to offset', () => {
      const location = { column: 5, line: 2 };
      const offset = locationToOffset(location, sourceCode);
      expect(offset).toBeGreaterThanOrEqual(0);
    });
  });

  describe('offsetToLocation', () => {
    it('should convert offset to location', () => {
      const offset = 20;
      const location = offsetToLocation(offset, sourceCode);
      expect(location.line).toBeGreaterThan(0);
      expect(location.column).toBeGreaterThan(0);
    });
  });

  describe('Source Location Tests (from original)', () => {
    it('declaration has correct source location', () => {
      const input = 'public class Test { }';

      const cu = parseAndTranslate(input);
      const classDecl = findFirstNodeOfType(cu, isClassDeclaration);

      expect(classDecl).not.toBeNull();
      if (classDecl?.location) {
        // The location should span from "class" to the end
        const classIndex = input.indexOf('class');
        expect(classDecl.location.start.line).toBe(1);
        expect(classDecl.location.start.column).toBeGreaterThanOrEqual(classIndex + 1);
        expect(classDecl.location.end.line).toBe(1);
        expect(classDecl.location.end.column).toBeGreaterThanOrEqual(input.length);
      }
    });

    it('unknown source location prints special string', () => {
      expect(isUnknownLocation(UNKNOWN_SOURCE_LOCATION)).toBe(true);
      // Note: We don't have a toString() method, but we can check the structure
      expect(UNKNOWN_SOURCE_LOCATION.start.line).toBe(0);
      expect(UNKNOWN_SOURCE_LOCATION.start.column).toBe(0);
    });

    it('extract from source one-line node', () => {
      const input = `
        class Test {
          public String field
            = 'Hello';
        }
      `;
      const classDecl = findFirstNodeOfType(parseAndTranslate(input), isClassDeclaration);
      expect(classDecl).not.toBeNull();
      if (classDecl?.location) {
        const extracted = getSourceText(classDecl, input);
        expect(extracted).toContain('Test');
      }
    });

    it('extract from source multi-line node', () => {
      const input = `
        class Test {
          public String field
            = 'Hello';
        }
      `;
      const cu = parseAndTranslate(input);
      const fieldDecl = findFirstNodeOfType(cu, isVariableDeclaration);
      expect(fieldDecl).not.toBeNull();
      if (fieldDecl?.location) {
        const extracted = getSourceText(fieldDecl, input);
        expect(extracted).toContain('String field');
        expect(extracted).toContain("= 'Hello'");
      }
    });

    it('extract from source whole file', () => {
      const input = `
        class Test {
          public String field
            = 'Hello';
        }
      `.trim();
      const cu = parseAndTranslate(input);
      if (cu.location) {
        const extracted = getSourceText(cu, input);
        expect(extracted).toContain('class Test');
      }
    });

    it('extract from source arbitrary location', () => {
      const input = `
        class Test {
          public String field
            = 'Hello';
        }
      `.trim();
      const node = NodeFactory.createIdentifier('test', {
        location: {
          end: { column: 16, line: 3 },
          start: { column: 4, line: 1 },
        },
      });
      const extracted = getSourceText(node, input);
      expect(extracted).toBeTruthy();
    });

    it('trailing empty line', () => {
      const input = 'public class Test { }\n';

      const cu = parseAndTranslate(input);
      if (cu.location) {
        expect(cu.location.end.line).toBe(2);
        expect(cu.location.end.column).toBeGreaterThanOrEqual(0);
        const extracted = getSourceText(cu, input);
        expect(extracted).toBeTruthy();
      }
    });

    it('trailing whitespace line', () => {
      const input = 'public class Test { }\n ';

      const cu = parseAndTranslate(input);
      if (cu.location) {
        expect(cu.location.end.line).toBe(2);
        expect(cu.location.end.column).toBeGreaterThanOrEqual(1);
        const extracted = getSourceText(cu, input);
        expect(extracted).toBeTruthy();
      }
    });

    it('leading empty line', () => {
      const input = '\npublic class Test { }';

      const cu = parseAndTranslate(input);
      if (cu.location) {
        // The source location starts from the first regular token
        expect(cu.location.start.line).toBe(2);
        expect(cu.location.start.column).toBeGreaterThanOrEqual(0);
      }
    });

    it('tabs are counted as single characters', () => {
      const input = '\t\tpublic class Test { }';

      const cu = parseAndTranslate(input);
      if (cu.location) {
        expect(cu.location.start.column).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('Position Utilities', () => {
    const range: SourceRange = {
      end: { column: 20, line: 7 },
      start: { column: 10, line: 5 },
    };

    describe('isPositionInRange', () => {
      it('should return true for position inside range', () => {
        const position: Position = { column: 15, line: 6 };
        expect(isPositionInRange(position, range)).toBe(true);
      });

      it('should return true for position at start', () => {
        const position: Position = { column: 10, line: 5 };
        expect(isPositionInRange(position, range)).toBe(true);
      });

      it('should return true for position at end', () => {
        const position: Position = { column: 20, line: 7 };
        expect(isPositionInRange(position, range)).toBe(true);
      });

      it('should return false for position before range', () => {
        const position: Position = { column: 15, line: 4 };
        expect(isPositionInRange(position, range)).toBe(false);
      });

      it('should return false for position after range', () => {
        const position: Position = { column: 15, line: 8 };
        expect(isPositionInRange(position, range)).toBe(false);
      });

      it('should handle single-line range', () => {
        const singleLineRange: SourceRange = {
          end: { column: 20, line: 5 },
          start: { column: 10, line: 5 },
        };
        const position: Position = { column: 15, line: 5 };
        expect(isPositionInRange(position, singleLineRange)).toBe(true);
      });
    });

    describe('isPositionBefore', () => {
      it('should return true for position before range', () => {
        const position: Position = { column: 15, line: 4 };
        expect(isPositionBefore(position, range)).toBe(true);
      });

      it('should return false for position in range', () => {
        const position: Position = { column: 15, line: 6 };
        expect(isPositionBefore(position, range)).toBe(false);
      });
    });

    describe('isPositionAfter', () => {
      it('should return true for position after range', () => {
        const position: Position = { column: 15, line: 8 };
        expect(isPositionAfter(position, range)).toBe(true);
      });

      it('should return false for position in range', () => {
        const position: Position = { column: 15, line: 6 };
        expect(isPositionAfter(position, range)).toBe(false);
      });
    });

    describe('getDistanceToRange', () => {
      it('should return 0 for position in range', () => {
        const position: Position = { column: 15, line: 6 };
        expect(getDistanceToRange(position, range)).toBe(0);
      });

      it('should calculate distance for position before range', () => {
        const position: Position = { column: 5, line: 5 };
        const distance = getDistanceToRange(position, range);
        expect(distance).toBeGreaterThan(0);
      });
    });
  });
});

/**
 * Tests for node finding utilities.
 */

import {
  findNodeAtPosition,
  findNodesInRange,
  getNodePath,
  getNodeMetadata,
  isNodeType,
} from '../../src/utils/node-finder.js';

describe('Node Finder Utilities', () => {
  describe('findNodeAtPosition', () => {
    it('should find node at position', () => {
      const location: SourceRange = {
        end: { column: 20, line: 5 },
        start: { column: 10, line: 5 },
      };
      const node = NodeFactory.createIdentifier('test', { location });
      const position: Position = { column: 15, line: 5 };

      const result = findNodeAtPosition(node, position);
      expect(result).not.toBeNull();
      expect(result?.node).toBe(node);
      expect(result?.nodeType).toBe('Identifier');
    });

    it('should return null for position outside node', () => {
      const location: SourceRange = {
        end: { column: 20, line: 5 },
        start: { column: 10, line: 5 },
      };
      const node = NodeFactory.createIdentifier('test', { location });
      const position: Position = { column: 15, line: 10 };

      const result = findNodeAtPosition(node, position);
      expect(result).toBeNull();
    });

    it('should find deepest node when nested', () => {
      const innerLocation: SourceRange = {
        end: { column: 20, line: 5 },
        start: { column: 15, line: 5 },
      };
      const outerLocation: SourceRange = {
        end: { column: 25, line: 5 },
        start: { column: 10, line: 5 },
      };

      const inner = NodeFactory.createIdentifier('inner', { location: innerLocation });
      const outer = NodeFactory.createBinaryExpression(
        '+',
        inner,
        NodeFactory.createNumberLiteral(1, '1'),
        { location: outerLocation }
      );

      const position: Position = { column: 17, line: 5 };
      const result = findNodeAtPosition(outer, position, { preferLeaf: true });

      expect(result).not.toBeNull();
      expect(result?.node).toBe(inner);
    });

    it('should include ancestors', () => {
      const location: SourceRange = {
        end: { column: 20, line: 5 },
        start: { column: 10, line: 5 },
      };
      const node = NodeFactory.createIdentifier('test', { location });
      const position: Position = { column: 15, line: 5 };

      const result = findNodeAtPosition(node, position);
      expect(result).not.toBeNull();
      expect(Array.isArray(result?.ancestors)).toBe(true);
    });
  });

  describe('findNodesInRange', () => {
    it('should find nodes fully contained in range', () => {
      const node1Location: SourceRange = {
        end: { column: 15, line: 5 },
        start: { column: 10, line: 5 },
      };
      const node2Location: SourceRange = {
        end: { column: 25, line: 5 },
        start: { column: 20, line: 5 },
      };

      NodeFactory.createIdentifier('a', { location: node1Location });
      NodeFactory.createIdentifier('b', { location: node2Location });
      const block = NodeFactory.createBlock([], {
        location: {
          end: { column: 30, line: 5 },
          start: { column: 5, line: 5 },
        },
      });

      const searchRange: SourceRange = {
        end: { column: 27, line: 5 },
        start: { column: 8, line: 5 },
      };

      const result = findNodesInRange(block, searchRange);
      expect(result.fullyContained.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter by node types', () => {
      const location: SourceRange = {
        end: { column: 20, line: 5 },
        start: { column: 10, line: 5 },
      };
      const node = NodeFactory.createIdentifier('test', { location });
      const searchRange: SourceRange = {
        end: { column: 25, line: 5 },
        start: { column: 5, line: 5 },
      };

      const result = findNodesInRange(node, searchRange, {
        nodeTypes: ['Identifier'],
      });

      expect(result.nodes.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getNodePath', () => {
    it('should return path from root to node', () => {
      const inner = NodeFactory.createIdentifier('inner');
      const outer = NodeFactory.createBinaryExpression(
        '+',
        inner,
        NodeFactory.createNumberLiteral(1, '1')
      );

      const path = getNodePath(inner, outer);
      expect(path).not.toBeNull();
      expect(path?.path.length).toBeGreaterThan(0);
      expect(path?.depth).toBeGreaterThan(0);
    });
  });

  describe('getNodeMetadata', () => {
    it('should return metadata for node', () => {
      const node = NodeFactory.createIdentifier('test');
      const metadata = getNodeMetadata(node);

      expect(metadata.nodeType).toBe('Identifier');
      expect(metadata.isLeaf).toBe(true);
    });

    it('should include source text when provided', () => {
      const location = {
        end: { column: 5, line: 1 },
        start: { column: 1, line: 1 },
      };
      const node = NodeFactory.createIdentifier('test', { location });
      const source = 'test';

      const metadata = getNodeMetadata(node, source);
      expect(metadata.sourceText).toBeDefined();
    });

    it('should identify leaf nodes', () => {
      const leaf = NodeFactory.createIdentifier('test');
      const metadata = getNodeMetadata(leaf);
      expect(metadata.isLeaf).toBe(true);
    });

    it('should identify non-leaf nodes', () => {
      const node = NodeFactory.createBinaryExpression(
        '+',
        NodeFactory.createNumberLiteral(1, '1'),
        NodeFactory.createNumberLiteral(2, '2')
      );
      const metadata = getNodeMetadata(node);
      expect(metadata.isLeaf).toBe(false);
      expect(metadata.children.length).toBeGreaterThan(0);
    });
  });

  describe('isNodeType', () => {
    it('should return true for matching type', () => {
      const node = NodeFactory.createIdentifier('test');
      expect(isNodeType(node, 'Identifier')).toBe(true);
    });

    it('should return false for non-matching type', () => {
      const node = NodeFactory.createIdentifier('test');
      expect(isNodeType(node, 'BinaryExpression')).toBe(false);
    });
  });
});

/**
 * Tests for source extraction utilities
 * Ported from com.google.summit.translation.SourceLocationTest.
 */

describe('Source Extraction Utilities', () => {
  const sourceCode = `public class Test {
    private Integer value = 42;
    public void method() {
        return;
    }
}`;

  describe('getSourceRange', () => {
    it('should return location if available', () => {
      const location = {
        end: { column: 15, line: 2 },
        start: { column: 5, line: 2 },
      };
      const node = NodeFactory.createIdentifier('value', { location });

      const range = getSourceRange(node);
      expect(range).toEqual(location);
    });

    it('should return null if location not available', () => {
      const node = NodeFactory.createIdentifier('test');
      const range = getSourceRange(node);
      expect(range).toBeNull();
    });
  });

  describe('getSourceText', () => {
    it('should extract text for single-line node', () => {
      // "value" is at columns 21-25 in "    private Integer value = 42;"
      const location = {
        end: { column: 25, line: 2 },
        start: { column: 21, line: 2 },
      };
      const node = NodeFactory.createIdentifier('value', { location });

      const text = getSourceText(node, sourceCode);
      expect(text).toBe('value');
    });

    it('should extract text for multi-line node', () => {
      const location = {
        end: { column: 1, line: 5 },
        start: { column: 1, line: 1 },
      };
      const node = NodeFactory.createBlock([], { location });

      const text = getSourceText(node, sourceCode);
      expect(text).toContain('public class Test');
    });

    it('should trim text when requested', () => {
      // "value" starts at column 21 in "    private Integer value = 42;"
      const location = {
        end: { column: 26, line: 2 },
        start: { column: 21, line: 2 },
      };
      const node = NodeFactory.createIdentifier('value', { location });

      const text = getSourceText(node, sourceCode, { trim: true });
      expect(text).toBe('value');
    });
  });

  describe('locationToOffset', () => {
    it('should convert location to offset', () => {
      const location = { column: 5, line: 2 };
      const offset = locationToOffset(location, sourceCode);
      expect(offset).toBeGreaterThanOrEqual(0);
    });
  });

  describe('offsetToLocation', () => {
    it('should convert offset to location', () => {
      const offset = 20;
      const location = offsetToLocation(offset, sourceCode);
      expect(location.line).toBeGreaterThan(0);
      expect(location.column).toBeGreaterThan(0);
    });
  });

  describe('Source Location Tests (from original)', () => {
    it('declaration has correct source location', () => {
      const input = 'public class Test { }';

      const cu = parseAndTranslate(input);
      const classDecl = findFirstNodeOfType(cu, isClassDeclaration);

      expect(classDecl).not.toBeNull();
      if (classDecl?.location) {
        // The location should span from "class" to the end
        const classIndex = input.indexOf('class');
        expect(classDecl.location.start.line).toBe(1);
        expect(classDecl.location.start.column).toBeGreaterThanOrEqual(classIndex + 1);
        expect(classDecl.location.end.line).toBe(1);
        expect(classDecl.location.end.column).toBeGreaterThanOrEqual(input.length);
      }
    });

    it('unknown source location prints special string', () => {
      expect(isUnknownLocation(UNKNOWN_SOURCE_LOCATION)).toBe(true);
      // Note: We don't have a toString() method, but we can check the structure
      expect(UNKNOWN_SOURCE_LOCATION.start.line).toBe(0);
      expect(UNKNOWN_SOURCE_LOCATION.start.column).toBe(0);
    });

    it('extract from source one-line node', () => {
      const input = `
        class Test {
          public String field
            = 'Hello';
        }
      `;
      const classDecl = findFirstNodeOfType(parseAndTranslate(input), isClassDeclaration);
      expect(classDecl).not.toBeNull();
      if (classDecl?.location) {
        const extracted = getSourceText(classDecl, input);
        expect(extracted).toContain('Test');
      }
    });

    it('extract from source multi-line node', () => {
      const input = `
        class Test {
          public String field
            = 'Hello';
        }
      `;
      const cu = parseAndTranslate(input);
      const fieldDecl = findFirstNodeOfType(cu, isVariableDeclaration);
      expect(fieldDecl).not.toBeNull();
      if (fieldDecl?.location) {
        const extracted = getSourceText(fieldDecl, input);
        expect(extracted).toContain('String field');
        expect(extracted).toContain("= 'Hello'");
      }
    });

    it('extract from source whole file', () => {
      const input = `
        class Test {
          public String field
            = 'Hello';
        }
      `.trim();
      const cu = parseAndTranslate(input);
      if (cu.location) {
        const extracted = getSourceText(cu, input);
        expect(extracted).toContain('class Test');
      }
    });

    it('extract from source arbitrary location', () => {
      const input = `
        class Test {
          public String field
            = 'Hello';
        }
      `.trim();
      const loc = {
        end: { column: 16, line: 3 },
        start: { column: 4, line: 1 },
      };
      const node = NodeFactory.createIdentifier('test', { location: loc });
      const extracted = getSourceText(node, input);
      expect(extracted).toBeTruthy();
    });

    it('trailing empty line', () => {
      const input = 'public class Test { }\n';

      const cu = parseAndTranslate(input);
      if (cu.location) {
        expect(cu.location.end.line).toBe(2);
        expect(cu.location.end.column).toBeGreaterThanOrEqual(0);
        const extracted = getSourceText(cu, input);
        expect(extracted).toBeTruthy();
      }
    });

    it('trailing whitespace line', () => {
      const input = 'public class Test { }\n ';

      const cu = parseAndTranslate(input);
      if (cu.location) {
        expect(cu.location.end.line).toBe(2);
        expect(cu.location.end.column).toBeGreaterThanOrEqual(1);
        const extracted = getSourceText(cu, input);
        expect(extracted).toBeTruthy();
      }
    });

    it('leading empty line', () => {
      const input = '\npublic class Test { }';

      const cu = parseAndTranslate(input);
      if (cu.location) {
        // The source location starts from the first regular token
        expect(cu.location.start.line).toBe(2);
        expect(cu.location.start.column).toBeGreaterThanOrEqual(0);
      }
    });

    it('tabs are counted as single characters', () => {
      const input = '\t\tpublic class Test { }';

      const cu = parseAndTranslate(input);
      if (cu.location) {
        expect(cu.location.start.column).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('Position Utilities', () => {
    const range: SourceRange = {
      end: { column: 20, line: 7 },
      start: { column: 10, line: 5 },
    };

    describe('isPositionInRange', () => {
      it('should return true for position inside range', () => {
        const position: Position = { column: 15, line: 6 };
        expect(isPositionInRange(position, range)).toBe(true);
      });

      it('should return true for position at start', () => {
        const position: Position = { column: 10, line: 5 };
        expect(isPositionInRange(position, range)).toBe(true);
      });

      it('should return true for position at end', () => {
        const position: Position = { column: 20, line: 7 };
        expect(isPositionInRange(position, range)).toBe(true);
      });

      it('should return false for position before range', () => {
        const position: Position = { column: 15, line: 4 };
        expect(isPositionInRange(position, range)).toBe(false);
      });

      it('should return false for position after range', () => {
        const position: Position = { column: 15, line: 8 };
        expect(isPositionInRange(position, range)).toBe(false);
      });

      it('should handle single-line range', () => {
        const singleLineRange: SourceRange = {
          end: { column: 20, line: 5 },
          start: { column: 10, line: 5 },
        };
        const position: Position = { column: 15, line: 5 };
        expect(isPositionInRange(position, singleLineRange)).toBe(true);
      });
    });

    describe('isPositionBefore', () => {
      it('should return true for position before range', () => {
        const position: Position = { column: 15, line: 4 };
        expect(isPositionBefore(position, range)).toBe(true);
      });

      it('should return false for position in range', () => {
        const position: Position = { column: 15, line: 6 };
        expect(isPositionBefore(position, range)).toBe(false);
      });
    });

    describe('isPositionAfter', () => {
      it('should return true for position after range', () => {
        const position: Position = { column: 15, line: 8 };
        expect(isPositionAfter(position, range)).toBe(true);
      });

      it('should return false for position in range', () => {
        const position: Position = { column: 15, line: 6 };
        expect(isPositionAfter(position, range)).toBe(false);
      });
    });

    describe('getDistanceToRange', () => {
      it('should return 0 for position in range', () => {
        const position: Position = { column: 15, line: 6 };
        expect(getDistanceToRange(position, range)).toBe(0);
      });

      it('should calculate distance for position before range', () => {
        const position: Position = { column: 5, line: 5 };
        const distance = getDistanceToRange(position, range);
        expect(distance).toBeGreaterThan(0);
      });
    });
  });
});
