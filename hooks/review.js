const
    Hook = require("../hook"),

    CommentEvent = require("../events/comment"),
    ReviewEvent = require("../events/review"),

    approvalHandler = require("../handlers/approval"),
    commentHandler = require("../handlers/comment");

const parseReviewTrigger = trigger =>
    (({
        action,
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

        if(action == "submitted")
            events.push(new ReviewEvent(trigger, user.login, {
                branch: head.ref,
                title: title
            }, state, html_url));

        return events;
    })(trigger);

module.exports = new Hook([
    approvalHandler,
    commentHandler
], parseReviewTrigger, ({ sender, pull_request }) =>
    `${sender.login} reviewed Github PR for ${pull_request.head.ref}`);
