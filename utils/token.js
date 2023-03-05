const jwt = require("jsonwebtoken");

exports.genetateToken = (userInfo) => {
  const payload = {
    email: userInfo.email,
    role: userInfo.role,
  };
  const token = jwt.sign(payload, process.env.TOKEN_SECRET, {
    expiresIn: "1days",
  });

  return token;
};
