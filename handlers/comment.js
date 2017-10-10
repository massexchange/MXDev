const
    Promise = require("bluebird"),
    nconf = require("nconf"),

    Github = require("../api/github"),
    JIRA = require("../api/jira"),
    Hipchat = require("../api/hipchat"),

    { link } = require("../util/markdown"),

    CommentEvent = require("../events/comment");

nconf.env("_");

const github = new Github(
    nconf.get("GITHUB:TOKEN"),
    nconf.get("LOSERS"));

const jira = new JIRA(nconf.get("JIRA"));

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:DEVELOPMENT:TOKEN"));

const handleTestResult = event => testPassed => {
    if(!testPassed) {
        console.log("Test was a fail, 2bad so sad.");
        return Promise.resolve();
    }

    console.log("Registering test pass...");
    const issueBranchP = event.issue.branch
        ? Promise.resolve(event.issue.branch)
        : github.findIssueBranch(event.issue.number, event.repo)
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
                testPassMessage(githubUser, event, jiraIssue))));
};

const testPassMessage = (user, event, issue) =>
`${user.name} just successfully tested ${link(event.issue.name, event.url)} for issue ${link(`[${issue.key}] - ${issue.fields.summary}`, JIRA.issueUrl(issue))}`;

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
        .then(handleTestResult(event))
        //TODO: fix this later. handle different comment cases properly
        .catch(() => Promise.resolve());
};

module.exports = {
    matches: event => ["created", "edited"].includes(event.action),
    name: "Comment",
    accepts: CommentEvent,
    handle: handler,
    irrelevantMessage: "Don't care about comment deletions."
};