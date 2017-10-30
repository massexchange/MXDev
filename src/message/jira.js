const
    JIRA = require("../api/jira"),
    { link } = require("../util/markdown");

return {
    forIssue: issue =>
        `for issue ${link(`${issue.key} - ${issue.fields.summary}`, JIRA.issueUrl(issue))}`
};
