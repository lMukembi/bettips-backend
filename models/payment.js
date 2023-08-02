const mongoose = require("mongoose");
const paymentSchema = new mongoose.Schema(
  {
    MSISDN: {
      type: String,
      required: true,
    },

    TransID: {
      type: String,
      required: true,
    },

    TransAmount: {
      type: Number,
      required: true,
    },
    FirstName: {
      type: String,
      required: true,
    },

    LastName: {
      type: String,
      required: true,
    },

    TransID: {
      type: String,
      required: true,
    },

    TransAmount: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const payment = mongoose.model("payment", paymentSchema);

module.exports = payment;
