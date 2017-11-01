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

        const eventForAction = {
            labeled: labelEvent,
            unlabeled: () => labelEvent(false),
            opened: (...args) => new PREvent(trigger, {
                branch,
                number,
                title,
                url: html_url,
                mergeable
            }, login, ...args)
        };

        events.push(eventForAction[action]());

        return events;
    })(trigger);

module.exports = new Hook([
    prHandler,
    labelHandler
], parsePrEvent, ({ sender, pull_request }) =>
    `${sender.login} triggered a PR event for ${pull_request.head.ref}`);
