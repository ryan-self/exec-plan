/* --- EXTERNAL DEPENDENCIES --- */

var events = require('events');
var exec   = require('child_process').exec;
var util   = require('util');

/* --- MODULE SCOPE VARIABLES --- */

/**
 * Function with no body.
 */
var emptyFn = (function () {});

/* --- PRIVATE UTILITY FUNCTIONS --- */

/**
 * Provide a common handler for errors.
 * @param execPlan ExecPlan
 * @param error Error
 * @param stderr String
 * @param errorHandler Function
 *                       @param error Error
 *                       @param stderr String
 */
var handleError = function (execPlan, error, stderr, errorHandler) {
    if (isFunction(errorHandler) && (errorHandler(error, stderr) !== false)) {
        // fire event if errorHandler allows us
        execPlan.emit('error', error, stderr);
    }
};

/**
 * @return Boolean - whether given object is a function
 */
var isFunction = function (obj) {
    return typeof obj === 'function';
};

/**
 * @return Boolean - whether given object is an object
 */
var isObject = function (obj) {
    Object.prototype.toString.call(obj) === '[object Object]';
};

/**
 * @return Boolean - whether given object is a string
 */
var isString = function (obj) {
    return typeof obj === 'string';
};

/**
 * Factory for constructing a function that should execute as the callback for the final step in an
 * execution plan.
 * @param execPlan ExecPlan     - the ExecPlan that is the context for resultant 'final' function
 * @param errorHandler Function - the function that will handle any errors
 *                       @param error Error
 *                       @param stderr String
 * @return Function         - a function that can be used as the 'next step' in the final step
 *                            in the execPlan
 *           @param error Error   - the Error object created in final step (if any)
 *           @param stdout String - the stdout of the final step
 *           @param stderr String - the stderr of the final step
 */
var makeFinalFn = (function (execPlan, errorHandler) {
    return function (error, stdout, stderr) {
        console.log(stdout);
        if (error && isFunction(errorHandler)) handleError(execPlan, error, stderr, errorHandler);
        else                                   execPlan.emit('complete', stdout);
    };
});

/**
 * this is an internal API, so for the time being, assume all arguments are valid.
 * provides a function that corresponds to a 'step' in an execution plan.
 * @param execPlan ExecPlan
 * @param first Boolean         - whether this corresponds to the 'first' step in execution plan.
 * @param preLogic Function     - function to execute before command is exec'd. See: ExecPlan.add.
 * @param command String        - the command to exec. See: ExecPlan.add.
 * @param options Object        - config options for exec. See: ChildProcess.exec.
 * @param errorHandler Function - error handler from previous step. See: ExecPlan.add.
 * @param nextStep Function     - the callback for exec for next step. See: ChildProcess.exec.
 * @return Function             - callback to use as a step. See: ChildProcess.exec.
 */
var makeStep = function (execPlan, first, preLogic, command, options, errorHandler, nextStep) {
    return function (error, stdout, stderr) {
        // log stdout/err
        if (!first) {  // a previous step's stdout/err is available
            console.log(stdout);
            if (stderr !== '') console.log('stderr: ' + stderr);
        }

        if (error) {  // error occurred during this step
            handleError(execPlan, error, stderr, errorHandler);
        } else {  // this step successfully executed
            preLogic(stdout);
            if (options === null) exec(command, nextStep);
            else                  exec(command, options, nextStep);
        }
    };
};

/* --- CONSTRUCTOR --- */

/**
 * @return ExecPlan instance
 */
ExecPlan = function () {
    this.plan = [];
};

// set up ExecPlan to have the ability to manage custom events
util.inherits(ExecPlan, events.EventEmitter);

/* --- PLAN MANAGEMENT --- */

/**
 * add a 'step' to the execution plan.
 * @param [preLogic] Function                    - called before command is executed.
 *                     @param stdout String - stdout from previous step.
 * @param command String                         - shell command to execute.
 * @param [options] Object                       - exec options. See: ChildProcess.exec API.
 * @param [errorHander] Function                 - called if command errors out.
 *                        @param error Error   - error that occurred during previous step.
 *                        @param stderr String - stderr from previous step.
 *                        @return Boolean      - whether 'error' event should be fired by ExecPlan.
 * @throws TypeError - if given command is not a string
 */
