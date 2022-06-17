const enums = require("../../json/enums.json");
const messages = require("../../json/messages.json");

const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
require("dotenv").config();
aws.config.update({
  secretAccessKey: process.env.SECRET_KEY,
  accessKeyId: process.env.ACCESSKEYID,
  region: process.env.REGION,
});
const s3 = new aws.S3();
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid Mime Type, only JPEG and PNG for images and mp4 and mkv for video"
      ),
      false
    );
  }
};
const upload = multer({
  // fileFilter,
  storage: multerS3({
    s3,
    bucket: process.env.BUCKET,
    // acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: async function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        `gps-tracker/template/` +
          file.fieldname +
          "-" +
          uniqueSuffix +
          "." +
          file.originalname.split(".")[file.originalname.split(".").length - 1]
      );
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 2, // we are allowing only 2 MB files
  },
});

const deleteImage = function (req, res, next) {
  if (req.body.keys instanceof Array == false) {
    return res.status(enums.HTTP_CODES.FORBIDDEN).json({
      success: false,
      data: `${messages.TYPE_NOT_SUPPORTED}`,
    });
  }
  console.log("req.body.keys[0]", req.body.keys[0]);
  let array = req.body.keys;
  console.log("array", array);
  for (let i = 0; i < array.length; i++) {
    const s3 = new aws.S3();
    var params = {
      Bucket: process.env.BUCKET,
      Key: req.body.keys[i],
    };
    s3.getObject(params, (err) => {
      if (err) {
        const message = "File not found";
        const payload = {
          success: false,
          message: message,
        };
        req.user = payload;
        next();
      }
      s3.deleteObject(params, function (err, data) {
        console.log("data", data);
        const message = "files deleted";
        const payload = {
          success: true,
          data: message,
        };
        req.user = payload;
        next();
      });
    });
  }
};
module.exports = { upload, deleteImage };
