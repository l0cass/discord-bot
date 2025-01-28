import {
  AttachmentBuilder,
  CommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { supportedLanguages } from "../utils/constants";
import { getOption } from "../utils/getOption";

export const data = new SlashCommandBuilder()
  .setName("audio")
  .setDescription("Create an audio from text")
  .addStringOption((option) =>
    option
      .setName("language")
      .setDescription("The language of the text")
      .setRequired(true)
      .addChoices(...supportedLanguages),
  )
  .addStringOption((option) =>
    option
      .setName("text")
      .setDescription("The text to convert to audio")
      .setRequired(true),
  );

export const execute = async (interaction: CommandInteraction) => {
  const language = getOption(interaction, "language");
  const textToConvert = getOption(interaction, "text");

  if (textToConvert.length > 200) {
    await interaction.reply("O texto deve ter no máximo 200 caracteres.");
    return;
  }

  await interaction.deferReply();

  try {
    const response = await fetch(
      `https://lingva.ml/api/v1/audio/${language}/${encodeURIComponent(textToConvert)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (response.ok) {
      const audioBuffer = (await response.json()).audio;

      const audioAttachment = new AttachmentBuilder(Buffer.from(audioBuffer), {
        name: "audio.mp3",
        description: "Generated audio file",
      });

      await interaction.editReply({
        content: "Aqui está o áudio gerado:",
        files: [audioAttachment],
      });
    } else {
      await interaction.editReply("Erro ao gerar o áudio.");
    }
  } catch (error) {
    console.error("Error generating audio:", error);
    await interaction.editReply("Houve um erro ao gerar o áudio.");
  }
};
