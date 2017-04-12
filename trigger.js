const Promise = require("bluebird");

module.exports = class Trigger {
    constructor(handlers, message) {
        this.handlers = handlers;
        this.message = message;
    }
    handle(event) {
        console.log(this.message(event));

        return Promise.all(this.handlers
            .filter(handler =>
                handler.matches(event))
            .map(handler =>
                handler.handle(event)));
    }
};
