const
    Hook = require("../hook"),
    ReleaseEvent = require("../events/release"),

    releaseHandler = require("../handlers/release");

const parseReleaseTrigger = trigger =>
    (({ version: {
        id, name, userStartDate, userReleaseDate
    }}) => {
        const events = [];

        events.push(new ReleaseEvent(trigger, id, name, userStartDate, userReleaseDate));

        return events;
    })(trigger);

module.exports = new Hook([releaseHandler], parseReleaseTrigger, ({ version: { name } }) =>
    `Version ${name} was just released!`);
