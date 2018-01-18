const nconf = require("nconf");
const MXControlEvent = require("../events/mxcontrol");
const Hipchat = require("../api/hipchat");
const MXControl = require("mxcontrol");
const Promise = require("bluebird");
const dnsLookup = Promise.promisify(require("dns").lookup);
const {mxDynamoDB} = require("mxaws");

nconf.env("_");

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:MXCONTROL:TOKEN"));
const statusVerbs = [...MXControl.possibleActions.statusVerbs];
const upVerbs = [...MXControl.possibleActions.upVerbs];
const downVerbs = [...MXControl.possibleActions.downVerbs];
const rebootVerbs = [...MXControl.possibleActions.rebootVerbs];

const handleMXControlEvent = async event => {
    const useFullCLI = event.debug;
    const task = event.task;
    const targetName = task.instance || task.environment || task.database;
    const action = task.action.toLowerCase();

    if (!checkForControlTaskErrors) return;

    msgMXControlRoom(
        MXControl.buildLog(targetName, task.action, task.size, task.database));

    //Standard MXControl status functions wasn't meant for a hipchat audience.
    //Wrap those with something new.
    if (statusVerbs.includes(action)) {

        const statusResponse = await MXControl.runTask(task);

        if (useFullCLI) //If using the full CLI anyway, format output for Hipchat
            await msgMXControlRoom(formatStatusResponse(statusResponse).join("\n"));

        else if (!useFullCLI && targetName) {

            const environmentErrors =
                await checkEnvironmentReadiness(statusResponse, targetName);

            if (environmentErrors.length != 0) {
                await msgMXControlRoom(`${targetName}.massexchange.com is **NOT READY.**`);
                environmentErrors.map(async err => await msgMXControlRoom(err));

            } else await msgMXControlRoom(`${targetName}.massexchange.com is **READY.**`);

        } else await msgMXControlRoom("Please specify an environment");

        return;
    }

    //Lets start remembering what we brought up...
    if (!useFullCLI &&
            (upVerbs.includes(action)
            || rebootVerbs.includes(action))
    ) {
        await mxDynamoDB.putItem({"Name": `MXWeb-${targetName}`}, "mxDevTest");
        await mxDynamoDB.putItem({"Name": `MXBackend-${targetName}`}, "mxDevTest");
        //no return -- let the rest of the task run...
    }

    //Else, handle the control task normally.
    MXControl.runTask(task).catch(err =>{
        //task failed for some reason -- shoot errors
        console.log(err);
        //attempt to notify Hipchat
        msgMXControlRoom("Something went wrong with the operation. Ops has been notified.");
    });
};

const msgMXControlRoom =
    async message => hipchat.notify(message, {room: "MXControl"});

const flattenStatus = statusJSON =>
    Array.isArray(statusJSON[0])
        ? statusJSON.reduce((agg, curr) => agg.concat(curr), [])
        : statusJSON;

const formatStatusResponse = statusJSON =>
    flattenStatus(statusJSON).map(parseStatusText);

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

const checkForControlTaskErrors = async MXControlTask => {
    const tasksWithErrors = await MXControl.getControlTaskErrors(MXControlTask);
    if (tasksWithErrors.length != 0) { //For now, just assume one task will ever exist
        const errorArray = parseMXControlErrors(tasksWithErrors[0].errors);
        await msgMXControlRoom("## Errors:");
        await msgMXControlRoom(errorArray.join("\n"));
        await msgMXControlRoom("## Please double check your input, and try again.");
        return false;
    }
    return true;
};


const parseMXControlErrors = errorArray =>
    errorArray.reduce((agg, curr) => agg.concat(curr), []);

const checkEnvironmentReadiness = async(statusJSON, envName) => {
    const errors = [];

    const isEnvironmentMember = obj =>
        obj.InstanceEnvironment == envName
        || obj.InstanceName == `mxenvironment-${envName}`;

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

    if (backend.InstanceState != "running" && frontend.InstanceState != "running")
        errors.push("The environment is off.");

    if (backend.InstanceState != "running" && frontend.InstanceState == "running")
        errors.push("The backend is down.");

    if (backend.InstanceState == "running" && frontend.InstanceState != "running")
        errors.push("The frontend is down.");

    if (db.InstanceState != "available")
        errors.push("The database is unavailable. Please wait for its operation to complete.");

    if (frontend.InstanceAddress != addressFromDNS && frontend.InstanceState == "running")
        errors.push(`There is an error in the enviroment's DNS configuration.
Likely a Dynroute error. Try rebooting.`);

    return errors;
};

module.exports = {
    matches: event => true,
    name: "MXControl",
    accepts: MXControlEvent,
    handle: handleMXControlEvent,
    irrelevantMessage: "see what happens when Frank farts..."
};
