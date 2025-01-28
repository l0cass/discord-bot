import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { supportedCoins } from "../utils/constants";
import { getOption } from "../utils/getOption";

export const data = new SlashCommandBuilder()
  .setName("price")
  .setDescription("Get the price from one currency to another")
  .addStringOption((option) =>
    option
      .setName("source")
      .setDescription("The currency to convert from")
      .setRequired(true)
      .addChoices(...supportedCoins),
  )
  .addStringOption((option) =>
    option
      .setName("target")
      .setDescription("The currency to convert to")
      .setRequired(true)
      .addChoices(...supportedCoins),
  );

export const execute = async (interaction: CommandInteraction) => {
  const sourceCurrency = getOption(interaction, "source");
  const targetCurrency = getOption(interaction, "target");

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

      const sourceCurrencyName = currencyNames[sourceCurrency.toUpperCase()];
      const targetCurrencyName = currencyNames[targetCurrency.toUpperCase()];

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
};
