// index.js
require("dotenv").config();
const TwoBladeBot = require("./main/bot");
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const settings = loadSettings();

const MSG_PATH = path.join(__dirname, "msg.json");
const SETTINGS_PATH = path.join(__dirname, "settings.json");
const USER_PATH = path.join(__dirname, "user.json");

let startTime;
if (settings.uptime && /^[0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(settings.uptime)) {
  const [h, m, s] = settings.uptime.split(":").map((n) => parseInt(n, 10));
  const offsetMs = (h * 3600 + m * 60 + s) * 1000;
  startTime = Date.now() - offsetMs;
} else {
  startTime = Date.now();
  settings.uptime = "00:00:00";
  saveSettings(settings);
}

console.log("Start time set:", new Date(startTime).toLocaleString());

process.on("uncaughtException", (err) => {
  if (err.code === "EIO") return;
  console.error(err);
  process.exit(1);
});

(async () => {
  const bot      = new TwoBladeBot("https://twoblade.com");
  const username = process.env.TB_USERNAME;
  const password = process.env.TB_PASSWORD;

  try {
    await bot.start(username, password);
    console.clear();
    console.log(`\nBot connected! Version: ${settings.version}`);

    let isFirstStart   = true;
    let isSleeping     = false;
    let storedMessages = loadMessages();
    let knownUsers     = loadUsers();
    const displayedMessages = new Set();

    bot.on("ready", () => {
      if (isFirstStart) {
        setTimeout(() => {
          bot.sendMessage(settings.welcome);
        }, 0); // if u want time out
        isFirstStart = false;
      }
    });

    bot.on("message", (msg) => {
      if (isSleeping) return;
      if (typeof msg !== "object") return;
      //if (msg.fromUser === "emexos#twoblade.com") return;
      // banning user function is available soon
      if (displayedMessages.has(msg.id)) return;
      displayedMessages.add(msg.id);

      storedMessages.push({
        text: msg.text,
        fromUser: msg.fromUser,
        timestamp: new Date().toISOString(),
      });
      saveMessages(storedMessages);

      const rows = process.stdout.rows || 24;
      readline.cursorTo(process.stdout, 0, 0);
      readline.clearScreenDown(process.stdout);

      const frameWidth = 60;
      const formatLine = (label, value) => {
        const content = `${label}: '${value}',`;
        const padding = frameWidth - content.length - 3;
        return `|${content}${" ".repeat(Math.max(padding, 0))}|`;
      };

      const shortText =
        msg.text.length > 35 ? msg.text.substring(0, 35) + "..." : msg.text;
      const border = "=".repeat(frameWidth);

      console.clear();
      console.log(" ");
      console.log(border);
      console.log(           "|   NEW MESSAGE" .padEnd(frameWidth - 1) + "|");
      console.log(formatLine( "   ID  " , msg.id       ));
      console.log(formatLine( "   text" , shortText    ));
      console.log(formatLine( "   User" , msg.fromUser ));
      console.log(border);
      console.log(" ");

      readline.cursorTo(process.stdout, 0, rows - 2);
      readline.clearScreenDown(process.stdout);
      process.stdout.write(DIVIDER + "\n");
      readline.cursorTo(process.stdout, 0, rows - 1);
      rl.prompt(true);
    });

    bot.on("disconnect", () => {
      clearLine();
      const timestamp = new Date().toLocaleString();
      console.log(`# Bot disconnected at ${timestamp}.., going to sleep mode...`);
    });

    // -------------------------- CLI setup ------------------------------
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "",
    });

    const DIVIDER = "─".repeat(33);

    function showDividerPrompt() {
      const rows = process.stdout.rows || 30;
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");

      readline.cursorTo(process.stdout, 0, rows - 2);
      readline.clearScreenDown(process.stdout);
      process.stdout.write(DIVIDER + "\n");
      readline.cursorTo(process.stdout, 0, rows - 1);
      rl.setPrompt(`[${hrs}:${mins}]# `);
      rl.prompt(true);
    }

    setInterval(showDividerPrompt, 60 * 1000);

    const clearLine = () => {
      readline.cursorTo(process.stdout, 0);
      readline.clearLine(process.stdout, 0);
    };

    showDividerPrompt();

    rl.on("line", async (line) => {
      const input = line.trim();
      if (!input.startsWith("--say ")) {
        showDividerPrompt();
        return;
      }
      const text = input.slice(6);
      const message = ` ${text}`;

      try {
        await bot.sendMessage(message);
        const rows = process.stdout.rows || 24;
        readline.cursorTo(process.stdout, 0, rows - 3);
        readline.clearLine(process.stdout, 0);
        console.log(` ${message}`);
      } catch (err) {
        console.error("Failed to send message:", err);
      }
      showDividerPrompt();
    });
    // ------------------------ end CLI ---------------------------

  } catch (err) {
    console.error("Opss! i just glitched out like windows 98, please contact emexos#twoblade.com", err);
  }
})();

function loadSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function saveSettings(settings) {
  fs.writeFileSync(
    SETTINGS_PATH,
    JSON.stringify(settings, null, 2),
    "utf8"
  );
}
function saveMessages(messages) {
  fs.writeFileSync(MSG_PATH, JSON.stringify(messages, null, 2), "utf8");
}
function loadMessages() {
  try {
    return JSON.parse(fs.readFileSync(MSG_PATH, "utf8"));
  } catch {
    return [];
  }
}
function loadUsers() {
  try {
    return new Set(JSON.parse(fs.readFileSync(USER_PATH, "utf8")));
  } catch {
    return new Set();
  }
}
function saveUsers(userSet) {
  fs.writeFileSync(USER_PATH, JSON.stringify([...userSet], null, 2), "utf8");
}
function showMessageBanner(title) {
  const border = "=".repeat(60);
  console.clear();
  console.log(" ");
  console.log(border);
  console.log("|   " + title.padEnd(55) + "|");
  console.log(border);
  console.log(" ");
}
