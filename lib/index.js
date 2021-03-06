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

  if (config.enabled === undefined) {
    config.enabled = true;
  }

  if (!config.apiKey && config.enabled) {
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
        body: JSON.stringify(body),
        timeout: config.reqTimeout
      }).catch(function(err) {
        if (err.statusCode && err.statusCode >= 400) {
          return err.response;
        }
        else {
          throw err;
        }
      }).then(function(res) {
        res.origBody = res.body;
        res.body = JSON.parse(res.body);
        return res;
      });
    } else {
      return Bluebird.resolve({
        body: []
      });
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
    message.from_email = message.from_email || "";
    message.from_name = message.from_name || "";
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

  /**
   * https://mandrillapp.com/api/docs/messages.JSON.html#method=send-template
   *
   * @param {Object}     message        mandrill message object to send (see schema)
   * @param {Object}     replacements   key/value text replacements
   * @param {Object}     opts           sending options
   * @param {Boolean}    opts.async     whether to send async (no response)
   * @param {Date}       opts.sendAt    time to send email at
   * @param {String}     opts.ipPool    the name of the dedicated ip pool that should be used to send the message
   * @returns {Promise} resolving to mailchimp response
   */
  function sendMessageTemplate (message, replacements, opts) {
    if (opts === undefined) {
      opts = {};
    }

    if (!opts.templateName) {
      var err = new Error("No template given");
      return Bluebird.reject(err);
    }

    /*eslint-disable camelcase*/
    message.from_email = message.from_email || "";
    message.from_name = message.from_name || "";
    /*eslint-enable */

    var messageData = schemas.messageValidator.validate(message);

    // Convert replacements object {name: "Peter Pan"}
    // into mandrill style [{name: "name", contents: "Peter Pan"}]
    var templateContent = [];
    Object.keys(replacements).forEach(function (key) {
      templateContent.push({
        name: key,
        content: replacements[key]
      });
    });

    var body = {
      key: config.apiKey,
      message: Object.assign(messageData.data, {
        "merge_language": "handlebars",
        "global_merge_vars": templateContent
      }),
      async: opts.async || true,
      "ip_pool": opts.ipPool || null,
      "send_at": opts.sendAt || null,
      "template_name": opts.templateName,
      "template_content": [],

    };

    return makeRequest("messages/send-template.json", body);
  }

  /**
   * https://mandrillapp.com/api/docs/templates.JSON.html#method=add
   *
   * @param {String}     template                   template code - html with handlebar variables
   * @param {Object}     opts                       template options
   * @param {String}     opts.name                  name of the template
   * @param {String}     opts.subject               subject of the email
   * @param {Boolean}    opts.publish               whether to make the template live
   * @param {Array}      opts.labels                array of text labels
   * @returns {Promise} resolving to mailchimp response
   */
  function addTemplate (template, opts) {
    if (opts === undefined) {
      opts = {};
    }

    if (opts.name === undefined) {
      var err = new Error("opts.name is required to create a template");
      return Bluebird.reject(err);
    }

    var body = {
      key: config.apiKey,
      name: opts.name,
      "from_name": opts.fromName,
      subject: opts.subject,
      code: template,
      publish: opts.publish,
      labels: opts.labels
    };

    return makeRequest("templates/add.json", body);
  }

  /**
   * https://mandrillapp.com/api/docs/templates.JSON.html#method=info
   *
   * @param {String}     name                  name of the template
   * @returns {Promise} resolving to mailchimp response
   */
  function getTemplate (name) {
    if (typeof name !== "string") {
      var err = new Error("that template name is invalid");
      return Bluebird.reject(err);
    }

    var body = {
      key: config.apiKey,
      name: name
    };

    return makeRequest("templates/info.json", body);
  }

  /**
   * https://mandrillapp.com/api/docs/templates.JSON.html#method=publish
   *
   * @param {String}     name                  name of the template
   * @returns {Promise} resolving to mailchimp response
   */
  function publishTemplate (name) {
    if (typeof name !== "string") {
      var err = new Error("that template name is invalid");
      return Bluebird.reject(err);
    }

    var body = {
      key: config.apiKey,
      name: name
    };

    return makeRequest("templates/publish.json", body);
  }

  /**
   * https://mandrillapp.com/api/docs/templates.JSON.html#method=update
   *
   * @param {String}     template                   template code - html with handlebar variables
   * @param {Object}     opts                       template options
   * @param {String}     opts.name                  name of the template
   * @param {String}     opts.subject               subject of the email
   * @param {Boolean}    opts.publish               whether to make the template live
   * @param {Array}      opts.labels                array of text labels
   * @returns {Promise} resolving to mailchimp response
   */
  function updateTemplate (template, opts) {
    if (opts === undefined) {
      opts = {};
    }

    if (opts.name === undefined) {
      var err = new Error("opts.name is required to update a template");
      return Bluebird.reject(err);
    }

    if (typeof template !== "string") {
      var err = new Error("the template code is invalid");
      return Bluebird.reject(err);
    }

    var body = {
      key: config.apiKey,
      name: opts.name,
      "from_name": opts.fromName,
      subject: opts.subject,
      code: template,
      publish: opts.publish,
      labels: opts.labels
    };

    return makeRequest("templates/update.json", body);
  }

  /**
  * https://mandrillapp.com/api/docs/templates.JSON.html#method=info
  *
  * @param {String} filter   an optional string to filter by
  * @returns {Array} an array containing the names of all templates
  */
  function listTemplates (filter) {
    var body = {
      key: config.apiKey
    };

    if (typeof filter === "string") {
      body.label = filter;
    }

    return makeRequest("templates/list.json", body);
  }

  return {
    addTemplate: addTemplate,
    getTemplate: getTemplate,
    publishTemplate: publishTemplate,
    listTemplates: listTemplates,
    updateTemplate: updateTemplate,
    sendMessage: sendMessage,
    sendMessageTemplate: sendMessageTemplate,
    makeRequest: makeRequest
  };
};
