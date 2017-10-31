const Event = require("../event");

/*
    Represents a PR labeling

    label: name of the label
    branch: branch of the PR
    user: name of the labeler
*/
module.exports = class LabelEvent extends Event {
    constructor(trigger, label, pr, user, isPresent = true) {
        super(trigger);

        this.label = label;
        this.pr = pr;
        this.user = user;
        this.isPresent = isPresent;
    }
};
