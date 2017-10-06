const
    Hook = require("../hook");


//In the future, assuming we're going to want to have this deal with
//multiple possible handlers.
const parseHipchatTrigger = (trigger) => {

}

module.exports = new Hook([], parseHipchatTrigger ,()=>"potato")
