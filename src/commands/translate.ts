import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { supportedLanguages } from "../utils/constants";
import { getOption } from "../utils/getOption";

export const data = new SlashCommandBuilder()
  .setName("translate")
  .setDescription("Translate text from one language to another")
  .addStringOption((option) =>
    option
      .setName("source_language")
      .setDescription("The source language of the text to translate")
      .setRequired(true)
      .addChoices(...supportedLanguages),
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
      .addChoices(...supportedLanguages),
  );

export const execute = async (interaction: CommandInteraction) => {
  const sourceLanguage = getOption(interaction, "source_language");
  const text = getOption(interaction, "text");
  const targetLanguage = getOption(interaction, "target_language");

  if (text.length > 200) {
    await interaction.reply("O texto deve ter no máximo 200 caracteres.");
    return;
  }

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
};
