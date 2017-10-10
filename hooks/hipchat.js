const
    Hook = require("../hook");


//In the future, assuming we're going to want to have this deal with
//multiple possible handlers.
const parseHipchatTrigger = (trigger) => {
    //if it's not a message, do something else. Ionno yet.
    return {
        event: trigger.event,
        message: trigger.item.message.message,
        from: {
            id: trigger.item.message.from.id,
            mentionName: trigger.item.message.from.mention_name,
            name: trigger.item.

    }
}

module.exports = new Hook([], parseHipchatTrigger ,()=>"potato");
