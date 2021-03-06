"use strict";
var helper = require('./helper.js'),
    protodef = require('./protodef.js'),
    protoErrorType = protodef.Response.ErrorType,
    termTypes = protodef.Term.TermType,
    util = require('util');

var INDENT = 4;
var LIMIT = 80;

var error = module.exports = {};

/**
 *
 */
error.ReqlBaseError = function() {
  var tmp = Error.apply(this, arguments);
  tmp.name = this.name = 'ReqlBaseError';

  this.message = tmp.message;
  if (Error.captureStackTrace)
    Error.captureStackTrace(this, this.constructor);
};
util.inherits(error.ReqlBaseError, Error);

/**
 *
 */
error.ReqlDriverError = function(message, query, secondMessage) {
  error.ReqlBaseError.call(this, message);
  this.name = 'ReqlDriverError';

  if ((Array.isArray(query) && (query.length > 0)) || (!Array.isArray(query) && !!query)) {
    if ((this.message.length > 0) && (this.message[this.message.length - 1] === '.')) {
      this.message = this.message.slice(0, this.message.length - 1);
    }

    this.message += ' after:\n';
    var backtrace = generateBacktrace(query, 0, null, [], {indent: 0, extra: 0});
    this.message += backtrace.str;
  } else {
    if (this.message[this.message.length - 1] !== '?') this.message += '.';
  }

  if (secondMessage) this.message += '\n' + secondMessage;
};
util.inherits(error.ReqlDriverError, error.ReqlBaseError);

/**
 *
 */
error.ReqlServerError = function(message, query) {
  error.ReqlBaseError.call(this, message);
  this.name = 'ReqlServerError';

  if ((Array.isArray(query) && (query.length > 0)) || (!Array.isArray(query) && !!query)) {
    if ((this.message.length > 0) && (this.message[this.message.length - 1] === '.')) {
      this.message = this.message.slice(0, this.message.length - 1);
    }

    this.message += ' for:\n';
    var backtrace = generateBacktrace(query, 0, null, [], {indent: 0, extra: 0});
    this.message += backtrace.str;
  } else {
    if (this.message[this.message.length - 1] !== '?') this.message += '.';
  }
};
util.inherits(error.ReqlServerError, error.ReqlBaseError);


/**
 *
 */
error.ReqlRuntimeError = function(message, query, frames) {
  error.ReqlBaseError.call(this, message);
  this.name = 'ReqlRuntimeError';

  if (!!query && !!frames) {
    if ((this.message.length > 0) && (this.message[this.message.length - 1] === '.')) {
      this.message = this.message.slice(0, this.message.length - 1);
    }

    this.message += ' in:\n';

    frames = frames.b;
    if (frames) this.frames = frames.slice(0);
    var backtrace = generateBacktrace(query, 0, null, frames, { indent: 0, extra: 0 });
    var queryLines = backtrace.str.split('\n');
    var carrotLines = backtrace.car.split('\n');
    for (var i = 0; i < queryLines.length; i++) {
      this.message += queryLines[i] + '\n';
      if (carrotLines[i].match(/\^/)) {
        var pos = queryLines[i].match(/[^\s]/);
        if ((pos) && (pos.index)) {
          this.message += space(pos.index) + carrotLines[i].slice(pos.index) + '\n';
        } else {
          this.message += carrotLines[i] + '\n';
        }
      }
    }
  }
};
util.inherits(error.ReqlRuntimeError, error.ReqlBaseError);

error.createRuntimeError = function(type, message, query, frames) {
  switch (type) {
    case protoErrorType.INTERNAL:
      return new error.ReqlInternalError(message, query, frames);
    case protoErrorType.RESOURCE_LIMIT:
      return new error.ReqlResourceLimitError(message, query, frames);
    case protoErrorType.QUERY_LOGIC:
      return new error.ReqlQueryLogicError(message, query, frames);
    case protoErrorType.OP_FAILED:
      return new error.ReqlOpFailedError(message, query, frames);
    case protoErrorType.OP_INDETERMINATE:
      return new error.ReqlOpIndeterminateError(message, query, frames);
    case protoErrorType.USER:
      return new error.ReqlUserError(message, query, frames);
  }

  return new error.ReqlRuntimeError(message, query, frames);
};

