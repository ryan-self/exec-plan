exec-plan - Run child process commands synchronously
====================================================

Description
-----------

Provide the ability to run child process commands synchronously, with some fine-grained control, all while avoiding the
dreaded pyramid of doom (i.e., callback indentation) >.<

Easy Install
------------

    $ sudo npm install exec-plan

Install with package.json setup
-------------------------------

````javascript
/**
 * package.json example
 * package.json should be in the root of the project that will include 'exec-plan' as a dependency.
 * use this method of installing 'exec-plan' module to put it under the project's local directory.
 */
{
    "name": "my personal project",
    "version": "0.0.1",
    "dependencies": {
        "exec-plan": "0.0.1"
    }
}
````

    $ sudo npm install
- Note: this will install all dependencies for "my personal project" in "node_modules" folder
        below the project's root directory

Examples
--------

````javascript
/**
 * An example of the most basic usage.
 */

var ExecPlan = require('exec-plan').ExecPlan;
var execPlan = new ExecPlan();

execPlan.add('ls -la');
execPlan.add('grep "test" ./*');
execPlan.add('ps -ef');
execPlan.execute();
````

````javascript
/**
 * An example with more fine-grained control.
 */

var ExecPlan = require('exec-plan').ExecPlan;
var execPlan = new ExecPlan();

// attach event handlers to the events exposed by ExecPlan
execPlan.on('error', function (error, stderr) {
    console.log('an error happened in one of the steps in execution plan');
    console.log(error);  // the error object for the process that caused the problem
    console.log('the stderr for the process that caused the problem is ' + stderr);
});
execPlan.on('complete', function (stdout) {
    console.log('the entire execution plan finished, i.e., all child processes completed with no errors');
    console.log('the stdout for the final step in the execution plan is ' + stdout);
});

// first, setup a vanilla set of commands
execPlan.add('ls -la');
execPlan.add('ps -ef');

// now, add a command that will include some 'pre logic' that will run before the command is executed, 
// but after previous command in the execution plan finished.
execPlan.add(function (stdout) {
    process.chdir('/tmp');  // run this logic before the command is executed
}, 'grep "test" ./*');

// now, add a command that will include an error handler that will run before the 'error' event is fired.
execPlan.add('some_command_that_does_not_exist', function (error, stderr) {
    console.log('ERROR: ' + stderr);
    console.log(error); // a standard js Error object
    return false;  // return false to signal to execPlan that the 'error' event should not be fired
});

// run the set of commands
execPlan.execute();
````

ExecPlan API
------------

Events
======

- **'complete'** - fires when an entire execution plan's set of commands successfully execute.
    - The following parameters will be given to the provided callback:
        - **stdout** *String* - the stdout of the final command that successfully executed.
    - Example usage:
      ````javascript
      var ExecPlan = require('exec-plan').ExecPlan;
      var execPlan = new ExecPlan();

      execPlan.on('complete', function (stdout) {
          // provide code to do processing after all commands have successfully been executed.
      });
      ````
- **'error'**
    - The following parameters will be given to the provided callback:
        - **error** *Error*   - the js Error object of the command that caused the problem.
        - **stderr** *String* - the stderr of the command that caused the problem.
    - Example usage:
      ````javascript
      var ExecPlan = require('exec-plan').ExecPlan;
      var execPlan = new ExecPlan();

      execPlan.on('error', function (error, stderr) {
          // provide code to handle any command errors.
      });
      ````

Public Actions
==============

- **add** - adds a 'step' command to the execution plan.
    - The following parameters are expected:
        - **[preLogic]** *Function*     - a function to call before the command is executed, but after previous
                                          command finished.
            - The preLogic function should expect the following parameters:
                - **stdout** *String* - the stdout of the previously-executed step.
        - **command** *String*          - command to be executed.
        - **[options]** *Object*        - child_process.exec options. See: child_process.exec API.
        - **[errorHandler]** *Function* - a function to call if the command produces an error.
            - The errorHandler function should expect the following parameters:
                - **error** *Error*   - js Error object that occurred during command execution.
                - **stderr** *String* - the stderr of the command.
            - The errorHandler function should return ```` false ```` if 'error' event should not be fired in
              addition to this errorHandler.
- **execute** - executes all added commands in the order in which they were added.
    - This order will be enforced, such that each command will not execute until previous commands finish.


