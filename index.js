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
    commentHook = require("./hooks/comment"),
    releaseHook = require("./hooks/release");

nconf.env("_");

const LOG = message => {
    console.log(message);
};

const hooks = {
    review: reviewHook,
    comment: commentHook,
    release: releaseHook
};
var handleGithubWebhook = request => {
    LOG("Received Github webhook!");
    const trigger = JSON.parse(request.body);

    if(Github.isPingEvent(trigger)) {
        LOG("It's a ping, validating...");
        return Github.validatePing(trigger);
    }

    const target = request.resource.split('/')[1];
    const hook = hooks[target];

    LOG(`Hook triggered: ${target}`);

    return hook.trigger(trigger);
};

exports.handler = (event, context, callback) => {
    return handleGithubWebhook(event)
        .then(result =>
            callback(null, result))
        .catch(callback);
};
