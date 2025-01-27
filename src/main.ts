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

interface UserConversationHistory {
  userId: string;
  history: string[];
}

const conversationHistory: UserConversationHistory[] = [];

const googleGemini = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY as string,
).getGenerativeModel({ model: "gemini-1.5-flash" });

client.once(Events.ClientReady, async () => {
  console.log(`Ready! Logged in as ${client.user?.tag}`);

  try {
    const commands = [
      new SlashCommandBuilder()
        .setName("hello")
        .setDescription("Replies concatenating the rest of the sentence"),
      new SlashCommandBuilder()
        .setName("ask")
        .setDescription("Ask a question to Gemini")
        .addStringOption((option) =>
          option
            .setName("question")
            .setDescription("The question to ask Gemini")
            .setRequired(true),
        ),
      new SlashCommandBuilder()
        .setName("price")
        .setDescription("Get the price from one currency to another")
        .addStringOption((option) =>
          option
            .setName("source")
            .setDescription("The currency to convert from")
            .setRequired(true)
            .addChoices(
              { name: "USD", value: "USD" },
              { name: "EUR", value: "EUR" },
              { name: "GBP", value: "GBP" },
              { name: "JPY", value: "JPY" },
              { name: "AUD", value: "AUD" },
              { name: "CAD", value: "CAD" },
              { name: "BRL", value: "BRL" },
            ),
        )
        .addStringOption((option) =>
          option
            .setName("target")
            .setDescription("The currency to convert to")
            .setRequired(true)
            .addChoices(
              { name: "USD", value: "USD" },
              { name: "EUR", value: "EUR" },
              { name: "GBP", value: "GBP" },
              { name: "JPY", value: "JPY" },
              { name: "AUD", value: "AUD" },
              { name: "CAD", value: "CAD" },
              { name: "BRL", value: "BRL" },
            ),
        ),
      new SlashCommandBuilder()
        .setName("translate")
        .setDescription("Translate text from one language to another")
        .addStringOption((option) =>
          option
            .setName("source_language")
            .setDescription("The source language of the text to translate")
            .setRequired(true)
            .addChoices(
              { name: "Alemão", value: "de" },
              { name: "Inglês", value: "en" },
              { name: "Chinês", value: "zh" },
              { name: "Francês", value: "fr" },
              { name: "Espanhol", value: "es" },
              { name: "Português", value: "pt" },
            ),
        )
        .addStringOption((option) =>
          option
            .setName("text")
            .setDescription("The text to translate")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("target_language")
            .setDescription("The language to translate to")
            .setRequired(true)
            .addChoices(
              { name: "Alemão", value: "de" },
              { name: "Inglês", value: "en" },
              { name: "Chinês", value: "zh" },
              { name: "Francês", value: "fr" },
              { name: "Espanhol", value: "es" },
              { name: "Português", value: "pt" },
            ),
        ),
    ];

    for (const command of commands) {
      await client.application?.commands.create(command.toJSON());
    }

    const fetchedCommands = await client.application?.commands.fetch();

    if (fetchedCommands) {
      const commandNames = fetchedCommands.map(({ name }) => name).join(", ");
      console.log(`Comandos registrados: ${commandNames}`);
    } else {
      console.log("Nenhum comando registrado.");
    }
  } catch (error) {
    console.error("Erro ao registrar comando:", (error as Error).message);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const getOption = (label: string) => {
    const option = interaction.options.get(label, true);

    return option.value as string;
  };

  switch (interaction.commandName) {
    case "hello":
      await interaction.reply("+ ' World!'");
      break;
    case "ask":
      const question = getOption("question");

      await interaction.deferReply();

      try {
        const { response } = await googleGemini.generateContent([question]);

        await interaction.editReply(response.text());
      } catch (error) {
        console.error("Error querying Gemini:", error);
        await interaction.editReply("Houve um erro ao consultar o Gemini.");
      }
      break;
    case "price":
      const sourceCurrency = getOption("source");
      const targetCurrency = getOption("target");

      await interaction.deferReply();

      try {
        const response = await fetch(
          `https://api.frankfurter.app/latest?from=${sourceCurrency}&to=${targetCurrency}`,
          { method: "GET", headers: { "Content-Type": "application/json" } },
        );

        const data = await response.json();

        if (data.rates[targetCurrency.toUpperCase()]) {
          const currencyNames: { [key: string]: string } = {
            USD: "Dólar Americano",
            EUR: "Euro",
            GBP: "Libra Esterlina",
            JPY: "Iene Japonês",
            AUD: "Dólar Australiano",
            CAD: "Dólar Canadense",
            BRL: "Real",
          };

          const sourceCurrencyName =
            currencyNames[sourceCurrency.toUpperCase()];
          const targetCurrencyName =
            currencyNames[targetCurrency.toUpperCase()];

          await interaction.editReply(
            `O preço de ${sourceCurrencyName} para ${targetCurrencyName} é ${data.rates[targetCurrency.toUpperCase()]}.`,
          );
        } else {
          await interaction.editReply("Moeda não suportada.");
        }
      } catch (error) {
        console.error("Error fetching price:", error);
        await interaction.editReply("Houve um erro ao consultar o preço.");
      }
      break;
    case "translate":
      const text = getOption("text");
      const sourceLanguage = getOption("source_language");
      const targetLanguage = getOption("target_language");

      await interaction.deferReply();

      try {
        const response = await fetch(
          `https://lingva.ml/api/v1/${sourceLanguage}/${targetLanguage}/${encodeURIComponent(text)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );

        const data = await response.json();

        const languageMap: { [key: string]: string } = {
          fr: "Francês",
          de: "Alemão",
          en: "Inglês",
          es: "Espanhol",
          zh: "Chinês",
          pt: "Português",
        };

        const fullSourceLanguageName = languageMap[sourceLanguage];
        const fullTargetLanguageName = languageMap[targetLanguage];

        if (data.translation) {
          await interaction.editReply(
            `Texto traduzido de ${fullSourceLanguageName} para ${fullTargetLanguageName}: ${data.translation}`,
          );
        } else {
          await interaction.editReply("Erro ao traduzir o texto.");
        }
      } catch (error) {
        console.error("Error translating text:", error);
        await interaction.editReply("Houve um erro ao traduzir o texto.");
      }
      break;
  }
});

client.login(process.env.CLIENT_TOKEN);

// https://discord.com/oauth2/authorize?client_id=1333200976277930025&permissions=8&integration_type=0&scope=bot
