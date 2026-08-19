<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// ===================================================
// SECURE CONFIGURATION
// Your token is safe here because PHP code is never sent to the browser.
// ===================================================
$ACCESS_TOKEN = 'IGAAfKKGzijcBBZAFpFMl8zaWRKQ19pSW9WZAFU5enRuMkJmSi14Q3NHRV80cG4zdWVIeVdWNTZAwNVdDaURzeEhBV0JpRkYtbGxTaXJpN2FSWkR0MnRiWWJ3ZAkExZAUNlOUx6NHQ0emgwa0pycnJjUkt6YjI1cHRlWElQMTlONlpwQQZDZD';

if (!$ACCESS_TOKEN) {
    echo json_encode(['error' => 'Instagram access token not configured.']);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

$url = '';

if ($action === 'stats') {
    // Fetch account stats (followers, total posts)
    $url = "https://graph.instagram.com/me?fields=id,username,followers_count,media_count&access_token=" . $ACCESS_TOKEN;
} elseif ($action === 'posts') {
    // Fetch feed posts
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 18;
    $fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";
    $url = "https://graph.instagram.com/me/media?fields=" . $fields . "&limit=" . $limit . "&access_token=" . $ACCESS_TOKEN;
} elseif ($action === 'recent_media') {
    // Fetch recent media just for engagement calculation
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 30;
    $url = "https://graph.instagram.com/me/media?fields=like_count,comments_count&limit=" . $limit . "&access_token=" . $ACCESS_TOKEN;
} else {
    echo json_encode(['error' => 'Invalid action']);
    exit;
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);

if(curl_errno($ch)){
    echo json_encode(['error' => curl_error($ch)]);
} else {
    echo $response;
}

curl_close($ch);
?>
