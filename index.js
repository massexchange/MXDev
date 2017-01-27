const
    request = require("request-promise"),
    GitHubApi = require("github"),
    Hipchatter = require("hipchatter"),
    Promise = require("bluebird"),
    nconf = require("nconf");

nconf.env("_");

const github = new GitHubApi({
    protocol: "https",
    headers: {
        "user-agent": "MXDev"
    },
    Promise: Promise,
    timeout: 5000
});

const hipchat = new Hipchatter(nconf.get("HIPCHAT:TOKEN"));

const isPingEvent = event =>
    event.zen &&
    event.hookid &&
    event.hook;

const pullRequestReviewEvent = "pull_request_review";

const validHookConfig = (pingEvent) =>
    pingEvent.hook.events.some(event =>
        event == pullRequestReviewEvent);

var handleGithubWebhook = event => {
    if(isPingEvent(event)) {
        if(validHookConfig(event))
            return Promise.resolve("Configuration valid!");
        else
            return Promise.reject(new Error(`Webhook configuration is incorrect! Expecting event ${pullRequestReviewEvent}`));
    }

    const issueKey = event.pull_request.head.ref;
    const reviewer = event.sender.login;

    console.log(`${reviewer} reviewed Github PR for ${issueKey}!`);
    if(event.review.state != "approved") {
        console.log("Was not an approval, too bad.");
        return;
    }

    return findGithubUserName(reviewer)
        .then(findJiraUsername)
        .then(addApproverTo(event.pull_request.head.ref))
        .then(lookupJiraIssue)
        .then(notifyHipchat)
        .then(() =>
            console.log("Done! (Probably)"));
};

var findGithubUserName = username => {
    console.log(`Finding Github user name for ${username}...`);
    return github.users.getForUser({
        username
    });
};

var secretSecretJiraCredsShh = nconf.get("JIRA");

var jiraAPI = "https://massexchange.atlassian.net/rest/api/2";

var findJiraUsername = (user) => {
    console.log(`Finding JIRA username for ${user.name}...`);
    return request({
        url: `${jiraAPI}/user/search`,
        qs: {
            username: user.name
        },
        json: true,
        auth: secretSecretJiraCredsShh
    });
};

var addApproverCommand = name => ({
    update: {
        customfield_11204: [{
            add: { name }
        }]
    }});


var addApproverTo = issueKey => users => {
    if(users.length == 0) {
        console.log("No users with that name found! Make sure the user's name in JIRA and Github are the same.");
        return Promise.reject();
    }

    var username = users[0].name;

    console.log(`Adding ${username} as an approver of ${issueKey} on JIRA...`);
    return request.put({
        url: `${jiraAPI}/issue/${issueKey}`,
        json: true,
        auth: secretSecretJiraCredsShh,
        body: addApproverCommand(username)
    }).catch(err => {
        console.log(err);
    }).then(() => issueKey);
};

const lookupJiraIssue = issueKey => {
    console.log(`Looking up ${issueKey} on JIRA...`);
    return request.get({
        url: `${jiraAPI}/issue/${issueKey}`,
        json: true,
        auth: secretSecretJiraCredsShh
    }).catch(err => {
        console.log(err);
    });
};

const hipchatRoom = "Development";
const notifyHipchat = issue => {
    console.log("Notifying Hipchat...");
    return new Promise((resolve, reject) =>
        hipchat.notify(hipchatRoom, {
            message: `I just approved <a href="https://massexchange.atlassian.net/browse/${issue.key}"> [${issue.key}] - ${issue.fields.summary}</a>`,
            color: "green",
            token: nconf.get("HIPCHAT:ROOM:DEVELOPMENT:TOKEN"),
            notify: true
        }, err => {
            if(err)
                reject(err);
            else
                resolve();
        }));
};

exports.handler = (event, context, callback) => {
    handleGithubWebhook(event)
        .then(callback)
        .catch(callback);
};
