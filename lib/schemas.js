var schemajs = require("schemajs");

var messageSchema = {
  html: {
    type: "string"
  },
  text: {
    type: "string"
  },
  subject: {
    type: "string",
    required: true
  },
  "from_email": {
    type: "string",
    required: true
  },
  "from_name": {
    type: "string",
    required: true
  },
  to: {
    type: "array",
    required: true,
    schema: {
      type: "object",
      schema: {
        email: {
          type: "email",
          required: true
        },
        name: {
          type: "string",
          required: true
        },
        type: {
          type: "string",
          default: "to",
          properties: {
            in: ["from", "to", "bcc", "cc"]
          }
        }
      }
    }
  },
  headers: {
    type: "object",
    schema: {
      "Reply-To": {
        type: "string"
      }
    }
  },
  important: {
    type: "boolean"
  },
  "track_opens": {
    type: "boolean"
  },
  "auto_text": {
    type: "boolean",
    default: true
  },
  "auto_html": {
    type: "boolean"
  },
  "inline_css": {
    type: "boolean"
  },
  "url_strip_qs": {
    type: "boolean"
  },
  "preserve_recipients": {
    type: "boolean",
    default: false
  },
  "view_content_link": {
    type: "boolean"
  },
  "bcc_address": {
    type: "email"
  },
  "tracking_domain": {
    type: "url"
  },
  "signing_domain": {
    type: "url"
  },
  "return_path_domain": {
    type: "string"
  },
  merge: {
    type: "boolean"
  },
  "merge_language": {
    type: "string"
  },
  "global_merge_vars": {
    type: "array"
  },
  "merge_vars": {
    type: "array"
  },
  tags: {
    type: "array"
  },
  subaccount: {
    type: "string"
  },
  "google_analytics_domains": {
    type: "array"
  },
  "google_analytics_campaign": {
    type: "string"
  },
  metadata: {
    type: "object",
    schema: {
      website: {
        type: "url"
      }
    }
  },
  "recipient_metadata": {
    type: "array",
    schema: {
      type: "object",
      schema: {
        rcpt: {
          type: "email"
        },
        values: {
          type: "object"
        }
      }
    }
  },
  attachments: {
    type: "array",
    schema: {
      type: "object",
      schema: {
        type: {
          type: "string"
        },
        name: {
          type: "string"
        },
        content: {}
      }
    }
  },
  images: {
    type: "array",
    schema: {
      type: "object",
      schema: {
        type: {
          type: "string"
        },
        name: {
          type: "string"
        },
        content: {}
      }
    }
  }
};

exports.messageValidator = schemajs.create(messageSchema);
