const
    Promise = require("bluebird"),

    Event = require("../event");

const parseTrigger = trigger =>
    new Event(trigger);

module.exports = class Hook {
    constructor(handlers, triggerParser = parseTrigger, message) {
        this.handlers = handlers;
        this.triggerParser = triggerParser;
        this.message = message;
    }
    handle(trigger) {
        console.log(this.message(trigger));

        const events = this.triggerParser(trigger);

        return Promise.all(...events.map(event =>
            this.handlers
                .filter(handler =>
                    event instanceof handler.accepts)
                .filter(handler =>
                    handler.matches(event))
                .map(handler =>
                    handler.handle(event))));
    }
};
