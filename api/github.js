"use strict";

const
    GitHubApi = require("github"),
    Promise = require("bluebird");

const pullRequestReviewEvent = "pull_request_review";

class Github {
    constructor(token, losers) {
        this.api = new GitHubApi({
            protocol: "https",
            headers: {
                "user-agent": "MXDev"
            },
            Promise: Promise,
            timeout: 5000
        });
        this.api.authenticate({
            type: "token",
            token
        });
        this.losers = losers;
    }
    findIssueBranch(event) {
        console.log("Looking up issue branch...");

        return this.api.pullRequests.get({
            owner: event.repository.owner.login,
            repo: event.repository.name,
            number: event.issue.number
        }).then(pr => pr.head.ref);
    }
    findUser(username) {
        console.log(`Fetching Github user ${username}...`);

        const loserName = this.losers[username];
        if(loserName)
            return Promise.resolve({ name: loserName });

        return this.api.users.getForUser({ username })
            .catch(err => Promise.reject(err.status));
    }
    static validatePing(event) {
        if(isValidHookConfig(event))
            return Promise.resolve("Configuration valid!");

        return Promise.reject(new Error(
            `Webhook configuration is incorrect! Expecting event ${pullRequestReviewEvent}`));
    }
    static isPingEvent(event) {
        return event.zen &&
            event.hookid &&
            event.hook;
    }
}

const isValidHookConfig = pingEvent =>
    pingEvent.hook.events.some(event =>
        event == pullRequestReviewEvent);

module.exports = Github;
