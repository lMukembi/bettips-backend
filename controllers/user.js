const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const user = require("../models/user");

exports.register = async (req, res) => {
  const { username, phone, password } = req.body;

  let SECRET =
    "19d3a438700fe6dbdfaa74f0a494340f0d85b59041812ff39798947a5539d8b91b765fbd501818a1";
  let EXPIRE = "4h";

  const userAccount = await user.create({ username, phone, password });

  await userAccount.save();

  const result = { id: userAccount.id };
  const token = jwt.sign(result, SECRET, {
    expiresIn: EXPIRE,
  });

  res.status(200).json({ success: true, result: userAccount, data: token });
};

exports.login = async (req, res, next) => {
  const { phone, password } = req.body;

  let SECRET =
    "19d3a438700fe6dbdfaa74f0a494340f0d85b59041812ff39798947a5539d8b91b765fbd501818a1";
  let EXPIRE = "4h";

  const userAccount = await user.findOne({ phone });

  if (!userAccount) {
    return res.status(400).json({
      message: "The phone number is not yet registered",
    });
  }

  const passwordMatch = await bcrypt.compare(password, userAccount.password);

  if (!passwordMatch) {
    return res.status(404).json({ message: "The password does not match" });
  }

  const result = { id: userAccount.id };
  const token = jwt.sign(result, SECRET, {
    expiresIn: EXPIRE,
  });

  res.status(200).json({ success: true, result: userAccount, data: token });
};

exports.getUser = async (req, res, next) => {
  try {
    const userAccount = await user.findOne({ _id: req.params.id });

    res.status(200).json(userAccount);
  } catch (error) {
    res.status(404).json({ message: "Could not fetch the user please!" });
  }
};
