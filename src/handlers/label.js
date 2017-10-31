const
    nconf = require("nconf"),

    Github = require("../api/github"),
    JIRA = require("../api/jira"),
    Hipchat = require("../api/hipchat"),

    { link } = require("../util/markdown"),
    { forIssue } = require("../message/jira"),

    LabelEvent = require("../events/label");

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

const notMergable = "This PR is not mergeable, are you sure its `ready`?"

/*
    for now, only handling ready labelings

    on label: check if the PR has been approved at all (mergeable)
    if not, leave a comment saying it didnt go through

    otherwise, transition the jira issue (if it exists)
    to ready, and report it to hipchat
*/
const handle = async event => {
    console.log("Registering labeling...");

    if(!event.pr.mergable) {
        console.log("PR is not mergable, notifying owner");
        return github.comment(event.pr, notMergable);
    }

    const githubUser = await github.findUser(event.user);
    const jiraUsername = await jira.findUsername(githubUser);

    var output = readyMessage(githubUser, event);
    try {
        const issue = await jira.lookupIssue(event.pr.branch);
        await jira.transitionIssue(issue, "Mark Ready");

        output += forIssue(issue);
    } catch(e) {
        console.log(`No issue found: ${e}`);
    }

    return hipchat.notify(output);
};

const readyMessage = ({ name }, { branch, url }) =>
`${name} just marked ${link(branch, url)} ready`;

module.exports = {
    matches: ({ isPresent, name }) => isPresent && name == "ready",
    name: "Label",
    accepts: LabelEvent,
    handle,
    irrelevantMessage: "Only care about \"ready\" labelings"
};
