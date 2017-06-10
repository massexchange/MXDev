const
    ConfluenceApi = require("confluence-api"),
    marked = require("marked"),

    Promise = require("bluebird");

const confluenceRenderer = new marked.Renderer();

confluenceRenderer.heading = (text, level) =>
    level != 3
        ? `<h${level}>${text}</h${level}>`
        : "";

const markedOptions = {
    renderer: confluenceRenderer,
    gfm: true,
    tables: false,
    breaks: true,
    sanitize: true,
    smartypants: true
};

const parsePage = ({ id, title, body, _links: { base, webui }, version: { number } }) => ({
    id,
    title,
    content: body.storage.value,
    url: base + webui,
    version: number
});

const handleErr = err => {
    const message = JSON.stringify(JSON.parse(err.response.text).message);
    return Promise.reject(new Error(message, err));
};

class Confluence {
    constructor({ username, password }) {
        this.api = Promise.promisifyAll(new ConfluenceApi({
            baseUrl: "https://massexchange.atlassian.net/wiki",
            username, password
        }));
    }
    getPage(space, title) {
        console.log(`Querying Confluence for ${space}/${title}...`);
        return this.api.getContentByPageTitleAsync(space, title)
            .then(({ results }) => {
                const page = parsePage(results[0]);
                page.space = space;
                return page;
            })
            .tap(page =>
                console.log("Got page!"))
            .catch(handleErr);
    }
    addPage(parentPage, title, content) {
        console.log("Converting content...");
        const converted = marked(content, markedOptions);

        return this.getPage(parentPage.space, title)
            .then((page) =>
                this.updatePage(page, converted),
            () =>
                this.createPage(parentPage, title, converted));
    }
    createPage(parentPage, title, content) {
        console.log(`Adding Confluence page ${parentPage.title}/${title}...`);
        return this.api.postContentAsync(parentPage.space, title, content, parentPage.id)
            .then(parsePage)
            .tap(page =>
                console.log("Page created!"))
            .catch(handleErr);
    }
    updatePage({ space, id, version, title }, content) {
        console.log(`Updating Confluence page ${title}...`);
        return this.api.putContentAsync(space, id, 1 + version, title, content)
            .then(parsePage)
            .tap(page =>
                console.log("Page updated!"))
            .catch(handleErr);
    }
}

module.exports = Confluence;
