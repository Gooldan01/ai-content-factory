# 🔒 Безопасная интеграция с Telegram Bot

## 📚 Обзор

Этот проект использует **серверную архитектуру** для безопасной отправки уведомлений в Telegram. Токен бота **никогда не попадает на клиентскую сторону**.

## 🏗️ Архитектура

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Браузер   │ ───> │  Ваш сервер  │ ───> │  Telegram   │
│  (клиент)   │      │ (api/telegram)│      │     API     │
└─────────────┘      └──────────────┘      └─────────────┘
                         ↑
                     Токен здесь
                     (защищён)
```

### ✅ Что защищено:
- 🔐 Токен бота хранится только на сервере
- 🚫 Невозможно увидеть токен в исходном коде сайта
- 🛡️ Rate limiting — защита от спама
- 🔒 Валидация данных — защита от инъекций
- 🌐 CORS — контроль источников запросов

---

## 📁 Структура файлов

```
AI Content Factory/
│
├── 📂 api/                         ← Серверная часть
│   ├── telegram.php                ← API endpoint (PHP)
│   ├── telegram.js                 ← API endpoint (Node.js)
│   ├── .htaccess                   ← Защита для PHP
│   ├── package.json                ← Зависимости Node.js
│   └── env.example                 ← Пример конфигурации
│
├── 📂 assets/
│   ├── main.js                     ← Клиентский код (БЕЗОПАСНЫЙ)
│   └── styles.css
│
├── 📄 index.html
│
├── 📖 SECURITY_SETUP.md            ← Полная инструкция
├── 📖 SECURITY_CHECKLIST.txt       ← Чеклист
├── 📖 TELEGRAM_SETUP.md            ← Создание бота
├── 📖 QUICK_START.txt              ← Быстрый старт
│
├── 🔧 vercel.json.example          ← Конфиг для Vercel
└── 🔧 netlify.toml.example         ← Конфиг для Netlify
```

---

## 🚀 Быстрый старт

### 1️⃣ Выберите платформу

| Платформа | Файл | Путь в `main.js` |
|-----------|------|------------------|
| **PHP хостинг** | `api/telegram.php` | `/api/telegram.php` |
| **Vercel** | `api/telegram.js` | `/api/telegram` |
| **Netlify** | `api/telegram.js` | `/.netlify/functions/telegram` |
| **VPS/Node.js** | `api/telegram.js` | `http://localhost:3000/api/telegram` |

### 2️⃣ Настройте токен

**Для PHP:**
```php
// api/telegram.php, строка 19-20
define('TELEGRAM_BOT_TOKEN', 'ВАШ_ТОКЕН');
define('TELEGRAM_CHAT_ID', 'ВАШ_CHAT_ID');
```

**Для Node.js:**
```bash
# Создайте файл .env
TELEGRAM_BOT_TOKEN=ВАШ_ТОКЕН
TELEGRAM_CHAT_ID=ВАШ_CHAT_ID
```

### 3️⃣ Укажите путь к API

```javascript
// assets/main.js, строка 705
const API_ENDPOINT = '/api/telegram.php';  // Ваш путь
```

### 4️⃣ Загрузите на сервер

- **PHP:** Загрузите папку `api/` на хостинг
- **Vercel:** `vercel deploy`
- **Netlify:** `netlify deploy`

### 5️⃣ Проверьте

1. Откройте сайт
2. Заполните форму
3. Проверьте Telegram

---

## 🔍 Проверка безопасности

### ✅ Чеклист

- [ ] Токен НЕ виден в исходном коде сайта (Ctrl+U)
- [ ] API endpoint доступен и отвечает
- [ ] Формы работают
- [ ] Уведомления приходят в Telegram
- [ ] CORS настроен на ваш домен (не `*`)
- [ ] Rate limiting работает

### 🧪 Тест безопасности

Выполните в консоли браузера (F12):

```javascript
// Проверка 1: Токен не виден
console.log('Проверка токена в коде...');
if (document.documentElement.innerHTML.includes('bot')) {
  console.warn('⚠️ Возможна утечка токена!');
} else {
  console.log('✅ Токен не найден в клиентском коде');
}

// Проверка 2: API защищён от GET
fetch('/api/telegram.php', {method: 'GET'})
  .then(r => r.json())
  .then(d => {
    if (d.error === 'Method not allowed') {
      console.log('✅ Защита от GET работает');
    }
  });
```

---

## 🛡️ Встроенная защита

