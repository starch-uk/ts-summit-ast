/**
 * @file Shared constants used across the codebase.
 * Named constants replace magic numbers for better maintainability and ESLint compliance.
 */

/** Initial value for statement counter when processing field declarations. */
const INITIAL_STATEMENT_COUNTER = 1;

/** Category order for inner types (classes, interfaces, enums) in class member sorting. */
const MEMBER_CATEGORY_INNER_TYPES = 0;

/** Category order for fields (variable declarations) in class member sorting. */
const MEMBER_CATEGORY_FIELDS = 1;

/** Category order for properties in class member sorting. */
const MEMBER_CATEGORY_PROPERTIES = 2;

/** Category order for methods in class member sorting. */
const MEMBER_CATEGORY_METHODS = 3;

/** Threshold for non-empty array check: array has elements when length > this value. */
const MIN_NON_EMPTY_ARRAY_LENGTH = 0;

/** Empty array length. */
const EMPTY_ARRAY_LENGTH = 0;

/** Minimum number of children for type and name in parameter or variable declarations. */
const MIN_CHILDREN_FOR_TYPE_AND_NAME = 2;

/** Minimum number of children for type, name, and initializer. */
const MIN_CHILDREN_FOR_TYPE_NAME_INIT = 3;

/** Regex capture group index for tag name in param and similar patterns. */
const CAPTURE_GROUP_TAG_NAME = 1;

/** Regex capture group index for tag content. */
const CAPTURE_GROUP_TAG_CONTENT = 2;

/** Regex capture group index for first capture group. */
const CAPTURE_GROUP_FIRST = 1;

/** Index for last element when accessing array from end. */
const LAST_ELEMENT_OFFSET = 1;

/** Default array nesting when no dimensions specified. */
const DEFAULT_ARRAY_NESTING = 0;

/** Minimum children for key-value pair (key and value). */
const MIN_CHILDREN_FOR_KEY_AND_VALUE = 2;

/** Minimum children for type and size. */
const MIN_CHILDREN_FOR_TYPE_AND_SIZE = 2;

/** Divisor for even check (length % 2 for pairs). */
const LENGTH_EVEN_DIVISOR = 2;

/** Remainder when number is evenly divisible. */
const EVEN_MODULO_REMAINDER = 0;

/** Single element count. */
const SINGLE_ELEMENT_COUNT = 1;

/** Default array dimension. */
const DEFAULT_ARRAY_DIMENSION = 0;

/** First index in array. */
const FIRST_INDEX = 0;

/** Slice start index. */
const SLICE_START_INDEX = 0;

/** Offset for previous position. */
const PREVIOUS_POSITION_OFFSET = 1;

/** Index of first regex capture group. */
const FIRST_CAPTURE_GROUP_INDEX = 0;

/** Initial index value for iteration. */
const INITIAL_INDEX = 0;

/** Initial counter value. */
const INITIAL_COUNTER = 0;

/** CLI args start at index 2 (after node and script). */
const CLI_ARGS_START_INDEX = 2;

/** Initial position/offset. */
const INITIAL_POSITION = 0;

/** Initial line number. */
const INITIAL_LINE = 1;

/** Initial column number. */
const INITIAL_COLUMN = 0;

/** Lexer initial column (1-based). */
const LEXER_INITIAL_COLUMN = 1;

/** Character offset for single char. */
const SINGLE_CHAR_OFFSET = 1;

/** Character offset for two chars. */
const DOUBLE_CHAR_OFFSET = 2;

/** Character offset for three chars. */
const TRIPLE_CHAR_OFFSET = 3;

/** Character offset for four chars. */
const QUADRUPLE_CHAR_OFFSET = 4;

/** Default array dimensions to add. */
const DEFAULT_ARRAY_DIMENSIONS_TO_ADD = 1;

export {
  CAPTURE_GROUP_FIRST,
  CAPTURE_GROUP_TAG_CONTENT,
  CAPTURE_GROUP_TAG_NAME,
  CLI_ARGS_START_INDEX,
  DEFAULT_ARRAY_DIMENSION,
  DEFAULT_ARRAY_NESTING,
  EMPTY_ARRAY_LENGTH,
  EVEN_MODULO_REMAINDER,
  FIRST_CAPTURE_GROUP_INDEX,
  FIRST_INDEX,
  INITIAL_COLUMN,
  INITIAL_COUNTER,
  DOUBLE_CHAR_OFFSET,
  LEXER_INITIAL_COLUMN,
  QUADRUPLE_CHAR_OFFSET,
  SINGLE_CHAR_OFFSET,
  TRIPLE_CHAR_OFFSET,
  DEFAULT_ARRAY_DIMENSIONS_TO_ADD,
  INITIAL_INDEX,
  INITIAL_LINE,
  INITIAL_POSITION,
  INITIAL_STATEMENT_COUNTER,
  LAST_ELEMENT_OFFSET,
  LENGTH_EVEN_DIVISOR,
  MEMBER_CATEGORY_FIELDS,
  MEMBER_CATEGORY_INNER_TYPES,
  MEMBER_CATEGORY_METHODS,
  MEMBER_CATEGORY_PROPERTIES,
  MIN_CHILDREN_FOR_KEY_AND_VALUE,
  MIN_CHILDREN_FOR_TYPE_AND_NAME,
  MIN_CHILDREN_FOR_TYPE_AND_SIZE,
  MIN_CHILDREN_FOR_TYPE_NAME_INIT,
  MIN_NON_EMPTY_ARRAY_LENGTH,
  PREVIOUS_POSITION_OFFSET,
  SINGLE_ELEMENT_COUNT,
  SLICE_START_INDEX,
};
