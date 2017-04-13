const
    Promise = require("bluebird"),
    nconf = require("nconf"),

    Github = require("../api/github"),
    JIRA = require("../api/jira"),
    Hipchat = require("../api/hipchat"),

    CommentEvent = require("../events/comment");

nconf.env("_");

const github = new Github(
    nconf.get("GITHUB:TOKEN"),
    nconf.get("LOSERS"));

const jira = new JIRA(nconf.get("JIRA"));

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:DEVELOPMENT:TOKEN"), true);

const handleTestResult = event => testPassed => {
    if(!testPassed) {
        console.log("Test was a fail, 2bad so sad.");
        return Promise.resolve();
    }

    console.log("Registering test pass...");
    const issueBranchP = github.findIssueBranch(event.issue.number, event.repo)
        .catch(err => console.log(err));

    return github.findUser(event.user)
        .then(githubUser =>
            Promise.all([
                jira.findUsername(githubUser),
                issueBranchP])
            .spread((jiraUsername, issueKey) =>
                jira.addTester(jiraUsername, issueKey)
                    .then(() => jira.lookupIssue(issueKey)))
            .then(jiraIssue => hipchat.notify(
                testPassMessage(githubUser, event, jiraIssue)))
            .then(() =>
                console.log("Done! (Probably)")));
};

const testPassMessage = (user, event, issue) =>
`${user.name} just successfully tested <a href="${event.url}">${event.issue.name}</a>
for issue <a href="${JIRA.issueUrl(issue)}">[${issue.key}] - ${issue.fields.summary}</a>`;

const testResultPattern = /\[Test: (Pass|Fail)\]/;
const testResults = {
    Pass: true,
    Fail: false
};
const parseComment = comment => {
    console.log("Parsing comment...");
    const match = testResultPattern.exec(comment);
    if(!match) {
        console.log("Comment was not related to testing.");
        return Promise.reject();
    }

    return Promise.resolve(testResults[match[1]]);
};

const handler = event => {
    return parseComment(event.body)
        .then(handleTestResult(event));
};

module.exports = {
    matches: event => ["created", "edited"].includes(event.action),
    name: "TestPass",
    accepts: CommentEvent,
    handle: handler,
    irrelevantMessage: "Don't care about comment deletions."
};
