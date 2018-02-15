const Hipchat = require("../api/hipchat");
const nconf = require("nconf");
const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:MXCONTROL:TOKEN"));
nconf.env("_");

const util = {};

util.msgMXControlRoom =
    message => hipchat.notify(message, {room: "MXControl"});

module.exports = util;
