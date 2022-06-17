const express = require("express");
const app = express();
// define all route imports here

const user = require("./routes/user/user");

// define all routes here
app.use("/user", user);

module.exports = app;
