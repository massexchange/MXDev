"use strict";

const Hipchatter = require("hipchatter");

const hipchatRoom = "Development";

class Hipchat {
    constructor(token, mock = false) {
        this.api = new Hipchatter();
        this.token = token;
        this.mock = mock;
    }
    notify(message, color) {
        console.log("Notifying Hipchat...");

        if(this.mock)
            return mockNotify(message);

        return new Promise((resolve, reject) =>
            this.api.notify(hipchatRoom, {
                message,
                color: color || "green",
                token: this.token,
                notify: true
            }, err => {
                if(err)
                    reject(err);
                else
                    resolve();
            }));
    }
}

const mockNotify = message => {
    console.log(message);
    return Promise.resolve();
};

module.exports = Hipchat;
