interface ChoiceType {
  name: string;
  value: string;
}

export const supportedCoins: ChoiceType[] = [
  { name: "USD", value: "USD" },
  { name: "EUR", value: "EUR" },
  { name: "GBP", value: "GBP" },
  { name: "JPY", value: "JPY" },
  { name: "AUD", value: "AUD" },
  { name: "CAD", value: "CAD" },
  { name: "BRL", value: "BRL" },
];

export const supportedLanguages: ChoiceType[] = [
  { name: "Alemão", value: "de" },
  { name: "Inglês", value: "en" },
  { name: "Chinês", value: "zh" },
  { name: "Francês", value: "fr" },
  { name: "Espanhol", value: "es" },
  { name: "Português", value: "pt" },
];
