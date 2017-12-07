const GithubEvent = require("./github");

/*
    Represents a PR labeling

    label: name of the label
    branch: branch of the PR
    user: name of the labeler
*/
module.exports = class PREvent extends GithubEvent {
    constructor(trigger, pr, user, existing = false) {
        super(trigger);

        this.pr = pr;
        this.user = user;
        this.existing = existing;
    }
};
