<?php
/**
 * Серверный endpoint для безопасной отправки данных в Telegram
 * 
 * ВАЖНО: Храните этот файл вне публичной директории или защитите через .htaccess
 */

// Настройки CORS (если сайт на другом домене)
header('Access-Control-Allow-Origin: https://marketfactory.su'); // В production замените * на ваш домен!
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Обработка preflight запроса
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Принимаем только POST запросы
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// ============================================
// КОНФИГУРАЦИЯ ЧЕРЕЗ ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ
// ============================================
$BOT_TOKEN = getenv('TELEGRAM_BOT_TOKEN');
$CHAT_ID   = getenv('TELEGRAM_CHAT_ID');

if (!$BOT_TOKEN || !$CHAT_ID) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server misconfiguration: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set'
    ]);
    exit;
}

// Дополнительная защита
define('RATE_LIMIT_SECONDS', 5); // Минимальный интервал между отправками
define('MAX_MESSAGE_LENGTH', 4000); // Максимальная длина сообщения

// ============================================
// ФУНКЦИИ
// ============================================

/**
 * Простая защита от спама через сессии
 */
function checkRateLimit() {
    session_start();
    
    $currentTime = time();
    $lastSubmit = isset($_SESSION['last_submit']) ? $_SESSION['last_submit'] : 0;
    
    if ($currentTime - $lastSubmit < RATE_LIMIT_SECONDS) {
        return false;
    }
    
    $_SESSION['last_submit'] = $currentTime;
    return true;
}

/**
 * Валидация и очистка входных данных
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * Отправка сообщения в Telegram
 */
function sendToTelegram($message) {
    global $BOT_TOKEN, $CHAT_ID;
    $url = 'https://api.telegram.org/bot' . $BOT_TOKEN . '/sendMessage';
    
    $data = [
        'chat_id' => $CHAT_ID,
        'text' => $message,
        'parse_mode' => 'HTML',
        'disable_web_page_preview' => true
    ];
    
    $options = [
        'http' => [
            'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
            'method'  => 'POST',
            'content' => http_build_query($data),
            'timeout' => 10
        ]
    ];
    
    $context = stream_context_create($options);
    $result = @file_get_contents($url, false, $context);
    
    if ($result === false) {
        return false;
    }
    
    $response = json_decode($result, true);
    return isset($response['ok']) && $response['ok'] === true;
}

/**
 * Логирование (опционально)
 */
function logSubmission($message, $success) {
    $logFile = __DIR__ . '/submissions.log';
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $status = $success ? 'SUCCESS' : 'FAILED';
    
    $logEntry = "[$timestamp] [$status] IP: $ip\n";
    
    // Раскомментируйте, если нужно логирование
    // file_put_contents($logFile, $logEntry, FILE_APPEND);
}

// ============================================
// ОСНОВНАЯ ЛОГИКА
// ============================================

// Проверка rate limit
if (!checkRateLimit()) {
    http_response_code(429);
    echo json_encode([
        'success' => false, 
        'error' => 'Слишком частые запросы. Пожалуйста, подождите.'
    ]);
    exit;
}

// Получение и валидация данных
$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

if (!$data || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid data format']);
    exit;
}

// Очистка данных
$data = sanitizeInput($data);

// Формирование сообщения
$message = '';

if (isset($data['type'])) {
    switch ($data['type']) {
        case 'lead': // Форма заявки с модулями
            $message = "🎯 <b>НОВАЯ ЗАЯВКА С САЙТА</b>\n\n";
            
            if (isset($data['contact']) && !empty($data['contact'])) {
                $message .= "📱 <b>Контакт:</b> " . $data['contact'] . "\n";
            }
            
            if (isset($data['email']) && !empty($data['email'])) {
                $message .= "📧 <b>Email:</b> " . $data['email'] . "\n";
            }
            
            if (isset($data['message']) && !empty($data['message'])) {
                $message .= "💬 <b>Сообщение:</b>\n" . $data['message'] . "\n";
            }
            
            if (isset($data['modules']) && is_array($data['modules']) && count($data['modules']) > 0) {
                $message .= "\n📦 <b>Выбранные модули:</b>\n";
                foreach ($data['modules'] as $module) {
                    $message .= "  • " . $module . "\n";
                }
            }
            
            if (isset($data['total']) && !empty($data['total'])) {
                $message .= "\n💰 <b>Итого:</b> " . $data['total'];
            }
            break;
            
        case 'consultation': // Форма консультации
            $message = "🎯 <b>НОВАЯ ЗАЯВКА НА КОНСУЛЬТАЦИЮ</b>\n\n";
            
            if (isset($data['name']) && !empty($data['name'])) {
                $message .= "👤 <b>Имя:</b> " . $data['name'] . "\n";
            }
            
            if (isset($data['contact']) && !empty($data['contact'])) {
                $message .= "📱 <b>Контакт:</b> " . $data['contact'] . "\n";
            }
            
            $message .= "\n📍 <b>Форма:</b> Запись на консультацию (футер сайта)";
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Unknown form type']);
            exit;
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Form type not specified']);
    exit;
}

// Проверка длины сообщения
if (strlen($message) > MAX_MESSAGE_LENGTH) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Message too long']);
    exit;
}

// Отправка в Telegram
$success = sendToTelegram($message);

// Логирование
logSubmission($message, $success);

// Ответ клиенту
if ($success) {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Заявка успешно отправлена']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Ошибка отправки в Telegram']);
}

