const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Account SID from www.twilio.com/console
const authToken = process.env.TWILIO_AUTH_TOKEN; // Your Auth Token from www.twilio.com/console

// TODO DEBUGGING ❗❗❗ UNCOMMENT THIS
// const client = require("twilio")(accountSid, authToken, {
//   lazyLoading: true,
// });

class Bot {
  constructor(firstInteractionName) {
    this.interactions = {};
    this.firstInteractionName = firstInteractionName;

    // debugging
    this.lastMessage = "";
  }

  async defineInteractionsByObject(object) {
    const interactions = object;

    for (const interaction of Object.entries(interactions)) {
      this.interactions[interaction[0]] = {
        body: interaction[1].body,
        relations: interaction[1].relations,
        isDynamic: interaction[1].isDynamic,
        identifierMessage: interaction[1].identifierMessage,
      };
    }

    return this.interactions;
  }

  defineActionByInteractionName(name, action) {
    this.interactions[name].action = action;
  }

  async handleUserMessage(message, senderID) {
    // 1. Define which interaction the user is currently in
    // 2. Parse the user input and define to which interaction he must be directed
    // 3. Return array of messages to send back to the user

    // Get last message sent by the bot to the user
    // DANILOOO ❗❗❗❗❗❗❗ eu nao consigo testar isso aqui não, por favor ve pra mim se ele pega a última mensagem mesmo.
    // Eu so copiei o codigo da documentação deles, eu não sei se ta certovt
    // const lastBotMessage = await client.messages.list({
    //   from: "whatsapp:+14155238886",
    //   to: senderID,
    //   limit: 20,
    // }).messages[0];

    // TODO DEBUGGING ❗❗❗ REMOVE THIS
    const lastBotMessage = this.lastMessage;

    // If lastBotMessage is undefined, it is the first interaction, and thus it is necessary to send the initial message
    if (!lastBotMessage) {
      return this.interactions[this.firstInteractionName].body;
    }

    // Get current interaction
    const currentInteraction = this.interactions[
      this.getContext(lastBotMessage)
    ];

    // Parse user input
    const userInput = message.trim().toLowerCase();

    // Check which interaction is the next one
    let interactionTitle;

    for (const relation of currentInteraction.relations) {
      if (relation.keyword.includes(userInput) || relation.keyword == "_ANY_") {
        interactionTitle = relation.nextInteraction;
        break;
      }
    }

    const nextInteraction = this.interactions[interactionTitle];

    // If no interaction was found, user typed something wrong. Return the previous message with a warning
    if (!interactionTitle) {
      return !currentInteraction.isDynamic
        ? [
            "Ops, não entendi... Você pode tentar de novo?",
            ...currentInteraction.body,
          ]
        : [
            "Ops, não entendi... Você pode tentar de novo?",
            ...currentInteraction.action(
              currentInteraction,
              nextInteraction,
              userInput
            ),
          ];
    }

    // Check if next interaction is dynamic or not. If it is, let the action return the message. If not, return the static message
    if (!nextInteraction.isDynamic) {
      return nextInteraction.body;
    } else {
      return nextInteraction.action(
        currentInteraction,
        nextInteraction,
        userInput
      );
    }
  }

  // This method gets the current context of the conversation with the specified user. It receives the last message that the bot sent
  //   and returns the title of the interaction that the user is in.
  // To handle dynamic messages, I decided that every interaction *must* end with a static identifier message, so we can decide in
  //   which interaction we currently are. I'm not sure if it is the best, and we would probably need a DB to handle this properly,
  //   but for now it will be enough
  getContext(previousMessage) {
    for (const interaction of Object.entries(this.interactions)) {
      if (interaction[1].isDynamic) {
        if (interaction[1].identifierMessage == previousMessage) {
          return interaction[0];
        }
      } else {
        if (
          interaction[1].body[interaction[1].body.length - 1] == previousMessage
        ) {
          return interaction[0];
        }
      }
    }

    // Something went wrong
    console.log("Something went wrong with getContext()");
    return "";
  }
}

// -------- TESTS ----------

async function doTest() {
  const fs = require("fs");
  const path = require("path");

  const prompt = require("prompt-sync")({ sigint: true });

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const bot = new Bot("greeting");

  // Each action has the following structure: {interactionName: _name_, func: _actionFunc_ }
  const actions = require("./../actions");

  fs.readFile(path.join(__dirname, "..", "interactions.json"), (err, data) => {
    if (err) console.error(err);

    // Define possible interactions
    bot.defineInteractionsByObject(JSON.parse(data));

    // Add the action to the proper interaction
    for (action in actions) {
      bot.defineActionByInteractionName(
        actions[action].interactionName,
        actions[action].func
      );
    }
  });

  while (true) {
    await sleep(100);

    const answers = await bot.handleUserMessage(prompt());

    // Write a function to send message back to WhatsApp
    for (const answer of answers) {
      if (answer) console.log(answer);
      bot.lastMessage = answer;
      // Add a timer to make the interaction more organic
      await sleep(700);
    }
  }
}

doTest();

module.exports = Bot;
