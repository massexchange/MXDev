const
    nconf = require("nconf"),

    Github = require("../api/github"),
    JIRA = require("../api/jira"),
    Hipchat = require("../api/hipchat"),

    { link } = require("../util/markdown"),
    { forIssue } = require("../message/jira"),

    LabelEvent = require("../events/label");

nconf.env("_");

const jira = new JIRA(nconf.get("JIRA"));

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:DEVELOPMENT:TOKEN"));

const notReadyBecause = reason =>
    `This PR ${reason}, are you sure its \`ready\`?`;

const notMergable = notReadyBecause("is not mergeable");
const notTested = notReadyBecause("has not been tested");

const readyMessage = ({ name, login }, { title, url }, added = true) =>
`${name || login } just ${added ? "" : "un"}marked ready PR ${link(title, url)}`;

const color = {
    true: "green",
    false: "yellow"
};

/*
    only on label:
        check if the PR has been approved at all (mergeable)
        if not, leave a comment saying it didnt go through
        otherwise,

        transition the jira issue (if it exists) to ready
    only on unlabel:
        transition the jira issue (if it exists) to in review

    report it to hipchat
*/
const handleReady = async ({ label, isPresent, installation, pr, user }) => {
    console.log(`Registering ${label} ${
        isPresent
            ? "addition"
            : "removal"}...`);

    const github = await Github.init(installation);

    const notReady = reason => {
        console.log("PR is not ready, notifying owner");

        return Promise.all([
            github.comment(pr, reason),
            github.removeLabel(pr, "ready")]);
    };

    if(isPresent && !pr.mergeable)
        return notReady(notMergable);

    const githubUser = await github.findUser(user);

    var output = readyMessage(githubUser, pr, isPresent);
    try {
        const issue = await jira.lookupIssue(pr.branch);

        try {
            await jira.transitionIssue(issue,
                isPresent
                    ? "Mark Ready"
                    : "Not Ready");
        } catch (e) {
            console.log(`Error transitioning issue: ${e}`);
            return notReady(notTested);
        }

        output += forIssue(issue);
    } catch(e) {
        console.log(`No issue found: ${e}`);
    }

    return hipchat.notify(output, {
        color: color[isPresent]
    });
};

module.exports = {
    matches: ({ label }) => label == "ready",
    name: "Label",
    accepts: LabelEvent,
    handle: handleReady,
    irrelevantMessage: "Only care about the \"ready\" label"
};