/**
 *
 */
error.ReqlInternalError = function(message, query, frames) {
  error.ReqlRuntimeError.call(this, message, query, frames);
  this.name = 'ReqlInternalError';
};
util.inherits(error.ReqlInternalError, error.ReqlRuntimeError);

/**
 *
 */
error.ReqlResourceLimitError = function(message, query, frames) {
  error.ReqlRuntimeError.call(this, message, query, frames);
  this.name = 'ReqlResourceLimitError';
};
util.inherits(error.ReqlResourceLimitError, error.ReqlRuntimeError);

/**
 *
 */
error.ReqlQueryLogicError = function(message, query, frames) {
  error.ReqlRuntimeError.call(this, message, query, frames);
  this.name = 'ReqlQueryLogicError';
};
util.inherits(error.ReqlQueryLogicError, error.ReqlRuntimeError);

/**
 *
 */
error.ReqlOpFailedError = function(message, query, frames) {
  error.ReqlRuntimeError.call(this, message, query, frames);
  this.name = 'ReqlOpFailedError';
};
util.inherits(error.ReqlOpFailedError, error.ReqlRuntimeError);

/**
 *
 */
error.ReqlOpIndeterminateError = function(message, query, frames) {
  error.ReqlRuntimeError.call(this, message, query, frames);
  this.name = 'ReqlOpIndeterminateError';
};
util.inherits(error.ReqlOpIndeterminateError, error.ReqlRuntimeError);

/**
 *
 */
error.ReqlUserError = function(message, query, frames) {
  error.ReqlRuntimeError.call(this, message, query, frames);
  this.name = 'ReqlUserError';
};
util.inherits(error.ReqlUserError, error.ReqlInternalError);

/**
 *
 */
error.ReqlCompileError = function(message, query, frames) {
  error.ReqlBaseError.call(this, message);
  this.name = 'ReqlCompileError';

  if (!!query && !!frames) {
    if ((this.message.length > 0) && (this.message[this.message.length - 1] === '.')) {
      this.message = this.message.slice(0, this.message.length - 1);
    }

    this.message += ' in:\n';

    frames = frames.b;
    if (frames) this.frames = frames.slice(0);
    var backtrace = generateBacktrace(query, 0, null, frames, {indent: 0, extra: 0});
    var queryLines = backtrace.str.split('\n');
    var carrotLines = backtrace.car.split('\n');
    for (var i = 0; i < queryLines.length; i++) {
      this.message += queryLines[i] + '\n';
      if (carrotLines[i].match(/\^/)) {
        var pos = queryLines[i].match(/[^\s]/);
        if ((pos) && (pos.index)) {
          this.message += space(pos.index) + carrotLines[i].slice(pos.index) + '\n';
        } else {
          this.message += carrotLines[i] + '\n';
        }
      }
    }
  }
};
util.inherits(error.ReqlCompileError, error.ReqlBaseError);

/**
 *
 */
error.ReqlClientError = function(message) {
  error.ReqlBaseError.call(this, message);
  this.name = 'ReqlClientError';
};
util.inherits(error.ReqlClientError, error.ReqlBaseError);

var _constants = {
  MONDAY: true,
  TUESDAY: true,
  WEDNESDAY: true,
  THURSDAY: true,
  FRIDAY: true,
  SATURDAY: true,
  SUNDAY: true,
  JANUARY: true,
  FEBRUARY: true,
  MARCH: true,
  APRIL: true,
  MAY: true,
  JUNE: true,
  JULY: true,
  AUGUST: true,
  SEPTEMBER: true,
  OCTOBER: true,
  NOVEMBER: true,
  DECEMBER: true,
  MINVAL: true,
  MAXVAL: true,
};

var constants = {};
for (var key in _constants) {
  constants[termTypes[key]] = true;
}

