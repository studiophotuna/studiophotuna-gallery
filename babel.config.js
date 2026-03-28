module.exports = {
  sourceType: "module",
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          electron: "38.2.2" // adjust if needed
        }
      }
    ],
    ["@babel/preset-react", { runtime: "automatic" }]
  ]
};
