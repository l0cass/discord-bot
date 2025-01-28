import { GoogleGenerativeAI } from "@google/generative-ai";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { getOption } from "../utils/getOption";

const googleGemini = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY as string,
).getGenerativeModel({ model: "gemini-1.5-flash" });

export const data = new SlashCommandBuilder()
  .setName("ask")
  .setDescription("Ask a question to Gemini")
  .addStringOption((option) =>
    option
      .setName("question")
      .setDescription("The question to ask Gemini")
      .setRequired(true),
  );

export const execute = async (interaction: CommandInteraction) => {
  const question = getOption(interaction, "question");

  await interaction.deferReply();

  try {
    const { response } = await googleGemini.generateContent([
      `
      Rules:
      1. Limit responses to a maximum of 2000 characters.
      2. Provide accurate and concise information.
      3. Be respectful and considerate in all responses.
      4. Avoid any form of bias or discrimination.
      5. Ensure the information is up-to-date and relevant.

      Question: ${question}
      `,
    ]);

    await interaction.editReply(response.text());
  } catch (error) {
    console.error("Error querying Gemini:", error);
    await interaction.editReply("Houve um erro ao consultar o Gemini.");
  }
};
