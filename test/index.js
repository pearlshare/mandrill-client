var expect = require("expect.js");
var nock = require("nock");
var messageResponse = require("./fixtures/message_response");
var config = require("./config");
var errors = require("./errors");
var logger = require("./logger");
var mandrill = require("../lib")(config, errors, logger);

describe("mandrill-client", function(){

  describe("makeRequest", function() {

    it("should resolve to empty array if mandrill not enabled", function() {
      config.mandrill.enabled = false;

      mandrill.makeRequest("messages/send.json", {}).then(function(res) {
        expect(res).to.be.a("array");
        expect(res).to.have.length(0);
      });
    });

    it("should make a request if mandrill is enabled", function() {
      config.mandrill.enabled = true;

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

    it("should throw an error if there is an invalid message", function() {
      config.mandrill.enabled = true;

      var badMessage = {
        shouldBeHere: false
      };

      mandrill.sendMessage(badMessage).then(function(res) {
        console.log("Shouldn't run!");
      }).catch(function(err) {
        expect(err);
      });
    });

    it("should send a message", function() {
      config.mandrill.enabled = true;

      // Nock out mandrill messages
      nock("https://mandrillapp.com")
        .persist()
        .post("/api/1.0/messages/send.json").reply(200, messageResponse);

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
