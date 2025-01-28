import "dotenv/config";

import {
  Client,
  CommandInteraction,
  Events,
  GatewayIntentBits,
  SlashCommandBuilder,
} from "discord.js";
import { readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

interface CommandFile {
  data: SlashCommandBuilder;
  execute: (interaction: CommandInteraction) => Promise<void>;
}

const commands: CommandFile[] = [];

const __dirname = dirname(fileURLToPath(import.meta.url));
const commandFiles = readdirSync(join(__dirname, "commands")).filter((file) =>
  file.endsWith(".ts"),
);

for (const file of commandFiles) {
  try {
    const command = (await import(`./commands/${file}`)) as CommandFile;
    commands.push(command);
  } catch (error) {
    console.error(`Error loading command ${file}:`, (error as Error).message);
  }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async () => {
  const isGlobal = process.argv.includes("--global");

  try {
    console.log(`Ready! Logged in as ${client.user?.tag}`);

    if (isGlobal) {
      await client.application?.commands.set(
        commands.map((command) => command.data.toJSON()),
      );
    } else {
      const guild = await client.guilds.fetch(process.env.GUILD_ID as string);

      if (!guild) {
        console.error("Guild not found. Please check the GUILD_ID.");
        process.exit(1);
      }

      await guild.commands.set(
        commands.map((command) => command.data.toJSON()),
      );
    }

    console.log(
      `Commands ${isGlobal ? "global" : "local"} loaded: ${commands
        .map((command) => command.data.name)
        .join(", ")}`,
    );
  } catch (error) {
    console.error("Erro ao registrar comando:", (error as Error).message);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = commands.find(
    ({ data }) => data.name === interaction.commandName,
  );

  if (!command) {
    await interaction.reply("Comando não encontrado.");
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(
      `Error executing command ${interaction.commandName}:`,
      (error as Error).message,
    );

    await interaction.reply("Ocorreu um erro ao executar este comando.");
  }
});

client.login(process.env.CLIENT_TOKEN);

// https://discord.com/oauth2/authorize?client_id=1333200976277930025&permissions=8&integration_type=0&scope=bot
