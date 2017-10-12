const nconf = require("nconf");
const MXControlEvent = require("../events/mxcontrol");
const Hipchat = require("../api/hipchat");
const MXControl = require("mxcontrol");
const Promise = require("bluebird");

nconf.env("_");

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:MXCONTROL:TOKEN"));

const handleMXControlTask = (event) => {
    const task = event.task;
    const targetName = task.instance || task.environment || task.database;

    hipchat.notify(
        MXControl.buildLog(
            targetName,
            task.action,
            task.size,
            task.database
        ),
        {room: "MXControl"}
    );

    return MXControl.runTask(task).then(()=>{
        hipchat.notify(
            `MXControl job for ${targetName} Completed.`,
            {room: "MXControl"}
        );
        return Promise.resolve();
    });

}

module.exports = {
    matches: event => true,
    name: "MXControl",
    accepts: MXControlEvent,
    handle: handleMXControlTask,
    irrelevantMessage: "see what happens when Frank farts..."
};
