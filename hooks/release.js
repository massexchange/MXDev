const
    moment = require("moment"),

    Hook = require("../hook"),
    ReleaseEvent = require("../events/release"),

    releaseHandler = require("../handlers/release");

const format = "DD/MMM/YY";

const parseReleaseTrigger = trigger =>
    (({ version: {
        id, name, userStartDate, userReleaseDate, projectId
    }}) => {
        const events = [];

        events.push(new ReleaseEvent(trigger, id, name,
            moment(userStartDate, format),
            moment(userReleaseDate, format), projectId));

        return events;
    })(trigger);

module.exports = new Hook([releaseHandler], parseReleaseTrigger, ({ version: { name } }) =>
    `Version ${name} was just released!`);
