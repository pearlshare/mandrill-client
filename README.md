[![Circle CI](https://circleci.com/gh/pearlshare/mandrill-client.svg?style=svg&circle-token=7167cf456ec5e58c3f36637709fd8d919de83b7b)](https://circleci.com/gh/pearlshare/mandrill-client)
# Mandrill Client

A node.js wrapper around the [Mandrill](https://mandrillapp.com) HTTP API.

## Objectives

To provide a set of promise based helper methods for making and validating requests to the mandrill API.

## Usage

```js

var mandrill = require("mandrill-client");

mandrill.sendMessage({
    html: "<p>Free Donuts, click <a href='http://example.com/free'>here</a></p>",
    subject: "Please read my email",
    from_email: "homer@example.com",
    from_name: "Homer Simpson",
    to: [
        {
            email: "you@example.com",
            name: "Barney Grumble"
        }
    ]
}).then(function (res) {
    console.log("mandrill loves donuts", res.body);
}).catch(function (err) {
    console.error("doh!", err)
});

```
