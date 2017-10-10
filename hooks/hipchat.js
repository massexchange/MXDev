const
    Hook = require("../hook");
    MXControlEvent = require("../events/mxcontrol"),

//In the future, assuming we're going to want to have this deal with
//multiple possible handlers.
const parseHipchatTrigger = (trigger) => {
    //if it's not a message, do something else. Ionno yet.
    const parsedTrigger = {
        event: trigger.event,
        message: trigger.item.message.message,
        from: {
            id: trigger.item.message.from.id,
            mentionName: trigger.item.message.from.mention_name,
            name: trigger.item.message.from.name
        }
    };
    const events = [];

    if (parsedTrigger.event == "room_message") { //scaffold for future stuffs
        const commandArgs = parsedTrigger.message.split(" ");
        if (commandArgs[0] == "/mxcontrol") {
            events.push(new MXControlEvent(
                trigger,
                commandArgs[1], //action
                commandArgs[2], //targetType
                commandArgs[3], //target
                commandArgs[4]  //size
            ));
        }
    }

    return events;
};

// const parseMessage

module.exports = new Hook(
    [],
    parseHipchatTrigger,
    ()=>"potato");