var _nonPrefix = {
  DB: true,
  DB_CREATE: true,
  DB_LIST: true,
  DB_DROP: true,
  JS: true,
  NOW: true,
  TIME: true,
  EPOCH_TIME: true,
  ISO8601: true,
  BRANCH: true,
  JAVASCRIPT: true,
  ERROR: true,
  MAKE_ARRAY: true,
  JSON: true,
  ARGS: true,
  HTTP: true,
  RANDOM: true,
  BINARY: true,
  OBJECT: true,
  CIRCLE: true,
  GEOJSON: true,
  POINT: true,
  LINE: true,
  POLYGON: true,
  UUID: true,
  DESC: true,
  ASC: true,
  RANGE: true,
  LITERAL: 'true'
};

var nonPrefix = {};
for (var key in _nonPrefix) {
  nonPrefix[termTypes[key]] = true;
}

// Constants are also in nonPrefix
for (var key in _constants) {
  nonPrefix[termTypes[key]] = true;
}

var _typeToString = {
  DB: 'db',
  DB_CREATE: 'dbCreate',
  DB_LIST: 'dbList',
  DB_DROP: 'dbDrop',
  TABLE_CREATE: 'tableCreate',
  TABLE_LIST: 'tableList',
  TABLE_DROP: 'tableDrop',
  TABLE: 'table',
  INDEX_CREATE: 'indexCreate',
  INDEX_DROP: 'indexDrop',
  INDEX_LIST: 'indexList',
  INDEX_WAIT: 'indexWait',
  INDEX_STATUS: 'indexStatus',
  INSERT: 'insert',
  UPDATE: 'update',
  REPLACE: 'replace',
  DELETE: 'delete',
  SYNC: 'sync',
  GET: 'get',
  GET_ALL: 'getAll',
  BETWEEN: 'between',
  FILTER: 'filter',
  INNER_JOIN: 'innerJoin',
  OUTER_JOIN: 'outerJoin',
  EQ_JOIN: 'eqJoin',
  ZIP: 'zip',
  MAP: 'map',
  WITH_FIELDS: 'withFields',
  CONCAT_MAP: 'concatMap',
  ORDER_BY: 'orderBy',
  DESC: 'desc',
  ASC: 'asc',
  SKIP: 'skip',
  LIMIT: 'limit',
  SLICE: 'slice',
  NTH: 'nth',
  OFFSETS_OF: 'offsetsOf',
  IS_EMPTY: 'isEmpty',
  UNION: 'union',
  SAMPLE: 'sample',
  REDUCE: 'reduce',
  COUNT: 'count',
  SUM: 'sum',
  AVG: 'avg',
  MIN: 'min',
  MAX: 'max',
  OBJECT: 'object',
  DISTINCT: 'distinct',
  GROUP: 'group',
  UNGROUP: 'ungroup',
  CONTAINS: 'contains',
  IMPLICIT_VAR: 'row',
  PLUCK: 'pluck',
  WITHOUT: 'without',
  MERGE: 'merge',
  APPEND: 'append',
  PREPEND: 'prepend',
  DIFFERENCE: 'difference',
  SET_INSERT: 'setInsert',
  SET_UNION: 'setUnion',
  SET_INTERSECTION: 'setIntersection',
  SET_DIFFERENCE: 'setDifference',
  HAS_FIELDS: 'hasFields',
  INSERT_AT: 'insertAt',
  SPLICE_AT: 'spliceAt',
  DELETE_AT: 'deleteAt',
  CHANGE_AT: 'changeAt',
  KEYS: 'keys',
  VALUES: 'values',
  MATCH: 'match',
  UPCASE: 'upcase',
  DOWNCASE: 'downcase',
  ADD: 'add',
  SUB: 'sub',
  MUL: 'mul',
  DIV: 'div',
  MOD: 'mod',
  AND: 'and',
  OR: 'or',
  EQ: 'eq',
  NE: 'ne',
  GT: 'gt',
  GE: 'ge',
  LT: 'lt',
  LE: 'le',
  NOT: 'not',
  FLOOR: 'floor',
  CEIL: 'ceil',
  ROUND: 'round',
  NOW: 'now',
  TIME: 'time',
  EPOCH_TIME: 'epochTime',
  ISO8601: 'ISO8601',
  IN_TIMEZONE: 'inTimezone',
  TIMEZONE: 'timezone',
  DURING: 'during',
  DATE: 'date',
  TIME_OF_DAY: 'timeOfDay',
  YEAR: 'year',
  MONTH: 'month',
  DAY: 'day',
  DAY_OF_WEEK: 'dayOfWeek',
  DAY_OF_YEAR: 'dayOfYear',
  HOURS: 'hours',
  MINUTES: 'minutes',
  SECONDS: 'seconds',
  TO_ISO8601: 'toISO8601',
  TO_EPOCH_TIME: 'toEpochTime',
  FUNCALL: 'do',
  BRANCH: 'branch',
  FOR_EACH: 'forEach',
  ERROR: 'error',
  DEFAULT: 'default',
  JAVASCRIPT: 'js',
  COERCE_TO: 'coerceTo',
  TYPE_OF: 'typeOf',
  INFO: 'info',
  JSON: 'json',
  ARGS: 'args',
  HTTP: 'http',
  RANDOM: 'random',
  CHANGES: 'changes',
  BINARY: 'binary',
  INDEX_RENAME: 'indexRename',
  CIRCLE: 'circle',
  DISTANCE: 'distance',
  FILL: 'fill',
  GEOJSON: 'geojson',
  TO_GEOJSON: 'toGeojson',
  GET_INTERSECTING: 'getIntersecting',
  GET_NEAREST: 'getNearest',
  INCLUDES: 'includes',
  INTERSECTS: 'intersects',
  LINE: 'line',
  POINT: 'point',
  POLYGON: 'polygon',
  POLYGON_SUB: 'polygonSub',
  UUID: 'uuid',
  RANGE: 'range',
  TO_JSON_STRING: 'toJSON',
  CONFIG: 'config',
  STATUS: 'status',
  WAIT: 'wait',
  RECONFIGURE: 'reconfigure',
  REBALANCE: 'rebalance',
  SPLIT: 'split',
  LITERAL: 'literal',
  MONDAY: 'monday',
  TUESDAY: 'tuesday',
  WEDNESDAY: 'wednesday',
  THURSDAY: 'thursday',
  FRIDAY: 'friday',
  SATURDAY: 'saturday',
  SUNDAY: 'sunday',
  JANUARY: 'january',
  FEBRUARY: 'february',
  MARCH: 'march',
  APRIL: 'april',
  MAY: 'may',
  JUNE: 'june',
  JULY: 'july',
  AUGUST: 'august',
  SEPTEMBER: 'september',
  OCTOBER: 'october',
  NOVEMBER: 'november',
  DECEMBER: 'december' ,
  MINVAL: 'minval',
  MAXVAL: 'maxval',
};

