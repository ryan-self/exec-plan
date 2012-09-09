exec-plan
=========

Provide the ability to run child process commands sequentially, with some fine-grained control, all while avoiding the
dread pyramid of doom (i.e., callback indentation) >.<

Examples
========

````Javascript
/**
 * An example of the most basic usage.
 */

var ExecPlan = require('exec-plan').ExecPlan;
var execPlan = new ExecPlan();
execPlan.add('ls -la');
execPlan.add('grep "test" ./*');
execPlan.add('ps -ef');
execPlan.execute();