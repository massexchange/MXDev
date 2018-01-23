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

        if (debug) {
        //If Debug mode is on, full mxcontrol cli is exposed in hipchatNotes
            let controlTask = {
                action: args[0]
            };

            //Adapted from MXControl/CLI.js
            if (size) controlTask = Object.assign({size: size}, controlTask);

            this.task =
            env ? Object.assign({environment: env}, controlTask)
                : inst ? Object.assign({instance: inst}, controlTask)
                    : db ? Object.assign({database: db}, controlTask)
                        : console.log("Invalid Target Type.");

            return;
        }

        //Normal simplified operation -- be simple.
        //Arguments come in from args const, not flags.
        // -- only whole-environment operations allowed (no resizes)
        // -- outputs are simplified -- handled outputs elsewhere

        //args: [action, target]
        this.task = {
            action: args[0],
            environment: args[1]
        };
    }

};
