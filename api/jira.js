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
    findUsername(user) {
        console.log(`Finding JIRA username for ${user.name}...`);

        return request({
            url: `${jiraAPI}/user/search`,
            qs: {
                username: user.name
            },
            json: true,
            auth: this.creds
        }).then(users => {
            if(users.length == 0)
                return Promise.reject(
                    "No users with that name found! Make sure the user's name in JIRA and Github are the same.");

            return users[0];
        });
    }
    addApprover(user, issueKey) {
        console.log(`Adding ${user.name} as an approver of ${issueKey} on JIRA...`);

        return request.put({
            url: `${jiraAPI}/issue/${issueKey}`,
            json: true,
            auth: this.creds,
            body: addApproverCommand(user.name)
        }).catch(err =>
            Promise.reject(err.response.body.errorMessages)
        ).then(() => issueKey);
    }
    addTester(user, issueKey) {
        console.log(`Setting ${user.name} as the tester of ${issueKey} on JIRA...`);

        return request.put({
            url: `${jiraAPI}/issue/${issueKey}`,
            json: true,
            auth: this.creds,
            body: addTesterCommand(user.name)
        }).catch(err =>
            Promise.reject(err.response.body.errorMessages)
        ).then(() => issueKey);
    }
    lookupIssue(issueKey) {
        console.log(`Looking up ${issueKey} on JIRA...`);

        return request.get({
            url: `${jiraAPI}/issue/${issueKey}`,
            json: true,
            auth: this.creds
        }).catch(err =>
            Promise.reject(err.response.body.errorMessages));
    }
    static issueUrl(issue) {
        return `https://massexchange.atlassian.net/browse/${issue.key}`;
    }
}

module.exports = JIRA;
