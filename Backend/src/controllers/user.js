const User = require("../models/User");
const RefreshToken = require("../models/Token");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../helper/jwtService");
const createError = require("http-errors");

module.exports = {
  signUp: async (req, res, next) => {
    const { first_name, last_name, user_name, email, password } =
      req.verified.body;
    //check email was registered
    const existEmail = await User.findOne({ email });
    if (existEmail) {
      return res
        .status(401)
        .json({ success: false, message: "email is already registered" });
    }
    //check user_name was registered
    const existUserName = await User.findOne({ user_name });
    if (existUserName) {
      return res
        .status(401)
        .json({ success: false, message: "user name already exists" });
    }

    //create user & save user to db
    const newUser = new User({
      first_name,
      last_name,
      user_name,
      email,
      password,
    });
    await newUser.save();

    const token = await signAccessToken(newUser._id);
    const refreshToken = await signRefreshToken(newUser._id);

    res.setHeader("Authorization", token);
    res.setHeader("RefreshToken", refreshToken);

    return res.status(201).json({ success: true, user: { user_name } });
  },

  signIn: async (req, res, next) => {
    const { user } = req;
    const token = await signAccessToken(user._id);
    const refreshToken = await signRefreshToken(user._id);
    res.setHeader("Authorization", token);
    res.setHeader("RefreshToken", refreshToken);

    res.json({
      success: true,
      user: { avatar: user.avatar, user_name: user.user_name },
    });
  },

  getInfo: async (req, res, next) => {
    const { user_name } = req.verified.params;
    const user = await User.findOne({ user_name }, { __v: 0, password: 0 });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  },

  signOut: async (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw createError.BadRequest();
    }
    const { sub } = await verifyRefreshToken(refreshToken);
    const refreshTokenOdd = await RefreshToken.findOne({ userId: sub });
    await refreshTokenOdd.remove();
    res.status(200).json({
      success: true,
    });
  },

  refreshToken: async (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw createError.BadRequest();

    const { sub } = await verifyRefreshToken(refreshToken);

    const newToken = await signAccessToken(sub);
    const newRefreshToken = await signRefreshToken(sub);

    res.setHeader("Authorization", newToken);
    res.setHeader("RefreshToken", newRefreshToken);

    res.status(201).json({ success: true });
  },
};
