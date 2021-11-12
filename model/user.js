const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  aparment: { type: String, unique: true },
  first_name: { type: String, default: null },
  last_name: { type: String, default: null },
  email: { type: String, unique: true },
  password: { type: String },
  token: { type: String },
});

module.exports = mongoose.model("user", userSchema);