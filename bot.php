<?php
// linebot/bot.php

include "../connection.php";

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-error.log');

// ป้องกันกรณี PHP 5.3 หรือต่ำกว่า ที่ยังไม่มี JSON_UNESCAPED_UNICODE / JSON_PRETTY_PRINT
if (!defined('JSON_UNESCAPED_UNICODE')) {
    define('JSON_UNESCAPED_UNICODE', 0);
}
if (!defined('JSON_PRETTY_PRINT')) {
    define('JSON_PRETTY_PRINT', 0);
}

/* =========================================================
 * 1) รับ id จาก GET ใช้ทั้งเลือก OA ใน DB และชื่อโฟลเดอร์ history/linehistory
 * =======================================================*/
$idRaw = isset($_GET['id']) ? $_GET['id'] : '1';
$historyId = preg_replace('/[^a-zA-Z0-9_-]/', '', $idRaw);
if ($historyId === '') {
    $historyId = '1';
}
$lineOaId = (int)$historyId;
if ($lineOaId <= 0) {
    $lineOaId = 1;
}

/* ถ้าไม่มี $pdo เลย ให้ออก */
if (!isset($pdo) || !$pdo) {
    file_put_contents(
        __DIR__ . '/php-error.log',
        date('Y-m-d H:i:s') . " [id={$historyId}] ERROR: PDO not available" . PHP_EOL,
        FILE_APPEND
    );
    http_response_code(500);
    exit('DB connection error');
}

/* =========================================================
 * 2) ดึง TOKEN & SECRET จากตาราง line_oa (ใช้ PDO เท่านั้น)
 * =======================================================*/
$channelAccessToken = '';
$channelSecret      = '';

try {
    $sql = "SELECT line_oa_accesstoken, line_oa_channelsecret
            FROM line_oa
            WHERE line_oa_id = :id
            LIMIT 1";
    $sth = $pdo->prepare($sql);
    $sth->execute(array(':id' => $lineOaId));
    $row = $sth->fetch(PDO::FETCH_ASSOC);

    if ($row && isset($row['line_oa_accesstoken']) && isset($row['line_oa_channelsecret'])) {
        $channelAccessToken = $row['line_oa_accesstoken'];
        $channelSecret      = $row['line_oa_channelsecret'];
    } else {
        file_put_contents(
            __DIR__ . '/php-error.log',
            date('Y-m-d H:i:s') . " [id={$historyId}] ERROR: line_oa not found for id {$lineOaId}" . PHP_EOL,
            FILE_APPEND
        );
        http_response_code(500);
        exit('LINE OA config not found');
    }
} catch (Exception $e) {
    file_put_contents(
        __DIR__ . '/php-error.log',
        date('Y-m-d H:i:s') . " [id={$historyId}] DB ERROR: " . $e->getMessage() . PHP_EOL,
        FILE_APPEND
    );
    http_response_code(500);
    exit('DB error');
}

/* =========================================================
 * 3) Helper: ดึง Profile จาก LINE (ใช้ตอน follow)
 * =======================================================*/
function getLineProfile($userId, $accessToken)
{
    $url = 'https://api.line.me/v2/bot/profile/' . urlencode($userId);

    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => array(
            'Authorization: Bearer ' . $accessToken
        )
    ));
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err      = curl_error($ch);
    curl_close($ch);

    if ($httpCode != 200 || $err) {
        return array();
    }

    $data = json_decode($response, true);
    if (!is_array($data)) {
        return array();
    }
    return $data;
}

/* =========================================================
 * 4) Helper: upsert ลงตาราง line_oa_user (ใช้ตอน follow สำหรับ name / photo)
 *    ✅ เพิ่ม line_oa_id
 * =======================================================*/
function upsertLineOaUser($uid, $name, $photo, $lineOaId, $pdo)
{
    $uid      = (string)$uid;
    $name     = trim((string)$name);
    $photo    = trim((string)$photo);
    $lineOaId = (int)$lineOaId;

    try {
        if ($uid === '' || $lineOaId <= 0) {
            return;
        }

        $sql = "INSERT INTO line_oa_user
                    (line_oa_user_uid, line_oa_id, line_oa_user_name, line_oa_user_photo, line_oa_user_lastupdate)
                VALUES (:uid, :line_oa_id, :name, :photo, NOW())
                ON DUPLICATE KEY UPDATE
                    line_oa_user_name = IF(VALUES(line_oa_user_name) <> '', VALUES(line_oa_user_name), line_oa_user_name),
                    line_oa_user_photo = IF(VALUES(line_oa_user_photo) <> '', VALUES(line_oa_user_photo), line_oa_user_photo),
                    line_oa_user_lastupdate = VALUES(line_oa_user_lastupdate)";
        $sth = $pdo->prepare($sql);
        $sth->execute(array(
            ':uid'        => $uid,
            ':line_oa_id' => $lineOaId,
            ':name'       => $name,
            ':photo'      => $photo
        ));
    } catch (Exception $e) {
        file_put_contents(
            __DIR__ . '/php-error.log',
            date('Y-m-d H:i:s') . " upsertLineOaUser ERROR: " . $e->getMessage() . PHP_EOL,
            FILE_APPEND
        );
    }
}


