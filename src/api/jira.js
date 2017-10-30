"use strict";

const request = require("request-promise");

const jiraAPI = "https://massexchange.atlassian.net/rest/api/2";

const approvedByField = "customfield_11204";
const testedByField = "customfield_11201";

const addApproverCommand = name => ({
    update: {
        [approvedByField]: [{
            add: { name }
        }]
    }});

const addTesterCommand = name => ({
    update: {
        [testedByField]: [{
            set: { name }
        }]
    }});

class JIRA {
    constructor(secretSecretJiraCredsShh) {
        this.creds = secretSecretJiraCredsShh;
    }
    async findUsername(user) {
        console.log(`Finding JIRA username for ${user.name}...`);

        const users = await request({
            url: `${jiraAPI}/user/search`,
            qs: {
                username: user.name
            },
            json: true,
            auth: this.creds
        });

        if(users.length == 0)
            return Promise.reject(
                "No users with that name found! Make sure the user's name in JIRA and Github are the same.");

        return users[0];
    }
    async addApprover({ name }, issueKey) {
        console.log(`Adding ${name} as an approver of ${issueKey} on JIRA...`);

        try {
            await request.put({
                url: `${jiraAPI}/issue/${issueKey}`,
                json: true,
                auth: this.creds,
                body: addApproverCommand(name)
            });
            return issueKey;
        } catch(err) {
            console.log("Issue not found! Check the branch name.");
            return;
        }
    }
    async addTester({ name }, issueKey) {
        console.log(`Setting ${name} as the tester of ${issueKey} on JIRA...`);

        try {
            await request.put({
                url: `${jiraAPI}/issue/${issueKey}`,
                json: true,
                auth: this.creds,
                body: addTesterCommand(name)
            });
            return issueKey;
        } catch(err) {
            throw new Error(err.response.body.errorMessages);
        }
    }
    async lookupIssue(issueKey) {
        console.log(`Looking up ${issueKey} on JIRA...`);

        try {
            const response = await request.get({
                url: `${jiraAPI}/issue/${issueKey}`,
                json: true,
                auth: this.creds
            });
            return response;
        } catch(err) {
            throw new Error(err.response.body.errorMessages);
        }
    }
    static issueUrl(issue) {
        return `https://massexchange.atlassian.net/browse/${issue.key}`;
    }
    search(jql, ...fields) {
        return request.post({
            url: `${jiraAPI}/search`,
            json: true,
            auth: this.creds,
            body: { jql, fields },
            maxResults: 100,
            fieldsByKeys: true
        });
    }
    getProject(id) {
        return request.get({
            url: `${jiraAPI}/project/${id}`,
            json: true,
            auth: this.creds
        });
    }
}

module.exports = JIRA;
