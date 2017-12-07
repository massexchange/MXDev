const commonTags = require("common-tags");

const { TemplateTag } = commonTags;

const util = {};

util.capitalize = word =>
    word[0].toUpperCase() + word.slice(1);

util.stripExtension = fileName =>
    fileName.split(".")[0];

util.quoteEscape = new TemplateTag({
    onEndResult(result) {
        return result.replace(/\"/g, '\\"');
    }
});

util.partition = (list, pred, trueField, falseField, singleTrue = true) => {
    const seed = {
        [falseField]: []
    };
    if(!singleTrue)
        seed[trueField] = [];

    return list.reduce((agg, element) => {
        if(pred(element))
            singleTrue
                ? agg[trueField] = element
                : agg[trueField].push(element);
        else
            agg[falseField].push(element);

        return agg;
    }, seed);
};

module.exports = util;
