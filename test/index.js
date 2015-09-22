var expect = require("expect.js");
var nock = require("nock");
var messageResponse = require("./fixtures/message_response");
var templateResponse = require("./fixtures/template_response");
var mandrillClient = require("../");

var config = {
  apiKey: "API_KEY",
  enabled: false, // Disabled for testing
  reqTimeout: 5 * 1000
}

describe("mandrill-client", function () {

  describe("configuration", function () {
    it("should return an object if configuation is correct", function () {
      expect(mandrillClient({apiKey: "123ABC"})).to.be.an("object");
    });

    it("should not require an apiKey if it is not enabled", function() {
      expect(mandrillClient({
        enabled: false
      })).to.be.an("object")
    });

    it("should throw an error if no configuration object is given", function () {
      try {
        mandrillClient();
        expect().fail("should build the mandrill client");
      } catch (err) {
        expect(err).to.be.an(Error);
        expect(err.message).to.match(/config/);
      }
    });

    it("should throw an error if no apiKey configuration is given", function () {
      try {
        mandrillClient({});
        expect().fail("should build the mandrill client");
      } catch (err) {
        expect(err).to.be.an(Error);
        expect(err.message).to.match(/apiKey/);
      }
    });
  });

  describe("makeRequest", function () {

    var mandrill = mandrillClient(config);

    it("should resolve to empty array if mandrill not enabled", function() {
      return mandrill.makeRequest("messages/send.json", {}).then(function(res) {
        expect(res).to.be.a("array");
        expect(res).to.have.length(0);
      });
    });

    it("should make a request if mandrill is enabled", function() {
      config.enabled = true;

      // Nock out mandrill messages
      nock("https://mandrillapp.com")
        .persist()
        .post("/api/1.0/messages/send.json").reply(200, messageResponse);

      return mandrill.makeRequest("messages/send.json", {}).then(function(res) {
        expect(res.body).to.be.a("array");
        expect(res.body).to.have.length(1);
      });
    });

    it("should handle an response with statusCode 400", function() {
      config.enabled = true;

      // Nock out mandrill messages
      nock("https://mandrillapp.com")
        .persist()
        .post("/api/1.0/test").reply(400, []);

      return mandrill.makeRequest("test", {}).then(function(res) {
        expect(res.statusCode).to.eql(400);
        expect(res.body).to.be.a("array");
      });
    });
  });

  describe("sendMessage", function () {
    var mandrill = mandrillClient(config);

    it("should throw an error if there is an invalid message", function() {
      config.enabled = true;

      var badData = {
        shouldBeHere: false
      };

      return mandrill.sendMessage(badData).then(function(res) {
        expect().fail("A bad message should fail the test");
      }).catch(function(err) {
        expect(err);
        expect(err.message).to.eql("mandrill message not valid");
      });
    });

    it("should send a message", function() {
      config.enabled = true;

      // Nock out mandrill messages
      nock("https://mandrillapp.com")
        .post("/api/1.0/messages/send.json")
        .reply(200, messageResponse);

      var message = {
        subject: "Email from Pearlshare",
        html: "<p>An email message especially for you!</p>",
        "from_name": "Pearlshare",
        "from_email": "team@pearlshare.com",
        to: [
          {
            name: "test",
            email: "test@example.com"
          }
        ]
      };

      return mandrill.sendMessage(message).then(function(res) {
        expect(res.body).to.be.an("array");
        expect(res.body[0].email).to.equal("recipient.email@example.com");
        expect(res.body[0].status).to.equal("sent");
      });
    });
  });

  describe("sendMessageTemplate", function () {
    var mandrill = mandrillClient(config);

    it("should throw an error if there is invalid data", function() {
      config.enabled = true;

      var badData = {
        shouldBeHere: false
      };

      return mandrill.sendMessageTemplate(badData).then(function(res) {
        expect().fail("A bad message should fail the test");
      }).catch(function(err) {
        expect(err);
        expect(err.message).to.match(/template/);
      });
    });

    it("should send a message with a template", function() {
      config.enabled = true;

      // Nock out mandrill messages
      nock("https://mandrillapp.com")
        .post("/api/1.0/messages/send-template.json")
        .reply(200, messageResponse);

      var message = {
        subject: "Email from Pearlshare",
        "from_name": "Pearlshare",
        "from_email": "team@pearlshare.com",
        to: [
          {
            name: "test",
            email: "test@example.com"
          }
        ]
      };

      var values = {
        name: "Simba",
        occupation: "Lion"
      };

      return mandrill.sendMessage(message, values).then(function(res) {
        expect(res.body).to.be.an("array");
        expect(res.body[0].email).to.equal("recipient.email@example.com");
        expect(res.body[0].status).to.equal("sent");
      });
    });
  });

  describe("addTemplate", function () {
    var mandrill = mandrillClient(config);

    it("should throw an error if there is invalid data", function() {
      config.enabled = true;

      var badData = {
        shouldBeHere: false
      };

      return mandrill.addTemplate(badData).then(function(res) {
        expect().fail("A bad message should fail the test");
      }).catch(function(err) {
        expect(err);
        expect(err.message).to.match(/template/);
      });
    });

    it("should add a template", function() {
      config.enabled = true;

      // Nock out mandrill messages
      nock("https://mandrillapp.com")
        .post("/api/1.0/templates/add.json")
        .reply(200, templateResponse);

      var template = "<h1>Some HTML!</h1>";
      var opts = {
        name: "myExampleTemplate"
      };

      return mandrill.addTemplate(template, opts).then(function(res) {
        expect(res.body).to.be.an("object");
        expect(res.body.name).to.equal("Example Template");
        expect(res.body.code).to.be.a("string");
      });
    });
  });

  describe("getTemplate", function () {
    var mandrill = mandrillClient(config);

    it("should throw an error if there is invalid data", function() {
      config.enabled = true;

      var badData = {
        shouldBeHere: false
      };

      return mandrill.getTemplate(badData).then(function(res) {
        expect().fail("A bad message should fail the test");
      }).catch(function(err) {
        expect(err);
        expect(err.message).to.match(/template/);
      });
    });

    it("should get a template", function() {
      config.enabled = true;

      // Nock out mandrill messages
      nock("https://mandrillapp.com")
        .post("/api/1.0/templates/info.json")
        .reply(200, templateResponse);

      var templateName = "exampleTemplateName";

      return mandrill.getTemplate(templateName).then(function(res) {
        expect(res.body).to.be.an("object");
        expect(res.body.name).to.equal("Example Template");
        expect(res.body.code).to.be.a("string");
      });
    });
  });
  
  describe("publishTemplate", function () {
    var mandrill = mandrillClient(config);

    it("should throw an error if there is invalid data", function() {
      config.enabled = true;

      var badData = {
        shouldBeHere: false
      };

      return mandrill.publishTemplate(badData).then(function(res) {
        expect().fail("A bad message should fail the test");
      }).catch(function(err) {
        expect(err);
        expect(err.message).to.match(/template/);
      });
    });

    it("should get a template", function() {
      config.enabled = true;

      // Nock out mandrill messages
      nock("https://mandrillapp.com")
        .post("/api/1.0/templates/publish.json")
        .reply(200, templateResponse);

      var templateName = "exampleTemplateName";

      return mandrill.publishTemplate(templateName).then(function(res) {
        expect(res.body).to.be.an("object");
        expect(res.body.name).to.equal("Example Template");
        expect(res.body.code).to.be.a("string");
      });
    });
  });

  describe("updateTemplate", function () {
    var mandrill = mandrillClient(config);

    it("should throw an error if there is invalid data", function() {
      config.enabled = true;

      var badData = {
        shouldBeHere: false
      };

      return mandrill.updateTemplate(badData).then(function(res) {
        expect().fail("A bad message should fail the test");
      }).catch(function(err) {
        expect(err);
        expect(err.message).to.match(/template/);
      });
    });

    it("should update a template", function() {
      config.enabled = true;

      // Nock out mandrill messages
      nock("https://mandrillapp.com")
        .post("/api/1.0/templates/update.json")
        .reply(200, templateResponse);

      var newTemplate = "<h2>This is the new template</h2>";
      var templateData = {
        name: "Example template name"
      };

      return mandrill.updateTemplate(newTemplate, templateData).then(function(res) {
        expect(res.body).to.be.an("object");
        expect(res.body.name).to.equal("Example Template");
        expect(res.body.code).to.be.a("string");
      });
    });
  });

  describe("listTemplates", function () {
    var mandrill = mandrillClient(config);

    it("should list all templates associated with the user", function() {
      config.enabled = true;

      // Nock out mandrill messages
      nock("https://mandrillapp.com")
        .post("/api/1.0/templates/list.json")
        .reply(200, [
            templateResponse,
            templateResponse
          ]);

      return mandrill.listTemplates().then(function(res) {
        expect(res.body).to.be.an("array");
        expect(res.body).to.have.length(2);
        expect(res.body[0].name).to.match(/Template/);
        expect(res.body[0].subject).to.match(/subject/);
      });
    });
  });
});
