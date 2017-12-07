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

const jira = new JIRA(nconf.get("JIRA"));

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:DEVELOPMENT:TOKEN"));

const color = {
    true: "green",
    false: "red"
};

const handleTestResult = async ({ installation, issue, repo, user }, testPassed) => {
    console.log("Registering test result...");

    const github = await Github.init(installation);

    const issueBranchP = issue.branch
        ? Promise.resolve(issue.branch)
        : github.findIssueBranch(issue.number, repo)
            .catch(err => console.log(err));

    const githubUser = await github.findUser(user);

    const [jiraUser, issueKey] = await Promise.all([
        jira.findUser(githubUser),
        issueBranchP]);

    const jiraIssue = await jira.lookupIssue(issueKey);

    const newlyPassed = !jiraIssue.testedBy && testPassed;
    const newlyFailed = jiraIssue.testedBy && !testPassed;

    if(newlyPassed)
        await jira.addTester(jiraUser, issueKey);
    else if(newlyFailed) {
        await jira.removeTester(issueKey);

        try {
            await github.removeLabel({ repo, user }, "ready");
        } catch({ message }) {
            if(message == "Label does not exist")
                console.log("PR wasn't labeled that in the first place");
        }
    }

    //only notify if something new happened
    if(!(newlyPassed || newlyFailed)) {
        console.log("Comment did not indicate a change in status");
        return;
    }

    var output = testPassMessage(githubUser, event, testPassed);
    try {
        output += forIssue(issue);
    } catch(e) {
        console.log(`No issue found: ${e}`);
    }

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
