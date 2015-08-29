var Bluebird     = require("bluebird");
var request      = require("./promisified/superagent");
var schemas      = require("./schemas");

var mandrillUrl = "https://mandrillapp.com/api/1.0/";

module.exports = function maildrillClient(config, errors, logger) {
  if (!config || !errors || !logger) {
    throw new Error("mandrill-client requires a config, errors, and logger");
  }

  /*
   * Make a request to mandrill server setting the path, body and request options
   *
   * @param {String}     apiPath
   * @param {Object}     body
   */
  function makeRequest (apiPath, body) {
    if (config.mandrill.enabled) {
      return request
        .post(mandrillUrl + apiPath)
        .timeout(config.mandrill.reqTimeout)
        .set("Content-Type", "application/json")
        .send(body);
    } else {
      logger.info("Mandrill: DUMMY send message", body);
      return Bluebird.resolve([]);
    }
  }

  /*
   * https://mandrillapp.com/api/docs/messages.JSON.html
   *
   * @param {Object}     message                    mandrill message object to send (see schema)
   * @param {Object}     opts
   * @param {Boolean}    opts.async                 whether to send async (no response)
   * @param {Date}       opts.sendAt                time to send email at
   * @param {String}     opts.ipPool                the name of the dedicated ip pool that should be used to send the message
   */
  function sendMessage (message, opts) {
    if (opts === undefined) {
      opts = {};
    }

    /*eslint-disable camelcase*/
    message.from_email = message.from_email || config.pearlshare.teamEmail;
    message.from_name = message.from_name || config.pearlshare.name;
    /*eslint-enable */

    var form = schemas.messageValidator.validate(message);

    if (!form.valid) {
      return Bluebird.resolve().then(function() {
        throw new errors.ValidationError("mandrill message not valid", form.errors);
      });
    }

    var body = {
      key: config.mandrill.apiKey,
      message: form.data,
      async: opts.async || true,
      "ip_pool": opts.ipPool || null,
      "send_at": opts.sendAt || null
    };

    return makeRequest("messages/send.json", body);
  }

  return {
    sendMessage: sendMessage,
    makeRequest: makeRequest
  };
};
