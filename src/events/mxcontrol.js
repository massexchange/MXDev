const Event = require("../event");

/*
    MXDev-Formatted Wrapper for MXControl Control Task.
    See MXControl/README.md > ControlTask Syntax for the makeup of this.task
    See MXControl/README.md for more information regarding acceptable arguments.
*/

module.exports = class MXControlEvent extends Event {
    //second argument is a deconstructed Minimist args object.
    //"_" is minimist parlance for unflagged arguments
    constructor(trigger, {_, debug, sudo, env, inst, db, size}) {
        super(trigger);

        const args = _;
        this.debug = debug; //TODO: expose full CLI, not simplified
        this.sudo = sudo;   //TODO: restrict doing things with certain targets

        if (debug) {
            //If Debug mode is on, full mxcontrol cli is exposed in hipchatNotes
                let controlTask = {
                    action: action
                };

                //Adapted from MXControl/CLI.js
                if (size) controlTask = Object.assign({size: size}, controlTask);

                this.task =
                ["env", "environment"].includes(targetType)
                    ?  Object.assign({environment: target}, controlTask)
                    : ["inst", "instance"].includes(targetType)

                        ? Object.assign({instance: target}, controlTask)
                        : ["db", "database"].includes(targetType)

                            ? Object.assign({database: target}, controlTask)
                            : console.log("Invalid Target Type.");

                return
            }
        }

        //Normal simplified operation -- be simple.
        //Arguments come in from args const, not flags.
        // -- operations don't require target type
        // -- only whole-environment operations allowed (no resizes)
        // -- outputs are simplified -- handle outputs elsewhere

        //args: [action, target]
        this.task = {
            action: args[0],
            environment: args[1]
        }





};
