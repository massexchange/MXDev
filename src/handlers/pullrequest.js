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

const handle = async event => {
    const github = await Github.init(event.installation);

    const githubUser = await github.findUser(event.user);

    var output = openMessage(githubUser, event.pr);
    try {
        const issue = await jira.lookupIssue(event.pr.branch);
        output += forIssue(issue);
    } catch(e) {
        console.log(`No issue found: ${e}`);
    }

    return hipchat.notify(output);
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
