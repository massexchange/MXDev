const
    Hook = require("../hook"),

    CommentEvent = require("../events/comment"),
    ApprovalEvent = require("../events/approval"),

    approvalHandler = require("../handlers/approval"),
    testPassHandler = require("../handlers/testPass");

const parseApprovalTrigger = ({
    review: { user, state, body, html_url },
    pull_request: { head, title },
    repository: { name, owner }
}) => {
    const events = [];

    events.push(new CommentEvent(user.login, body, head.ref, {
        name,
        owner: owner.login
    }));

    events.push(new ApprovalEvent(user.login, {
        branch: head.ref,
        title: title
    }, state, html_url));

    return events;
};

module.exports = new Hook([
    approvalHandler,
    testPassHandler
], parseApprovalTrigger, (sender, pull_request) => `${sender.login} reviewed Github PR for ${pull_request.head.ref}!`);
