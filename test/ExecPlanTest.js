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

// GROUP: verification of correct construction
exports.construction = {
    'Passing in no config object makes autoPrintOut/Err true':
            function (test) {
        var execPlan = new ExecPlan();
        test.ok(execPlan.willAutoPrintOut());
        test.ok(execPlan.willAutoPrintErr());
        test.done();
    },
    'Config {autoPrintOut:false} sets autoPrintOut/Err accordingly':
            function (test) {
        var execPlan = new ExecPlan({autoPrintOut: false});
        test.equal(execPlan.willAutoPrintOut(), false, 'execPlan will not auto print stdout');
        test.ok(execPlan.willAutoPrintErr(), 'execPlan will auto print stderr');
        test.done();
    },
    'Config {autoPrintErr:false} sets autoPrintOut/Err accordingly':
            function (test) {
        var execPlan = new ExecPlan({autoPrintErr: false});
        test.ok(execPlan.willAutoPrintOut(), 'execPlan will auto print stderr');
        test.equal(execPlan.willAutoPrintErr(), false, 'execPlan will not auto print stderr');
        test.done();
    },
    'Config {autoPrintOut:false, autoPrintErr:false} sets autoPrintOut/Err correctly':
            function (test) {
        var execPlan = new ExecPlan({autoPrintOut: false, autoPrintErr: false});
        test.equal(execPlan.willAutoPrintOut(), false, 'execPlan will not auto print stdout');
        test.equal(execPlan.willAutoPrintErr(), false, 'execPlan will not auto print stderr');
        test.done();
    }
};
