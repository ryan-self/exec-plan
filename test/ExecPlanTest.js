/* --- ENVIRONMENT SETUP --- */

// require external modules
var ExecPlan = require('exec-plan').ExecPlan;
var sinon    = require('sinon');
var utils    = require('../utils');

// short-hand variables
var emptyFn    = utils.emptyFn;
var isFunction = utils.isFunction;
var isDefined  = utils.isDefined;
var isNumber   = utils.isNumber;
var isString   = utils.isString;
var isObject   = utils.isObject;
var isArray    = utils.isArray;

/* ------------------------- */

/* --- TEST CASES --- */

// GROUP: verification of correct construction
exports.construction = {
    'Passing in no config object gives default to all config options':
            function (test) {
        var execPlan = new ExecPlan();
        test.ok(execPlan.willAutoPrintOut());
        test.ok(execPlan.willAutoPrintErr());
        test.ok(execPlan.continuesOnError());
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
    },
    'Config {continueOnError: false} sets continueOnError correctly': function (test) {
        var execPlan = new ExecPlan({continueOnError: false});
        test.equal(execPlan.continuesOnError(), false, 'execPlan will not contine on errors');
        test.done();
    }
};

// GROUP: verification that autoPrintOut/Err settings are honored by execution
exports.autoPrintOut_Err = {
    setUp: function (callback) {
        this.stdoutStub = sinon.stub(process.stdout, "write");
        this.stderrStub = sinon.stub(process.stderr, "write");
        callback();
    },
    tearDown: function (callback) {
        this.stdoutStub.restore();
        this.stderrStub.restore();
        callback();
    },
    'Prints to stdout by default': function (test) {  // this test case will serve as a template
                                                      // for the others (avoid repeating comments).
        // setup exec plan
        var testCase = this, execPlan = new ExecPlan();
        execPlan.add('ls');
        execPlan.add('ps -ef');
        execPlan.on('finish', function () {  // need to wait until plan finishes
            test.ok(testCase.stdoutStub.called, 'stdout is written to');
            test.done();
        });

        // set the asynchronous execution of the plan into motion
        execPlan.execute();
    },
    'Prints to stderr by default': function (test) {
        var testCase = this, execPlan = new ExecPlan();
        execPlan.add('./command_that_does_not_exist');
        execPlan.on('finish', function () {
            test.ok(testCase.stdoutStub.called, 'stderr is written to');
            test.done();
        });
        execPlan.execute();
    },
    'Does not print to stdout when "autoPrintOut" is turned off': function (test) {
        var testCase = this, execPlan = new ExecPlan({autoPrintOut: false});
        var errorSpy = sinon.spy();
        execPlan.add('ls');
        execPlan.on('finish', function () {
            test.ok(!testCase.stdoutStub.called, 'stdout is not written to');
            test.done();
        });
        execPlan.execute();
    },
    'Does not print to stderr when "autoPrintErr" is turned off': function (test) {
        var testCase = this, execPlan = new ExecPlan({autoPrintErr: false});
        var errorSpy = sinon.spy();
        execPlan.add('./command_that_does_not_exist');
        execPlan.on('execerror', errorSpy);
        execPlan.on('finish', function () {
            test.ok(errorSpy.called, 'error event handler is called');
            test.ok(!testCase.stderrStub.called, 'stderr is not written to');
            test.done();
        });
        execPlan.execute();
    }
};

// GROUP: verification of 'execute' method
exports.execute = {
    setUp: function (callback) {
        this.execPlan = new ExecPlan({autoPrintOut: false, autoPrintErr: false});
        callback();
    },
    tearDown: function (callback) {
        delete this.execPlan;
        callback();
    },
    'Execution happens in order given': function (test) {
        var execPlan = this.execPlan;
        var execQueue = [];
        var makeQueuer = function (order) { return function () { execQueue.push(order) }; };
        execPlan.add(makeQueuer(1), 'echo "hi"');
        execPlan.add(makeQueuer(2), 'echo "hi"');
        execPlan.add(makeQueuer(3), 'echo "hi"');
        execPlan.add(makeQueuer(4), 'echo "hi"');
        execPlan.on('finish', function () {
            for (var i=1; i<=execQueue.length; i++) {
                test.ok(execQueue[i-1] === i, 'element at position ' + i + ' is in order');
            }
            test.done();
        });
        execPlan.execute();
    }
};

