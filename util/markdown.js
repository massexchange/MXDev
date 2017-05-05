class MarkdownUtil {
    link(text, url) {
        return `[${text}](${url})`;
    }
}

module.exports = MarkdownUtil;
