const
    nconf = require("nconf"),
    Promise = require("bluebird"),
    readDirFiles = require("read-dir-files"),

    Confluence = require("../api/confluence"),
    util = require("../util");

nconf.env("_").file("../deploy.env");

const readDir = Promise.promisifyAll(readDirFiles);

const engineeringSpace = "ENG";

const { user: username, pass: password } = nconf.get("JIRA");

const confluence = new Confluence({
    username, password
});

const uploadPageTo = parent => ([fileName, content]) =>
    confluence.addPage(parent, util.stripExtension(fileName), content);

const uploadSectionTo = parent => ([name, elements]) => {
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

    const { normalFiles, index: { content: indexContent } } =
        util.partition(files,
            ([fileName]) =>
                fileName == "README.md",
            "index",
            "normalFiles");

    return confluence.addSectionHomepage(parent, util.capitalize(name), indexContent)
        .then(home => [
            normalFiles.map(uploadPageTo(home)),
            dirs.map(uploadSectionTo(home))
        ]);
};

console.log("Loading docs...");
Promise.join(
    confluence.getPage(engineeringSpace, "Engineering Home"),
    readDir.readAsync("../../MXEngineering/docs", "UTF-8")
).then(([home, docsRoot]) =>
    uploadSectionTo(home)(["docs", docsRoot]));