/* =========================================================
 * 5) Helper: บันทึก/อัปเดต email ของ user (PDO เท่านั้น)
 *    ✅ เพิ่ม line_oa_id (ตอน insert/update)
 * =======================================================*/
function saveUserEmail($uid, $email, $lineOaId, $pdo)
{
    $uid      = (string)$uid;
    $email    = (string)$email;
    $lineOaId = (int)$lineOaId;

    if ($uid === '' || $email === '') {
        return;
    }

    try {
        // อัปเดตก่อน
        $sql = "UPDATE line_oa_user
        SET line_oa_user_email = :email,
            line_oa_user_lastupdate = NOW()
        WHERE line_oa_user_uid = :uid
          AND line_oa_id = :line_oa_id";

        $sth = $pdo->prepare($sql);
        $sth->execute(array(
            ':line_oa_id' => $lineOaId,
            ':email'      => $email,
            ':uid'        => $uid
        ));

        // ถ้าไม่มีแถว (rowCount = 0) ให้ insert ใหม่แบบ minimal
        if ($sth->rowCount() == 0) {
            $sqlIns = "INSERT INTO line_oa_user
                        (line_oa_user_uid, line_oa_id, line_oa_user_email, line_oa_user_lastupdate)
                       VALUES (:uid, :line_oa_id, :email, NOW())";
            $sthIns = $pdo->prepare($sqlIns);
            $sthIns->execute(array(
                ':uid'        => $uid,
                ':line_oa_id' => $lineOaId,
                ':email'      => $email
            ));
        }
    } catch (Exception $e) {
        file_put_contents(
            __DIR__ . '/php-error.log',
            date('Y-m-d H:i:s') . " saveUserEmail ERROR: " . $e->getMessage() . PHP_EOL,
            FILE_APPEND
        );
    }
}

/* =========================================================
 * 6) Helper: อัปเดตข้อมูล lastchat + seen + replyToken
 *    ✅ เพิ่ม line_oa_id (ตอน insert/update)
 * =======================================================*/
function updateLastChatMeta($uid, $replyToken, $lineOaId, $pdo)
{
    $uid        = (string)$uid;
    $replyToken = (string)$replyToken;
    $lineOaId   = (int)$lineOaId;

    if ($uid === '' || $lineOaId <= 0) {
        return;
    }

    $now = date('Y-m-d H:i:s');

    try {
        $sql = "UPDATE line_oa_user
                SET line_oa_user_lastchat = :dt,
                    line_oa_user_lastchat_seen = 'n',
                    line_oa_user_lastchat_replytoken = :rt,
                    line_oa_user_lastupdate = :dt
                WHERE line_oa_user_uid = :uid
                  AND line_oa_id = :line_oa_id";
        $sth = $pdo->prepare($sql);
        $sth->execute(array(
            ':dt'         => $now,
            ':rt'         => $replyToken,
            ':uid'        => $uid,
            ':line_oa_id' => $lineOaId
        ));

        if ($sth->rowCount() == 0) {
            // ✅ ไม่มีแถวของ uid+oa -> insert ใหม่
            $sqlIns = "INSERT INTO line_oa_user
                        (line_oa_user_uid,
                         line_oa_id,
                         line_oa_user_lastchat,
                         line_oa_user_lastchat_seen,
                         line_oa_user_lastchat_replytoken,
                         line_oa_user_lastupdate)
                       VALUES
                        (:uid, :line_oa_id, :dt, 'n', :rt, :dt)";
            $sthIns = $pdo->prepare($sqlIns);
            $sthIns->execute(array(
                ':uid'        => $uid,
                ':line_oa_id' => $lineOaId,
                ':dt'         => $now,
                ':rt'         => $replyToken
            ));
        }
    } catch (Exception $e) {
        file_put_contents(
            __DIR__ . '/php-error.log',
            date('Y-m-d H:i:s') . " updateLastChatMeta ERROR: " . $e->getMessage() . PHP_EOL,
            FILE_APPEND
        );
    }
}

