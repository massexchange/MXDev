const Hook = require("../hook");

const MXCtrlResponseHandler = require("../handlers/mxapp");
const MXAppEvent = require("../events/mxapp");

const parseMXAppTrigger = trigger =>
    (({
        source,     //an InstanceName, or application
        message     //a string
    }) => {
        const events = [];

        if (message = "CRON")
            events.push(
                new MXAppEvent(trigger, source, message)
            );

        if (message = "UP") //TODO: Change to INSTANCE UP
            events.push(
                new MXAppEvent(trigger, source, message)
            );

        return events;
    })(trigger);

module.exports = new Hook(
    [MXCtrlResponseHandler],
    parseMXAppTrigger,
    (trigger) => {
        console.log("Recieved signal from MXApp");
        console.log(trigger);
    }
);
