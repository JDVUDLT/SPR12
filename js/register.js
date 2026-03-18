// Функция для подготовки данных (оставляем как есть)
function data(data) {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
}

// Основная функция регистрации
async function sendDataRegistration() {
  // Получаем значения полей
  const name = document.getElementById("name").value.trim();
  const login = document.getElementById("log").value.trim();
  const password = document.getElementById("pass1").value;
  const confirmPassword = document.getElementById("pass2").value;
  
  // 1. ПРОВЕРКА ЗАПОЛНЕНИЯ ПОЛЕЙ
  if (!name || !login || !password) {
    alert("Пожалуйста, заполните все поля");
    return;
  }
  
  // 2. ПРОВЕРКА МИНИМАЛЬНОЙ ДЛИНЫ
  if (login.length < 3) {
    alert("Логин должен содержать минимум 3 символа");
    return;
  }
  
  if (password.length < 6) {
    alert("Пароль должен содержать минимум 6 символов");
    return;
  }
  
  // 3. ПРОВЕРКА СОВПАДЕНИЯ ПАРОЛЕЙ
  if (password !== confirmPassword) {
    alert("Пароли не совпадают");
    return;
  }
  
  try {
    // 4. ПОКАЗЫВАЕМ, ЧТО ИДЕТ ЗАГРУЗКА
    const submitButton = document.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = "Регистрация...";
    submitButton.disabled = true;
    
    // 5. ОТПРАВЛЯЕМ ЗАПРОС (без id - пусть сервер генерирует)
    const response = await fetch("/sendDataRegistration", data({
      name: name,
      login: login,    // переименовал для понятности
      password: password
    }));
    
    // 6. ПРОВЕРЯЕМ, ЧТО ОТВЕТ ВООБЩЕ ПОЛУЧИЛИ
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // 7. ПАРСИМ ОТВЕТ
    const result = await response.json();
    
    // 8. ОБРАБАТЫВАЕМ ОТВЕТ (исправляем логику)
    if (result.msg === "Такой пользователь существует") {
      alert("Пользователь с таким логином уже существует. Пожалуйста, выберите другой логин.");
      // Возвращаем кнопку в исходное состояние
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    } else if (result.user) {
      // Успешная регистрация
      alert("Регистрация прошла успешно!");
      
      // Сохраняем информацию о пользователе (опционально)
      localStorage.setItem("user", JSON.stringify(result.user));
      
      // Перенаправляем на страницу профиля
      window.location.href = "/profile";
    } else {
      // Неизвестный ответ от сервера
      alert("Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.");
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
    
  } catch (error) {
    // 9. ОБРАБОТКА ОШИБОК СЕТИ
    console.error("Ошибка регистрации:", error);
    alert("Ошибка соединения с сервером. Проверьте подключение к интернету.");
    
    // Возвращаем кнопку в исходное состояние
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.textContent = "Зарегистрироваться";
      submitButton.disabled = false;
    }
  }
}