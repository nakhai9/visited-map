require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser")

const uploadRouter = require("./routes/upload");
const checkHealthRouter = require("./routes/health");
const app = express();

// Middleware parse JSON
app.use(express.json());
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route test
app.get("/", (req, res) => {
    res.send("Server Node.js đang chạy 🚀");
});

// API ví dụ
app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello World" });
});

app.use("/health", checkHealthRouter)
app.use("/api/upload/", uploadRouter);

// Start server
app.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${process.env.PORT || 3200}`);
});
