import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const CLIENT_ID = "104576196378-e5u7o8ahfl73d344kgm8m07rpd82j0qb.apps.googleusercontent.com";
const JWT_SECRET = "v9pt9w7GhX4ngrTq3GL68070Rn0S0boL5LuXsS5LmRc=";

let DATABASE_NAME = "sandgame";

let api = express.Router();
let Users;
let Saves;

const initApi = async (app) => {
  app.set("json spaces", 2);
  app.use("/api", api);

  let conn = await MongoClient.connect("mongodb://127.0.01");
  let db = conn.db(DATABASE_NAME);
  Users = db.collection("users");
  Saves = db.collection("saves");
};

api.use(bodyParser.json());
api.use(cors());

api.get("/", (req, res) => {
  res.json({ message: "Hello, world!" });
});

api.get("/users", async (req, res) => {
  let id = req.params.id;
  let user = await Users.findOne({ id: id });
})

api.get("/users/:id", async (req, res) => {
  let user = await Users.findOne({ id: id });
})

// TODO do middleware
api.use("/saves/:id", async (req, res, next) => {
  let id = req.params.id;
  let save = await Saves.findOne({ id: id });
  res.locals.id = id;
  res.locals.save = save;
  next();
})

api.use("/protected", async (req, res, next) => {
  const error = () => { res.status(403).json({ error: "Access denied" }); };
  let header = req.header("Authorization");
  if (!header) return error();
  let [type, value] = header.split(" ");
  if (type !== "Bearer") return error();
  try {
    let verified = jwt.verify(value, JWT_SECRET);
    res.locals.name = verified.name;
    next();
  } catch (e) {
    console.error(e);
    error();
  }
});

api.post("/saves/:id", async (req, res) => {
  let id = res.locals.id;
  let pxs = req.body.pxs;
  let date = req.body.date;
  await Saves.updateOne(
    { id: id },
    { $set: {
      isUsed: "true",
      dateSaved: date,
      data: pxs }
    }
  );
})

api.patch("/saves/:id/data", async (req, res) => {
  let save = res.locals.save;
  let data = save.data;
})

api.get("/saves/:id/", async (req, res) => {
  let save = res.locals.save;
  res.json(save);
})

api.delete("/saves/:id", async (req, res) => {
  let id = res.locals.id;
  await Saves.updateOne(
    { id: id },
    { $set: {
      isUsed: "false",
      dateSaved: null,
      data: {} }
    }
  );
})

api.post("/login", async (req, res) => {
  let idToken = req.body.idToken;
  let client = new OAuth2Client();
  let data;
  try {
    let login = await client.verifyIdToken({ idToken, audience: CLIENT_ID });
    data = login.getPayload();
  } catch (e) {
    console.error(e);
    res.status(403).json({ error: "Invalid ID token" });
  }
  let email = data.email;
  let name = data.name;
  let apiKey = jwt.sign({ email, name }, JWT_SECRET, { expiresIn: "1d" });
  res.json({ apiKey });
});

api.get("/protected", async (req, res) => {
  res.json(res.locals.name);
})

/* Catch-all route to return a JSON error if endpoint not defined.
   Be sure to put all of your endpoints above this one, or they will not be called. */
api.all("/*", (req, res) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.url}` });
});

export default initApi;
