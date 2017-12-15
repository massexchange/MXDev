const Hook = require("../hook");

const MXControlEvent = require("../events/mxcontrol");
const MXControlHandler = require("../handlers/mxcontrol");

//a primer to this type of function
//(cause this shit is difficult the first time)
//I'm definining a function here that takes in a trigger,
//and returns the result of a
//the result of another function which does some destructuring
//when called on the given trigger, which is passed into said function
//w/ destructuring on the last line of this function.
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
        const commandArgs = (event == "room_message")
            ? message.split(" ")
            : null;

        const events = [];

        if (commandArgs[0] == "/mxcontrol")
            events.push(new MXControlEvent(
                trigger,
                commandArgs[1], //action
                commandArgs[2], //targetType
                commandArgs[3], //target
                commandArgs[4]  //size
            ));
    })(trigger);

// const parseHipchatTrigger = (trigger) => {
//
//     const simpleTrigger = simplifyHipchatTrigger(trigger);
//
//     const events = [];
//
//     if (simpleTrigger.event == "room_message") {
//         const commandArgs = simpleTrigger.message.split(" ");
//
//         if (commandArgs[0] == "/mxcontrol")
//             events.push(new MXControlEvent(
//                 trigger,
//                 commandArgs[1], //action
//                 commandArgs[2], //targetType
//                 commandArgs[3], //target
//                 commandArgs[4]  //size
//             ));
//     }
//
//     return events;
// };

// const simplifyHipchatTrigger = (trigger) => {
//     return {
//         event: trigger.event,
//         message: trigger.item.message.message,
//         from: {
//             id: trigger.item.message.from.id,
//             mentionName: trigger.item.message.from.mention_name,
//             name: trigger.item.message.from.name
//         }
//     };
// };


module.exports = new Hook(
    [MXControlHandler],
    parseHipchatTrigger,
    (trigger) => {
        console.log("Recieved Hipchat Message:");
        console.log(simplifyHipchatTrigger(trigger));
    });
