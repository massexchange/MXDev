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
github.authenticate({
    type: "token",
    token: nconf.get("GITHUB:TOKEN")
});

const hipchat = new Hipchatter();

const isPingEvent = event =>
    event.zen &&
    event.hookid &&
    event.hook;

const pullRequestReviewEvent = "pull_request_review";

const validHookConfig = (pingEvent) =>
    pingEvent.hook.events.some(event =>
        event == pullRequestReviewEvent);


const handlePing = event => {
    if(validHookConfig(event))
        return Promise.resolve("Configuration valid!");
    else
        return Promise.reject(new Error(
            `Webhook configuration is incorrect! Expecting event ${pullRequestReviewEvent}`));
};

const handleReview = event => {
    const issueKey = event.pull_request.head.ref;
    const reviewer = event.sender.login;

    console.log(`${reviewer} reviewed Github PR for ${issueKey}!`);
    if(event.review.state != "approved")
        return Promise.resolve("Was not an approval, too bad.");

    return handleApproval(event);
};

const handleApproval = event =>
    findGithubUserName(event.sender.login).then(user =>
        findJiraUsername(user)
            .then(addApproverTo(event.pull_request.head.ref))
            .then(lookupJiraIssue)
            .then(notifyHipchatofApproval(user, event))
            .then(() =>
                console.log("Done! (Probably)")));


const approvalMessage = (user, approval, issue) =>
`${user.name} just approved <a href="${approval.review.html_url}">${approval.pull_request.title}</a>
for issue <a href="${issueUrl(issue)}">[${issue.key}] - ${issue.fields.summary}</a>`;

const notifyHipchatofApproval = (user, event) => issue =>
    notifyHipchat(approvalMessage(user, event, issue));

const testPassMessage = (user, event, issue) =>
`${user.name} just successfully tested <a href="${event.comment.html_url}">${event.issue.title}</a>
for issue <a href="${issueUrl(issue)}">[${issue.key}] - ${issue.fields.summary}</a>`;

const notifyHipchatofTestPass = (user, event) => issue =>
    notifyHipchat(testPassMessage(user, event, issue));

const findIssueBranch = event =>
    github.pullRequests.get({
        owner: event.repository.owner.login,
        repo: event.repository.name,
        number: event.issue.number
    }).then(pr => pr.head.ref);

const handleTestResult = event => testPassed => {
    if(!testPassed)
        return Promise.resolve("Test was a fail, 2bad so sad.");

    const issueBranchP = findIssueBranch(event.issue.number)
        .catch(err => console.log(err));

    return findGithubUserName(event.sender.login)
        .then(findJiraUsername)
        .then(user =>
            issueBranchP
                .then(addTester(user))
                .then(lookupJiraIssue)
                .then(notifyHipchatofTestPass(user, event))
                .then(() =>
                    console.log("Done! (Probably)")));
};

const testResultPattern = /\[Test: (Pass|Fail)\]/;
const testResults = {
    Pass: true,
    Fail: false
};
const parseComment = comment => {
    console.log(`Parsing comment ${comment}`);
    const match = testResultPattern.exec(comment);
    if(!match) {
        console.log("Comment was not related to testing.");
        return Promise.reject();
    }

    return Promise.resolve(testResults[match[1]]);
};

const handleComment = event => {
    if(["created", "edited"].indexOf(event.action) < 0) {
        console.log("Don't care about comment deletions.");
        return Promise.resolve();
    }

    return parseComment(event.comment.body)
        .then(handleTestResult(event));
};

const routes = {
    review: handleReview,
    comment: handleComment
};
var handleGithubWebhook = request => {
    const event = JSON.parse(request.body);

    const action = request.resource.split('/')[1];
    const handler = routes[action];

    if(isPingEvent(event))
        return handlePing(event);

    console.log(`Handling: ${action}`);

    return handler(event);
};

const losers = nconf.get("LOSERS");

var findGithubUserName = username => {
    console.log(`Finding Github user name for ${username}...`);
    const loserName = losers[username];
    if(loserName)
        return Promise.resolve({ name: loserName });

    return github.users.getForUser({ username })
        .catch(err => Promise.reject(err.status));
};

var secretSecretJiraCredsShh = nconf.get("JIRA");
var jiraAPI = "https://massexchange.atlassian.net/rest/api/2";

var findJiraUsername = user => {
    console.log(`Finding JIRA username for ${user.name}...`);
    return request({
        url: `${jiraAPI}/user/search`,
        qs: {
            username: user.name
        },
        json: true,
        auth: secretSecretJiraCredsShh
    }).then(users => {
        if(users.length == 0)
            return Promise.reject(
                "No users with that name found! Make sure the user's name in JIRA and Github are the same.");

        return users[0];
    });
};

var approvedByField = "customfield_11204";
var addApproverCommand = name => ({
    update: {
        [approvedByField]: [{
            add: { name }
        }]
    }});
var addApproverTo = issueKey => user => {
    var username = user.name;

    console.log(`Adding ${username} as an approver of ${issueKey} on JIRA...`);
    return request.put({
        url: `${jiraAPI}/issue/${issueKey}`,
        json: true,
        auth: secretSecretJiraCredsShh,
        body: addApproverCommand(username)
    }).catch(err =>
        Promise.reject(err.response.body.errorMessages)
    ).then(() => issueKey);
};

var testedByField = "customfield_11201";
var addTesterCommand = name => ({
    update: {
        [testedByField]: [{
            set: { name }
        }]
    }});

var addTester = user => issueKey => {
    var username = user.name;

    console.log(`Setting ${username} as the tester of ${issueKey} on JIRA...`);
    return request.put({
        url: `${jiraAPI}/issue/${issueKey}`,
        json: true,
        auth: secretSecretJiraCredsShh,
        body: addTesterCommand(username)
    }).catch(err =>
        Promise.reject(err.response.body.errorMessages)
    ).then(() => issueKey);
};

const issueUrl = issue =>
    `https://massexchange.atlassian.net/browse/${issue.key}`;

const lookupJiraIssue = issueKey => {
    console.log(`Looking up ${issueKey} on JIRA...`);
    return request.get({
        url: `${jiraAPI}/issue/${issueKey}`,
        json: true,
        auth: secretSecretJiraCredsShh
    }).catch(err =>
        Promise.reject(err.response.body.errorMessages));
};

const hipchatRoom = "Development";

const notifyHipchat = message => {
    console.log("Notifying Hipchat...");

    return new Promise((resolve, reject) =>
        hipchat.notify(hipchatRoom, {
            message,
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
    console.log(JSON.stringify(context));
    console.log(JSON.stringify(event));
    handleGithubWebhook(event)
        .then(result =>
            callback(null, result))
        .catch(callback);
};
