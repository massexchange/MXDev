const Event = require("../event");

/*
    Represents a PR review

    user: name of the reviewer
    body: content of the comment
    issue: issue that was commented on
        - number
        - title
    repo: repository containing the issue
        - name
        - owner
*/
module.exports = class ReviewEvent extends Event {
    constructor(user, pullRequest, state, url) {
        this.user = user;
        this.pullRequest = pullRequest;
        this.state = state;
        this.url = url;
    }
};
