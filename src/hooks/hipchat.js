const Hook = require("../hook");

const MXControlEvent = require("../events/mxcontrol");
const MXControlHandler = require("../handlers/mxcontrol");
const minimist = require("minimist");

//a primer to this type of function
//(cause this shit is difficult the first time)
//I'm definining a function here that takes in a trigger,
//and returns the result of a
//the result of another function which does some destructuring
//when called on the given trigger, which is passed into said function
//w/ destructuring on the last line of this function, after the return.
const parseHipchatTrigger = trigger =>
    (({
        event,
        item: {
            message: {
                message,
                from: {
                    id,
                    mentionName: mention_name,
                    name
                }
            }
        }
    }) => {
        const events = [];
        let command, args;

        if (event == "room_message") {
            const msgContent = message.split(" ");
            command = msgContent[0].slice(1);
            args = minimist(msgContent.slice(1));
        }

        if (command == "mxcontrol")
            events.push(new MXControlEvent(trigger,...args._));

        return events;
    })(trigger);


module.exports = new Hook(
    [MXControlHandler],
    parseHipchatTrigger,
    (trigger) => {
        console.log("Recieved Hipchat Message:");
        console.log(trigger.item.message.message);
    });
