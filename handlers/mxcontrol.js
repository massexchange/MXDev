const nconf = require("nconf");
const MXControlEvent = require("../events/mxcontrol");
const Hipchat = require("../api/hipchat");

const handleMXControlTask = (event) =>{
    
}

module.exports = {
    matches: event => true,
    name: "MXControl",
    accepts: MXControlEvent,
    handle: handleMXControlTask,
    irrelevantMessage: "see what happens when Frank farts..."
};