var typeToString = {};
for (var key in _typeToString) {
  typeToString[termTypes[key]] = _typeToString[key];
}

var _noPrefixOptargs = {
  ISO8601: true,
};

var noPrefixOptargs = {};
for (var key in _noPrefixOptargs) {
  noPrefixOptargs[termTypes[key]] = true;
}

var _specialType = {
  DATUM: function(term, index, father, frames, options, optarg) {
    optarg = optarg || false;

    var underline = Array.isArray(frames) && (frames.length === 0);
    var currentFrame, backtrace;
    currentFrame = Array.isArray(frames) ? frames.shift() : null;

    var result = { str: '', car: '' };
    if ((helper.isPlainObject(term)) && (term.$reql_type$ === 'BINARY')) {
      carify(result, 'r.binary(<Buffer>)', underline);
      return result;
    }

    if ((index === 0) && ((father === null) || (!nonPrefix[father[0]]))) carify(result, 'r.expr(', underline);

    if (typeof term === 'string') {
      carify(result, '"' + term + '"', underline);
    } else if (helper.isPlainObject(term)) {
      var totalKeys = Object.keys(term).length;
      if (totalKeys === 0) {
        carify(result, '{}', underline);
      } else {
        carify(result, '{\n', underline);
        var countKeys = 0;
        var extraToRemove = options.extra;
        options.indent += INDENT + options.extra;
        options.extra = 0;
        for (var key in term) {
          countKeys++;
          //if (!((father) && (Array.isArray(father[2])) && (Object.keys(father[2]).length > 0))) options.extra = 0;

          if (optarg) {
            carify(result, space(options.indent) + camelCase(key) + ': ', underline);
          } else {
            carify(result, space(options.indent) + key + ': ', underline);
          }

          if ((currentFrame !== null) && (currentFrame === key)) {
            backtrace = generateBacktrace(term[key], countKeys, term, frames, options);
          } else {
            backtrace = generateBacktrace(term[key], countKeys, term, null, options);
          }

          result.str += backtrace.str;
          result.car += backtrace.car;

          if (countKeys !== totalKeys) {
            carify(result, ',\n', underline);
          }
        }

        options.indent -= INDENT + extraToRemove;
        carify(result, '\n' + space(options.indent + extraToRemove) + '}', underline);
      }
    } else if (Array.isArray(term)) {
      carify(result, '[', underline);
      for (var z = 0; z < term.length; z++) {
        if ((currentFrame !== null) && (currentFrame === z)) {
          backtrace = generateBacktrace(term[z], z, term, frames, options);
        } else {
          backtrace = generateBacktrace(term[z], z, term, null, options);
        }
        result.str += backtrace.str;
        result.car += backtrace.car;
      }
      carify(result, ']', underline);
    } else {
      carify(result, '' + term, underline);
    }

    if ((index === 0) && ((father === null) || (!nonPrefix[father[0]]))) carify(result, ')', underline);
    if (underline) result.car = result.str.replace(/./g, '^');
    return result;
  },

  TABLE: function(term, index, father, frames, options) {
    var result = { str: '', car: '' };
    var backtrace, underline, currentFrame;
    if ((term.length === 1) || (term[1].length === 0) || (term[1][0][0] !== termTypes.DB)) {
      underline = Array.isArray(frames) && (frames.length === 0);
      currentFrame = Array.isArray(frames) ? frames.shift() : null;

      carify(result, 'r.' + typeToString[term[0]] + '(', underline);
      if (Array.isArray(term[1])) {
        for (var i = 0; i < term[1].length; i++) {
          if (i !== 0) result.str += ', ';


          if ((currentFrame !== null) && (currentFrame === 1)) {
            // +1 for index because it's like if there was a r.db(...) before .table(...)
            backtrace = generateBacktrace(term[1][i], i + 1, term, frames, options);
          } else {
            backtrace = generateBacktrace(term[1][i], i + 1, term, null, options);
          }

          result.str += backtrace.str;
          result.car += backtrace.car;
        }
      }

      backtrace = makeOptargs(term, 0, term, frames, options, currentFrame);
      result.str += backtrace.str;
      result.car += backtrace.car;

      carify(result, ')', underline);
      if (underline) result.car = result.str.replace(/./g, '^');
    } else {
      backtrace = generateNormalBacktrace(term, index, father, frames, options);
      result.str = backtrace.str;
      result.car = backtrace.car;
    }

    return result;
  },

  GET_FIELD: function(term, index, father, frames, options) {
    var result = { str: '', car: '' };
    var backtrace, underline, currentFrame;
    underline = Array.isArray(frames) && (frames.length === 0);
    currentFrame = Array.isArray(frames) ? frames.shift() : null;

    if ((currentFrame !== null) && (currentFrame === 0)) {
      backtrace = generateBacktrace(term[1][0], 0, term, frames, options);
    } else {
      backtrace = generateBacktrace(term[1][0], 0, term, null, options);
    }

    result.str = backtrace.str;
    result.car = backtrace.car;

    carify(result, '(', underline);

    if ((currentFrame !== null) && (currentFrame === 1)) {
      backtrace = generateBacktrace(term[1][1], 1, term, frames, options);
    } else {
      backtrace = generateBacktrace(term[1][1], 1, term, null, options);
    }
    result.str += backtrace.str;
    result.car += backtrace.car;

    carify(result, ')', underline);
    if (underline) result.car = result.str.replace(/./g, '^');
    return result;
  },

  MAKE_ARRAY: function(term, index, father, frames, options) {
    var result = { str: '', car: '' };
    var backtrace, underline, currentFrame;

    underline = Array.isArray(frames) && (frames.length === 0);
    currentFrame = Array.isArray(frames) ? frames.shift() : null;
    if ((index === 0) && ((father === null) || (!nonPrefix[father[0]]))) carify(result, 'r.expr(', underline);
    if (!((options) && (options.noBracket))) {
      carify(result, '[', underline);
    }

    for (var i = 0; i < term[1].length; i++) {
      if (i !== 0) {
        carify(result, ', ', underline);
      }

      if ((currentFrame !== null) && (currentFrame === i)) {
        backtrace = generateBacktrace(term[1][i], i, term, frames, options);
      } else {
        backtrace = generateBacktrace(term[1][i], i, term, null, options);
      }
      result.str += backtrace.str;
      result.car += backtrace.car;
    }

    if (!((options) && (options.noBracket))) {
      carify(result, ']', underline);
    }

    if ((index === 0) && ((father === null) || (!nonPrefix[father[0]]))) {
      carify(result, ')', underline);
    }

    if (underline) result.car = result.str.replace(/./g, '^');
    return result;
  },

  FUNC: function(term, index, father, frames, options) {
    var result = { str: '', car: '' };
    var backtrace, underline, currentFrame;

    underline = Array.isArray(frames) && (frames.length === 0);
    currentFrame = Array.isArray(frames) ? frames.shift() : null;
    if ((term[1][0][1].length === 1) && (helper.hasImplicit(term[1][1]))) {
      if ((currentFrame !== null) && (currentFrame === 1)) {
        backtrace = generateBacktrace(term[1][1], 1, term, frames, options);
      } else {
        backtrace = generateBacktrace(term[1][1], 1, term, null, options);
      }
      result.str = backtrace.str;
      result.car = backtrace.car;
    } else {
      carify(result, 'function(', underline);

      for (var i = 0; i < term[1][0][1].length; i++) {
        if (i !== 0) {
          carify(result, ', ', underline);
        }
        carify(result, 'var_' + term[1][0][1][i], underline);
      }

      options.indent += INDENT + options.extra;
      var extraToRemove = options.extra;
      options.extra = 0;
      //if (!((Array.isArray(term[2])) && (term[2].length > 0))) options.extra = 0;

      carify(result, ') {\n' + space(options.indent) + 'return ', underline);

      if ((currentFrame !== null) && (currentFrame === 1)) {
        backtrace = generateBacktrace(term[1][1], 1, term, frames, options);
      } else {
        backtrace = generateBacktrace(term[1][1], 1, term, null, options);
      }

      result.str += backtrace.str;
      result.car += backtrace.car;

      options.indent -= INDENT + extraToRemove;
      options.extra = extraToRemove;

      carify(result, '\n' + space(options.indent + extraToRemove) + '}', underline);
    }

    if (underline) result.car = result.str.replace(/./g, '^');
    return result;
  },

  VAR: function(term, index, father, frames, options) {
    var result = { str: '', car: '' };
    var underline, currentFrame;
    underline = Array.isArray(frames) && (frames.length === 0);
    if (Array.isArray(frames)) currentFrame = frames.shift();

    carify(result, 'var_' + term[1][0], underline);

    if (underline) result.car = result.str.replace(/./g, '^');
    return result;
  },

  FUNCALL: function(term, index, father, frames, options) {
    // The syntax is args[1].do(args[0])
    var result = { str: '', car: '' };
    var backtrace, underline, currentFrame;
    underline = Array.isArray(frames) && (frames.length === 0);
    currentFrame = Array.isArray(frames) ? frames.shift() : null;

    if (term[1].length === 2) {
      if ((currentFrame !== null) && (currentFrame === 1)) {
        backtrace = generateBacktrace(term[1][1], 0, term, frames, options);
      } else {
        backtrace = generateBacktrace(term[1][1], 0, term, null, options);
      }

      result.str = backtrace.str;
      result.car = backtrace.car;

      carify(result, '.do(', underline);
    } else {
      carify(result, 'r.do(', underline);

      for (var i = 1; i < term[1].length; i++) {
        if ((currentFrame !== null) && (currentFrame === i)) {
          backtrace = generateBacktrace(term[1][i], i, term, frames, options);
        } else {
          backtrace = generateBacktrace(term[1][i], i, term, null, options);
        }

        result.str += backtrace.str;
        result.car += backtrace.car;

        if (i !== term[1].length) {
          carify(result, ', ' , underline);
        }
      }
    }

    if ((currentFrame !== null) && (currentFrame === 0)) {
      backtrace = generateBacktrace(term[1][0], 0, term, frames, options);
    } else {
      backtrace = generateBacktrace(term[1][0], 0, term, null, options);
    }

    result.str += backtrace.str;
    result.car += backtrace.car;

    carify(result, ')', underline);

    if (underline) result.car = result.str.replace(/./g, '^');
    return result;
  },

  IMPLICIT_VAR: function(term, index, father, frames, options) {
    var result = { str: '', car: '' };
    var underline, currentFrame;
    underline = Array.isArray(frames) && (frames.length === 0);
    if (Array.isArray(frames)) currentFrame = frames.shift();

    carify(result, 'r.row', underline);

    if (underline) result.car = result.str.replace(/./g, '^');
    return result;
  },

  WAIT: function(term, index, father, frames, options) {
    var result = { str: '', car: '' };
    var backtrace;

    if (term.length === 1 || term[1].length === 0) {
      backtrace = generateWithoutPrefixBacktrace(term, index, father, frames, options);
      result.str = backtrace.str;
      result.car = backtrace.car;
    } else {
      backtrace = generateNormalBacktrace(term, index, father, frames, options);
      result.str = backtrace.str;
      result.car = backtrace.car;
    }
    return result;
  },

  MAP: function(term, index, father, frames, options) {
    var result = { str: '', car: '' };
    var backtrace;

    if (term.length > 1 && term[1].length > 2) {
      backtrace = generateWithoutPrefixBacktrace(term, index, father, frames, options);
      result.str = backtrace.str;
      result.car = backtrace.car;
    } else {
      backtrace = generateNormalBacktrace(term, index, father, frames, options);
      result.str = backtrace.str;
      result.car = backtrace.car;
    }
    return result;
  },
};

