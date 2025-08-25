const env = require("dotenv");
env.config();
const express = require("express");
const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ status: "The server is running fine" });
});

app.listen(PORT, () => {
  console.log(`The server is running on ${PORT}`);
});
