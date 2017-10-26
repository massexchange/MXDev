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
        (targetType == "env" || targetType == "environment")
            ? this.task = Object.assign({environment: target}, controlTask)
            : (targetType == "inst" || targetType == "instance")

                ? this.task = Object.assign({instance: target}, controlTask)
                : (targetType == "db" || targetType == "database")

                    ? this.task = Object.assign({database: target}, controlTask)
                    : console.log("Invalid Target Type.");
    }
};
