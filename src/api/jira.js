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

const removeTesterCommand = () => ({
    update: {
        [testedByField]: [{
            set: {}
        }]
    }});

class User {
    constructor({ name, emailAddress, displayName }) {
        this.username = name;
        this.email = emailAddress;
        this.name = displayName;
    }
}

class Comment {
    constructor({ id, author, body, created }) {
        this.id = id;
        this.author = new User(author);
        this.body = body;
        this.created = created;
    }
}

class Issue {
    constructor({ id, key, fields }) {
        const { status, description, summary, creator, reporter, comment: { comments = [] } } = fields;

        this.id = id;
        this.key = key;

        this.approvedBy = (fields[approvedByField] || []).map(user =>
            new User(user));

        if(fields[testedByField])
            this.testedBy = new User(fields[testedByField]);

        this.creator = new User(creator);
        this.reporter = new User(reporter);

        this.status = status.name;

        this.description = description;
        this.summary = summary;

        this.comments = comments.map(comment =>
            new Comment(comment));
    }
}

class JIRA {
    constructor(secretSecretJiraCredsShh) {
        this.creds = secretSecretJiraCredsShh;
    }
    async findUser({ name }) {
        console.log(`Finding JIRA username for ${name}...`);

        const users = await request({
            url: `${jiraAPI}/user/search`,
            qs: {
                username: name
            },
            json: true,
            auth: this.creds
        });

        if(users.length == 0)
            return Promise.reject(
                "No users with that name found! Make sure the user's name in JIRA and Github are the same.");

        return new User(users[0]);
    }
    async addApprover({ name, username }, issueKey) {
        console.log(`Adding ${name} as an approver of ${issueKey} on JIRA...`);

        try {
            await request.put({
                url: `${jiraAPI}/issue/${issueKey}`,
                json: true,
                auth: this.creds,
                body: addApproverCommand(username)
            });
            return issueKey;
        } catch(err) {
            console.log("Issue not found! Check the branch name.");
            return;
        }
    }
    async addTester({ name, username }, issueKey) {
        console.log(`Setting ${name} as the tester of ${issueKey} on JIRA...`);

        try {
            await request.put({
                url: `${jiraAPI}/issue/${issueKey}`,
                json: true,
                auth: this.creds,
                body: addTesterCommand(username)
            });
            return issueKey;
        } catch(err) {
            throw new Error(err);
        }
    }
    async removeTester(issueKey) {
        console.log(`Removing tester of ${issueKey} on JIRA...`);

        try {
            await request.put({
                url: `${jiraAPI}/issue/${issueKey}`,
                json: true,
                auth: this.creds,
                body: removeTesterCommand()
            });
            return issueKey;
        } catch(err) {
            throw new Error(err);
        }
    }
    async lookupIssue(issueKey) {
        console.log(`Looking up ${issueKey} on JIRA...`);

        try {
            return new Issue(await request.get({
                url: `${jiraAPI}/issue/${issueKey}`,
                json: true,
                auth: this.creds
            }));
        } catch(err) {
            throw new Error(err);
        }
    }
    async getTransitions({ key }) {
        try {
            return await request.get({
                url: `${jiraAPI}/issue/${key}/transitions`,
                json: true,
                auth: this.creds
            });
        } catch(err) {
            throw new Error(err);
        }
    }
    async transitionIssue(issue, target) {
        console.log(`Triggering transition "${target}" on ${issue.key}...`);

        try {
            const { transitions } = await this.getTransitions(issue);

            const targetTransition = transitions
                .filter(({ name }) => name == target)[0];

            if(!targetTransition)
                throw new Error(
                    `Transition ${target} not available for issue ${issue.key}`);

            return await request.post({
                url: `${jiraAPI}/issue/${issue.key}/transitions`,
                json: true,
                auth: this.creds,
                body: { transition: {
                    id: targetTransition.id } }
            });
        } catch(err) {
            throw new Error(err);
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
