const nconf = require("nconf");
const MXControlEvent = require("../events/mxcontrol");
const Hipchat = require("../api/hipchat");
const MXControl = require("mxcontrol");
const Promise = require("bluebird");
const dnsLookup = Promise.promisify(require("dns").lookup);
const {mxDynamoDB} = require("mxaws");

nconf.env("_");

const appNames = ["MXWeb", "MXBackend"];
const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:MXCONTROL:TOKEN"));
const dynamoName = nconf.get("DYNAMODB:TABLE:MXCONTROL");
const statusVerbs = [...MXControl.possibleActions.statusVerbs];
const upVerbs = [...MXControl.possibleActions.upVerbs];
const rebootVerbs = [...MXControl.possibleActions.rebootVerbs];

const handleMXControlEvent = async event => {
    const useFullCLI = event.debug;
    const task = event.task;
    const targetName = task.instance || task.environment || task.database;
    const action = task.action.toLowerCase();

    if (!(await checkForControlTaskErrors(task))) return;

    msgMXControlRoom(
        MXControl.buildLog(targetName, task.action, task.size, task.database));

    //Standard MXControl status functions weren't meant for a hipchat audience.
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

    if (!useFullCLI &&
        (upVerbs.includes(action) || rebootVerbs.includes(action)))
        addEnvEntriesToDynamo(targetName);

    MXControl.runTask(task).catch(err =>{
        console.log(err);
        msgMXControlRoom("Something went wrong with the operation. Ops has been notified.");
    });
};

const addEnvEntriesToDynamo = async envName => {
    return appNames.map(async appName =>
        await mxDynamoDB.putItem({
            "InstanceName": {"S":`${appName}-${envName}`}
        }, dynamoName));
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
        const errorArray = [
            "## Errors:",
            ...parseMXControlErrors(tasksWithErrors[0].errors),
            "## Please double check your input, and try again."
        ];
        await msgMXControlRoom(errorArray.join("\n"));
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