/* =========================================================
 * 6.1) Helper: สร้าง URL เต็มจาก path รูป (รองรับทั้ง http และ path)
 * =======================================================*/
function toAbsoluteUrl($path)
{
    $path = trim((string)$path);
    if ($path === '') return '';

    // ถ้าเป็น URL อยู่แล้ว
    if (preg_match('~^https?://~i', $path)) {
        return $path;
    }

    // สร้างเป็น https://domain/xxx
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
    if ($host === '') return $path;

    $path = ltrim($path, '/');
    return 'https://' . $host . '/' . $path;
}

/* =========================================================
 * 6.2) Helper: reply message ไปที่ LINE
 * =======================================================*/
function lineReply($replyToken, $messages, $accessToken, $curlLogFile, $historyId)
{
    $replyToken = (string)$replyToken;
    if ($replyToken === '' || empty($messages) || !is_array($messages)) {
        return false;
    }

    // LINE จำกัด 5 ข้อความต่อ reply
    if (count($messages) > 5) {
        $messages = array_slice($messages, 0, 5);
    }

    $payload = array(
        "replyToken" => $replyToken,
        "messages"   => array_values($messages)
    );

    $json = json_encode($payload, JSON_UNESCAPED_UNICODE);

    $ch = curl_init('https://api.line.me/v2/bot/message/reply');
    curl_setopt_array($ch, array(
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => array(
            'Content-Type: application/json',
            'Authorization: Bearer ' . $accessToken
        ),
        CURLOPT_POSTFIELDS     => $json
    ));

    $resp = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    file_put_contents(
        $curlLogFile,
        date('Y-m-d H:i:s') . " [id={$historyId}] REPLY http={$httpCode} err={$err} resp={$resp}" . PHP_EOL,
        FILE_APPEND
    );

    return ($httpCode == 200);
}

/* =========================================================
 * 6.3) Helper: forward เฉพาะ follow event ไป actmenu webhook
 * =======================================================*/
function forwardFollowToActmenu($rawBody, $signature, $curlLogFile, $historyId)
{
    $rawBody = (string)$rawBody;
    if ($rawBody === '') {
        return;
    }

    // TODO: เปลี่ยนให้ตรง URL production ของระบบ actmenu
    $targetUrl = 'https://actmenu.northbkk.ac.th/api/line/webhook';

    $parsed = json_decode($rawBody, true);
    if (!is_array($parsed) || !isset($parsed['events']) || !is_array($parsed['events'])) {
        return;
    }

    $hasFollow = false;
    foreach ($parsed['events'] as $ev) {
        if (isset($ev['type']) && $ev['type'] === 'follow') {
            $hasFollow = true;
            break;
        }
    }

    if (!$hasFollow) {
        return;
    }

    $ch = curl_init($targetUrl);
    curl_setopt_array($ch, array(
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 2,
        CURLOPT_TIMEOUT        => 4,
        CURLOPT_HTTPHEADER     => array(
            'Content-Type: application/json',
            'X-Line-Signature: ' . (string)$signature
        ),
        CURLOPT_POSTFIELDS     => $rawBody
    ));

    $resp = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    file_put_contents(
        $curlLogFile,
        date('Y-m-d H:i:s') . " [id={$historyId}] FORWARD follow http={$httpCode} err={$err} resp={$resp}" . PHP_EOL,
        FILE_APPEND
    );
}

/* =========================================================
 * 7) รับ raw body และตั้งค่า log
 * =======================================================*/
$body = file_get_contents('php://input');

// linehistory — แยกตาม id และไฟล์ตามวัน
$logBaseDir = __DIR__ . '/linehistory';
if (!is_dir($logBaseDir)) {
    mkdir($logBaseDir, 0777, true);
}

$logDir = $logBaseDir . '/' . $historyId;
if (!is_dir($logDir)) {
    mkdir($logDir, 0777, true);
}

$today       = date('Ymd');
$logFile     = $logDir . '/' . $today . '_log.txt';
$curlLogFile = $logDir . '/' . $today . '_curl_log.txt';

// log raw body
file_put_contents(
    $logFile,
    date('Y-m-d H:i:s') . " [id={$historyId}] BODY: " . $body . PHP_EOL,
    FILE_APPEND
);

/* =========================================================
 * 8) ตรวจ signature
 * =======================================================*/