// GROUP: verification of error handlers used by specific commands
exports.errorHandlers = {
    setUp: function (callback) {
        this.execPlan = new ExecPlan({autoPrintOut: false, autoPrintErr: false});
        callback();
    },
    tearDown: function (callback) {
        delete this.execPlan;
        callback();
    },
    'Single command error handler gets called before "error" event': function (test) {
        var execPlan = this.execPlan;
        var errorSpy = sinon.spy();
        var errorHandlerSpy = sinon.spy();
        execPlan.add('./command_that_does_not_exist', errorHandlerSpy);
        execPlan.on('execerror', errorSpy);
        execPlan.on('finish', function () {
            test.ok(errorHandlerSpy.called, 'individual error handler was called');
            test.ok(errorSpy.called, 'error event handler was called');
            test.ok(errorHandlerSpy.calledBefore(errorSpy), 
                    'individual error handler was called before error event handler');
            test.done();
        });
        execPlan.execute();
    },
    'Returning false in error handler prevents "error" event from firing': function (test) {
        var execPlan = this.execPlan;
        var errorSpy = sinon.spy();
        var errorHandlerSpy = sinon.spy();
        execPlan.add('./command_that_does_not_exist', function () {
            errorHandlerSpy();
            return false;
        });
        execPlan.on('execerror', errorSpy);
        execPlan.on('finish', function () {
            test.ok(errorHandlerSpy.called, 'individual error handler is called');
            test.ok(!errorSpy.called, 'error event handler is not called');
            test.done();
        });
        execPlan.execute();
    },
    'Returning true in error handler prevents "error" event from firing': function (test) {
        var execPlan = this.execPlan;
        var errorSpy = sinon.spy();
        var errorHandlerSpy = sinon.spy();
        execPlan.add('./command_that_does_not_exist', function () {
            errorHandlerSpy();
            return true;
        });
        execPlan.on('execerror', errorSpy);
        execPlan.on('finish', function () {
            test.ok(errorHandlerSpy.called, 'individual error handler is called');
            test.ok(!errorSpy.called, 'error event handler is not called');
            test.done();
        });
        execPlan.execute();
    },
    'Returning false in error handler stops plan, even when general policy is to continue':
            function (test) {
        var execPlan = this.execPlan;
        var errorHandlerSpy = sinon.spy();
        var secondCommandSpy = sinon.spy();
        execPlan.add('./command_that_does_not_exist', function () {
            errorHandlerSpy();
            return false;
        });
        execPlan.add(secondCommandSpy, 'echo "hi"');
        execPlan.on('finish', function () {
            test.ok(errorHandlerSpy.called, 'individual error handler is called');
            test.ok(!secondCommandSpy.called, 'second command is not called');
            test.done();
        });
        execPlan.execute();
    },
    'Returning true in error handler continues plan, even when general policy is to stop':
            function (test) {
        var execPlan = new ExecPlan({
            autoPrintOut: false, 
            autoPrintErr: false,
            continueOnError: false
        });
        var errorHandlerSpy = sinon.spy();
        var secondCommandSpy = sinon.spy();
        execPlan.add('./command_that_does_not_exist', function () {
            errorHandlerSpy();
            return true;
        });
        execPlan.add(secondCommandSpy, 'echo "hi"');
        execPlan.on('finish', function () {
            test.ok(errorHandlerSpy.called, 'individual error handler is called');
            test.ok(secondCommandSpy.called, 'second command is called');
            test.done();
        });
        execPlan.execute();
    },
    'No return from error handler continues plan when general policy is to continue':
            function (test) {
        var execPlan = this.execPlan;
        var errorHandlerSpy = sinon.spy();
        var secondCommandSpy = sinon.spy();
        execPlan.add('./command_that_does_not_exist', function () {
            errorHandlerSpy();
        });
        execPlan.add(secondCommandSpy, 'echo "hi"');
        execPlan.on('finish', function () {
            test.ok(errorHandlerSpy.called, 'individual error handler is called');
            test.ok(secondCommandSpy.called, 'second command is not called');
            test.done();
        });
        execPlan.execute();
    },
    'No return from error handler stops plan when general policy is to stop': function (test) {
        var execPlan = new ExecPlan({
            autoPrintOut: false, 
            autoPrintErr: false, 
            continueOnError: false
        });
        var errorHandlerSpy = sinon.spy();
        var secondCommandSpy = sinon.spy();
        execPlan.add('./command_that_does_not_exist', function () {
            errorHandlerSpy();
        });
        execPlan.add(secondCommandSpy, 'echo "hi"');
        execPlan.on('finish', function () {
            test.ok(errorHandlerSpy.called, 'individual error handler is called');
            test.ok(!secondCommandSpy.called, 'second command is called');
            test.done();
        });
        execPlan.execute();
    },
    '2nd command has error handler called without 1st error handler called': function (test) {
        var execPlan = this.execPlan;
        var errorHandler1Spy = sinon.spy();
        var errorHandler2Spy = sinon.spy();
        execPlan.add('echo "hi"', errorHandler1Spy);
        execPlan.add('./command_that_does_not_exist', errorHandler2Spy);
        execPlan.on('finish', function () {
            test.ok(!errorHandler1Spy.called, '1st error handler is not called');
            test.ok(errorHandler2Spy.called, '2nd error handler is called');
            test.done();
        });
        execPlan.execute();
    },
    'Of 4 commands, 1st command has error handler called': function (test) {
        var execPlan = this.execPlan;
        var errorHandler1Spy = sinon.spy();
        execPlan.add('./command_that_does_not_exist', errorHandler1Spy);
        execPlan.add('echo "hi"');
        execPlan.add('echo "hi"');
        execPlan.add('echo "hi"');
        execPlan.on('finish', function () {
            test.ok(errorHandler1Spy.called, '1st error handler is called');
            test.done();
        });
        execPlan.execute();
    },
    'Of 4 commands, 2nd command has error handler called': function (test) {
        var execPlan = this.execPlan;
        var errorHandler2Spy = sinon.spy();
        execPlan.add('echo "hi"');
        execPlan.add('./command_that_does_not_exist', errorHandler2Spy);
        execPlan.add('echo "hi"');
        execPlan.add('echo "hi"');
        execPlan.on('finish', function () {
            test.ok(errorHandler2Spy.called, '2nd error handler is called');
            test.done();
        });
        execPlan.execute();
    },
    'Of 4 commands, 3rd command has error handler called': function (test) {
        var execPlan = this.execPlan;
        var errorHandler3Spy = sinon.spy();
        execPlan.add('echo "hi"');
        execPlan.add('echo "hi"');
        execPlan.add('./command_that_does_not_exist', errorHandler3Spy);
        execPlan.add('echo "hi"');
        execPlan.on('finish', function () {
            test.ok(errorHandler3Spy.called, '3rd error handler is called');
            test.done();
        });
        execPlan.execute();
    },
    'Of 4 commands, 4th command has error handler called': function (test) {
        var execPlan = this.execPlan;
        var errorHandler4Spy = sinon.spy();
        execPlan.add('echo "hi"');
        execPlan.add('echo "hi"');
        execPlan.add('echo "hi"');
        execPlan.add('./command_that_does_not_exist', errorHandler4Spy);
        execPlan.on('finish', function () {
            test.ok(errorHandler4Spy.called, '4th error handler is called');
            test.done();
        });
        execPlan.execute();
    }
};
