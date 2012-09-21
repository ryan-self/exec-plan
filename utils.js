/* --- STUBS --- */

var emptyFn = exports.emptyFn = (function () {});

/* --- CONVERTERS --- */

var toString = exports.toString = function (value) {
    return Object.prototype.toString.call(value);
};

/* --- TYPE CHECKERS --- */

var isDefined = exports.isDefined = function (value) {
    return typeof value !== 'undefined';
};
var isString = exports.isString = function (value) {
    return typeof value === 'string';
};
var isNumber = exports.isNumber = function (value) {
    return typeof value === 'number';
};
var isFunction = exports.isFunction = function (value) {
    return typeof value === 'function';
};
var isArray = exports.isArray = function (value) {
    return toString(value) === '[object Array]';
};
var isObject = exports.isObject = function (value) {
    return toString(value) === '[object Object]';
};
