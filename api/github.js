"use strict";

const
    GitHubApi = require("github"),
    Promise = require("bluebird");

const pullRequestReviewEvent = "pull_request_review";

class Github {
    constructor(token, losers) {
        if(!token)
            throw new Error("Github API token must be defined!");

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
    findIssueBranch(issue, { owner, name: repo }) {
        console.log("Looking up issue branch...");

        return this.api.pullRequests.get({
            owner,
            repo,
            number: issue
        }).then(pr => pr.head.ref);
    }
    findUser(username) {
        console.log(`Fetching Github user ${username}...`);

        const loserName = this.losers[username];
        if(loserName)
            return Promise.resolve({ name: loserName });

        return this.api.users.getForUser({ username })
            .catch(err => {
                throw err.status;
            });
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
