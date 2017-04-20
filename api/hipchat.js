"use strict";

const Hipchatter = require("hipchatter");

const rooms = {
    dev: "Development",
    announce: "Announcements"
};

class Hipchat {
    constructor(token, mock = false) {
        this.api = new Hipchatter();
        this.token = token;
        this.mock = mock;
    }
    notify(message, color, room = "dev") {
        console.log("Notifying Hipchat...");

        const roomName = rooms[room];

        if(this.mock)
            return mockNotify(message, roomName);

        return new Promise((resolve, reject) =>
            this.api.notify(roomName, {
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

const divider = "-------------------------------";

const mockNotify = (message, room) => {
    console.log(`To room ${room}:
${divider}
${message}
${divider}`);
    return Promise.resolve();
};

module.exports = Hipchat;
