<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$envFile = __DIR__ . '/.env';
if (!file_exists($envFile)) {
    echo json_encode(['error' => '.env file missing']);
    exit;
}

// Parse .env file manually to avoid external dependencies
$envVars = parse_ini_file($envFile);

// Check for the YouTube API Key (assumes you named it YOUTUBE_API_KEY or similar)
$API_KEY = isset($envVars['YOUTUBE_API_KEY']) ? $envVars['YOUTUBE_API_KEY'] : null;

if (!$API_KEY) {
    // Try to find any key containing 'YOUTUBE' if exact match fails
    foreach ($envVars as $key => $value) {
        if (stripos($key, 'YOUTUBE') !== false) {
            $API_KEY = $value;
            break;
        }
    }
}

$CHANNEL_ID = 'UC50bu38IH4kCSaUtpzt_BFg'; // Your THRM channel ID

if (!$API_KEY) {
    echo json_encode(['error' => 'YouTube API key not found in .env']);  
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'stats') {
    $url = "https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=" . $CHANNEL_ID . "&key=" . $API_KEY;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    
    echo $response;
    exit;
} elseif ($action === 'posts') {
    // 1. Get the Uploads Playlist ID (Replace UC with UU in the channel ID)
    $uploadsPlaylistId = 'UU' . substr($CHANNEL_ID, 2);
    
    // Pagination token for loading more posts
    $pageToken = isset($_GET['after']) ? $_GET['after'] : '';
    $maxResults = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    
    $playlistUrl = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=" . $uploadsPlaylistId . "&maxResults=" . $maxResults . "&key=" . $API_KEY;
    if ($pageToken) {
        $playlistUrl .= "&pageToken=" . urlencode($pageToken);
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $playlistUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $playlistRes = curl_exec($ch);
    curl_close($ch);
    
    $playlistData = json_decode($playlistRes, true);
    
    if (isset($playlistData['error'])) {
        echo json_encode(['error' => $playlistData['error']['message']]);
        exit;
    }
    
    if (empty($playlistData['items'])) {
        echo json_encode(['data' => []]);
        exit;
    }
    
    // 2. Extract Video IDs to fetch statistics
    $videoIds = [];
    foreach ($playlistData['items'] as $item) {
        if (isset($item['contentDetails']['videoId'])) {
            $videoIds[] = $item['contentDetails']['videoId'];
        }
    }
    
    if (!empty($videoIds)) {
        $statsUrl = "https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=" . implode(',', $videoIds) . "&key=" . $API_KEY;
        $ch2 = curl_init();
        curl_setopt($ch2, CURLOPT_URL, $statsUrl);
        curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
        $statsRes = curl_exec($ch2);
        curl_close($ch2);
        
        $statsData = json_decode($statsRes, true);
        $statsMap = [];
        if (isset($statsData['items'])) {
            foreach ($statsData['items'] as $video) {
                $statsMap[$video['id']] = $video;
            }
        }
        
        // Merge stats into playlist items
        foreach ($playlistData['items'] as &$item) {
            $vid = $item['contentDetails']['videoId'];
            if (isset($statsMap[$vid])) {
                $item['video_details'] = $statsMap[$vid];
            }
        }
    }
    
    echo json_encode($playlistData);
    exit;
} else {
    echo json_encode(['error' => 'Invalid action']);
    exit;
}
?>
