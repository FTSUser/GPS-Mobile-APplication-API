const express = require("express");
const router = express.Router();
const { upload, deleteImage } = require("./storeImages");
const auth = require("../../middleware/auth");
const enums = require("../../json/enums.json");
const messages = require("../../json/messages.json");

const uploadImage = upload.array("image", 20);

router.post("/image-upload", auth, uploadImage, function (req, res) {
  let response = [];
  if (req.files instanceof Array == false) {
    return res.status(enums.HTTP_CODES.FORBIDDEN).json({
      success: false,
      message: `${messages.TYPE_NOT_SUPPORTED}`,
    });
  }
  for (var i = 0; i < req.files.length; i++) {
    response.push(req.files[ i ].location);
  }
  return res.json({ imageUrl: response });
});
router.delete("/delete", deleteImage, function (req, res) {
  const messaage = deleteImage.message;
  console.log("req.user", req.user);
  return res.status(200).json(req.user);
});
module.exports = router;
