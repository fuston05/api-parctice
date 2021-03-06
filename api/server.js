// server.js
const express = require("express");
const cors = require("cors");
const server = express();
const helmet = require("helmet");
const morgan = require("morgan");
const { assignId, accessLogStream, isLoggedIn } = require("../middleware");

// global middleware
server.use(helmet());
server.use(cors());
server.use(express.json());
// assignId is used in the morgan token 'id'
server.use(assignId);

// logs to '/logs/access.log' file
server.use(
  morgan(
    "id: :id, method: :method, date: :date(iso), remoteAddr: :remote-addr, url: :url, status: :status, userAgent: :user-agent, resTime: :response-time \n\n",
    { stream: accessLogStream }
  )
);

// define routers
const { userRouter, authRouter ,privilegeRouter, departmentsRouter } = require("../routers");

// use routers
server.use("/users", isLoggedIn, userRouter);
server.use("/auth", authRouter);
server.use("/privileges", isLoggedIn, privilegeRouter);
server.use("/departments", isLoggedIn, departmentsRouter);

// root route
server.get("/", (req, res) => {
  res.status(200).json("**** Welcome, the Server is live! ****");
});

// fall back case
server.use("/", (req, res) => {
  res.status(404).json({ Error: "Did not recognize that url" });
});

module.exports = server;
