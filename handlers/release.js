const
    nconf = require("nconf"),

    JIRA = require("../api/jira"),
    Hipchat = require("../api/hipchat"),

    ReleaseEvent = require("../events/release");

nconf.env("_");

const jira = new JIRA(nconf.get("JIRA"));

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:DEVELOPMENT:TOKEN"));

const handleRelease = ({ name, dates: { start, end } }) => {
    console.log("Generating release notes...");

    console.log(`MX Version ${name} | ${start}-${end}`);

    return Promise.resolve();
};

const approvalMessage = (user, approval, issue) =>
`${user.name} just approved <a href="${approval.url}">${approval.pullRequest.title}</a>
for issue <a href="${JIRA.issueUrl(issue)}">[${issue.key}] - ${issue.fields.summary}</a>`;

module.exports = {
    matches: event => true,
    name: "Release",
    accepts: ReleaseEvent,
    handle: handleRelease,
    irrelevantMessage: "Was not an approval, too bad."
};
