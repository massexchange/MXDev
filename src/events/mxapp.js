const Event = require("../event");

module.exports = class MXAppEvent extends Event {
    constructor(trigger, source, message) {
        super(trigger);
        this.source = source;
        this.message = message;
    }
};
