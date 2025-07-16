//main/bot.js

const axios = require("axios").default;
const { io } = require("socket.io-client");
const tough = require("tough-cookie");
const EventEmitter = require("events");
const { handleAI } = require("./ai");

const cf_clearance = process.env.CF_CLEARANCE;

class TwoBladeBot extends EventEmitter {
    constructor(baseUrl = "https://twoblade.com") {
        super();
        this.baseUrl = baseUrl;
        this.username = null;
        this.password = null;
        this.cookies = new tough.CookieJar();
        this.socket = null;
        this.authToken = null;
        this.connected = false;
        this.messageCounts = {};
        this.startedAt = null;
    }

    async login(username, password) {
        this.username = username;
        this.password = password;

        const url = `${this.baseUrl}/login`;
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0',
            'Referer': `${this.baseUrl}/login`,
            'Origin': this.baseUrl,
            'Cookie': `cf_clearance=${cf_clearance}`
        };

        const data = new URLSearchParams();
        data.append("username", username);
        data.append("password", password);

        const response = await axios.post(url, data.toString(), {
            headers,
            withCredentials: true
        });

        const setCookies = response.headers['set-cookie'] || [];

        let authToken = null;
        for (const rawCookie of setCookies) {
            this.cookies.setCookieSync(rawCookie, this.baseUrl);
            const cookie = tough.Cookie.parse(rawCookie);
            if (cookie?.key === "auth_token") {
                authToken = cookie.value;
            }
        }

        if (!authToken) {
            throw new Error("auth_token cookie not found in login response");
        }

        this.authToken = authToken;
        this.emit("login", this.username);
    }

    async connect() {
        if (!this.authToken) {
            throw new Error("Must login before connecting");
        }

        const cookieString = `cf_clearance=${cf_clearance}; auth_token=${this.authToken}`;

        this.socket = io(this.baseUrl, {
            path: "/ws/socket.io",
            transports: ["websocket"],
            auth: { token: this.authToken },
            extraHeaders: {
                Cookie: cookieString,
                Origin: this.baseUrl
            }
        });

        this.socket.on("connect", () => {
            this.connected = true;
            this.emit("ready");
            this.startedAt = Date.now();
        });

        this.socket.on("disconnect", () => {
            this.connected = false;
            this.emit("disconnect");
        });

        this.socket.on("connect_error", (err) => {
            this.emit("error", err);
        });

        this.socket.on("users_count", (count) => {
            this.emit("users_count", count);
        });

        this.socket.on("recent_messages", (messages) => {
            this.emit("recent_messages", messages);
        });

        this.socket.on("message", (data) => {
            this.emit("message", data);

            const user = data.fromUser || 'Unknown';
            if (!this.messageCounts[user]) {
                this.messageCounts[user] = 0;
            }
            this.messageCounts[user]++;

            if (!data?.text || typeof data.text !== "string") return;
            const text = data.text.trim();

            handleAI(this, data);

        });
    }

    sendMessage(text) {
        if (!this.connected || !this.socket) {
            throw new Error("Not connected to socket");
        }
        this.socket.emit("message", text);
    }

    async start(username, password) {
        await this.login(username, password);
        await this.connect();
    }

    destroy() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

module.exports = TwoBladeBot;
