/* --- ENVIRONMENT SETUP --- */

var ExecPlan = require('exec-plan').ExecPlan;
var utils = require('../utils');
var isFunction = utils.isFunction;
var isDefined = utils.isDefined;
var isNumber = utils.isNumber;
var isString = utils.isString;
var isObject = utils.isObject;
var isArray = utils.isArray;

/* ------------------------- */

/* --- TEST CASES --- */

// verification of correct construction
exports['Passing in no constructor config object makes autoPrintOut and autoPrintErr true'] =
        function (test) {
    var execPlan = new ExecPlan();
    test.ok(execPlan.willAutoPrintOut());
    test.ok(execPlan.willAutoPrintErr());
    test.done();
};

exports['Constructor config {autoPrintOut:false} sets autoPrintOut and autoPrintErr accordingly'] =         function (test) {
    var execPlan = new ExecPlan({autoPrintOut: false});
    test.equal(execPlan.willAutoPrintOut(), false, 'execPlan will not auto print stdout');
    test.ok(execPlan.willAutoPrintErr(), 'execPlan will auto print stderr');
    test.done();
};

exports['Constructor config {autoPrintErr:false} sets autoPrintOut and autoPrintErr accordingly'] =         function (test) {
    var execPlan = new ExecPlan({autoPrintErr: false});
    test.ok(execPlan.willAutoPrintOut(), 'execPlan will auto print stderr');
    test.equal(execPlan.willAutoPrintErr(), false, 'execPlan will not auto print stderr');
    test.done();
};

exports['Constructor config {autoPrintOut:false, autoPrintErr:false} sets autoPrintOut and ' +
        'autoPrintErr accordingly'] = function (test) {
    var execPlan = new ExecPlan({autoPrintOut: false, autoPrintErr: false});
    test.equal(execPlan.willAutoPrintOut(), false, 'execPlan will not auto print stdout');
    test.equal(execPlan.willAutoPrintErr(), false, 'execPlan will not auto print stderr');
    test.done();
};
