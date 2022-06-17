require("dotenv").config();
const userSchema = require("../models/user/user");
const enums = require("../json/enums.json");
const messages = require("../json/messages.json");
const adminScema = require("../models/admin/admin");
const bcrypt = require("bcryptjs");
const logger = require("../logger/logger");



module.exports = {
  createAdmin: async (req, res) => {
    try {
      const existAdmin = await adminScema.findOne({
        email: process.env.ADMIN_EMAIL,
      });
      const salt = await bcrypt.genSalt(10);
      const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
      if (!existAdmin) {
        const object = {
          firstName: process.env.ADMIN_FIRST_NAME,
          lastName: process.env.ADMIN_LAST_NAME,
          email: process.env.ADMIN_EMAIL,
          phone: process.env.ADMIN_MOBILE,
          password: password,
        };

        const newAdmin = new adminScema(object);
        await newAdmin.save();
      } else {
        logger.info("Admin already exist...");
      }
    } catch (error) {
      return res
        .status(enums.HTTP_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, error: error });
    }
  },

  //user validation
  validateUserMaster: async (decoded) => {
    if (!decoded._id) {
      const message = {
        status: enums.HTTP_CODES.NOT_ACCEPTABLE,
        success: false,
        message: messages.USER_DOES_NOT_EXIST,
      };
      return {
        success: false,
        message: message,
      };
    }
    const userData = await userSchema.findOne({ _id: decoded._id });

    if (userData === null) {
      const message = {
        status: enums.HTTP_CODES.NOT_ACCEPTABLE,
        success: false,
        message: messages.USER_DOES_NOT_EXIST,
      };
      return {
        success: false,
        message: message,
      };
    }
    return {
      success: true,
      data: userData,
    };
  },

  //validation for empty fields or expressions for more than one data
  validateFields: (data, fields) => {
    let k = 0;
    let data4message = "please enter valid ";
    let array4fields = [];
    for (let i = 0; i < data.length; i++) {
      if (!data[i]) {
        array4fields.push(fields[i]);
        k = 1;
      }
    }

    if (k == 1) {
      for (let i = 0; i < array4fields.length - 1; i++) {
        data4message = data4message + array4fields[i] + ", ";
      }
      data4message = data4message + array4fields[array4fields.length - 1];
      return data4message;
    } else {
      return null;
    }
  },

  //validation for existing data
  validateExistFields: (data, fields) => {
    let k = 0;
    let data4message = `Entered `;
    let array4fields = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i]) {
        array4fields.push(fields[i]);
        k = 1;
      }
    }
    if (k == 1) {
      for (let i = 0; i < array4fields.length - 1; i++) {
        data4message = data4message + array4fields[i] + ", ";
      }
      data4message = data4message + array4fields[array4fields.length - 1];
      return data4message + ` is already exists.`;
    } else {
      return null;
    }
  },

  checkBooleanData: (data) => {
    if (data == null) {
      data4message = "boolean type must not be null";
      return data4message;
    }
  },
  //checking email validation
  emailExpression: (data4email) => {
    const emailExpression = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(
      data4email
    );
    if (emailExpression) {
      const emailExpression =
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data4email);
      if (emailExpression) {
        return true;
      }
    } else {
      return false;
    }
  },

  //checking username validation
  usernameExpression: (data4username) => {
    const usernameRegex = /^[A-Za-z0-9_.]+$/.test(data4username);
    if (usernameRegex) {
      return true;
    } else {
      return false;
    }
  },

  //checking username validation
  phoneExpression: (data4phone) => {
    const phonenoRegex =
      /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,13}$/.test(
        data4phone
      );
    if (phonenoRegex) {
      return true;
    } else {
      return false;
    }
  },

  //checking password valid or not
  passwordExpression: (data4password) => {
    const passwordExpression =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(
        data4password
      );
    if (passwordExpression) {
      return true;
    } else {
      return false;
    }
  },

  //check if given data is in array
  validationForArray: (dataInArray, fieldInArray) => {
    let k = 0;
    let message = "";
    for (let i = 0; i < dataInArray.length; i++) {
      if (dataInArray[i] !== null) {
        if (dataInArray[i] instanceof Array == false) {
          k = 1;
          message = message + fieldInArray[i];
        }
      }
    }
    if (k == 1) {
      return { success: false, message: message + " must be in array." };
    }
  },

  existArrayFieldInDatabase: async (schemaName, id) => {
    const exist = await schemaName.findOne({
      vItems: { $elemMatch: { _id: id } },
    });
    return exist;
  },

  otpValidTill: () => {
    //otp expiration time----------------------
    var minutes = parseInt(process.env.OTP_TIMEOUT);
    var currentDateObj = new Date();
    var numberOfMlSeconds = currentDateObj.getTime();
    var addMlSeconds = minutes * 60 * 1000;
    var otpValidTill = new Date(numberOfMlSeconds + addMlSeconds).toString();
    return otpValidTill;
  },

  // updateLocationSocket: async (port) => {
  //   // logger.info("Socket.io server started");
  //   // const io = require("socket.io")(server);
  //   // // const io = require("socket.io")(http, {
  //   // //     cors: {
  //   // //         origin: "*",
  //   // //         methods: ["GET", "POST"],
  //   // //         allowedHeaders: ["*"],
  //   // //         credentials: true
  //   // //     }
  //   // // });

  //   // io.use((socket, next) => {
  //   //   logger.info(
  //   //     `REQ [${socket.id}] [WS] ${socket.handshake.url} ${JSON.stringify(
  //   //       socket.handshake
  //   //     )}`
  //   //   );
  //   //   next();
  //   // });

  //   console.log("Socket.io server started");
  //   io.on("connection", (socket) => {
  //     console.log(socket);

  //     socket.on("location", (location) => {
  //       console.log(location);
  //       socket.broadcast.emit("location", location);
  //     });
  //   });
  // },
};
