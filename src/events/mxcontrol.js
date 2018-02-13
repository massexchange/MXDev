const Event = require("../event");

/*
    MXDev-Formatted Wrapper for MXControl Control Task.
    See MXControl/README.md > ControlTask Syntax for the makeup of this.task
    See MXControl/README.md for more information regarding acceptable arguments.
*/

module.exports = class MXControlEvent extends Event {
    //second argument is a deconstructed Minimist args object.
    //"_" is minimist parlance for unflagged arguments
    constructor(
        trigger,
        {_: args, env: environment, inst: instance, db: database, size, debug}
    ) {
        super(trigger);

        this.debug = debug;
        const sanitizedAction = args[0].toLowerCase();

        if (debug) {//If on, expose full mxcontrol CLI rather than simplified one
            this.task = {
                action: sanitizedAction,
                environment,
                instance,
                database,
                size
            };

            return;
        }

        //Normal simplified operation -- be simple.
        //Arguments come in from args const, not flags.
        // -- only whole-environment operations allowed (no resizes)
        //args: [action, target]
        this.task = {
            action: sanitizedAction,
            environment: args[1]
        };
    }

};
