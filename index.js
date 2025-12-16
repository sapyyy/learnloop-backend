const env = require("dotenv");
env.config();
const express = require("express");
const authRouter = require("./routes/auth");
const teacherRouter = require("./routes/teacher");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ status: "The server is running fine" });
});

// Use the auth routes
app.use("/api/auth", authRouter);
app.use("/api/teacher", teacherRouter);

app.listen(PORT, () => {
  console.log(`The server is running on ${PORT}`);
});

// default route
app.use((req, res) => {
  res.status(404).json({ status: "404: Bad Request" });
});
