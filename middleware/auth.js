const jwt = require("jsonwebtoken");
const user = require("../models/user");

exports.protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split("Bearer ")[1];
  }

  try {
    if (token === undefined) {
      return res
        .status(403)
        .json({ error: "You are not Authorized to access this account" });
    }

    let decoded = "";

    decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userExists = await user.findById(decoded.id);
    console.log(userExists);
    if (!userExists) {
      return res
        .status(404)
        .json({ message: "This user token does not exist" });
    }

    req.userExists = userExists;

    next();
  } catch (error) {
    res.status(400).json({
      message: "You are not authorized to access private data",
      error,
    });
  }
};
