
const Hook = require("../hook");

const MXControlEvent = require("../events/mxcontrol");
const MXControlHandler = require("../handlers/mxcontrol");

const parseHipchatTrigger = (trigger) => {

    const parsedTrigger = simplifyHipchatTrigger;

    const events = [];

    if (parsedTrigger.event == "room_message") {
        const commandArgs = parsedTrigger.message.split(" ");

        if (commandArgs[0] == "/mxcontrol")
            events.push(new MXControlEvent(
                trigger,
                commandArgs[1], //action
                commandArgs[2], //targetType
                commandArgs[3], //target
                commandArgs[4]  //size
            ));
    }

    return events;
};

const simplifyHipchatTrigger = (trigger) => {
    return {
        event: trigger.event,
        message: trigger.item.message.message,
        from: {
            id: trigger.item.message.from.id,
            mentionName: trigger.item.message.from.mention_name,
            name: trigger.item.message.from.name
        }
    };
};


module.exports = new Hook(
    [MXControlHandler],
    parseHipchatTrigger,
    (trigger)=> {
        console.log("Recieved Hipchat Message:");
        console.log(simplifyHipchatTrigger(trigger));
    });
