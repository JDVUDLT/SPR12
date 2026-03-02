       function data(data) {
            return {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }
        }
        function Return(){
          savedUser = JSON.parse(localStorage.getItem('user'))
          if(savedUser.id != undefined){
            window.location.href = "/profile"
          }  
        }
        async function sendData(){         
         let log = document.getElementById("log").value
         let pass = document.getElementById("pass1").value 
          if(log != "" && pass != ""){
            const req = await fetch("/sendDataLogin", data ({
              log: log,
              pass: pass
}))
          const res = await req.json()
          switch(res.msg){
            case "Вы ввели неправильный логин или пароль":
              alert("Увы хуйня")
          default:
            localStorage.setItem('user', JSON.stringify(res.user))
            window.location.href = "/profile"
              }
}
        else{
          alert("Заполните все поля")
        }
}