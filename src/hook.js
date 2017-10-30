const
    Event = require("./event");

const parseTrigger = trigger =>
    new Event(trigger);

module.exports = class Hook {
    constructor(handlers, triggerParser = parseTrigger, message) {
        this.handlers = handlers;
        this.triggerParser = triggerParser;
        this.message = message;
    }
    async trigger(trigger) {
        console.log("Parsing trigger...");
        console.log(this.message(trigger));

        const events = this.triggerParser(trigger);
        console.log(`Found events: ${events.map(event =>
            event.constructor.name).join(", ")}`);

        console.log(`Potential handlers: ${this.handlers.map(handler =>
            handler.name).join(", ")}`);

        await Promise.all(events.map(this.handle, this));
        console.log("Trigger handled");
    }
    async handle(event) {
        const relevantHandlers = this.handlers
            .filter(handler =>
                event instanceof handler.accepts)
            .filter(handler =>
                (handler.matches ||
                (() => true))(event));

        console.log(`${event.constructor.name}: ${relevantHandlers.length} handler(s)`);

        const resultPs = relevantHandlers.map(async handler => {
            await handler.handle(event);
            console.log(`Handler ${handler.name} is done with the ${event.constructor.name}`);
        });

        await Promise.all(resultPs);
        console.log(`${event.constructor.name} handled`);
    }
};
