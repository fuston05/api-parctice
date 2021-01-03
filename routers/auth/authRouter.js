// auth router
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mailer = require("../../nodeMailer");
// middleware
// express-validator
const { validationResult } = require("express-validator");
// express validator rules
const { registerValidation, passwordHash } = require("../../middleware");

const users = require("../users-model");
const dbConfig = require("../../data/db-config");

// verify a new registered user
router.get("/confirmEmail", (req, res) => {
  const { emailToken, u } = req.query;
  users
    .findByEmail(u)
    .then((resp) => {
      // compare tokens
      if (emailToken === resp.emailToken) {
        // if tokens match, update 'isVerified' to true in the DB
        console.log("tokens match");
        res
          .status(201)
          .send(
            "<p style= {background-color: blue; width: 50%; margin: 0 auto;}>Email verification was Successful!</p>"
          );
      } else {
        return res
          .status(400)
          .json({
            Error: "Could not verify your email, your link may have expired",
          });
        // tokens did not match, send error
      }
      console.log("res: ", resp);
    })
    .catch((err) => {
      console.log("err: ", err);
    });
});

// register a new user
// return 'id' on success, error message if validation fails
router.post("/register", registerValidation, passwordHash, (req, res) => {
  // check validation errors from the registerValidation middleware
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }

  // add emailToken to req.body
  req.body.emailToken = bcrypt.hashSync(
    `${Math.random() * Date.now()}`,
    parseInt(process.env.HASHING_ROUNDS)
  );
  users
    .register(req.body)
    .then(async (userRes) => {
      userRes[0].message = `Welcome, ${userRes[0].userName}`;
      const host = `${req.protocol}://${req.headers.host}`;
      console.log("host: ", host);
      // send verification email.
      mailer(req.body.email, req.body.emailToken, host).catch((err) => {
        console.log("mailer error: ", err);
        return res
          .status(400)
          .json({ error: "There was a problem sending the email" });
      });

      res.status(201).json(userRes[0]);
    })
    .catch((err) => {
      console.log("err: ", err);
      res.status(500).json({ Error: "Server error" });
    });
});

// login
router.post("/login", (req, res, next) => {
  // check if account NOT verified
  // send an error
  users
    .login(req.body)
    .then((loginRes) => {
      if (loginRes !== null) {
        // database results info
        const hashedPass = loginRes.password;
        const userId = loginRes.id;
        const userName = loginRes.userName;
        const userPrivilege = loginRes.privilege_id;

        // user passed info
        const password = info.password;

        // check password hash and username
        if (
          bcrypt.compareSync(password, hashedPass) &&
          info.userName === userName
        ) {
          // json web token
          const payload = {
            sub: userId,
            privilege: userPrivilege,
          };
          const sec = process.env.JWT_SECRET;
          const options = {
            expiresIn: "8h",
          };
          const token = jwt.sign(payload, sec, options);

          // return the welcome <userName> message and token
          res.status(200).json({
            message: `Welcome ${userName}`,
            token: token,
          });
        } else {
          //  if username and pass do not match
          res.status(401).json({ Error: "Invalid credentials" });
        }
      } else {
        // if no results were found
        res.status(404).json({ Error: "User does not exist" });
      }
    })
    .catch(next);
});

module.exports = router;
