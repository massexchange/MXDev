const Event = require("../event");

/*
    Represents a PR labeling

    label: name of the label
    branch: branch of the PR
    user: name of the labeler
*/
module.exports = class LabelEvent extends Event {
    constructor(trigger, label, branch, user) {
        super(trigger);

        this.label = label;
        this.branch = branch;
        this.user = user;
    }
};
