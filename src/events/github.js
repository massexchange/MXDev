const Event = require("../event");

module.exports = class GithubEvent extends Event {
    constructor(trigger) {
        super(trigger);

        this.installation = trigger.installation.id;
    }
};
