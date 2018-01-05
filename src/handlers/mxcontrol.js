const nconf = require("nconf");
const MXControlEvent = require("../events/mxcontrol");
const Hipchat = require("../api/hipchat");
const MXControl = require("mxcontrol");
const Promise = require("bluebird");
const dnsLookup = Promise.promisify(require("dns").lookup);

nconf.env("_");

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:MXCONTROL:TOKEN"));
const msgMXControlRoom =
    async message => hipchat.notify(message, {room: "MXControl"});

const flattenStatus = statusJSON =>
    Array.isArray(statusJSON[0])
        ? statusJSON.reduce((agg, curr) => agg.concat(curr), [])
        : statusJSON;

const formatStatusResponse = statusJSON =>
    parseStatusText(flattenStatus(statusJSON));

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

const checkEnvironmentUsingStatusResponse = async(statusJSON, envName) => {
    const errors = [];

    const isEnvironmentMember = obj =>
        obj.InstanceEnvironment == envName
        || obj.InstanceName == `mxenvironment-${envName}`;
    console.log("statusJSON:", statusJSON);

    const flatStatus = flattenStatus(statusJSON).filter(isEnvironmentMember);

    if (flatStatus.length == 0) {
        errors.push(`Environment ${envName} doesn't exist!`);
        return errors;
    }

    const backend = flatStatus.filter(obj =>
        obj.InstanceApplication == "MXBackend")[0];

    const frontend = flatStatus.filter(obj =>
        obj.InstanceApplication == "MXWeb")[0];

    const db = flatStatus.filter(obj =>
        obj.InstanceName == `mxenvironment-${envName}`)[0];

    const addressFromDNS = await dnsLookup(`${envName}.massexchange.com`);

    if (backend.InstanceState != "running")
        errors.push("The backend is down.");

    if (frontend.InstanceState != "running")
        errors.push("The frontend is down");

    if (db.InstanceState != "available")
        errors.push("The database is unavailable");

    if (frontend.InstanceAddress != addressFromDNS && frontend.InstanceState == "running")
        errors.push("There is an error in the enviroments DNS configuration");

    return errors;
};

const handleMXControlTask = async event => {
    const statusVerbs = ["status","info","scry","check"];

    const useFullCLI = event.debug;

    const task = event.task;
    const targetName = task.instance || task.environment || task.database;
    const action = task.action.toLowerCase();

    const logline =
        MXControl.buildLog(targetName, task.action, task.size, task.database);

    msgMXControlRoom(logline);

    if (statusVerbs.includes(action)) {
        let statusResponse = [];
        try {
            statusResponse = await MXControl.runTask(task);
        } catch(e) {
            console.log(`${targetName} not found.`);
        }

        if (useFullCLI)
            formatStatusResponse(statusResponse)
                .map(async res => await msgMXControlRoom(res));

        if (!useFullCLI && targetName) {
            const environmentErrors =
                await checkEnvironmentUsingStatusResponse(statusResponse, targetName);

            if (environmentErrors.length != 0) {
                await msgMXControlRoom(`${targetName}.massexchange.com is NOT READY.`);
                environmentErrors.map(async err => await msgMXControlRoom(err));

            } else await msgMXControlRoom(`${targetName}.massexchange.com is READY`);
        } else await msgMXControlRoom("Please specify an environment");

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
