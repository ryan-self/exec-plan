0.0.2 / 2012-09-22 
==================

  * fix bug where error handlers were not matching up with commands that set the handlers up
  * add **autoPrintOut** and **autoPrintErr** config options feature to allow disabling the automatic
    printing to stdout/err
  * add **finish** event
  * change **error** event to **execerror** due to a conflict with node.js *events* module
  * add initial suite of test cases for basic usage of ExecPlan
  * include sinon.js dev dependency for test harness

0.0.1 / 2012-09-08
==================

  * initial release
