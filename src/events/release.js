const Event = require("../event");

/*
    Represents a JIRA release
*/
module.exports = class ReleaseEvent extends Event {
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
