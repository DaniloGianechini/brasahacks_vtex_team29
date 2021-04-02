// external packages
const express = require("express");
require("dotenv").config();

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

const WA = require("../helper-functions/whatsapp-functions");

// Route for WhatsApp
webApp.post("/whatsapp", async (req, res) => {
  let message = req.body.Body;
  let senderID = req.body.From;

  console.log(message);
  console.log(senderID);

  // Write a function to send message back to WhatsApp
  await WA.sendMessage("Bem vindo ao sistema de vendas.", senderID);
});

// Start the server
webApp.listen(PORT, () => {
  console.log(`Server is up and running at ${PORT}`);
});