$signature = isset($_SERVER['HTTP_X_LINE_SIGNATURE']) ? $_SERVER['HTTP_X_LINE_SIGNATURE'] : '';
if (!$signature) {
    file_put_contents(
        $curlLogFile,
        date('Y-m-d H:i:s') . " [id={$historyId}] ERROR: Missing signature" . PHP_EOL,
        FILE_APPEND
    );
    http_response_code(400);
    exit("No signature");
}

$hash = base64_encode(hash_hmac('sha256', $body, $channelSecret, true));
if ($signature !== $hash) {
    file_put_contents(
        $curlLogFile,
        date('Y-m-d H:i:s') . " [id={$historyId}] ERROR: Invalid signature" . PHP_EOL,
        FILE_APPEND
    );
    http_response_code(400);
    exit("Invalid signature");
}

/* =========================================================
 * 9) JSON decode
 * =======================================================*/
$data = json_decode($body, true);
if (!isset($data['events']) || !is_array($data['events'])) {
    file_put_contents(
        $curlLogFile,
        date('Y-m-d H:i:s') . " [id={$historyId}] ERROR: No events" . PHP_EOL,
        FILE_APPEND
    );
    exit("No events");
}

/* =========================================================
 * 10) เตรียมโฟลเดอร์ history/{id}/
 * =======================================================*/
$historyBase = __DIR__ . '/history';
if (!is_dir($historyBase)) {
    mkdir($historyBase, 0777, true);
}

$folder = $historyBase . '/' . $historyId;
if (!is_dir($folder)) {
    mkdir($folder, 0777, true);
}

/* =========================================================
 * 11) function บันทึก history เป็น JSON array
 * =======================================================*/
