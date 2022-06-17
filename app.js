// Third party Modules
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const routes = require("./routes");
const logger = require("./logger/logger");
const cors = require("cors");
const utils = require("./utils/utils");
var http = require("http");
var app = express();

var socketController = require("./controllers/user/socket");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());

// Routes
app.use("/api/v1/", routes);

// Connect to MongoDb
const connection = async () => {
  mongoose.connect(process.env.MONGOURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  logger.info("mongoDB connected.....");
  await utils.createAdmin();
  const port = process.env.APP_PORT || 9999;
  const server = http.createServer(app);

  await socketController(server, logger);
  server.listen(process.env.APP_PORT, async () => {
    logger.info(
      `${process.env.APP_RELEASE} server STARTED on port: ${process.env.APP_PORT}\n`
    );
  });
  server.timeout = 120000;
};
connection();
