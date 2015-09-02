var Bluebird = require("bluebird");
var got = require("got");
var schemas = require("./schemas");
var util = require("util");
var mandrillUrl = "https://mandrillapp.com/api/1.0/";

/**
 * ValidationError
 * @param {String}  message     error messages
 * @param {Object}  errors      any form errors to attach the error
 * @returns {Error} validation errors
 */
function ValidationError (message, errors) {
  Error.apply(this, arguments);
  this.name = "mandrill-client validation error";
  this.message = message;
  this.errors = errors;
  return this;
}

util.inherits(ValidationError, Error)

/**
 * mandrillClient
 * @param {Object}    config                mandrill-client configuration object
 * @param {String}    config.apiKey         mandrill API key
 * @param {Number}    config.reqTimeout     time allowed for mandrill to respond
 * @param {Boolean}   config.enabled        whether to make mandrill API requests
 * @param {Boolean}   config.enabled        whether to make mandrill API requests
 * @returns {Object} mandrill request helper
 */
module.exports = function mandrillClient(config) {
  var logger;

  if (!config) {
    throw new Error("mandrill-client requires a config object");
  }

  if (!config.apiKey) {
    throw new Error("mandrill-client requires an apiKey");
  }

  // Setup default configuration
  if (config.logger) {
    logger = config.logger;
  } else {
    logger = console;
  }


  if (!config.reqTimeout) {
    config.reqTimeout = 10 * 1000; // 10 seconds
  }

  /*
   * Make a request to mandrill server setting the path, body and request options
   *
   * @param {String}     apiPath
   * @param {Object}     body
   */
  function makeRequest (apiPath, body) {
    if (config.enabled) {
      return got(mandrillUrl+apiPath, {
        method: "post",
        headers: {
          "Content-Type": "application/json"
        },
        body: body,
        timeout: config.reqTimeout
      }).then(function(res) {
        res.origBody = res.body;
        res.body = JSON.parse(res.body);
        return res;
      });
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
    message.from_email = message.from_email;
    message.from_name = message.from_name;
    /*eslint-enable */

    var form = schemas.messageValidator.validate(message);

    if (!form.valid) {
      var err = new ValidationError("mandrill message not valid", form.errors);
      return Bluebird.reject(err);
    }

    var body = {
      key: config.apiKey,
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
