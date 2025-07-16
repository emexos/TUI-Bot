# TwoBlade Chatbot

A Node.js-based bot for [TwoBlade](https://twoblade.com) that logs in automatically, connects to the WebSocket, and reacts to messages


## Prerequisites

### 1. Install Node.js

If you don't have Node.js installed:

* Windows/macOS/Linux:
  Visit [https://nodejs.org/](https://nodejs.org/) and download the LTS version.

* Verify installation in the terminal:

  ```bash
  node -v
  ```
  ```bash
  npm -v
  ```

### 2. Install dependencies

In the project directory, run:

```bash
npm install
```

## Configuration (.env)

in the project root set up the .env with the following content:

```
CF_CLEARANCE=your_cf_token
TB_USERNAME=your_twoblade_account_username
TB_PASSWORD=your_twoblade_account_password
GEMINI_API_KEY=your_api_key
```
!!don't use SPACES!!!

### How to get the values

* `CF_CLEARANCE`:
  This cookie is obtained when logging into [twoblade.com](https://twoblade.com).
  Open the browser dev tools (F12), go to "Application" > "Cookies" and copy the value for `cf_clearance`.

* `TB_USERNAME` & `TB_PASSWORD`:
  Your TwoBlade account login credentials.

* `GEMINI_API_KEY`:
  Get it from [Google AI](https://makersuite.google.com/app) after creating a project.

## Start

The `index.js` file is already included. To start the bot, run:

```bash
npm run dev
```
this will start this: nodemon --watch nothing --ext xyz index.js

## Project Structure

```
root-bot
├── .env
├── main/
    ├── bot.js
    ├── ai.js
├── index.js
├── package.json
```

## Commands

if the bot was installed with 
```bash
git clone https://github.com/emexos/TUI-Bot.git
``` 
then you can use ```--update``` to search for updates and to update instant run ```--update -i```