_specialType.TABLE_CREATE = _specialType.TABLE;
_specialType.TABLE_DROP = _specialType.TABLE;
_specialType.TABLE_LIST = _specialType.TABLE;
_specialType.RECONFIGURE = _specialType.WAIT;
_specialType.REBALANCE = _specialType.WAIT;
_specialType.BRACKET = _specialType.GET_FIELD;

var specialType = {};
for (var key in _specialType) {
  specialType[termTypes[key]] = _specialType[key];
}

function space(n) {
  return new Array(n + 1).join(' ');
}

function carify(result, str, underline) {
  if (underline === true) {
    result.str += str;
    result.car += str.replace(/[^\n]/g, '^');
  } else {
    result.str += str;
    result.car += str.replace(/[^\n]/g, ' ');
  }
}

function makeOptargs(term, index, father, frames, options, currentFrame) {
  var result = { str: '', car: '' };
  var backtrace, underline;

  if (helper.isPlainObject(term[2])) {
    //if ((currentFrame != null) && (frames != null)) frames.unshift(currentFrame);

    //underline = Array.isArray(frames) && (frames.length === 0);
    underline = false;
    //if (Array.isArray(frames)) currentFrame = frames.shift();

    // This works before there is no prefix term than can be called with no normal argument but with an optarg
    if (Array.isArray(term[1]) && (term[1].length > 1)) {
      carify(result, ', ' , underline);
    } else if (Array.isArray(term[1]) && (term[1].length > 0) && (noPrefixOptargs[term[0]])) {
      carify(result, ', ' , underline);
    }

    backtrace = specialType[termTypes.DATUM](term[2], index, term[2], frames, options, true);

    result.str += backtrace.str;
    result.car += backtrace.car;

    if (underline) result.car = result.str.replace(/./g, '^');
  }

  return result;
}

