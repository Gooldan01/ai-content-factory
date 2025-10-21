/**
 * Серверный endpoint для безопасной отправки данных в Telegram (Node.js)
 * 
 * Подходит для:
 * - Vercel Serverless Functions
 * - Netlify Functions
 * - AWS Lambda
 * - Любой Node.js сервер
 */

// ============================================
// КОНФИГУРАЦИЯ: ТОЛЬКО ЧЕРЕЗ ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ
// ============================================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  throw new Error('Server misconfiguration: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not set');
}

// Дополнительная защита
const RATE_LIMIT_SECONDS = 5;
const MAX_MESSAGE_LENGTH = 4000;

// Хранилище для rate limiting (в production используйте Redis или базу данных)
const requestLog = new Map();

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Проверка rate limit по IP
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const lastRequest = requestLog.get(ip);
  
  if (lastRequest && (now - lastRequest) < RATE_LIMIT_SECONDS * 1000) {
    return false;
  }
  
  requestLog.set(ip, now);
  
  // Очистка старых записей
  if (requestLog.size > 1000) {
    const oldestKey = requestLog.keys().next().value;
    requestLog.delete(oldestKey);
  }
  
  return true;
}

/**
 * Получение IP адреса клиента
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         'unknown';
}

/**
 * Валидация и очистка данных
 */
function sanitizeInput(data) {
  if (typeof data === 'string') {
    return data.trim().substring(0, 500); // Ограничение длины
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Экранирование HTML для Telegram
 */
function escapeHTML(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  };
  return text.replace(/[&<>]/g, (m) => map[m]);
}

/**
 * Отправка сообщения в Telegram
 */
async function sendToTelegram(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error('Telegram API Error:', error);
    return false;
  }
}

/**
 * Формирование сообщения из данных формы
 */
function formatMessage(data) {
  let message = '';
  
  switch (data.type) {
    case 'lead': // Форма заявки с модулями
      message = '🎯 <b>НОВАЯ ЗАЯВКА С САЙТА</b>\n\n';
      
      if (data.contact) {
        message += `📱 <b>Контакт:</b> ${escapeHTML(data.contact)}\n`;
      }
      
      if (data.email) {
        message += `📧 <b>Email:</b> ${escapeHTML(data.email)}\n`;
      }
      
      if (data.message) {
        message += `💬 <b>Сообщение:</b>\n${escapeHTML(data.message)}\n`;
      }
      
      if (data.modules && Array.isArray(data.modules) && data.modules.length > 0) {
        message += '\n📦 <b>Выбранные модули:</b>\n';
        data.modules.forEach(module => {
          message += `  • ${escapeHTML(module)}\n`;
        });
      }
      
      if (data.total) {
        message += `\n💰 <b>Итого:</b> ${escapeHTML(data.total)}`;
      }
      break;
      
    case 'consultation': // Форма консультации
      message = '🎯 <b>НОВАЯ ЗАЯВКА НА КОНСУЛЬТАЦИЮ</b>\n\n';
      
      if (data.name) {
        message += `👤 <b>Имя:</b> ${escapeHTML(data.name)}\n`;
      }
      
      if (data.contact) {
        message += `📱 <b>Контакт:</b> ${escapeHTML(data.contact)}\n`;
      }
      
      message += '\n📍 <b>Форма:</b> Запись на консультацию (футер сайта)';
      break;
      
    default:
      throw new Error('Unknown form type');
  }
  
  return message;
}

// ============================================
// ОСНОВНОЙ ОБРАБОТЧИК
// ============================================

/**
 * Основная функция-обработчик
 * Для Vercel/Netlify используйте export default
 * Для Express используйте как middleware
 */
async function handler(req, res) {
  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*'); // В production замените на ваш домен!
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Обработка preflight запроса
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Принимаем только POST
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }
  
  try {
    // Получение IP и проверка rate limit
    const clientIP = getClientIP(req);
    
    if (!checkRateLimit(clientIP)) {
      res.status(429).json({
        success: false,
        error: 'Слишком частые запросы. Пожалуйста, подождите.'
      });
      return;
    }
    
    // Получение и валидация данных
    const data = sanitizeInput(req.body);
    
    if (!data || !data.type) {
      res.status(400).json({
        success: false,
        error: 'Invalid data format'
      });
      return;
    }
    
    // Формирование сообщения
    const message = formatMessage(data);
    
    // Проверка длины
    if (message.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({
        success: false,
        error: 'Message too long'
      });
      return;
    }
    
    // Отправка в Telegram
    const success = await sendToTelegram(message);
    
    if (success) {
      res.status(200).json({
        success: true,
        message: 'Заявка успешно отправлена'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Ошибка отправки в Telegram'
      });
    }
    
  } catch (error) {
    console.error('Handler Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// ============================================
// ЭКСПОРТЫ
// ============================================

// Для Vercel Serverless Functions
module.exports = handler;

// Для ES modules (если используете)
// export default handler;

// Для локальной разработки с Express
if (require.main === module) {
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  app.post('/api/telegram', handler);
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Endpoint: http://localhost:${PORT}/api/telegram`);
  });
}

