const
    Promise = require("bluebird"),
    nconf = require("nconf"),

    Github = require("../api/github"),
    JIRA = require("../api/jira"),
    Hipchat = require("../api/hipchat");

nconf.env("_");

const github = new Github(
    nconf.get("GITHUB:TOKEN"),
    nconf.get("LOSERS"));

const jira = new JIRA(nconf.get("JIRA"));

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:DEVELOPMENT:TOKEN"));

const handleApproval = event =>
    github.findUser(event.sender.login).then(githubUser =>
        jira.findUsername(githubUser)
            .then(user => jira.addApprover(user, event.pull_request.head.ref))
            .then(() => jira.lookupIssue(event.pull_request.head.ref))
            .then(issue => hipchat.notify(
                approvalMessage(githubUser, event, issue)))
            .then(() =>
                console.log("Done! (Probably)")));

const approvalMessage = (user, approval, issue) =>
`${user.name} just approved <a href="${approval.review.html_url}">${approval.pull_request.title}</a>
for issue <a href="${JIRA.issueUrl(issue)}">[${issue.key}] - ${issue.fields.summary}</a>`;

module.exports = event => {
    console.log(`${event.sender.login} reviewed Github PR for ${event.pull_request.head.ref}!`);

    if(event.review.state != "approved") {
        console.log("Was not an approval, too bad.");
        return Promise.resolve();
    }

    return handleApproval(event);
};
