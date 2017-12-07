const
    nconf = require("nconf"),
    Humanize = require("humanize-plus"),
    Promise = require("bluebird"),

    JIRA = require("../api/jira"),
    Confluence = require("../api/confluence"),
    // JiraApi = require("jira-client"),
    Hipchat = require("../api/hipchat"),

    ReleaseEvent = require("../events/release");

nconf.env("_");

const engineeringSpace = "ENG";

const jiraCreds = nconf.get("JIRA");

const { user: username, pass: password } = jiraCreds;

const jira = new JIRA(jiraCreds);
const confluence = new Confluence({
    username, password
});
// const JIRA = new JiraApi({
//   protocol: "https",
//   host: "jira.somehost.com",
//   username, password,
//   apiVersion: "2",
//   strictSSL: true
// });

const hipchat = new Hipchat(nconf.get("HIPCHAT:ROOM:ANNOUNCEMENTS:TOKEN"));

const handleRelease = async release => {
    console.log("Fetching release issues...");
    const issueP = jira.search(`fixVersion = ${release.name} and project = ${release.project.id}`,
        "summary", "key", "issuetype");

    const projectP = jira.getProject(release.project.id);

    const [{ issues }, { name: projectName }] = await Promise.all([issueP, projectP]);

    release.project.name = projectName;

    console.log(`Found ${issues.length} issues`);

    console.log("Generating release notes...");
    const releaseDuration = release.dates.end.diff(release.dates.start, "days") + 1;
    const issueTypes = processIssues(issues);

    const versionName = `MX${projectName} v${release.name}`;

    const header = releaseHeader(versionName, release, issues.length);
    const summary = releaseSummary(release, issues, issueTypes, releaseDuration);
    const list = issueList(issueTypes);

    const short = shortNotes(header, summary, release.description);

    const notes = releaseNotes(short, list);

    const versionsHome = await confluence.getPage(engineeringSpace, "Versions");
    const versionPage = await confluence.addPage(versionsHome, versionName, notes);

    return hipchat.notify(hipchatNotes(short, versionPage), { room: "announce" });
};

const processIssues = issues =>
    issues.reduce((types, issue) => {
        const type = issue.fields.issuetype.name;
        if(!types[type])
            types[type] = [];

        types[type].push(issue);

        return types;
    }, {});

const format = "MMMM Do";

const releaseHeader = (versionName, { name, project, dates: { start, end } }, numIssues) =>
    `## ${versionName} | ${start.format(format)}-${end.format(format)} | ${numIssues} ${
        Humanize.pluralize(numIssues, "issue")}`;

const shortNotes = (header, summary, description) =>
`${header}

${summary}

${description
? `## Highlights
${description}`
: ""}`;

const hipchatNotes = (shortNotes, versionPage) =>
`${shortNotes}

[See issue list](${versionPage.url})`;

const releaseNotes = (shortNotes, list) =>
`${shortNotes}

## Issues
${list}`;

const issueTypeList = (type, issues) =>
`### ${type}
${issues.map(issue =>
`   - [[${issue.key}](${JIRA.issueUrl(issue)})] ${issue.fields.summary}`).join('\n')}`;

const issueList = issueTypes =>
    Object.keys(issueTypes).map(type =>
        issueTypeList(type, issueTypes[type])).join('\n\n');

const releaseSummary = ({ name, project }, issues, types, days) =>
    `MX${project.name} v${name} has just been released! It took us ${days} ${Humanize.pluralize(days, "day")} and included ${
        Humanize.oxford(Object.keys(types).map(key =>
            `${types[key].length} ${Humanize.pluralize(types[key].length, key)}`))}.`;

module.exports = {
    matches: event => true,
    name: "Release",
    accepts: ReleaseEvent,
    handle: handleRelease
};
