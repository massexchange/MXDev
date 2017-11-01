const GithubEvent = require("./github");

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
module.exports = class ReleaseEvent extends GithubEvent {
    constructor(trigger, id, name, description, startDate, releaseDate, projectId) {
        super(trigger);

        this.id = id;
        this.name = name;
        this.description = description;
        this.dates = {
            start: startDate,
            end: releaseDate
        };
        this.project = { id: projectId };
    }
};
