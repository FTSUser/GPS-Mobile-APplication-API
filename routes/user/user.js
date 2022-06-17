const express = require("express");
const router = express.Router();
const userController = require("../../controllers/user/user");
const auth = require("../../middleware/auth");

// Post Methods

// *route    POST /sign-up
// ?desc     Add user
// @access   user
router.post("/sign-up", userController.createUser);

// *route    POST /login
// ?desc     Login user
// @access   user
router.post("/login", userController.userLogin);

// *route    PUT /updateUser
// ?desc     Update user
// @access   user
router.put("/update-user", auth, userController.updateUser);

// *route    PUT /password-reset
// ?desc     Reset password
// @access   user
router.put("/password-reset", auth, userController.passwordUpdate);

//* route    PUT /on-off-location
// ?desc     Update user location
// @access   user
router.put("/on-off-location", auth, userController.onOffLocation);

// *route    PUT /update-location
// ?desc     Update user location
// @access   user
router.put("/update-location", auth, userController.updateLocation);

// Get Methods
// *route    GET /get-user
// ?desc     Get user
// @access   user
router.get("/get-user", auth, userController.getUser);


// *route    GET /get-on-users
// ?desc     Get on users
// @access   user
router.get("/get-on-users", auth, userController.getUserForLocation);


// *route    GET /get-one-user
// ?desc     Get one user
// @access   user
router.get("/get-one-user", auth, userController.getOnlyOneUser);

module.exports = router;
