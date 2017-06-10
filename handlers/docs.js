const
    fs = require("fs"),

    nconf = require("nconf"),
    Promise = require("bluebird"),

    Confluence = require("../api/confluence");

nconf.env("_");

const engineeringSpace = "ENG";


// const jiraCreds = nconf.get("JIRA");
const jiraCreds = { user: "mxdev", pass: "burpsnart" };

const { user: username, pass: password } = jiraCreds;

const confluence = new Confluence({
    username, password
});

const sourceControl = "format/Issues";

console.log("Loading doc...");
const content = fs.readFileSync(`../../MXEngineering/${sourceControl}.md`, "UTF-8");

console.log("Fetching home...");
confluence.getPage(engineeringSpace, "MXEngineering")
    .then(docsHome =>
        confluence.addPage(docsHome, sourceControl, content))
    .then(newPage =>
        console.log(`New page URL: ${newPage.url}`));
