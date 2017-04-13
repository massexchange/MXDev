const
    Hook = require("../hook"),
    CommentEvent = require("../events/comment"),

    testPassHandler = require("../handlers/testPass");

const parseCommentTrigger = ({
    comment: { user, body },
    action,
    issue,
    repository: { name, owner }
}) => {
    const events = [];

    events.push(new CommentEvent(user.login, body, action, issue.number, {
        name,
        owner: owner.login
    }));

    return events;
};

module.exports = new Hook([testPassHandler], parseCommentTrigger, ({ comment }) =>
    `Parsing comment ${comment.body}`);