ExecPlan.prototype.add = function (preLogic, command, options, errorHandler) {
    var objToAdd = {};
    var preLogicGiven = false, optionsGiven = false, errorHandlerGiven = false;

    /* --- HANDLE ARGUMENTS --- */

    // TODO: Refactor this logic. It is going to be very resistant to change; there is probably
    //       a library that handles this.

    // determine which arguments were given
    if (isFunction(preLogic))                              preLogicGiven = true;
    if ((preLogicGiven && isObject(options))
            || (!preLogicGiven && isObject(command)))      optionsGiven = true;
    if (preLogicGiven) {
        if ((optionsGiven && isFunction(errorHandler))
                || (!optionsGiven && isFunction(options))) errorHandlerGiven = true;
    } else {
        if ((optionsGiven && isFunction(options))
                || (!optionsGiven && isFunction(command))) errorHandlerGiven = true;
    }

    // assign variables correctly based on given input.
    // doing assignments in reverse order due to updating arguments with correct values as we go.
    if (!preLogicGiven) {
        if (optionsGiven) {
            if (errorHandlerGiven) errorHandler = options;
            else                   errorHandler = undefined;
            options = command;
        } else {
            if (errorHandlerGiven) errorHandler = command;
            else                   errorHandler = undefined;
            options = undefined;
        }
        command = preLogic;
        preLogic = undefined;
    } else {
        if (optionsGiven) {
            errorHandler = (errorHandlerGiven) ? errorHandler : undefined;
        } else {
            if (errorHandlerGiven) errorHandler = options;
            else                   errorHandler = undefined;
            options = undefined;
        }
    }

    /* ------------------------ */

    // validate required input
    if (!isString(command)) {
        throw new TypeError('given command is not a string');
    }

    // populate object to add to exec plan
    if (preLogic)     objToAdd.preLogic     = preLogic;
                      objToAdd.command      = command;
    if (options)      objToAdd.options      = options;
    if (errorHandler) objToAdd.errorHandler = errorHandler;

    // add object to exec plan
    this.plan.push(objToAdd);
};

/* --- PLAN EXECUTION --- */

/**
 * Do the actual execution of the plan that has been set up before this point.
 * Once the plan has been executed, it will become an empty plan again, irrespective of error.
 */
ExecPlan.prototype.execute = function () {
    var plan = this.plan, planLen, step, steps = [], idx, lastIdx;
    var preLogic, command, execOpts, errorHandler, errorHandlers = [], nextStep;

    // return immediately on empty plan
    if (plan.length === 0) return;

    // first, go through the plan and get all error handlers, because future steps must know about
    // past step's error handler.
    for (idx = 0, planLen = plan.length; idx < planLen; idx++) {
        step = plan[idx];
        errorHandler                    = step.errorHandler;
        if (!errorHandler) errorHandler = emptyFn;
        errorHandlers[idx] = errorHandler;
    }

    // the plan is being processed in reverse order, because individual steps depend on knowing
    // the callback for the 'next step'.
    for (planLen = plan.length, lastIdx = idx = planLen-1; idx >= 0; idx--) {
        step = plan[idx];

        // provide defaults for vars if not they are not present on current step
                            preLogic     = step.preLogic;
        if (!preLogic)      preLogic     = emptyFn;
                            command      = step.command;
                            execOpts     = step.options;
        if (!execOpts)      execOpts     = null;

        // make the current step
        if (idx < lastIdx) nextStep = steps[idx+1]; // use already created step
        else               nextStep = makeFinalFn(this, errorHandlers[idx-1]);
        steps[idx] = makeStep(this, (idx === 0), preLogic, command, execOpts,
                ((idx === 0) ? emptyFn : errorHandlers[idx-1]), nextStep);
    }

    // start the execution process
    steps[0]();

    // return plan to empty state
    this.plan = [];
};

/* --- DEBUG HELP --- */

ExecPlan.prototype.toString = function () {
    return this.plan.toString();
};

/* --- EXPORT THE CONSTRUCTOR --- */

exports.ExecPlan = ExecPlan;
