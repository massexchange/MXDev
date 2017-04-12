const
    Trigger = require("../trigger"),

    approvalHandler = require("../handlers/approval"),
    testPassHandler = require("../handlers/testPass");

module.exports = new Trigger([
    approvalHandler,
    testPassHandler
], (sender, pull_request) => `${sender.login} reviewed Github PR for ${pull_request.head.ref}!`);
