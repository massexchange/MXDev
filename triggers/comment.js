const
    Trigger = require("../trigger"),

    testPassHandler = require("../handlers/testPass");

module.exports = new Trigger([testPassHandler], ({ comment }) =>
    `Parsing comment ${comment.body}`);
