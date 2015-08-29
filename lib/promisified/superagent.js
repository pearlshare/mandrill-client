module.exports = require("superagent-promise")(
  require("superagent"),
  require("bluebird")
);
