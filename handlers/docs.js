const
    nconf = require("nconf"),
    Promise = require("bluebird"),
    readDirFiles = require("read-dir-files"),

    Confluence = require("../api/confluence");

nconf.env("_");

const readDir = Promise.promisifyAll(readDirFiles);

const engineeringSpace = "ENG";

// const jiraCreds = nconf.get("JIRA");
const jiraCreds = { user: "mxdev", pass: "burpsnart" };

const { user: username, pass: password } = jiraCreds;

const confluence = new Confluence({
    username, password
});

const capitalize = word =>
    word[0].toUpperCase() + word.slice(1);

const uploadPageTo = parent => ([name, content]) =>
    confluence.addPage(parent, name, content);

const uploadSectionTo = parent => ([name, elements]) => {
    const homeP = confluence.addSectionHomepage(parent, capitalize(name));

    const { files, dirs } = Object.keys(elements)
        .map(key => [key, elements[key]])
        .reduce((agg, [elementName, content]) => {
            (typeof content == "string"
                ? agg.files
                : agg.dirs
            ).push([elementName, content]);

            return agg;
        }, {
            files: [],
            dirs: []
        });

    return homeP.then(home => [
        files.map(uploadPageTo(home)),
        dirs.map(uploadSectionTo(home))
    ]);
};

console.log("Loading docs...");
Promise.join(
    confluence.getPage(engineeringSpace, "Engineering Home"),
    readDir.readAsync("../../MXEngineering/docs", "UTF-8")
).then(([home, docsRoot]) => {
    // console.log(docsRoot);
    uploadSectionTo(home)(["docs", docsRoot]);

});

// const content = fs.readFileSync(`../../MXEngineering/${sourceControl}.md`, "UTF-8");
//
// console.log("Fetching home...");
// confluence.getPage(engineeringSpace, "MXEngineering")
//     .then(docsHome =>
//         confluence.addPage(docsHome, sourceControl, content))
//     .then(newPage =>
//         console.log(`New page URL: ${newPage.url}`));
