const
    Hook = require("../hook"),
    CommentEvent = require("../events/comment"),

    testPassHandler = require("../handlers/testPass");

const parseCommentTrigger = trigger =>
    (({
        comment: { user, body, html_url },
        action,
        issue,
        repository: { name, owner }
    }) => {
        const events = [];

        events.push(new CommentEvent(trigger, user.login, body, action, {
            name: issue.title,
            number: issue.number
        }, {
            name,
            owner: owner.login
        }, html_url));

        return events;
    })(trigger);

module.exports = new Hook([testPassHandler], parseCommentTrigger, ({ comment, issue, action }) =>
    `${comment.user.login} ${action} a comment on [${issue.title}]: ${comment.body}`);
