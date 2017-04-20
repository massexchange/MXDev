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
module.exports = class ReleaseEvent extends Event {
    constructor(trigger, id, name, startDate, releaseDate, projectId) {
        super(trigger);

        this.id = id;
        this.name = name;
        this.dates = {
            start: startDate,
            end: releaseDate
        };
        this.project = { id: projectId };
    }
};
