const Hook = require("../hook");

const MXCtrlResponseHandler = require("../handlers/mxappCtrlResp");
const MXAppEvent = require("../events/mxapp");

const parseMXAppTrigger = trigger =>
    (({
        source,     //an InstanceName
        message     //a string
    }) => {
        const events = [];
        console.log(message);

        if (message = "UP")
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
