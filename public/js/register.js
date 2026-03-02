function data(data) {
        return {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        };
      }
      async function sendDataRegistration() {
        let name = document.getElementById("name").value;
        let log = document.getElementById("log").value;
        let pass = document.getElementById("pass1").value;
        let pass2 = document.getElementById("pass2").value;
        let id = Math.random().toString(36).slice(-8);
        if (name != "" && log != "" && pass != "") {
          switch(pass){
            case pass2: 
              const req = await fetch("/sendDataRegistration", data({
                  name: name,
                  log: log,
                  pass: pass,
                  id: id,
                })
              );
              const res = await req.json()
              switch(res.msg){
                case "Такой пользователь существует":
                  alert("Люблю тебя бро")
              default:
                window.location.href = "/profile"
              }
              break
            default:
              alert("Пароли не совпадают")
          }
        } 
        else {
          alert("Заполните все поля");
        }
      }
      