### 1. Rate Limiting
- ⏱️ Максимум 1 запрос в 5 секунд с одного IP
- 🚫 Автоматическая блокировка спама

### 2. Валидация данных
- 🧹 Очистка HTML тегов
- 📏 Ограничение длины сообщений (4000 символов)
- ✔️ Проверка типа формы

### 3. CORS контроль
- 🌐 Ограничение источников запросов
- 🔐 Защита от cross-origin атак

### 4. HTTP методы
- ✅ Только POST и OPTIONS
- ❌ GET, PUT, DELETE блокируются

### 5. Дополнительные заголовки (PHP)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

---

## 🔧 Конфигурация

### PHP (.htaccess)

Файл `api/.htaccess` уже настроен:
- ✅ Ограничение методов
- ✅ Защита от directory listing
- ✅ Ограничение размера запроса (10KB)
- ✅ Блокировка .log файлов

### Node.js (переменные окружения)

Используйте файл `.env`:
```bash
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

Или переменные платформы:
- **Vercel:** Settings → Environment Variables
- **Netlify:** Site settings → Build & deploy → Environment
- **Heroku:** Settings → Config Vars

---

## 📊 Мониторинг

### Логирование (опционально)

**PHP:** Раскомментируйте в `telegram.php` строку 84:
```php
file_put_contents($logFile, $logEntry, FILE_APPEND);
```

**Node.js:** Логи автоматически в консоль:
```javascript
console.log('✅ Сообщение отправлено');
console.error('❌ Ошибка:', error);
```

### Проверка статуса

Создайте endpoint для проверки:
```php
// api/health.php
<?php
echo json_encode(['status' => 'ok', 'timestamp' => time()]);
```

---

## 🐛 Решение проблем

### "Failed to fetch"
- ✓ Проверьте путь к API в `main.js`
- ✓ Убедитесь что файл загружен на сервер
- ✓ Проверьте CORS заголовки

### "Method not allowed"
- ✓ Это нормально для GET запросов (защита работает!)
- ✓ Формы должны отправлять POST

### "Rate limit exceeded"
- ✓ Подождите 5 секунд между отправками
- ✓ Это защита от спама

### Уведомления не приходят
- ✓ Проверьте токен на сервере
- ✓ Убедитесь что бот активен (`/start`)
- ✓ Проверьте Chat ID
- ✓ Посмотрите логи сервера

---

## 📚 Документация

- **[SECURITY_SETUP.md](./SECURITY_SETUP.md)** — Полная инструкция по настройке
- **[SECURITY_CHECKLIST.txt](./SECURITY_CHECKLIST.txt)** — Быстрый чеклист
- **[TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)** — Создание Telegram бота
- **[QUICK_START.txt](./QUICK_START.txt)** — Быстрый старт за 3 минуты

---

## 🔐 Best Practices

### ✅ DO (Делайте)
- ✅ Храните токен только на сервере
- ✅ Используйте переменные окружения
- ✅ Настройте CORS на конкретный домен
- ✅ Включите rate limiting
- ✅ Валидируйте входные данные
- ✅ Логируйте отправки

### ❌ DON'T (Не делайте)
- ❌ НЕ храните токен в клиентском коде
- ❌ НЕ публикуйте токен в репозитории
- ❌ НЕ используйте `Access-Control-Allow-Origin: *` в production
- ❌ НЕ отключайте rate limiting
- ❌ НЕ доверяйте клиентским данным без валидации

---

## 📞 Поддержка

Если возникли проблемы:

1. **Проверьте чеклист** в `SECURITY_CHECKLIST.txt`
2. **Изучите логи** сервера
3. **Откройте консоль браузера** (F12)
4. **Проверьте документацию**

---

## ⚡ Производительность

### Оптимизация

- **PHP:** Используйте `file_get_contents()` с контекстом (уже реализовано)
- **Node.js:** Используйте встроенный `fetch` (Node 18+)
- **Кэширование:** Rate limiting уже кэширует запросы

### Масштабирование

Для больших нагрузок:
- 📊 Используйте Redis для rate limiting
- 🗄️ Логируйте в базу данных
- 🚀 Используйте очереди (Bull, RabbitMQ)
- ⚖️ Настройте load balancer

---

## 🎉 Заключение

Теперь ваша интеграция с Telegram:
- ✅ **Безопасна** — токен защищён
- ✅ **Надёжна** — есть защита от спама
- ✅ **Быстра** — минимум запросов
- ✅ **Масштабируема** — готова к росту

**Безопасность — это не опция, это необходимость!** 🔒

---

*Последнее обновление: 2025*

