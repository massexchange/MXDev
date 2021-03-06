"use strict";

const
    Hipchatter = require("hipchatter"),
    marked = require("marked"),

    nconf = require("nconf");

const rooms = {
    dev: "Development",
    announce: "Announcements",
    MXControl: "MXControl"
};

const hipchatRenderer = new marked.Renderer();

hipchatRenderer.heading = (text, level) =>
    `<strong>${text}</strong>

`;

const markedOptions = {
    renderer: hipchatRenderer,
    gfm: true,
    tables: false,
    breaks: true,
    sanitize: true,
    smartypants: true
};

class Hipchat {
    constructor(token) {
        this.api = new Hipchatter();
        this.token = token;
        this.mock = nconf.get("HIPCHAT:DEBUG");
    }
    notify(message, { color = "green", room = "dev" } = {}) {
        console.log("Notifying Hipchat...");

        const roomName = rooms[room];

        const renderedMessage = marked(message, markedOptions);

        if(this.mock)
            return mockNotify(renderedMessage, roomName);

        return new Promise((resolve, reject) =>
            this.api.notify(roomName, {
                message: renderedMessage,
                color: color,
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
