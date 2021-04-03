// external packages
const express = require("express");
require("dotenv").config();

// Sleep helper function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Start the webapp
const webApp = express();

// Webapp settings

// Body Parser is deprecated. If we want to parse json, we can use express.json()
webApp.use(express.json());
app.use(express.urlencoded());

// Server Port
const PORT = process.env.PORT;

// Home route
webApp.get("/", (req, res) => {
  res.send(`Hello World.!`);
});

const WA = require("./helper-functions/whatsapp-functions");

const Bot = require("./helper-classes/Bot");
const bot = new Bot("interacao-1");

// Define actions to the interactions
// Each action receives its own interaction and the user input. It then must returns the array of messages to be sent to the user
//   The action must also return, in the last index of the array, the interaction identifierMessage
function handleFoodAnswer(currentInteraction, userInput) {
  /*
  Options:

    1) Pizza
    2) Strogonoff
    3) Sushi
  
  */

  let message = [""];

  switch (userInput) {
    case "1":
      message = [
        "Hummm pizza é top hem. Minha preferida é frango com catupiry.",
      ];
      break;
    case "2":
      message = [
        "Minha nossa senhora strogonoff não é nem comida, é um manjar dos deuses. Que treco bom minha nossa senhora.",
      ];
      break;
    case "3":
      message = [
        "Nossa sushi é show também. Hot roll ali é tudo de bom. Salmaozinho top tambem hem.",
      ];
    default:
      message = ["Essa comida nunca ouvi falar viu"];
  }

  return [...message, ...currentInteraction.identifierMessage];
}

// Define possible interactions
bot.defineInteractionsByJSON("./interactions.json").then((res) => {
  // Add the action to the proper interaction
  bot.defineActionByInteractionName("resposta-comida", handleFoodAnswer);
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
    await WA.sendMessage(answer, senderID);
    // Add a timer to make the interaction more organic
    await sleep(800);
  }
});

// Start the server
webApp.listen(PORT, () => {
  console.log(`Server is up and running at ${PORT}`);
});
