"use strict";

/*
    A user does something which TRIGGERS a HOOK
    The HOOK parses the TRIGGER into EVENT(S)
    HANDLERS are notified and can take ACTION(S)
*/

const
    nconf = require("nconf"),

    Github = require("./api/github"),

    releaseHook = require("./hooks/release"),
    githubHook = require("./hooks/github"),
    hipchatHook = require("./hooks/hipchat");

nconf.env("_");

const LOG = message => {
    console.log(message);
};

const hooks = {
    release: releaseHook,
    github: githubHook,
    hipchat: hipchatHook
};
const handleWebhook = request => {
    LOG("Received webhook!");           //ENV VAR BOOLS OPERATE ON THE
    const trigger = nconf.get("dev")    //PRESENCE OF ANY STRING
        ? request.body                  //"TRUE" AND "FALSE" WILL BOTH BE TRUE.
        : JSON.parse(request.body);

    if(Github.isPingEvent(trigger)) {
        LOG("It's a ping, validating...");
        return Github.validatePing(trigger);
    }

    const target = request.resource.split('/')[1];
    const hook = hooks[target];

    LOG(`Hook triggered: ${target}`);

    return hook.trigger(trigger, request.headers);
};

const buildResponse = (code, body) => ({
    statusCode: code,
    headers: {
        "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
});

exports.handler = async (event, context, callback) => {
    try {
        const result = await handleWebhook(event);
        console.log("Returning response:");

        const response = buildResponse(200, {
            result: "success"
        });

        console.log(response);
        callback(null, response);
    } catch(err) {
        console.log(`Error: ${err}`);
        callback(null, buildResponse(500, {
            error: err.message
        }));
    }
};
