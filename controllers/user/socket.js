const userController = require("../../controllers/user/user");

module.exports = (server, logger, port) => {
  logger.info("Socket.io server started");
  const io = require("socket.io")(server, {
    cors: {
      origin: "*",
    },
  });

  io.use((socket, next) => {
    logger.info(`${JSON.stringify(socket.handshake.time)}`);
    next();
  });

  io.on("connection", async (socket) => {
    socket.on("location", async (data) => {
      try {
        const token = socket.handshake.headers.token;
        const response = await userController.updateLocationSocket(token, data);
        console.log(response);
        io.in(socket.id).emit("response", response);
      } catch (error) {
        console.log("Error in finding Chats", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });

    socket.on("error", function (err) {
      console.log("received error from socket:", socket.id);
      console.log(err);
    });
  });
};
