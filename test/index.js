var expect = require("expect.js");
var nock = require("nock");
var messageResponse = require("./fixtures/message_response");
var mandrillClient = require("../");

var config = {
  apiKey: "API_KEY",
  enabled: false, // Disabled for testing
  reqTimeout: 5 * 1000
}

describe("mandrill-client", function(){

  describe("configuration", function () {
    it("should return an object if configuation is correct", function () {
      expect(mandrillClient({apiKey: "123ABC"})).to.be.a("object");
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

  describe("makeRequest", function() {

    var mandrill = mandrillClient(config);

    it("should resolve to empty array if mandrill not enabled", function() {
      mandrill.makeRequest("messages/send.json", {}).then(function(res) {
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

      mandrill.makeRequest("messages/send.json", {}).then(function(res) {
        expect(res.body).to.be.a("array");
        expect(res.body).to.have.length(1);
      });
    });
  });

  describe("sendMessage", function() {
    var mandrill = mandrillClient(config);

    it("should throw an error if there is an invalid message", function() {
      config.enabled = true;

      var badMessage = {
        shouldBeHere: false
      };

      mandrill.sendMessage(badMessage).then(function(res) {
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
        .persist()
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

      mandrill.sendMessage(message).then(function(res) {
        expect(res.body).to.be.an(Array);
        expect(res.body[0].email).to.equal("recipient.email@example.com");
        expect(res.body[0].status).to.equal("sent");
      });
    });
  });
});
