"use strict";
//@ts-check

const path = require("path");

/**@type {import('webpack').Configuration}*/
const config = {
  target: "node", // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
  entry: {
    figmaScript: "./src/commands/figma_tree/figma.script.ts",
    figmaVscodeScript: "./src/commands/figma_tree/figma.vscode.script.ts"
  },
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, "figmaScript"),
    filename: '[name].js'
  },
  mode: "production",
  node: {
    __dirname: false,
    __filename: false,
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: [".ts", ".js", ".d.ts"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
};
module.exports = config;
