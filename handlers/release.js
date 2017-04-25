const
    nconf = require("nconf"),
    Humanize = require("humanize-plus"),
    Promise = require("bluebird"),

    JIRA = require("../api/jira"),
    // JiraApi = require("jira-client"),
    Hipchat = require("../api/hipchat"),

    ReleaseEvent = require("../events/release");

nconf.env("_");

const { username, password } = jiraCreds = nconf.get("JIRA");

const jira = new JIRA(jiraCreds);
// const JIRA = new JiraApi({
//   protocol: "https",
//   host: "jira.somehost.com",
//   username, password,
//   apiVersion: "2",
//   strictSSL: true
// });

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:ANNOUNCEMENTS:TOKEN"), true);

const format = "MMMM Do";

const releaseNotes = ({ name, dates: { start, end } }) =>
    `MX Version ${name} | ${start.format(format)}-${end.format(format)}`;

const handleRelease = release => {
    console.log("Fetching release issues...")
    const issueP = jira.search(`fixVersion = ${release.name}`,
        "summary", "key", "issuetype");

    const projectP = jira.getProject(release.project.id);

    return Promise.all([issueP, projectP]).spread(({ issues }, { name: projectName }) => {
            release.project.name = projectName;

            console.log(`Found ${issues.length} issues`);

            console.log("Generating release notes...");
            const notes = releaseNotes(release, issues);

            const releaseDuration = release.dates.end.diff(release.dates.start, "days");

            console.log(notes);

            const issueTypes = processIssues(issues);

            console.log(issueList(issueTypes));

            return hipchat.notify(
                releaseMessage(release, issues, types, releaseDuration), "announce");
        });
};

const processIssues = issues => {
    return issues.reduce((types, issue) => {
        const type = issue.fields.issuetype.name;
        if(!types[type])
            types[type] = [];

        types[type].push(issue);

        return types;
    }, {});
};

const issueTypeList = (type, issues) =>
`### ${type}
${issues.map(issue =>
`   - [${issue.key}] ${issue.fields.summary}`).join('\n')}`;

const issueList = issueTypes =>
    Object.keys(issueTypes).map(type =>
        issueTypeList(type, issueTypes[type])).join('\n\n');

const releaseHeader = ({ name, project }, issues, types, days) =>
    `MX${project.name} v${name} has just been released! It took us ${days} ${Humanize.pluralize(days, "day")} and included ${
        Humanize.oxford(Object.keys(types).map(key =>
            `${types[key]} ${Humanize.pluralize(types[key], key)}`))}.`;

module.exports = {
    matches: event => true,
    name: "Release",
    accepts: ReleaseEvent,
    handle: handleRelease,
    irrelevantMessage: "Was not an approval, too bad."
};
