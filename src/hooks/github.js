const
    Hook = require("../hook"),
    CommentEvent = require("../events/comment"),

    reviewHook = require("./hooks/review"),
    commentHook = require("./hooks/comment"),
    pullrequestHook = require("./hooks/pullrequest"),

    commentHandler = require("../handlers/comment");

const thing = {
    review: reviewHook,
    comment: commentHook,
    pullrequest: pullrequestHook
};

const parseGithub = trigger =>
    (({
        action
    }) => {

    })(trigger);

module.exports = new Hook([commentHandler], parseGithub, ({ comment, issue, action }) =>
    `${comment.user.login} ${action} a comment on [${issue.title}]: ${comment.body}`);
