const express = require("express");
const server = express();
const fs = require("fs-extra");
server.listen(3000);
server.use(express.json());
server.use(express.static(__dirname + "/public"));
server.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
server.get("/Registration", (req, res) => {
  res.sendFile(__dirname + "/register.html");
});
server.get("/Login", (req, res) => {
  res.sendFile(__dirname + "/login.html");
});
server.get("/Profile", (req, res) => {
  res.sendFile(__dirname + "/profile.html");
});
server.get("/CreateTeam", (req, res) => {
  res.sendFile(__dirname + "/CreateTeam.html");
});
server.post("/sendDataRegistration", (req, res) => {
  let users = fs.readJSONSync("Users.json");
  let login = req.body;
  function getUserbyLogin(log) {
    return users.filter(function (users) {
      return users.log == log;
    });
  }
  let userlog = getUserbyLogin(login.log);
  if (userlog[0] === undefined) {
    users.push(login);
    fs.writeFileSync("Users.json", JSON.stringify(users, null, 4));
    res.json({
      user: req.body,
    });
  } else {
    res.json({
      msg: "Такой пользователь существует",
    });
  }
});
server.post("/sendDataLogin", (req, res) => {
  let login = req.body;
  let users = fs.readJSONSync("Users.json");
  function getUserbyLogin(log) {
    return users.filter(function (users) {
      return users.log == log;
    });
  }
  function getUserbyPass(pass) {
    return users.filter(function (users) {
      return users.pass == pass;
    });
  }
  let userlog = getUserbyLogin(login.log);
  let userpass = getUserbyPass(login.pass);
  if (userlog[0].log === login.log && userpass[0].pass === login.pass) {
    res.send({
      msg: "Вы успешно вошли",
      user: userlog[0],
    });
  } else {
    res.send({
      msg: "Вы ввели неправильный логин или пароль",
    });
  }
});
