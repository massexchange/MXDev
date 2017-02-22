const
    Promise = require("bluebird"),
    nconf = require("nconf"),

    Github = require("./github"),
    JIRA = require("./jira"),
    Hipchat = require("./hipchat");

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

    const issueBranchP = github.findIssueBranch(event)
        .catch(err => console.log(err));

    return github.findUser(event.sender.login)
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
`${user.name} just successfully tested <a href="${event.comment.html_url}">${event.issue.title}</a>
for issue <a href="${JIRA.issueUrl(issue)}">[${issue.key}] - ${issue.fields.summary}</a>`;

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

module.exports = event => {
    if(["created", "edited"].indexOf(event.action) < 0) {
        console.log("Don't care about comment deletions.");
        return Promise.resolve();
    }

    return parseComment(event.comment.body)
        .then(handleTestResult(event));
};
