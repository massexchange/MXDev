const
    Hook = require("../hook"),

    CommentEvent = require("../events/comment"),
    ReviewEvent = require("../events/review"),

    approvalHandler = require("../handlers/approval"),
    testPassHandler = require("../handlers/testPass");

const parseReviewTrigger = trigger =>
    (({
        review: { user, state, body, html_url },
        pull_request: { head, title },
        repository: { name, owner }
    }) => {
        const events = [];

        events.push(new CommentEvent(trigger, user.login, body, "created", {
            name: title,
            branch: head.ref
        }, {
            name,
            owner: owner.login
        }, html_url));

        events.push(new ReviewEvent(trigger, user.login, {
            branch: head.ref,
            title: title
        }, state, html_url));

        return events;
    })(trigger);

module.exports = new Hook([
    approvalHandler,
    testPassHandler
], parseReviewTrigger, ({ sender, pull_request }) =>
    `${sender.login} reviewed Github PR for ${pull_request.head.ref}`);
