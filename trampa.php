<?php
// Cargar WP para acceder a $wpdb
define('ABSPATH_TRAMPA', true);
$wp_load = __DIR__ . '/wp-load.php';
if (file_exists($wp_load)) {
    require_once $wp_load;
    global $wpdb;
    $wpdb->insert($wpdb->prefix . 'cvbk_honeypot', array(
        'tipo'    => 'honeypot',
        'ip'      => $_SERVER['REMOTE_ADDR'] ?? '',
        'ip_fwd'  => $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '',
        'uri'     => $_SERVER['REQUEST_URI'] ?? '',
        'method'  => $_SERVER['REQUEST_METHOD'] ?? '',
        'ua'      => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'referer' => $_SERVER['HTTP_REFERER'] ?? '',
        'headers' => json_encode(function_exists('getallheaders') ? (getallheaders() ?: []) : []),
    ));
} else {
    // Fallback: escribir en archivo si WP no está disponible
    $log_file = __DIR__ . '/wp-content/cvbk-honeypot.log';
    file_put_contents($log_file, json_encode(array(
        'ts'  => date('Y-m-d H:i:s'),
        'ip'  => $_SERVER['REMOTE_ADDR'] ?? '',
        'uri' => $_SERVER['REQUEST_URI'] ?? '',
        'ua'  => $_SERVER['HTTP_USER_AGENT'] ?? '',
    )) . "\n", FILE_APPEND | LOCK_EX);
}

$uri  = strtolower($_SERVER['REQUEST_URI'] ?? '');
$show = 'wp';
if (preg_match('#phpmyadmin|/pma|mysql#', $uri))                        $show = 'pma';
elseif (preg_match('#\.env|config#', $uri))                             $show = 'env';
elseif (preg_match('#shell|cmd|backdoor|c99|r57|wso#', $uri))           $show = 'shell';

http_response_code(200);
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<?php if ($show === 'pma'): ?>
<title>phpMyAdmin</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#f5f5f5;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}
.wrap{background:#fff;border:1px solid #ccc;padding:30px;width:350px}
.logo{text-align:center;font-size:28px;font-weight:bold;color:#e47911;margin-bottom:16px}
h2{font-size:16px;color:#333;margin-bottom:20px;text-align:center}
label{display:block;font-size:13px;color:#555;margin-bottom:4px}
input{width:100%;border:1px solid #ccc;padding:7px 10px;font-size:13px;margin-bottom:14px}
button{width:100%;background:#e47911;color:#fff;border:none;padding:9px;font-size:14px;cursor:pointer}
button:hover{background:#c96a00}
</style>

<?php elseif ($show === 'env'): ?>
<title>403 Forbidden</title>
<style>
body{font-family:monospace;background:#1e1e1e;color:#d4d4d4;padding:40px}
h1{color:#f44}pre{margin-top:20px;color:#888}
</style>

<?php elseif ($show === 'shell'): ?>
<title>Web Shell</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0d0d0d;color:#00ff41;font-family:monospace;padding:20px;min-height:100vh}
h2{color:#00ff41;margin-bottom:10px;font-size:14px}
textarea{background:#111;color:#00ff41;border:1px solid #00ff41;width:100%;padding:10px;font-family:monospace;font-size:13px;height:160px;resize:none}
input{background:#111;color:#00ff41;border:1px solid #00ff41;padding:6px 10px;font-family:monospace;width:78%}
button{background:#00ff41;color:#000;border:none;padding:6px 14px;font-family:monospace;cursor:pointer;margin-left:4px}
pre{margin-top:14px;background:#111;padding:12px;border:1px solid #222;min-height:60px;font-size:12px;white-space:pre-wrap}
</style>

<?php else: ?>
<title>Log In &lsaquo; Virtual Bike &mdash; WordPress</title>
<style>
html{background:#f0f0f1}
body{background:#f0f0f1;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:13px;color:#3c434a}
#login{width:320px;margin:80px auto 0;padding:0}
#login h1 a{background:#2271b1;display:block;height:60px;width:84px;margin:0 auto 20px;text-indent:-9999px;border-radius:4px}
#loginform{background:#fff;border:1px solid #c3c4c7;box-shadow:0 1px 3px rgba(0,0,0,.04);padding:26px 24px}
label{display:block;font-size:14px;margin-bottom:6px;font-weight:600}
input[type=text],input[type=password]{width:100%;border:1px solid #8c8f94;padding:6px 8px;font-size:14px;margin-bottom:16px;background:#fff;color:#2c3338;box-shadow:inset 0 1px 2px rgba(0,0,0,.07)}
input[type=text]:focus,input[type=password]:focus{border-color:#2271b1;box-shadow:0 0 0 1px #2271b1;outline:none}
#wp-submit{background:#2271b1;color:#fff;border:none;padding:6px 12px;font-size:13px;cursor:pointer;width:100%;font-weight:600}
#wp-submit:hover{background:#135e96}
p.forgetmenot{margin:0}p.submit{margin:16px 0 4px}
.message{background:#fff;border-left:4px solid #72aee6;padding:12px;margin-bottom:16px;font-size:13px}
#nav,#backtoblog{text-align:center;font-size:13px;margin-top:10px}
#nav a,#backtoblog a{color:#2271b1;text-decoration:none}
</style>
<?php endif; ?>
</head>
<body>

<?php if ($show === 'pma'): ?>
<div class="wrap">
  <div class="logo">phpMyAdmin</div>
  <h2>Bienvenido a phpMyAdmin</h2>
  <form method="post">
    <label>Usuario</label>
    <input type="text" name="pma_username" autocomplete="username" />
    <label>Contraseña</label>
    <input type="password" name="pma_password" autocomplete="current-password" />
    <button type="submit">Iniciar sesión</button>
  </form>
</div>

<?php elseif ($show === 'env'): ?>
<h1>403 Forbidden</h1>
<p>You don't have permission to access this resource.</p>
<pre>Apache/2.4.54 (Unix) Server at virtual-bike.cl Port 443</pre>

<?php elseif ($show === 'shell'): ?>
<h2>[ Web Shell v2.1 — PHP <?= PHP_MAJOR_VERSION ?>.<?= PHP_MINOR_VERSION ?> ]</h2>
<form method="post">
  <textarea name="code" placeholder="// PHP code here..."></textarea><br><br>
  <input type="text" name="cmd" placeholder="system command..." />
  <button type="submit">Execute</button>
</form>
<pre>Connection established. Waiting for input...</pre>

<?php else: ?>
<div id="login">
  <h1><a href="https://virtual-bike.cl">Virtual Bike</a></h1>
  <div class="message">Tu sesión ha expirado. Por favor vuelve a iniciar sesión.</div>
  <form name="loginform" id="loginform" method="post">
    <label for="user_login">Nombre de usuario o correo</label>
    <input type="text" name="log" id="user_login" autocomplete="username" />
    <label for="user_pass">Contraseña</label>
    <input type="password" name="pwd" id="user_pass" autocomplete="current-password" />
    <p class="forgetmenot"><label><input type="checkbox" name="rememberme" /> Recuérdame</label></p>
    <p class="submit"><input type="submit" name="wp-submit" id="wp-submit" value="Acceder" /></p>
  </form>
  <p id="nav"><a href="#">¿Olvidaste tu contraseña?</a></p>
  <p id="backtoblog"><a href="https://virtual-bike.cl">← Ir a Virtual Bike</a></p>
</div>
<?php endif; ?>

</body>
</html>
