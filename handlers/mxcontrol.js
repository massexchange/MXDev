const nconf = require("nconf");
const MXControlEvent = require("../events/mxcontrol");
const Hipchat = require("../api/hipchat");
const MXControl = require("mxcontrol");
const Promise = require("bluebird");

nconf.env("_");

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:MXCONTROL:TOKEN"));
const msgMXControlRoom =
    (message) => hipchat.notify(message, {room: "MXControl"});

const handleMXControlTask = (event) => {
    const task = event.task;
    const targetName = task.instance || task.environment || task.database;

    const logline =
        MXControl.buildLog(targetName, task.action, task.size, task.database);

    msgMXControlRoom(logline);

    return Promise.resolve(MXControl.runTask(task).then((res)=>{

        const action = task.action.toLowerCase();

        if (action == "status" || action == "info") {
            console.log(res);
            msgMXControlRoom(
                JSON.stringify(res)
                    .replace(/\[|\]|\{/g, "")    //delete square and curlies
                    .replace(/,/g, "")              //delete commas
                    .replace(/}/g, "  ")              //replace closing curlies with newline
            );
        }

        else
            msgMXControlRoom(
                `MXControl job for ${targetName} Completed.`
            );

        return Promise.resolve();

    }));

};

module.exports = {
    matches: event => true,
    name: "MXControl",
    accepts: MXControlEvent,
    handle: handleMXControlTask,
    irrelevantMessage: "see what happens when Frank farts..."
};
