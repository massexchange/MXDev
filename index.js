"use strict";

/*
    A user does something which TRIGGERS a HOOK
    The HOOK parses the TRIGGER into EVENT(S)
    HANDLERS are notified and can take ACTION(S)
*/

const
    nconf = require("nconf"),

    Github = require("./api/github"),

    reviewHook = require("./hooks/review"),
    commentHook = require("./hooks/comment");

nconf.env("_");

const hooks = {
    review: reviewHook,
    comment: commentHook
};
var handleGithubWebhook = request => {
    const trigger = JSON.parse(request.body);

    if(Github.isPingEvent(trigger))
        return Github.validatePing(trigger);

    const target = request.resource.split('/')[1];
    const hook = hooks[target];

    console.log(`Hook triggered: ${target}`);

    return hook.handle(trigger);
};

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    handleGithubWebhook(event)
        .then(result =>
            callback(null, result))
        .catch(callback);
};
