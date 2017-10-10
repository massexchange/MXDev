const Event = require("../event");

/*
    MXDev-Formatted Wrapper for MXControl Control Task.
    See MXControl/README.md > ControlTask Syntax for more information.
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
        (targetType == "env")
            ? this.task = Object.assign({environment: target}, controlTask)
            : (targetType == "inst")

                ? this.task = Object.assign({instance: target}, controlTask)
                : (targetType == "db")

                    ? this.task = Object.assign({database: target}, controlTask)
                    : console.log("Invalid Target Type.");

    }
};
