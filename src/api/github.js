"use strict";

const
    nconf = require("nconf"),
    Promise = require("bluebird"),
    fs = Promise.promisify(require("fs")),

    GitHubApi = require("github"),
    jwt = require("jsonwebtoken");

nconf.env("_")

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
        this.hasAuth = this.requestToken();

        this.losers = losers;
    }
    async requestToken() {
        const cert = await fs.readFileAsync(nconf.get("GITHUB:KEY"));
        const token = jwt.sign({ iss: nconf.get("GITHUB:APPID") },
            cert, {
                algorithm: "RS256",
                expiresIn: "10m"
            });

        this.api.authenticate({
            type: "integration",
            token
        });
    }
    async findIssueBranch(issue, { owner, name: repo }) {
        console.log("Looking up issue branch...");

        await this.hasAuth;

        return this.api.pullRequests.get({
            owner,
            repo,
            number: issue
        }).then(pr => pr.head.ref);
    }
    async findUser(username) {
        console.log(`Fetching Github user ${username}...`);

        await this.hasAuth;

        const loserName = this.losers[username];
        if(loserName)
            return Promise.resolve({ name: loserName });

        return this.api.users.getForUser({ username })
            .catch(err => {
                throw err.status;
            });
    }
    async comment({ repo: { owner, name: repo }, number }, message) {
        console.log(`Commenting on ${owner}/${repo}`);

        await this.hasAuth;

        return this.api.issues.createComment({
            owner, repo, number,
            body: message
        });
    }
    static async validatePing(event) {
        if(isValidHookConfig(event))
            return "Configuration valid!";

        throw new Error(
            `Webhook configuration is incorrect! Expecting event ${pullRequestReviewEvent}`);
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
