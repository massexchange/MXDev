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
                    .replace(/\[|\]|\}/g, "")    //delete square and curlies
                    .replace(/,/g, "\n")              //delete commas
                    .replace(/\{/g, "\n--> ")              //replace closing curlies with newline
                    .replace(/"/g, "")
                    .replace(/:/g, ": ")
            );
        }

        else
            msgMXControlRoom(
                `MXControl job for ${targetName} Completed.`
            );

        return Promise.resolve();

    }).catch(err =>{
        //task failed for some reason -- shoot errors
        console.log(err);
        //attempt to notify Hipchat
        msgMXControlRoom(JSON.stringify(err));
        msgMXControlRoom("Something went wrong with the operation. Ops has been notified.");
    }));

};

module.exports = {
    matches: event => true,
    name: "MXControl",
    accepts: MXControlEvent,
    handle: handleMXControlTask,
    irrelevantMessage: "see what happens when Frank farts..."
};
