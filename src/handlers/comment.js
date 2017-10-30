const
    Promise = require("bluebird"),
    nconf = require("nconf"),

    Github = require("../api/github"),
    JIRA = require("../api/jira"),
    Hipchat = require("../api/hipchat"),

    { link } = require("../util/markdown"),
    { forIssue } = require("../message/jira"),

    CommentEvent = require("../events/comment");

nconf.env("_");

const github = new Github(
    nconf.get("GITHUB:TOKEN"),
    nconf.get("LOSERS"));

const jira = new JIRA(nconf.get("JIRA"));

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:DEVELOPMENT:TOKEN"));

const color = {
    true: "green",
    false: "red"
};

const handleTestResult = async (event, testPassed) => {
    console.log("Registering test result...");

    const issueBranchP = event.issue.branch
        ? Promise.resolve(event.issue.branch)
        : github.findIssueBranch(event.issue.number, event.repo)
            .catch(err => console.log(err));

    const githubUser = await github.findUser(event.user);

    const [jiraUsername, issueKey] = await Promise.all([
        jira.findUsername(githubUser),
        issueBranchP]);

    if(testPassed)
        await jira.addTester(jiraUsername, issueKey);

    const output = testPassMessage(githubUser, event, testPassed);
    try {
        const jiraIssue = await jira.lookupIssue(issueKey);
        output += forIssue(jiraIssue);
    } catch(e) {}

    return hipchat.notify(output, {
        color: color[testPassed]
    });
};

const testPassMessage = ({ name }, { issue, url }, passed) =>
`${name} just ${passed ? "" : "un" }successfully tested ${link(issue.name, url)}`;

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

const handler = async event => {
    try {
        const result = await parseComment(event.body);
        return handleTestResult(event, result);
    } catch(e) {
        //TODO: fix this later. handle different comment cases properly
        return;
    }
};

module.exports = {
    matches: event => ["created", "edited"].includes(event.action),
    name: "Comment",
    accepts: CommentEvent,
    handle: handler,
    irrelevantMessage: "Don't care about comment deletions."
};
