import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("hello")
  .setDescription("Replies concatenating the rest of the sentence");

export const execute = async (interaction: CommandInteraction) =>
  await interaction.reply("+ ' World!'");
