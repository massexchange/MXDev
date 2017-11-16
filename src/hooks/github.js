const
    reviewHook = require("../hooks/review"),
    commentHook = require("../hooks/comment"),
    pullrequestHook = require("../hooks/pullrequest");

const hookByEvent = {
    issue_comment: commentHook,
    pull_request: pullrequestHook,
    pull_request_review: reviewHook
};

module.exports = {
    trigger: (trigger, { "X-GitHub-Event": eventName }) =>
        hookByEvent[eventName].trigger(trigger)
};
