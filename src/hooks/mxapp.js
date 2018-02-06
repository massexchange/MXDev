const Hook = require("../hook");

const MXAppResponseHandler = require("../handlers/mxapp");
const MXAppEvent = require("../events/mxapp");

const parseMXAppTrigger = trigger =>
    (({
        source,     //an InstanceName, or application
        message     //a string
    }) => {
        const events = [];

        const validMessageTypes = ["CRON", "UP"];
        const messageType = message.split(" ")[0];

        if (validMessageTypes.includes(messageType))
            events.push(
                new MXAppEvent(trigger, source, message)
            );

        return events;
    })(trigger);

module.exports = new Hook(
    [MXAppResponseHandler],
    parseMXAppTrigger,
    (trigger) => {
        console.log("Recieved signal from MXApp");
        console.log(trigger);
    }
);