function appendHistory($file, $data)
{
    $arr = array();

    if (file_exists($file)) {
        $old = json_decode(file_get_contents($file), true);
        if (is_array($old)) {
            $arr = $old;
        }
    }

    $arr[] = $data;

    file_put_contents(
        $file,
        json_encode($arr, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
    );
}

/* =========================================================
 * 11.1) Helper: ค้นคำถามใน DB แล้วสร้าง messages สำหรับ reply
 * =======================================================*/
function buildChatbotMessagesFromDb($lineOaId, $userText, $pdo)
{
    $lineOaId = (int)$lineOaId;
    $userText = trim((string)$userText);

    if ($lineOaId <= 0 || $userText === '') {
        return array();
    }

    try {
        // ✅ ตรงเป๊ะตามที่พี่เอกบอก "ถ้าตรง"
        $sql = "SELECT line_oa_chatbot_answer, line_oa_chatbot_image, line_oa_chatbot_flex
                FROM line_oa_chatbot
                WHERE line_oa_id = :line_oa_id
                  AND line_oa_chatbot_question = :q
                LIMIT 1";
        $sth = $pdo->prepare($sql);
        $sth->execute(array(
            ':line_oa_id' => $lineOaId,
            ':q'          => $userText
        ));
        $row = $sth->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return array();
        }

        $messages = array();

        $answer = isset($row['line_oa_chatbot_answer']) ? trim((string)$row['line_oa_chatbot_answer']) : '';
        $image  = isset($row['line_oa_chatbot_image'])  ? trim((string)$row['line_oa_chatbot_image'])  : '';
        $flex   = isset($row['line_oa_chatbot_flex'])   ? trim((string)$row['line_oa_chatbot_flex'])   : '';

        // 1) text
        if ($answer !== '') {
            $messages[] = array(
                "type" => "text",
                "text" => $answer
            );
        }

        // 2) image
        if ($image !== '') {
            $url = toAbsoluteUrl($image);
            $messages[] = array(
                "type" => "image",
                "originalContentUrl" => $url,
                "previewImageUrl"    => $url
            );
        }

        // 3) flex
        if ($flex !== '') {
            $decoded = json_decode($flex, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {

                // altText กันว่าง (LINE บังคับ)
                $alt = 'Chatbot';

                // ถ้า stored เป็นทั้งก้อน type:flex อยู่แล้ว
                if (isset($decoded['type']) && $decoded['type'] === 'flex') {
                    if (isset($decoded['altText']) && trim((string)$decoded['altText']) !== '') {
                        $alt = (string)$decoded['altText'];
                    } else {
                        $decoded['altText'] = $alt;
                    }
                    $messages[] = $decoded;

                } else {
                    // ถ้า stored เป็น contents อย่างเดียว
                    $messages[] = array(
                        "type"     => "flex",
                        "altText"  => $alt,
                        "contents" => $decoded
                    );
                }
            }
        }

        return $messages;

    } catch (Exception $e) {
        return array();
    }
}

/* =========================================================
 * 12) Process events (ใช้ PDO อย่างเดียว)
 * =======================================================*/
foreach ($data['events'] as $event) {

    $eventType = isset($event['type']) ? $event['type'] : '';

    // --------- 12.1 กรณีเป็นข้อความจาก user ---------
    if (
        $eventType === 'message' &&
        isset($event['message']['type']) &&
        $event['message']['type'] === 'text'
    ) {

        $replyToken = isset($event['replyToken']) ? $event['replyToken'] : '';
        $userText   = isset($event['message']['text']) ? $event['message']['text'] : '';

        $userIdRaw  = isset($event['source']['userId']) ? $event['source']['userId'] : 'unknown';
        $safeUserId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $userIdRaw);

        // history/{id}/{userId}.json
        $historyFile = $folder . '/' . $safeUserId . '.json';

        // บันทึกลง history ว่าผู้ใช้พิมพ์อะไร
        appendHistory($historyFile, array(
            'datetime' => date('Y-m-d H:i:s'),
            'from'     => 'user',
            'message'  => $userText
        ));
$profile = getLineProfile($userIdRaw, $channelAccessToken);
$displayName = isset($profile['displayName']) ? $profile['displayName'] : '';
$pictureUrl  = isset($profile['pictureUrl'])  ? $profile['pictureUrl']  : '';

upsertLineOaUser($userIdRaw, $displayName, $pictureUrl, $lineOaId, $pdo);

        // ✅ อัปเดต lastchat + seen = 'n' + replyToken + line_oa_id
        updateLastChatMeta($userIdRaw, $replyToken, $lineOaId, $pdo);

        // --- ดักอีเมลจากข้อความ ---
        $email = '';
        if (preg_match('/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i', $userText, $m)) {
            $email = $m[0];
        }
        if ($email != '') {
            // ✅ เซฟอีเมล + line_oa_id
            saveUserEmail($userIdRaw, $email, $lineOaId, $pdo);
        }

        /* =========================================================
         * ✅ 12.1.1 ตอบ Chatbot จาก DB ถ้าคำถามตรง
         * =======================================================*/
        $messages = buildChatbotMessagesFromDb($lineOaId, $userText, $pdo);
        if (!empty($messages)) {

            // log ว่าจะตอบอะไร (ย่อ ๆ)
            appendHistory($historyFile, array(
                'datetime' => date('Y-m-d H:i:s'),
                'from'     => 'bot',
                'message'  => 'matched chatbot in DB'
            ));

            lineReply($replyToken, $messages, $channelAccessToken, $curlLogFile, $historyId);
        }

        // --------- 12.2 กรณีเป็น follow (เพิ่มเพื่อน / กลับมาติดตาม) ---------
    } elseif ($eventType === 'follow') {

        $userIdRaw  = isset($event['source']['userId']) ? $event['source']['userId'] : 'unknown';
        $safeUserId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $userIdRaw);
        $historyFile = $folder . '/' . $safeUserId . '.json';

        // ดึง profile จาก LINE
        $profile = getLineProfile($userIdRaw, $channelAccessToken);
        $displayName = isset($profile['displayName']) ? $profile['displayName'] : '';
        $pictureUrl  = isset($profile['pictureUrl'])  ? $profile['pictureUrl']  : '';

        // ✅ upsert ลงตาราง line_oa_user พร้อม line_oa_id
        upsertLineOaUser($userIdRaw, $displayName, $pictureUrl, $lineOaId, $pdo);

        // เก็บลง history
        appendHistory($historyFile, array(
            'datetime' => date('Y-m-d H:i:s'),
            'from'     => 'Line',
            'message'  => 'event: follow'
        ));

        // forward follow event ไป actmenu เพื่อให้ส่ง richmenu/flex ได้ทันทีหลัง add friend
        // ใช้ raw body เดิมเพื่อให้ signature verify ผ่านฝั่ง actmenu
        static $isForwarded = false;
        if (!$isForwarded) {
            forwardFollowToActmenu($body, $signature, $curlLogFile, $historyId);
            $isForwarded = true;
        }

        // --------- 12.3 กรณีเป็น unfollow (บล็อค / เลิกเพื่อน) ---------
    } elseif ($eventType === 'unfollow') {

        $userIdRaw  = isset($event['source']['userId']) ? $event['source']['userId'] : 'unknown';
        $safeUserId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $userIdRaw);
        $historyFile = $folder . '/' . $safeUserId . '.json';

        appendHistory($historyFile, array(
            'datetime' => date('Y-m-d H:i:s'),
            'from'     => 'Line',
            'message'  => 'event: unfollow'
        ));
    } else {
        continue;
    }
}

echo "OK";
