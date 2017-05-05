class MarkdownUtil {
    static link(text, url) {
        return `[${text}](${url})`;
    }
}

module.exports = MarkdownUtil;
