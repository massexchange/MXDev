const
    url = require("url"),

    ConfluenceApi = require("confluence-api"),
    marked = require("marked"),
    commonTags = require("common-tags"),

    Promise = require("bluebird");

const confluenceRenderer = new marked.Renderer();

confluenceRenderer.heading = (text, level) =>
    level != 3
        ? `<h${level}>${text}</h${level}>`
        : "";

confluenceRenderer.link = (href, title, text) => {
    const path = url.parse(href).pathname.split("/");
    const pageName = path[path.length - 1];

    return `<a href="${pageName}" alt="${title}">${text}</a>`;
};

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

const { TemplateTag, oneLineTrim } = commonTags;

const quoteEscape = new TemplateTag({
    onEndResult(result) {
        return result.replace(/\"/g, '\\"');
    }
});

const childrenMacro = oneLineTrim`
    <ac:structured-macro ac:name="children" ac:schema-version="2" ac:macro-id="2c6d0117-f35c-446b-93db-15fcc5bc5012">
        <ac:parameter ac:name="all">
            true
        </ac:parameter>
    </ac:structured-macro>`;

class Confluence {
    constructor({ username, password }) {
        this.api = Promise.promisifyAll(new ConfluenceApi({
            baseUrl: "https://massexchange.atlassian.net/wiki",
            username, password
        }));
    }
    getPage(space, title) {
        console.log(`Querying for page ${title} in ${space}...`);

        if(typeof space == "undefined")
            throw new Error("Space cannot be enpty!");

        return this.api.getContentByPageTitleAsync(space, title)
            .then(({ results }) => {
                const page = parsePage(results[0]);
                page.space = space;
                return page;
            })
            // .tap(page =>
            //     console.log("Got page!"))
            .catch(handleErr);
    }
    addPage(parentPage, title, content, convert = true) {
        const pageP = this.getPage(parentPage.space, title);

        // console.log("Converting content...");
        const pageContent = convert
            ? marked(content, markedOptions)
            : content;

        return pageP
            .then((page) =>
                this.updatePage(parentPage, page, pageContent),
            () =>
                this.createPage(parentPage, title, pageContent));
    }
    addSectionHomepage(parentPage, title) {
        return this.addPage(parentPage, title, childrenMacro, false);
    }
    createPage(parentPage, title, content) {
        console.log(`Creating page ${parentPage.title}/${title}...`);

        return this.api.postContentAsync(parentPage.space, title, content, parentPage.id)
            .then(parsePage)
            .then(page => {
                page.space = parentPage.space;
                return page;
            })
            // .tap(page =>
            //     console.log("Page created!"))
            .catch(handleErr);
    }
    updatePage(parentPage, { space, id, version, title }, content) {
        console.log(`Updating page ${parentPage.title}/${title}...`);

        return this.api.putContentAsync(space, id, 1 + version, title, content)
            .then(parsePage)
            .then(page => {
                page.space = space;
                return page;
            })
            // .tap(page =>
            //     console.log("Page updated!"))
            .catch(handleErr);
    }
}

module.exports = Confluence;
