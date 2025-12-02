const express = require("express");
const server = express();
server.listen(3000);
server.use(express.json());
server.use(express.static(__dirname + "/public"));
server.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
