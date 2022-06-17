const enums = require("../../json/enums.json");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // primary key
    firstName: { type: String },
    lastName: { type: String },
    countryCode: { type: Number },
    email: { type: String },
    mobile: { type: Number },
    password: { type: String },
    status: {
      name: {
        type: String,
        enum: [
          enums.USER_STATUS.ACTIVE,
          enums.USER_STATUS.BLOCKED,
          enums.USER_STATUS.DISABLED,
          enums.USER_STATUS.INACTIVE,
          enums.USER_STATUS.INVITED,
          enums.USER_STATUS.PENDING,
        ],
      },
      modificationDate: Date,
    },
    otp: { type: String },
    otpValidTill: { type: Date },
    activeLocation: { type: Boolean, default: true },
    longitude: { type: Number },
    latitude: { type: Number },
  },
  {
    timestamps: true,
    versionKey: false,
    autoCreate: true,
  }
);
const newUser = new mongoose.model("user", userSchema, "user");
module.exports = newUser;
