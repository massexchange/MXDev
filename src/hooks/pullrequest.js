const
    Hook = require("../hook"),

    LabelEvent = require("../events/label"),
    PREvent = require("../events/pullrequest"),

    prHandler = require("../handlers/pullrequest"),
    labelHandler = require("../handlers/label");

class PullRequest {
    constructor({
        pull_request: { number, html_url,
            head: { ref: branch, repo: { name, owner: { login: owner } } },
            base: { ref: target },
            title, mergeable }
    }) {
        this.branch = branch;
        this.target = target;
        this.number = number;
        this.title = title;
        this.repo = {
            name,
            owner
        };
        this.url = html_url,
        this.mergeable = mergeable;
    }
}

const parsePrEvent = trigger =>
    (({
        action,
        label,
        sender: { login }
    }) => {
        const events = [];

        const labelEvent = (...args) => new LabelEvent(trigger, label.name,
            new PullRequest(trigger), login, ...args);

        const prEvent = (...args) => new PREvent(trigger,
            new PullRequest(trigger), login, ...args);

        const eventForAction = {
            labeled: labelEvent,
            unlabeled: () => labelEvent(false),
            opened: prEvent,
            edited: () => prEvent(true)
        };

        const eventBuilder = eventForAction[action];

        if(eventBuilder)
            events.push(eventBuilder());

        return events;
    })(trigger);

module.exports = new Hook([
    prHandler,
    labelHandler
], parsePrEvent, ({ sender, pull_request }) =>
    `${sender.login} triggered a PR event for ${pull_request.head.ref}`);
