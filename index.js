"use strict";

/*
    A user does something
    MXDev gets informed and directs to the appropriate TRIGGER
    Depending on the event, it may require an ACTION
*/

const
    nconf = require("nconf"),

    Github = require("./api/github"),

    reviewTrigger = require("./triggers/review"),
    commentTrigger = require("./triggers/comment");

nconf.env("_");

const triggers = {
    review: reviewTrigger,
    comment: commentTrigger
};
var handleGithubWebhook = request => {
    const event = JSON.parse(request.body);

    if(Github.isPingEvent(event))
        return Github.validatePing(event);

    const target = request.resource.split('/')[1];
    const trigger = triggers[target];

    console.log(`Trigger hit: ${target}`);

    return trigger.handle(event);
};

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    handleGithubWebhook(event)
        .then(result =>
            callback(null, result))
        .catch(callback);
};
