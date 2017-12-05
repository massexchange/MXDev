const
    Hook = require("../hook"),

    LabelEvent = require("../events/label"),
    PREvent = require("../events/pullrequest"),

    prHandler = require("../handlers/pullrequest"),
    labelHandler = require("../handlers/label");

const parsePrEvent = trigger =>
    (({
        action,
        label,
        pull_request: { number, html_url,
            head: { ref: branch, repo: { name: repoName, owner: { login: owner } } },
            base: { ref: target },
            title, mergeable },
        sender: { login }
    }) => {
        const events = [];

        const labelEvent = (...args) => new LabelEvent(trigger, label.name, {
            branch, number, mergeable, title,
            url: html_url,
            repo: {
                name: repoName,
                owner
            }
        }, login, ...args);

        const prEvent = (...args) => new PREvent(trigger, {
            branch,
            target,
            number,
            title,
            url: html_url,
            mergeable
        }, login, ...args);

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
