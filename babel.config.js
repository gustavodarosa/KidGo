module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [ // Adicionar esta seção de plugins
      ["module:react-native-dotenv", {
        "moduleName": "@env",
        "path": ".env", // Garante que ele leia da raiz
        "blacklist": null,
        "whitelist": null,
        "safe": false,
        "allowUndefined": true // Ou false se você quiser que dê erro se a variável não for encontrada
      }]
    ]
  };
};
