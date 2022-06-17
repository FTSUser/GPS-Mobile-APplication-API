const mongoose = require("mongoose");

// Create a schema for Database
const adminSchema = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    email: {
      type: String,
    },
    phone: {
      type: Number,
    },
    password: {
      type: String,
    },
    longitude: { type: Number },
    latitude: { type: Number },
    activeLocation: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false, autoCreate: true }
);

// Export

module.exports = admin = mongoose.model("admin", adminSchema, "admin");
