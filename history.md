0.0.3 / 2012-09-28
==================

  * fix **Issue # 2** - individual error handlers are now called when an error happens for corresponding command.
  * add feature requested in **Issue # 1** - introduce "continue on error" policy via the **continueOnError** constructor config option, and allow individual error handlers to override the policy.

0.0.2 / 2012-09-22 
==================

  * add **autoPrintOut** and **autoPrintErr** config options feature to allow disabling the automatic
    printing to stdout/err
  * add **finish** event
  * change **error** event to **execerror** due to a conflict with node.js *events* module
  * add initial suite of test cases for basic usage of ExecPlan
  * include sinon.js dev dependency for test harness
  * **KNOWN BUGS**:
    * **Issue #2** - individual error handlers are not being called when an error happens for corresponding command.

0.0.1 / 2012-09-08
==================

  * initial release
