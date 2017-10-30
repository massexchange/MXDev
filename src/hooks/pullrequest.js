const
    Hook = require("../hook"),

    LabelEvent = require("../events/label"),
    PREvent = require("../events/label"),

    prHandler = require("../handlers/pullrequest"),
    labelHandler = require("../handlers/label");

const parsePrEvent = trigger =>
    (({
        action,
        label,
        pull_request: { html_url, head: { ref: branch }, title },
        sender: { login },
        repository: { name, owner }
    }) => {
        const events = [];

        if(action == "labeled")
            events.push(new LabelEvent(trigger, label.name, branch, login));
        else if(action == "opened")
            events.push(new PREvent(trigger, {
                branch,
                title,
                url: html_url
            }, login));

        return events;
    })(trigger);

module.exports = new Hook([
    prHandler,
    labelHandler
], parsePrEvent, ({ sender, pull_request }) =>
    `${sender.login} triggered a PR event for ${pull_request.head.ref}`);
