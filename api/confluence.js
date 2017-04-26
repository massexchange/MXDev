const
    m2c = require("markdown2confluence-cws"),
    ConfluenceApi = require("confluence-api"),

    Promise = require("bluebird");

const engineeringSpace = "ENG";

const parsePage = ({ id, space: { key }, title, body, _links: { base, webui } }) => ({
    id,
    space: key,
    title,
    content: body.storage.value,
    url: base + webui
});

// console.log("Converting...");
// const converted = m2c(input, {
//     linkRewrite: href => {
//         return href;
//     },
// });
//
// console.log(converted);
//
// console.log("Done!");

const handleErr = err => {
    const message = JSON.stringify(JSON.parse(err.response.text).message);
    return Promise.reject(new Error(message, err));
};

return class Confluence {
    constructor({ username, password }) {
        this.api = Promise.promisifyAll(new ConfluenceApi({
            baseUrl: "https://massexchange.atlassian.net/wiki",
            username, password
        }));
    }
    getPage(space, title) {
        return this.api.getContentByPageTitle(space, title)
            .then(({ results }) =>
                parsePage(results[0]))
            .catch(handleErr);
    }
    addPage(parentPage, title, content) {
        return this.api.postContent(parentPage.space, title, content, parentPage.id)
            .then(parsePage)
            .catch(handleErr);
    }
};
