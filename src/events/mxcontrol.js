const Event = require("../event");

/*
    MXDev-Formatted Wrapper for MXControl Control Task.
    See MXControl/README.md > ControlTask Syntax for the makeup of this.task
    See MXControl/README.md for more information regarding acceptable arguments.
*/

module.exports = class MXControlEvent extends Event {
    constructor(trigger, action, targetType, target, size) {
        super(trigger);

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
    }
};
