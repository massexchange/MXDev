const
    JIRA = require("../api/jira"),
    { link } = require("../util/markdown");

module.exports = {
    forIssue: issue =>
        ` for issue ${link(`${issue.key} - ${issue.fields.summary}`, JIRA.issueUrl(issue))}`
};
