const Event = require("../event");

/*
    Represents a comment on an issue

    user: name of the commenter
    body: content of the comment
    issue: issue that was commented on
        - number
        - title
    repo: repository containing the issue
        - name
        - owner
*/
module.exports = class CommentEvent extends Event {
    constructor(trigger, user, body, action, issue, repo, url) {
        super(trigger);

        this.user = user;
        this.body = body;
        this.issue = issue;
        this.action = action;
        this.repo = repo;
        this.url = url;
    }
};
