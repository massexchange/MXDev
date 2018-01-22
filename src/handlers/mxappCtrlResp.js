const nconf = require("nconf");
const MXAppEvent = require("../events/mxapp");
const {mxDynamoDB} = require("mxaws");
const Promise = require("bluebird");
const Hipchat = require("../api/hipchat");

nconf.env("_");

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:MXCONTROL:TOKEN"));
const dynamoName = nconf.get("DYNAMODB:TABLE:MXCONTROL");

const msgMXControlRoom =
    async message => hipchat.notify(message, {room: "MXControl"});

const handleMXAppControlResponse = async event => {
    console.log(event);
    console.log("warmer, frank");
};

module.exports = {
    matches: event => true,
    name: "MXApp MXControl Response",
    accepts: MXAppEvent,
    handle: handleMXAppControlResponse,
    irrelevantMessage: "see what happens when Frank farts..."
};
