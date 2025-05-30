module.exports = {
  transformIgnorePatterns: [
    "/node_modules/(?!date-fns|@mui/x-date-pickers|@mui/x-date-pickers.*)"
  ],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest"
  }
};
