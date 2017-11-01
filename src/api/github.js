"use strict";

const
    nconf = require("nconf"),
    Promise = require("bluebird"),
    fs = Promise.promisifyAll(require("fs")),

    GitHubApi = require("github"),
    jwt = require("jsonwebtoken");

nconf.env("_");

const pullRequestReviewEvent = "pull_request_review";

class Github {
    constructor(installationId) {
        this.api = new GitHubApi({
            protocol: "https",
            headers: {
                "user-agent": "MXDev"
            },
            Promise: Promise,
            timeout: 5000
        });
        this.hasAuth = this.requestToken(installationId);

        this.losers = nconf.get("LOSERS");
    }
    async requestToken(id) {
        const cert = await fs.readFileAsync(nconf.get("GITHUB:KEY"));
        const token = jwt.sign({ iss: parseInt(nconf.get("GITHUB:APPID")) },
            cert, {
                algorithm: "RS256",
                expiresIn: "10m"
            });

        this.api.authenticate({
            type: "integration",
            token
        });

        const { data: { token: installationToken } } = await this.api.apps.createInstallationToken({
            installation_id: id
        });

        this.api.authenticate({
            type: "token",
            token: installationToken
        });

        console.log("Authenticated with Github API");
    }
    async findIssueBranch(issue, { owner, name: repo }) {
        console.log("Looking up issue branch...");

        const { data: { head: { ref } } } = await this.api.pullRequests.get({
            owner,
            repo,
            number: issue
        });

        return ref;
    }
    async findUser(username) {
        console.log(`Fetching Github user ${username}...`);

        const loserName = this.losers[username];
        if(loserName)
            return { name: loserName };

        try {
            const { data } = await this.api.users.getForUser({ username });
            return data;
        } catch(err) {
            throw new Error(err.status);
        }
    }
    async comment({ repo: { owner, name: repo }, number }, message) {
        console.log(`Commenting on ${owner}/${repo}`);

        const { data } = await this.api.issues.createComment({
            owner, repo, number,
            body: message
        });

        return data;
    }
}

const isValidHookConfig = ({ hook }) =>
    hook.events.some(event =>
        event == pullRequestReviewEvent);

const instances = {};
module.exports = class {
    static async validatePing(event) {
        if(isValidHookConfig(event))
            return "Configuration valid!";

        throw new Error(
            `Webhook configuration is incorrect! Expecting event ${pullRequestReviewEvent}`);
    }
    static isPingEvent({ zen, hookid, hook }) {
        return zen &&
            hookid &&
            hook;
    }
    static async init(installationId) {
        if(instances[installationId])
            return instances[installationId];

        const instance = instances[installationId] = new Github(installationId);
        await instance.hasAuth;

        return instance;
    }
};
