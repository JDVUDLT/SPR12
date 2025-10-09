const express = require("express");
const server = express();
server.listen(3000);
server.use(express.json());
server.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});