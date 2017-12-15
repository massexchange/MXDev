const nconf = require("nconf");
const MXControlEvent = require("../events/mxcontrol");
const Hipchat = require("../api/hipchat");
const MXControl = require("mxcontrol");
const Promise = require("bluebird");

nconf.env("_");

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:MXCONTROL:TOKEN"));
const msgMXControlRoom =
    async message => hipchat.notify(message, {room: "MXControl"});

const formatStatusResponse = statusJSON => {
    //flatten if necessary
    const flatStatus = Array.isArray(statusJSON[0])
        ? statusJSON.reduce((agg, curr) => agg.concat(curr), [])
        : statusJSON;

    return flatStatus.map(parseStatusText);
};

const parseStatusText = ({
    InstanceName,
    InstanceState,
    InstanceSize,
    InstanceAddress
}) =>`## ${InstanceName}
${InstanceState}
${InstanceSize}
${InstanceAddress}
`;

const handleMXControlTask = async event => {
    const statusVerbs = ["status","info","scry","check"];

    const task = event.task;
    const targetName = task.instance || task.environment || task.database;
    const action = task.action.toLowerCase();

    const logline =
        MXControl.buildLog(targetName, task.action, task.size, task.database);

    msgMXControlRoom(logline);

    //If status text, wait for response
    if (statusVerbs.includes(action)) {
        const statusResponse = await MXControl.runTask(task);
        const formattedResponse = formatStatusResponse(statusResponse);
        formattedResponse.map(async res => await msgMXControlRoom(res));
        return;
    }

    //Else, send the task and let lambda die.
    MXControl.runTask(task).catch(err =>{
        //task failed for some reason -- shoot errors
        console.log(err);
        //attempt to notify Hipchat
        msgMXControlRoom(JSON.stringify(err));
        msgMXControlRoom("Something went wrong with the operation. Ops has been notified.");
    });
};

module.exports = {
    matches: event => true,
    name: "MXControl",
    accepts: MXControlEvent,
    handle: handleMXControlTask,
    irrelevantMessage: "see what happens when Frank farts..."
};
