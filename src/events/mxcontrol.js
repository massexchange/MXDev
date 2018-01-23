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
        this.debug = debug;

        if (debug) {//If on, expose full mxcontrol CLI rather than simplified one
            let controlTask = {
                action: args[0]
            };

            if (size) controlTask = Object.assign({size: size}, controlTask);

            this.task =
            env ? Object.assign({environment: env}, controlTask)
                : inst ? Object.assign({instance: inst}, controlTask)
                    : db ? Object.assign({database: db}, controlTask)
                        : console.log("Invalid Target Type.");

            return;
        }

        //Else:
        //Normal simplified operation -- be simple.
        //Arguments come in from args const, not flags.
        // -- only whole-environment operations allowed (no resizes)

        //args: [action, target]
        this.task = {
            action: args[0],
            environment: args[1]
        };
    }

};
