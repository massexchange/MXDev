const
    nconf = require("nconf"),

    Github = require("../api/github"),
    JIRA = require("../api/jira"),
    Hipchat = require("../api/hipchat"),

    { link } = require("../util/markdown"),
    { forIssue } = require("../message/jira"),

    ReviewEvent = require("../events/review");

nconf.env("_");

const github = new Github(
    nconf.get("GITHUB:TOKEN"),
    nconf.get("LOSERS"));

const jira = new JIRA(nconf.get("JIRA"));

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:DEVELOPMENT:TOKEN"));

const action = {
    "approved": "approved",
    "changes_requested": "requested changes on"
};

const color = {
    "approved": "green",
    "changes_requested": "red"
};

const handleReview = async event => {
    console.log("Registering review...");

    const githubUser = await github.findUser(event.user);
    const user = await jira.findUsername(githubUser);

    if(event.state == "approved")
        await jira.addApprover(user, event.pullRequest.branch);

    var output = message(githubUser, event);
    try {
        output += forIssue(
            await jira.lookupIssue(event.pullRequest.branch));
    } catch(e) {
        console.log(`No issue found: ${e}`);
    }

    return hipchat.notify(output, { color: color[event.state] });
};

const message = (user, { state, url, pullRequest }) =>
`${user.name} just ${action[state]} ${link(pullRequest.title, url)}`;

module.exports = {
    matches: event => Object.keys(action).includes(event.state),
    name: "Review",
    accepts: ReviewEvent,
    handle: handleReview
};
