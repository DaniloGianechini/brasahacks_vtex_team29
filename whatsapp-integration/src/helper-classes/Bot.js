const fs = require("fs");

const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Account SID from www.twilio.com/console
const authToken = process.env.TWILIO_AUTH_TOKEN; // Your Auth Token from www.twilio.com/console

const client = require("twilio")(accountSid, authToken, {
  lazyLoading: true,
});

class Bot {
  constructor(firstInteractionName) {
    this.interactions = {};
    this.firstInteractionName = firstInteractionName;
  }

  async defineInteractionsByJSON(filepath) {
    await new Promise((resolve) => {
      fs.readFile(filepath, "utf8", (err, data) => {
        if (err) return console.error(err);

        const interactions = JSON.parse(data);

        for (const interaction of Object.entries(interactions)) {
          this.interactions[interaction[0]] = {
            body: interaction[1].body,
            relations: interaction[1].relations,
            isDynamic: interaction[1].isDynamic,
            identifierMessage: interaction[1].identifierMessage,
          };
        }

        resolve();
      });
    });

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
    //   Eu so copiei o codigo da documentação deles, eu não sei se ta certo
    const lastBotMessage = await client.messages.list({
      from: "whatsapp:+14155238886",
      to: senderID,
      limit: 20,
    }).messages[0];

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
    let interactionTitle = null;

    for (const relation of currentInteraction.relations) {
      if (relation.keyword == userInput) {
        interactionTitle = relation.nextInteraction;
      }
    }

    const nextInteraction = this.interactions[interactionTitle];

    // If no interaction was found, user typed something wrong. Return the previous message with a warning
    if (!interactionTitle) {
      return [
        "Ops, não entendi... Você pode tentar de novo?",
        ...currentInteraction.body,
      ];
    }

    // Check if next interaction is dynamic or not. If it is, let the action return the message. If not, return the static message
    if (!nextInteraction.isDynamic) {
      return nextInteraction.body;
    } else {
      return nextInteraction.action(nextInteraction, userInput);
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
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const bot = new Bot("interacao-1");

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
        break;
      default:
        message = ["Essa comida nunca ouvi falar viu"];
    }

    return [...message, ...currentInteraction.identifierMessage];
  }

  // Define possible interactions
  bot.defineInteractionsByJSON("./interactions.json").then(() => {
    // Add the action to the proper interaction
    bot.defineActionByInteractionName("resposta-comida", handleFoodAnswer);
  });

  await sleep(100);

  const answers = await bot.handleUserMessage("sim");

  // Write a function to send message back to WhatsApp
  for (const answer of answers) {
    console.log(answer);
    // Add a timer to make the interaction more organic
    await sleep(800);
  }
}

module.exports = Bot;
