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
    releaseHook = require("./hooks/release"),
    hipchatHook = require("./hooks/hipchat");

nconf.env("_");

const LOG = message => {
    console.log(message);
};

const hooks = {
    review: reviewHook,
    comment: commentHook,
    release: releaseHook,
    hipchat: hipchatHook
};

const handleWebhook = request => {
    LOG("Received webhook!");        //ENV VAR BOOLS OPERATE ON THE
    const trigger = nconf.get("dev") //PRESENCE OF ANY STRING
        ? request.body               //"TRUE" AND "FALSE" WILL BOTH BE TRUE.
        : JSON.parse(request.body);

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
    handleWebhook(event)
        .then(result => {
            console.log("Returning response:");

            const response = {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({
                    result: "success"
                })
            };
            console.log(response);

            callback(null, response);
        }).catch(err => {
            console.log(`Error: ${err}`);
            callback(null, {
                statusCode: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({
                    error: err.message
                })
            });
        });
};
