import { CommandInteraction } from "discord.js";

export const getOption = (interaction: CommandInteraction, label: string) =>
  interaction.options.get(label, true).value as string;
