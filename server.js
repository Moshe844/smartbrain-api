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

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "1";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:Moshe6700@localhost:5432/smart-brain",
  ssl: process.env.DATABASE_URL ? true : false,
});

const db = knex({
  client: "pg",
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  },
});

const app = express();

app.use(bodyParser.json());
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
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`app is running on port ${PORT}`);
});
