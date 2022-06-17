const userSchema = require("../../models/user/user");
const logger = require("../../logger/logger");
const enums = require("../../json/enums.json");
const utils = require("../../utils/utils");
const messages = require("../../json/messages.json");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminSchema = require("../../models/admin/admin");
const jwt_SECRET = process.env.JWT_SECRET;

module.exports = {
  createUser: async (req, res) => {
    logger.verbose(`${req.originalUrl}`);

    let { firstName, lastName, email, mobile, password, latitude, longitude } =
      req.body;
    if (email == process.env.ADMIN_EMAIL) {
      return res.status(enums.HTTP_CODES.BAD_REQUEST).json({
        success: false,
        message: messages.EMAIL_NOT_VALID,
      });
    } else if (mobile == process.env.ADMIN_MOBILE) {
      return res.status(enums.HTTP_CODES.BAD_REQUEST).json({
        success: false,
        message: messages.MOBILE_NOT_VALID,
      });
    }

    // checking if data is not empty
    const data = [firstName, lastName, email, mobile, password];
    const fields = ["firstName", "lastName", "email", "mobile", "password"];
    const data4message = utils.validateFields(data, fields);
    if (data4message) {
      return res.status(enums.HTTP_CODES.BAD_REQUEST).json({
        success: false,
        message: data4message,
      });
    }

    const userStatusCheck = await userSchema.findOne({
      $or: [{ mobile: mobile }, { email: email }],
    });

    if (userStatusCheck) {
      return res.status(enums.HTTP_CODES.NOT_ACCEPTABLE).json({
        success: false,
        message: messages.USER_ALREADY_EXIST,
      });
    }

    //checking if entered data is not exists in database

    const userPhoneExist = await userSchema.findOne({
      mobile: mobile,
    });
    const userEmailExist = await userSchema.findOne({
      email: email,
    });
    let data4exists = [userEmailExist, userPhoneExist];
    let field4exists = ["Email", "Phone"];
    const data4ExistField = utils.validateExistFields(
      data4exists,
      field4exists
    );
    if (data4ExistField) {
      return res.status(enums.HTTP_CODES.BAD_REQUEST).json({
        success: false,
        message: data4ExistField,
      });
    }

    // checking data validation
    const emailExpression = utils.emailExpression(email);
    const phoneRegex = utils.phoneExpression(mobile);
    const passwordExpression = utils.passwordExpression(password);
    // checking email, and password validation
    let data4expression = [emailExpression, passwordExpression, phoneRegex];
    let fields4expression = ["email", "password", "phone"];
    const data4expressionFields = utils.validateFields(
      data4expression,
      fields4expression
    );
    if (data4expressionFields) {
      return res.status(enums.HTTP_CODES.BAD_REQUEST).json({
        success: false,
        message: data4expressionFields,
      });
    }

    //encrypting password
    const salt = await bcrypt.genSalt(10);
    let new_pwd = password;
    const hash = await bcrypt.hash(new_pwd, salt);

    try {
      const userObject = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        mobile: mobile,
        password: hash,
        userRole: enums.USER_TYPE.USER,
        status: {
          name: enums.USER_STATUS.ACTIVE,
          modificationDate: Date.now().toString(),
        },
        latitude: latitude,
        longitude: longitude,
      };

      const newUser = new userSchema(userObject);
      const savedUser = await newUser.save();
      const data4token = {
        _id: savedUser._id,
      };
      const token = jwt.sign(data4token, jwt_SECRET);
      const payload = {
        id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        mobile: savedUser.mobile,
        token: token,
        latitude: savedUser.latitude,
        longitude: savedUser.longitude,
      };

      return res
        .status(enums.HTTP_CODES.OK)
        .json({ success: true, data: payload });
    } catch (error) {
      return res
        .status(enums.HTTP_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, error: error.message });
    }
  },

  userLogin: async (req, res) => {
    logger.verbose(`${req.originalUrl}`);

    const { password, mobile, email } = req.body;
    //checking  if user enter (phone or email) and password
    if ((!mobile && !email) || !password) {
      return res
        .status(enums.HTTP_CODES.BAD_REQUEST)
        .json({ success: false, message: messages.INVALID_PARAMETERS });
    }

    //check if user is admin or not
    if (
      email == process.env.ADMIN_EMAIL ||
      mobile == process.env.ADMIN_MOBILE
    ) {
      const data = await adminSchema.findOne({
        $or: [{ mobile: mobile }, { email: email }],
      });

      if (data) {
        const isCorrect = await bcrypt.compare(password, data.password);
        if (!isCorrect) {
          return res.status(enums.HTTP_CODES.UNAUTHORIZED).json({
            success: false,
            message: messages.WRONG_CREDENTIALS,
          });
        }
        const data4token = {
          _id: data._id,
        };
        const token = jwt.sign(data4token, jwt_SECRET);
        const payload = {
          id: data._id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          mobile: data.mobile,
          userType: "Admin",
          token: token,
        };

        return res
          .status(enums.HTTP_CODES.OK)
          .json({ success: true, data: payload });
      } else {
        return res.status(enums.HTTP_CODES.UNAUTHORIZED).json({
          success: false,
          message: messages.WRONG_CREDENTIALS,
        });
      }
    }

    //finding data using either email or phone number from database
    let userData;
    if (mobile) {
      userData = await userSchema.findOne({ mobile: mobile });
    } else if (email) {
      userData = await userSchema.findOne({ email: email });
    }

    if (!userData) {
      return res
        .status(enums.HTTP_CODES.NOT_FOUND)
        .json({ success: false, message: messages.USER_NOT_EXIST });
    }

    let existPwd = userData?.password;
    let userStatus = userData?.status?.name;

    if (
      userStatus === enums.USER_STATUS.BLOCKED ||
      userStatus == enums.USER_STATUS.INACTIVE ||
      userStatus == enums.USER_STATUS.DISABLED ||
      userStatus == enums.USER_STATUS.INVITED
    ) {
      return res.status(enums.HTTP_CODES.NOT_FOUND).json({
        success: false,
        message: messages.YOU_CAN_NOT_LOGIN,
      });
    }
    if (!existPwd) {
      return res
        .status(enums.HTTP_CODES.UNAUTHORIZED)
        .json({ success: false, message: messages.INVALID_PASSWORD });
    }

    const isMatch = await bcrypt.compare(password, existPwd);

    if (!isMatch) {
      return res.status(enums.HTTP_CODES.NOT_FOUND).json({
        success: false,
        message: messages.INVALID_PASSWORD_OR_USER,
      });
    }

    // User found - create jwt and return it
    const data4token = {
      _id: userData._id,
    };

    let token = jwt.sign(data4token, jwt_SECRET);
    const payload = {
      mobile: userData.mobile,
      email: userData.email,
      id: userData._id,
      userType: "User",
      token: token,
    };

    return res
      .status(enums.HTTP_CODES.OK)
      .send({ success: true, data: payload });
  },

  updateUser: async (req, res) => {
    logger.verbose(`${req.originalUrl}`);

    // decoded data from middleware auth
    const decoded = req.user;

    //getting data from database bu using token
    const user = await userSchema.findOne({ _id: decoded._id });
    if (!user) {
      return res
        .status(enums.HTTP_CODES.BAD_REQUEST)
        .json({ success: false, message: messages.USER_DOES_NOT_EXIST });
    }

    let { email, mobile, firstName, lastName } = req.body;

    if (!email && !mobile && !firstName && !lastName) {
      return res
        .status(enums.HTTP_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: messages.REQUIRED_FIELDS });
    }

    let alreadyEmail;
    if (email) {
      alreadyEmail = await userSchema.findOne({
        _id: { $ne: decoded._id },
        email: email,
      });
    }

    let alreadyPhone;
    if (mobile) {
      alreadyPhone = await userSchema.findOne({
        _id: { $ne: decoded._id },
        mobile: mobile,
      });
    }

    let data4expression = [];
    let fields4expression = [];
    let emailExpression;
    if (email) {
      emailExpression = utils.emailExpression(email);
      data4expression.push(emailExpression);
      fields4expression.push("email");
    }
    let phoneRegex;
    if (mobile) {
      phoneRegex = utils.phoneExpression(mobile);
      data4expression.push(phoneRegex);
      fields4expression.push("phone");
    }

    const data4expressionFields = await utils.validateFields(
      data4expression,
      fields4expression
    );
    if (data4expressionFields) {
      return res.status(enums.HTTP_CODES.BAD_REQUEST).json({
        success: false,
        message: data4expressionFields,
      });
    }

    //check if email and phone number are already taken
    const data4exists = [alreadyPhone, alreadyEmail];
    const field4exists = ["Phone", "Email"];

    const data4messageOfExists = await utils.validateExistFields(
      data4exists,
      field4exists
    );
    if (data4messageOfExists) {
      return res.status(enums.HTTP_CODES.BAD_REQUEST).json({
        success: false,
        message: data4messageOfExists,
      });
    }

    const data4token = {
      _id: user._id,
    };

    const userObject = {
      $set: {
        email: email || user.email,
        mobile: mobile || user.mobile,
        firstName: req.body.firstName || user.firstName,
        lastName: req.body.lastName || user.lastName,
      },
    };
    const token = jwt.sign(data4token, jwt_SECRET);
    try {
      const user = await userSchema.findOneAndUpdate(
        { _id: decoded._id },
        userObject,
        { new: true }
      );

      const payload = {
        email: user.email,
        mobile: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        token: token,
      };
      return res
        .status(enums.HTTP_CODES.OK)
        .json({ success: true, data: payload });
    } catch (error) {
      return res
        .status(enums.HTTP_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, error: error.message });
    }
  },

  passwordUpdate: async (req, res) => {
    logger.verbose(`${req.originalUrl}`);

    const decoded = req.user;
    const old_password = req.body.oldPassword;
    const new_password = req.body.newPassword;
    const renew_password = req.body.reNewPassword;
    const userData = await userSchema.findOne({ _id: decoded._id });

    //checking if there is a password exists
    if (!userData.password) {
      res
        .status(enums.HTTP_CODES.NOT_FOUND)
        .json({ success: false, message: messages.INVALID_TOKEN });
      return;
    }
    if (!old_password || !new_password) {
      res
        .status(enums.HTTP_CODES.BAD_REQUEST)
        .json({ success: false, message: messages.REQUIRED_FIELDS });
      return;
    }

    const isMatch = await bcrypt.compare(old_password, userData.password);
    if (!isMatch) {
      return res.status(enums.HTTP_CODES.UNAUTHORIZED).json({
        success: false,
        message: messages.INVALID_OLD_PASSWORD,
      });
    }

    //checking if new password is no same
    const isMatch_newPwd = await bcrypt.compare(
      new_password,
      userData.password
    );
    if (isMatch_newPwd) {
      return res.status(enums.HTTP_CODES.DUPLICATE_VALUE).json({
        success: false,
        message: messages.ALREADY_EXISTS_PASSWORD,
      });
    }

    if (new_password != renew_password) {
      return res
        .status(enums.HTTP_CODES.NOT_ACCEPTABLE)
        .json({ success: false, message: messages.PASSWORD_NOT_MATCH });
    }
    const passwordExpression =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(
        new_password
      );

    if (!passwordExpression) {
      return res
        .status(enums.HTTP_CODES.NOT_ACCEPTABLE)
        .json({ success: false, message: messages.INVALID_PASSWORD });
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(new_password, salt);

    try {
      const user = await userSchema.findOneAndUpdate(
        { _id: decoded._id },
        { password: hash },
        { new: true }
      );
      const data4token = {
        _id: user._id,
      };
      const token = jwt.sign(data4token, jwt_SECRET);
      return res
        .status(enums.HTTP_CODES.OK)
        .json({ success: true, token: token });
    } catch (error) {
      return res
        .status(enums.HTTP_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, error: error.message });
    }
  },

  updateLocation: async (req, res) => {
    logger.verbose(`${req.originalUrl}`);

    const decoded = req.user;
    const { latitude, longitude } = req.body;

    const data4expression = [latitude, longitude];
    const fields4expression = ["latitude", "longitude"];
    const data4expressionFields = await utils.validateFields(
      data4expression,
      fields4expression
    );
    if (data4expressionFields) {
      return res.status(enums.HTTP_CODES.BAD_REQUEST).json({
        success: false,
        message: data4expressionFields,
      });
    }
    const user = await userSchema.findOne({ _id: decoded._id });

    const object4update = {
      $set: {
        latitude: latitude || user.latitude,
        longitude: longitude || user.longitude,
      },
    };

    if (!user) {
      const isAdmin = await adminSchema.findOne({ _id: decoded._id });
      if (isAdmin) {
        const admin = await adminSchema.findOneAndUpdate(
          { _id: decoded._id },
          object4update,
          { new: true }
        );

        return res
          .status(enums.HTTP_CODES.OK)
          .json({ success: true, data: admin });
      } else {
        return res
          .status(enums.HTTP_CODES.NOT_FOUND)
          .json({ success: false, message: messages.INVALID_TOKEN });
      }
    }
    try {
      const user = await userSchema.findOneAndUpdate(
        { _id: decoded._id },
        object4update,
        { new: true }
      );
      return res
        .status(enums.HTTP_CODES.OK)
        .json({ success: true, data: user });
    } catch (error) {
      return res
        .status(enums.HTTP_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, error: error.message });
    }
  },

  getUser: async (req, res) => {
    logger.verbose(`${req.originalUrl}`);

    const decoded = req.user;
    if (!decoded._id) {
      return res.status(enums.HTTP_CODES.NOT_FOUND).json({
        success: false,
        message: messages.INVALID_TOKEN,
      });
    }

    try {
      //if login user is admin
      let isAdmin = await adminSchema.findOne({ _id: decoded._id });
      if (isAdmin) {
        const user = await userSchema.find();
        return res
          .status(enums.HTTP_CODES.OK)
          .json({ success: true, data: user, adminData: isAdmin });
      }

      //if login user is user
      let existAdmin = await adminSchema.findOne({
        email: process.env.ADMIN_EMAIL,
      });
      let user = await userSchema.findOne({ _id: decoded._id });

      return res
        .status(enums.HTTP_CODES.OK)
        .json({ success: true, data: user, adminData: existAdmin });
    } catch (error) {
      return res
        .status(enums.HTTP_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, error: error.message });
    }
  },

  getUserForLocation: async (req, res) => {
    logger.verbose(`${req.originalUrl}`);

    const decoded = req.user;
    if (!decoded._id) {
      return res.status(enums.HTTP_CODES.NOT_FOUND).json({
        success: false,
        message: messages.INVALID_TOKEN,
      });
    }

    try {
      //if login user is admin
      let isAdmin = await adminSchema.findOne({ _id: decoded._id });
      if (isAdmin) {
        const user = await userSchema.find({ activeLocation: true });
        if (isAdmin.activeLocation == false) {
          isAdmin = {};
        }
        return res
          .status(enums.HTTP_CODES.OK)
          .json({ success: true, data: user, adminData: isAdmin });
      }

      //if login user is user
      let existAdmin = await adminSchema.findOne({
        email: process.env.ADMIN_EMAIL,
      });

      if (existAdmin.activeLocation === false) {
        existAdmin = {};
      }
      let user = await userSchema.findOne({ _id: decoded._id });
      if (user.activeLocation === false) {
        user = {};
      }

      return res
        .status(enums.HTTP_CODES.OK)
        .json({ success: true, data: user, adminData: existAdmin });
    } catch (error) {
      return res
        .status(enums.HTTP_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, error: error.message });
    }
  },

  // updateLocationSocket: async (token) => {
  //   const decoded = jwt.verify(token, jwt_SECRET);
  //   let isAdmin;
  //   const existLocation = await userSchema.findOne({ _id: decoded._id });
  //   if (!existLocation) {
  //     isAdmin = await adminSchema.findOne({ _id: decoded._id });
  //   }
  //   let locationData = {};
  //   if (
  //     existLocation?.latitude !== data.latitude &&
  //     existLocation?.longitude !== data.longitude
  //   ) {
  //     locationData = {
  //       latitude: data.latitude,
  //       longitude: data.longitude,
  //     };
  //     await userSchema.findOneAndUpdate(
  //       { _id: decoded._id },
  //       { $set: locationData }
  //     );
  //   }

  //   let response;
  //   isAdmin = await adminSchema.findOne({
  //     $and: [{ _id: decoded._id }, { activeLocation: true }],
  //   });
  //   if (isAdmin) {
  //     const user = await userSchema.find({ activeLocation: true });
  //     response = { success: true, data: user, adminData: isAdmin };
  //   } else {
  //     const existAdmin = await adminSchema.findOne({
  //       $and: [{ email: process.env.ADMIN_EMAIL }, { activeLocation: true }],
  //     });
  //     const user = await userSchema.findOne({
  //       $and: [{ _id: decoded._id }, { activeLocation: true }],
  //     });
  //     response = { success: true, data: user, adminData: existAdmin };
  //   }
  // },

  updateLocationSocket: async (token, data) => {
    const decoded = jwt.verify(token, jwt_SECRET);

    console.log(decoded);
    const { latitude, longitude } = data;

    const user = await userSchema.findOne({ _id: decoded._id });
    const object4update = {
      $set: {
        latitude: latitude || user.latitude,
        longitude: longitude || user.longitude,
      },
    };
    if (!user) {
      let isAdmin = await adminSchema.findOne({ _id: decoded._id });
      let user = await userSchema.find({ activeLocation: true });
      if (isAdmin) {
        let admin = await adminSchema.findOneAndUpdate(
          { _id: decoded._id },
          object4update,
          { new: true }
        );

        if (admin.activeLocation === false) {
          admin = {};
        }

        console.log("daddadasdada", admin.activeLocation);

        return (response = {
          success: true,
          data: user,
          adminData: admin,
        });
      } else {
        return (response = {
          success: false,
          message: messages.INVALID_TOKEN,
        });
      }
    }

    try {
      let existAdmin = await adminSchema.findOne({
        email: process.env.ADMIN_EMAIL,
      });

      if (existAdmin.activeLocation == false) {
        existAdmin = {};
      }

      console.log("daddadasdada", existAdmin.activeLocation);
      let user = await userSchema.findOneAndUpdate(
        { _id: decoded._id },
        object4update,
        { new: true }
      );

      if (user.activeLocation == false) {
        user = {};
      }

      return (response = { success: true, data: user, adminData: existAdmin });
    } catch (error) {
      return (response = { success: false, message: error });
    }
  },

  onOffLocation: async (req, res) => {
    logger.verbose(`${req.originalUrl}`);
    const decoded = req.user;
    const user = await userSchema.findOne({ _id: decoded._id });

    try {
      if (!user) {
        const isAdmin = await adminSchema.findOne({ _id: decoded._id });
        if (isAdmin) {
          let adminObject = {};
          if (isAdmin.activeLocation == false) {
            adminObject = {
              $set: {
                activeLocation: true,
              },
            };
          } else if (isAdmin.activeLocation == true) {
            adminObject = {
              $set: {
                activeLocation: false,
              },
            };
          }
          const admin = await adminSchema.findOneAndUpdate(
            { _id: decoded._id },
            adminObject,
            { new: true }
          );

          return res
            .status(enums.HTTP_CODES.OK)
            .json({ success: true, data: admin });
        } else {
          return res
            .status(enums.HTTP_CODES.NOT_FOUND)
            .json({ success: false, message: messages.INVALID_TOKEN });
        }
      } else {
        let userObject = {};
        if (user.activeLocation == false) {
          userObject = {
            $set: {
              activeLocation: true,
            },
          };
        } else if (user.activeLocation == true) {
          userObject = {
            $set: {
              activeLocation: false,
            },
          };
        }
        const updateUser = await userSchema.findOneAndUpdate(
          { _id: decoded._id },
          userObject,
          { new: true }
        );

        return res
          .status(enums.HTTP_CODES.OK)
          .json({ success: true, data: updateUser });
      }
    } catch (error) {
      return res
        .status(enums.HTTP_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, error: error.message });
    }
  },

  getOnlyOneUser: async (req, res) => {
    logger.verbose(`${req.originalUrl}`);

    const decoded = req.user;
    if (!decoded._id) {
      return res.status(enums.HTTP_CODES.NOT_FOUND).json({
        success: false,
        message: messages.INVALID_TOKEN,
      });
    }

    try {
      //if login user is admin
      let isAdmin = await adminSchema.findOne({ _id: decoded._id });
      if (isAdmin) {
        const user = await userSchema.find();
        return res
          .status(enums.HTTP_CODES.OK)
          .json({ success: true, adminData: isAdmin });
      }

      let user = await userSchema.findOne({ _id: decoded._id });

      return res
        .status(enums.HTTP_CODES.OK)
        .json({ success: true, data: user });
    } catch (error) {
      return res
        .status(enums.HTTP_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, error: error.message });
    }
  },
};
