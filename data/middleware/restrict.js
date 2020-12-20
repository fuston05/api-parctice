const jwt = require("jsonwebtoken");

// make sure user credentials and role are good.

const restrict = (req, res, next) => {
  const token = req.headers.authorization;
  const sec = process.env.JWT_SECRET;
  const decoded = jwt.verify(token, sec);
  console.log('decoded', decoded);
  next();
};

module.exports = {
  restrict,
};
