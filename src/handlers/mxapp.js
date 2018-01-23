const nconf = require("nconf");
const MXAppEvent = require("../events/mxapp");
const {mxDynamoDB} = require("mxaws");
const Promise = require("bluebird");
const Hipchat = require("../api/hipchat");

nconf.env("_");

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:MXCONTROL:TOKEN"));
const dynamoName = nconf.get("DYNAMODB:TABLE:MXCONTROL");

//This handles the notification that an environment has finished coming up
const msgMXControlRoom =
    async message => hipchat.notify(message, {room: "MXControl"});

const handleMXAppControlResponse = async ({source, message}) => {
    console.log("Handling UP signal");
    const instancesComingUp =
        (await mxDynamoDB.scanTable(dynamoName)).Items
            .map(item => item.InstanceName.S);

    //stay quiet if the instance coming up is not on the hipchat-mxcontrol list
    if (!instancesComingUp.includes(source))
        return;

    await mxDynamoDB.deleteItem(
        {"InstanceName":{"S":source}},
        dynamoName
    );

    const remainingInstances =
        instancesComingUp.filter(instName => instName != source);

    const envName = source.split("-")[1];

    const sameEnvInsts =
        remainingInstances.filter(instName => instName.split("-")[1] == envName);

    if (sameEnvInsts.length == 0)
        msgMXControlRoom(`${envName}.massexchange.com is now **READY**`);
};

module.exports = {
    matches: event => true,
    name: "MXApp MXControl Response",
    accepts: MXAppEvent,
    handle: handleMXAppControlResponse,
    irrelevantMessage: "see what happens when Frank farts..."
};
