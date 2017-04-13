const
    Promise = require("bluebird"),

    Event = require("./event");

const parseTrigger = trigger =>
    new Event(trigger);

module.exports = class Hook {
    constructor(handlers, triggerParser = parseTrigger, message) {
        this.handlers = handlers;
        this.triggerParser = triggerParser;
        this.message = message;
    }
    handle(trigger) {
        console.log("Parsing trigger...");
        console.log(this.message(trigger));

        const events = this.triggerParser(trigger);
        console.log(`Found events: ${events.map(event =>
            event.constructor.name)}`);

        console.log(`Informing handlers: ${this.handlers.map(handler =>
            handler.name)}`);

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
