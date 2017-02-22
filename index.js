const
    nconf = require("nconf"),

    Github = require("./api/github"),

    handleReview = require("./routes/review"),
    handleComment = require("./routes/comment");

nconf.env("_");

const routes = {
    review: handleReview,
    comment: handleComment
};
var handleGithubWebhook = request => {
    const event = JSON.parse(request.body);

    const action = request.resource.split('/')[1];
    const handler = routes[action];

    if(Github.isPingEvent(event))
        return Github.validatePing(event);

    console.log(`Handling: ${action}`);

    return handler(event);
};

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    handleGithubWebhook(event)
        .then(result =>
            callback(null, result))
        .catch(callback);
};
