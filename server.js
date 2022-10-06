const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require("knex");
const register = require("./controllers/register");
const signin = require("./controllers/signin");
const profile = require("./controllers/profile");
const image = require("./controllers/image");
const { Pool } = require("pg");
const morgan = require("morgan");
const nodemailer = require("nodemailer");

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "1";

const pool = new Pool({
  connection: process.env.POSTGRES_URI,

  ssl: process.env.DATABASE_URI ? true : false,
});

// const db = knex({
//   client: "pg",
//   connection: {
//     host: "127.0.0.1",
//     user: "postgres",
//     port: 5432,
//     password: "Moshe6700",
//     database: "smart-brain",
//   },
// });

const db = knex({
  client: "pg",
  connection: process.env.POSTGRES_URI,

  ssl: {
    rejectUnauthorized: false,
  },
});

const app = express();

app.use(bodyParser.json());
app.use(morgan("combined"));
app.use(cors());

app.get("/", (req, res) => {
  res.send("it is working");
});
app.post("/signin", (req, res) => {
  signin.handleSignin(req, res, db, bcrypt);
});
app.post("/register", (req, res) => {
  register.handleRegister(req, res, db, bcrypt);
});
app.get("/profile/:id", (req, res) => {
  profile.handleProfile(req, res, db);
});
app.post("/profile/:id", (req, res) => {
  profile.handleProfileUpdate(req, res, db);
});
app.put("/image", (req, res) => {
  image.handleImage(req, res, db);
});
app.post("/imageurl", (req, res) => {
  image.handleApiCall(req, res);
});
app.post("/sendResetPassowrdLink", (req, res) => {
  const email = req.body.email;
  pool.query(`SELECT * FROM login WHERE email='${email}'`).then((data) => {
    if (data.rowCount === 0) {
      return res
        .status(401)
        .json({ message: "user with that email does not exists" });
    }
    const { email } = data.rows[0];
    const emailBody = `your sever url is http://localhost:3001/resetpassword/${btoa(
      email
    )}`;
    res.send(emailBody);
  });
});
app.get("/resetpassword/:token", (req, res) => {
  const email = atob(req.params.token);
  const { newPassowrd, newPassowrdConfirm } = req.body;
  if (newPassowrd !== newPassowrdConfirm) {
    return res.status(400).json({ message: "passowrd does not match" });
  }
  const hash = bcrypt.hashSync(newPassowrd);
  pool
    .query(`UPDATE login SET hash='${hash}' WHERE email='${email}'`)
    .then((data) => {
      if (data.rowCount === 1) {
        return res
          .status(200)
          .json({ message: "password updated successfully" });
      }
    });
});

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: (process.env.OAUTH_REFRESH_TOKEN = 1), //04o404QuM8qbYCgYIARAAGAQSNwF-L9Ir5Tqflflp6H2_vMc0brZivhsKHuzE0muBN_6vBs2rKtwdGGEAP891DuKpi5VZNhbSzT8,
  },
});

let mailOptions = {
  from: "arye6700@gmail.com",
  to: "arye6700@gmail.com",
  subject: "Nodemailer Project",
  text: "Hi from your nodemailer project",
};

transporter.sendMail(mailOptions, function (err, data) {
  if (err) {
    console.log("Error " + err);
  } else {
    console.log("Email sent successfully");
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`app is running on port ${PORT}`);
});
