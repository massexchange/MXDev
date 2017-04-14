const
    nconf = require("nconf"),

    Github = require("../api/github"),
    JIRA = require("../api/jira"),
    Hipchat = require("../api/hipchat"),

    ReviewEvent = require("../events/review");

nconf.env("_");

const github = new Github(
    nconf.get("GITHUB:TOKEN"),
    nconf.get("LOSERS"));

const jira = new JIRA(nconf.get("JIRA"));

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:DEVELOPMENT:TOKEN"));

const handleApproval = event => {
    console.log("Registering approval...");

    return github.findUser(event.user).then(githubUser =>
        jira.findUsername(githubUser)
            .then(user => jira.addApprover(user, event.pullRequest.branch))
            .then(() => jira.lookupIssue(event.pullRequest.branch))
            .then(issue => hipchat.notify(
                approvalMessage(githubUser, event, issue))))
        .catch(err =>
            console.log(`Error: ${err}`));
};

const approvalMessage = (user, approval, issue) =>
`${user.name} just approved <a href="${approval.url}">${approval.pullRequest.title}</a>
for issue <a href="${JIRA.issueUrl(issue)}">[${issue.key}] - ${issue.fields.summary}</a>`;

module.exports = {
    matches: event => event.state == "approved",
    name: "Approval",
    accepts: ReviewEvent,
    handle: handleApproval,
    irrelevantMessage: "Was not an approval, too bad."
};
