const
    nconf = require("nconf"),

    Github = require("../api/github"),
    JIRA = require("../api/jira"),
    Hipchat = require("../api/hipchat"),

    { link } = require("../util/markdown"),
    { forIssue } = require("../message/jira"),

    PREvent = require("../events/pullrequest");

nconf.env("_");

const jira = new JIRA(nconf.get("JIRA"));

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:DEVELOPMENT:TOKEN"));

const handle = async ({ installation, user, pr, existing }) => {
    const github = await Github.init(installation);

    const githubUser = await github.findUser(user);

    try {
        const issue = await jira.lookupIssue(pr.branch);
        if(!existing) {
            await github.comment(pr, `This PR is ${forIssue(issue)}`);
            return hipchat.notify(
                openMessage(githubUser, pr) +
                forIssue(issue));
        }

        return jira.setFixVersion(pr.target.replace("release/", ""), issue.key);
    } catch(e) {
        console.log(`No issue found: ${e}`);
    }
};

const openMessage = ({ name }, { title, url }) =>
`${name} just opened PR ${link(title, url)}`;

module.exports = {
    matches: event => true,
    name: "PullRequest",
    accepts: PREvent,
    handle,
    irrelevantMessage: "Not a PR event"
};
