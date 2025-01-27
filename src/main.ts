import "dotenv/config";
import {
  Client,
  Events,
  GatewayIntentBits,
  SlashCommandBuilder,
} from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const gemini = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY as string,
).getGenerativeModel({ model: "gemini-1.5-flash" });

client.once(Events.ClientReady, async () => {
  console.log(`Ready! Logged in as ${client.user?.tag}`);

  try {
    // /ping command
    await client.application?.commands.create(
      new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!")
        .toJSON(),
    );

    // /hello command
    await client.application?.commands.create(
      new SlashCommandBuilder()
        .setName("hello")
        .setDescription("Replies with 'World'!")
        .toJSON(),
    );

    // /ask command
    await client.application?.commands.create(
      new SlashCommandBuilder()
        .setName("ask")
        .setDescription("Ask a question to Gemini")
        .addStringOption((option) =>
          option
            .setName("question")
            .setDescription("The question to ask Gemini")
            .setRequired(true),
        )
        .toJSON(),
    );

    // /price command
    await client.application?.commands.create(
      new SlashCommandBuilder()
        .setName("price")
        .setDescription("Get the price from one currency to another")
        .addStringOption((option) =>
          option
            .setName("from")
            .setDescription("The currency to convert from")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("to")
            .setDescription("The currency to convert to")
            .setRequired(true),
        )
        .toJSON(),
    );

    const fetchedCommands = await client.application?.commands.fetch();
    console.log(
      "Comandos registrados:",
      fetchedCommands?.map(({ name }) => name).join(", "),
    );
  } catch (error) {
    console.error("Erro ao registrar comando:", error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  switch (interaction.commandName) {
    case "ping":
      await interaction.reply("Pong!");
      break;
    case "hello":
      await interaction.reply("World!");
      break;
    case "ask":
      const question = interaction.options.get("question");

      await interaction.deferReply();

      try {
        const result = await gemini.generateContent([
          question?.value as string,
        ]);

        await interaction.editReply(result.response.text());
      } catch (error) {
        console.error("Error querying Gemini:", error);
        await interaction.editReply("Houve um erro ao consultar o Gemini.");
      }

      break;
    case "price":
      const fromCurrency = (
        interaction.options.get("from")?.value as string
      ).toUpperCase();

      const toCurrency = (
        interaction.options.get("to")?.value as string
      ).toUpperCase();

      await interaction.deferReply();

      try {
        const response = await fetch(
          `https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`,
          { method: "GET" },
        );

        const data = await response.json();

        if (data.rates[toCurrency]) {
          await interaction.editReply(
            `O preço de ${fromCurrency} para ${toCurrency} é ${data.rates[toCurrency]}.`,
          );
        } else {
          await interaction.editReply("Moeda não suportada.");
        }
      } catch (error) {
        console.error("Error fetching price:", error);
        await interaction.editReply("Houve um erro ao consultar o preço.");
      }

      break;
  }
});

client.login(process.env.CLIENT_TOKEN);
