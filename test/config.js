function truthy (value) {
  return value === "true" || value === true;
}

module.exports = {
  mandrill: {
    apiKey: process.env.MANDRILL_ID || "",
    enabled: truthy(process.env.MANDRILL_ENABLED) || false,
    reqTimeout: 5 * 1000
  },
  pearlshare: {
    teamEmail: "team@pearlshare.com",
    name: "Pearlshare"
  }
};
