// external packages
const express = require("express");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Sleep helper function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Start the webapp
const webApp = express();

// Webapp settings

// Body Parser is deprecated. If we want to parse json, we can use express.json()
webApp.use(express.json());
webApp.use(express.urlencoded());

// Server Port
const PORT = process.env.PORT;

// Home route
webApp.get("/", (req, res) => {
  res.send(`Hello World.!`);
});

// const WA = require("./helper-functions/whatsapp-functions");

const Bot = require("./helper-classes/Bot");
const bot = new Bot("greeting");

// Each action has the following structure: {interactionName: _name_, func: _actionFunc_ }
const actions = require("./actions");

fs.readFile(path.join(__dirname, "interactions.json"), (err, data) => {
  if (err) console.error(err);

  // Define possible interactions
  bot.defineInteractionsByObject(JSON.parse(data));

  // Add the action to the proper interaction
  for (action of actions) {
    bot.defineActionByInteractionName(action.interactionName, action.func);
  }
});

// Route for WhatsApp
webApp.post("/whatsapp", async (req, res) => {
  let message = req.body.Body;
  let senderID = req.body.From;

  console.log(message);
  console.log(senderID);

  // Get appropriated message to send to the user
  const answers = await bot.handleUserMessage(message, senderID);

  // Write a function to send message back to WhatsApp
  for (const answer of answers) {
    if (answer) {
      if (answer.includes("_IMG_LINK:")) {
        // Danilo manda a img aqui sla como faz
      } else {
        await WA.sendMessage(answer, senderID);
      }
    }
    // Add a timer to make the interaction more organic
    await sleep(100);
  }
});

// Start the server
webApp.listen(PORT, () => {
  console.log(`Server is up and running at ${PORT}`);
});