function generateNormalBacktrace(term, index, father, frames, options) {
  var result = { str: '', car: '' };
  var backtrace, currentFrame, underline;
  underline = Array.isArray(frames) && (frames.length === 0);
  currentFrame = Array.isArray(frames) ? frames.shift() : null;

  if ((currentFrame !== null) && (currentFrame === 0)) {
    backtrace = generateBacktrace(term[1][0], 0, term, frames, options);
  } else {
    backtrace = generateBacktrace(term[1][0], 0, term, null, options);
  }

  result.str = backtrace.str;
  result.car = backtrace.car;

  var lines = backtrace.str.split('\n');
  var line = lines[lines.length - 1];
  var pos = line.match(/[^\s]/);
  pos = (pos) ? pos.index : 0;

  if (line.length - pos > LIMIT) {
    if (options.extra === 0) options.extra += INDENT;
    carify(result, '\n' + space(options.indent + options.extra) , underline);
  }

  carify(result, '.' + typeToString[term[0]] + '(' , underline);
  options.indent += options.extra;
  var extraToRemove = options.extra;
  options.extra = 0;

  for (var i = 1; i < term[1].length; i++) {
    if (i !== 1) {
      carify(result, ', ' , underline);
    }

    if ((currentFrame !== null) && (currentFrame === i)) {
      backtrace = generateBacktrace(term[1][i], i, term, frames, options);
    } else {
      backtrace = generateBacktrace(term[1][i], i, term, null, options);
    }

    result.str += backtrace.str;
    result.car += backtrace.car;
  }

  backtrace = makeOptargs(term, i, term, frames, options, currentFrame);
  result.str += backtrace.str;
  result.car += backtrace.car;

  options.indent -= extraToRemove;
  options.extra = extraToRemove;

  carify(result, ')' , underline);

  if (underline) result.car = result.str.replace(/./g, '^');
  return result;
}

function generateWithoutPrefixBacktrace(term, index, father, frames, options) {
  var result = { str: '', car: '' };
  var backtrace, currentFrame, underline;

  underline = Array.isArray(frames) && (frames.length === 0);
  currentFrame = Array.isArray(frames) ? frames.shift() : null;

  if (constants[term[0]]) {
    carify(result, 'r.' + typeToString[term[0]], underline);
    return result;
  }

  carify(result, 'r.' + typeToString[term[0]] + '(', underline);

  if (Array.isArray(term[1])) {
    for (var i = 0; i < term[1].length; i++) {
      if (i !== 0) carify(result, ', ', underline);

      if ((currentFrame !== null) && (currentFrame === i)) {
        backtrace = generateBacktrace(term[1][i], i, term, frames, options);
      } else {
        backtrace = generateBacktrace(term[1][i], i, term, null, options);
      }

      result.str += backtrace.str;
      result.car += backtrace.car;
    }
  }

  backtrace = makeOptargs(term, 0, term, frames, options, currentFrame);
  result.str += backtrace.str;
  result.car += backtrace.car;

  carify(result, ')', underline);

  if (underline) result.car = result.str.replace(/./g, '^');
  return result;
}

function generateBacktrace(term, index, father, frames, options) {
  var result = { str: '', car: '' };
  var backtrace, underline;

  // frames = null -> do not underline
  // frames = [] -> underline
  if (Array.isArray(term)) {
    if (term.length === 0) {
      underline = Array.isArray(frames) && (frames.length === 0);
      carify(result, 'undefined', underline);
    } else if (specialType[term[0]]) {
      backtrace = specialType[term[0]](term, index, father, frames, options);
      result.str = backtrace.str;
      result.car = backtrace.car;
    } else if (nonPrefix[term[0]]) {
      backtrace = generateWithoutPrefixBacktrace(term, index, father, frames, options);
      result.str = backtrace.str;
      result.car = backtrace.car;
    } else { // normal type -- this.<method>( this.args... )
      backtrace = generateNormalBacktrace(term, index, father, frames, options);
      result.str = backtrace.str;
      result.car = backtrace.car;
    }
  } else if (term !== undefined) {
    backtrace = specialType[termTypes.DATUM](term, index, father, frames, options);

    result.str = backtrace.str;
    result.car = backtrace.car;
  }

  return result;
}

function camelCase(str) {
  return str.replace(/_(.)/g, function(m, char) { return char.toUpperCase(); });
}

error.generateBacktrace = generateBacktrace;
