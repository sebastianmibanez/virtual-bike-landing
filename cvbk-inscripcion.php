<?php
/**
 * Plugin Name: CVBK Inscripción
 * Description: Endpoint REST para inscripción directa a Getnet — Clásica VBK 2026
 * Version: 2.0
 */

if (!defined('ABSPATH')) exit;

// Suprimir emails nativos de WooCommerce — usamos nuestros propios templates
add_filter('woocommerce_email_enabled_new_order',              '__return_false');
add_filter('woocommerce_email_enabled_cancelled_order',        '__return_false');
add_filter('woocommerce_email_enabled_failed_order',           '__return_false');
add_filter('woocommerce_email_enabled_customer_processing_order', '__return_false');
add_filter('woocommerce_email_enabled_customer_completed_order',  '__return_false');
add_filter('woocommerce_email_enabled_customer_refunded_order',   '__return_false');
add_filter('woocommerce_email_enabled_customer_on_hold_order',    '__return_false');
add_filter('woocommerce_email_enabled_customer_invoice',          '__return_false');

// Hardening WP
remove_action('wp_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');

// CORS — solo orígenes autorizados
add_action('rest_api_init', function() {
    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = array('https://virtual-bike.cl', 'https://www.virtual-bike.cl', 'http://localhost:5173', 'http://localhost:4173');
    if (in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-CVBK-Token');
        header('Access-Control-Allow-Credentials: false');
        header('Vary: Origin');
    }
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        status_header(204);
        exit;
    }
}, 15);

define('CVBK_JWT_SECRET', 'cvbk_2026_jwt_s3cr3t_!xK9#mP2qR');
define('CVBK_API_TOKEN', 'cvbk_2026_s3cr3t_t0k3n'); // legacy, mantenido para compatibilidad

define('CVBK_USERS', array(
    'seb'    => '$2b$10$TVfn14VpyQ5qxPnb6iJW1eXzv7oEWxiwyxP7v.wwmBqujc5BDonTa',
    'carlos' => '$2b$10$1dvc36RVUnYQUAEctVhnnOURw3dwWlJPSWeADwYR7pQZeu4gltrLi',
));

// ── Activación: crear tabla ──────────────────────────────────────────────────
register_activation_hook(__FILE__, 'cvbk_crear_tabla');

function cvbk_crear_tabla() {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';

    $tabla = $wpdb->prefix . 'cvbk_inscritos';
    dbDelta("CREATE TABLE IF NOT EXISTS $tabla (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        order_id    BIGINT DEFAULT NULL,
        nombre      VARCHAR(100) NOT NULL,
        apellido    VARCHAR(100) NOT NULL,
        email       VARCHAR(150) NOT NULL,
        telefono    VARCHAR(30)  NOT NULL,
        rut         VARCHAR(20)  NOT NULL,
        genero      VARCHAR(10)  DEFAULT '',
        categoria   VARCHAR(100) NOT NULL,
        club        VARCHAR(100) DEFAULT '',
        ip          VARCHAR(45)  DEFAULT '',
        user_agent  TEXT,
        estado_pago VARCHAR(30)  DEFAULT 'pendiente',
        created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP
    ) $charset;");

    $honeypot = $wpdb->prefix . 'cvbk_honeypot';
    dbDelta("CREATE TABLE IF NOT EXISTS $honeypot (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        ts         DATETIME     DEFAULT CURRENT_TIMESTAMP,
        tipo       VARCHAR(30)  DEFAULT '',
        ip         VARCHAR(45)  DEFAULT '',
        ip_fwd     VARCHAR(200) DEFAULT '',
        uri        VARCHAR(500) DEFAULT '',
        method     VARCHAR(10)  DEFAULT '',
        usuario    VARCHAR(100) DEFAULT '',
        ua         TEXT,
        referer    VARCHAR(500) DEFAULT '',
        headers    TEXT
    ) $charset;");

    $eventos = $wpdb->prefix . 'cvbk_eventos';
    dbDelta("CREATE TABLE IF NOT EXISTS $eventos (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        ts         DATETIME    DEFAULT CURRENT_TIMESTAMP,
        tipo       VARCHAR(30) NOT NULL,
        session_id VARCHAR(64) DEFAULT '',
        ip         VARCHAR(45) DEFAULT '',
        ua         TEXT,
        referrer   VARCHAR(500) DEFAULT ''
    ) $charset;");
}

// Crear tablas también si no existen (por si el plugin ya estaba activo)
add_action('init', function() {
    global $wpdb;
    $needs = array(
        $wpdb->prefix . 'cvbk_inscritos',
        $wpdb->prefix . 'cvbk_honeypot',
        $wpdb->prefix . 'cvbk_eventos',
    );
    foreach ($needs as $tabla) {
        if ($wpdb->get_var("SHOW TABLES LIKE '$tabla'") !== $tabla) {
            cvbk_crear_tabla();
            break;
        }
    }
});

// ── Helpers de seguridad ─────────────────────────────────────────────────────

function cvbk_validar_rut(string $rut): bool {
    $clean = strtoupper(preg_replace('/[^0-9kK]/', '', $rut));
    if (strlen($clean) < 2) return false;
    $body  = substr($clean, 0, -1);
    $dv    = substr($clean, -1);
    $sum   = 0;
    $mul   = 2;
    for ($i = strlen($body) - 1; $i >= 0; $i--) {
        $sum += intval($body[$i]) * $mul;
        $mul  = $mul === 7 ? 2 : $mul + 1;
    }
    $expected = 11 - ($sum % 11);
    $dvCalc   = $expected === 11 ? '0' : ($expected === 10 ? 'K' : (string)$expected);
    return $dv === $dvCalc;
}

define('CVBK_RL_WHITELIST', array('45.236.124.212')); // IPs exentas de rate limit

function cvbk_rate_limit(string $key, int $max = 5, int $window = 600): bool {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (in_array($ip, CVBK_RL_WHITELIST, true)) return true;
    $transient = 'cvbk_rl_' . md5($key);
    $hits      = (int) get_transient($transient);
    if ($hits >= $max) return false;
    set_transient($transient, $hits + 1, $window);
    return true;
}

// ── Rutas REST ───────────────────────────────────────────────────────────────
add_action('rest_api_init', 'cvbk_register_routes');

function cvbk_register_routes() {
    register_rest_route('cvbk/v1', '/inscribir', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'cvbk_inscribir',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('cvbk/v1', '/reservar', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'cvbk_reservar',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('cvbk/v1', '/pagar', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'cvbk_pagar',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('cvbk/v1', '/inscritos', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'cvbk_listar_inscritos',
        'permission_callback' => 'cvbk_check_token',
    ));

    register_rest_route('cvbk/v1', '/inscritos/export', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'cvbk_exportar_csv',
        'permission_callback' => 'cvbk_check_token',
    ));

    register_rest_route('cvbk/v1', '/auth', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'cvbk_login',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('cvbk/v1', '/inscritos/(?P<id>\d+)', array(
        'methods'             => WP_REST_Server::DELETABLE,
        'callback'            => 'cvbk_eliminar_inscrito',
        'permission_callback' => 'cvbk_check_token',
    ));

    register_rest_route('cvbk/v1', '/run-check-pagos', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => function($req) {
            if ($req->get_param('token') !== 'cvbk_2026_s3cr3t_t0k3n') {
                return new WP_Error('forbidden', 'No autorizado', array('status' => 401));
            }
            cvbk_procesar_pagos_pendientes();
            return rest_ensure_response(array('ok' => true));
        },
        'permission_callback' => '__return_true',
    ));

    register_rest_route('cvbk/v1', '/track', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'cvbk_track',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('cvbk/v1', '/stats', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'cvbk_stats',
        'permission_callback' => 'cvbk_check_token',
    ));

    register_rest_route('cvbk/v1', '/verificar', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'cvbk_verificar_inscrito',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('cvbk/v1', '/honeypot-log', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'cvbk_honeypot_log',
        'permission_callback' => 'cvbk_check_seb',
    ));

    register_rest_route('cvbk/v1', '/inscritos/(?P<id>\d+)/estado', array(
        'methods'             => WP_REST_Server::EDITABLE,
        'callback'            => 'cvbk_actualizar_estado',
        'permission_callback' => 'cvbk_check_token',
    ));

    register_rest_route('cvbk/v1', '/inscrito/(?P<id>\d+)', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'cvbk_get_inscrito_publico',
        'permission_callback' => '__return_true',
    ));
}

// ── JWT mínimo HS256 ─────────────────────────────────────────────────────────
function cvbk_jwt_encode(array $payload): string {
    $header  = rtrim(strtr(base64_encode('{"alg":"HS256","typ":"JWT"}'), '+/', '-_'), '=');
    $body    = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');
    $sig     = rtrim(strtr(base64_encode(hash_hmac('sha256', "$header.$body", CVBK_JWT_SECRET, true)), '+/', '-_'), '=');
    return "$header.$body.$sig";
}

function cvbk_jwt_decode(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$header, $body, $sig] = $parts;
    $expected = rtrim(strtr(base64_encode(hash_hmac('sha256', "$header.$body", CVBK_JWT_SECRET, true)), '+/', '-_'), '=');
    if (!hash_equals($expected, $sig)) return null;
    $payload = json_decode(base64_decode(strtr($body, '-_', '+/')), true);
    if (empty($payload['exp']) || $payload['exp'] < time()) return null;
    return $payload;
}

// ── Auth helpers ─────────────────────────────────────────────────────────────
function cvbk_check_seb(WP_REST_Request $request): bool {
    $raw     = $request->get_header('X-CVBK-Token') ?: $request->get_param('token');
    $payload = cvbk_jwt_decode($raw ?? '');
    return !empty($payload['usuario']) && $payload['usuario'] === 'seb';
}

function cvbk_check_token(WP_REST_Request $request): bool {
    $raw = $request->get_header('X-CVBK-Token')
        ?: $request->get_param('token');
    if (!$raw) return false;
    // Aceptar JWT nuevo
    $payload = cvbk_jwt_decode($raw);
    if ($payload && !empty($payload['usuario'])) return true;
    // Fallback token legacy durante transición
    return $raw === CVBK_API_TOKEN;
}

function cvbk_eliminar_inscrito(WP_REST_Request $request) {
    global $wpdb;
    $id    = (int) $request->get_param('id');
    $tabla = $wpdb->prefix . 'cvbk_inscritos';
    $row   = $wpdb->get_row($wpdb->prepare("SELECT id FROM $tabla WHERE id = %d", $id));
    if (!$row) return new WP_Error('no_encontrado', 'Inscripción no encontrada', array('status' => 404));
    $wpdb->delete($tabla, array('id' => $id));
    return rest_ensure_response(array('ok' => true, 'id' => $id));
}

function cvbk_honeypot_registrar(string $tipo, array $extra = []): void {
    global $wpdb;
    $wpdb->insert($wpdb->prefix . 'cvbk_honeypot', array_merge(array(
        'tipo'    => $tipo,
        'ip'      => $_SERVER['REMOTE_ADDR'] ?? '',
        'ip_fwd'  => $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '',
        'uri'     => $_SERVER['REQUEST_URI'] ?? '',
        'method'  => $_SERVER['REQUEST_METHOD'] ?? '',
        'ua'      => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'referer' => $_SERVER['HTTP_REFERER'] ?? '',
        'headers' => json_encode(getallheaders() ?: array()),
    ), $extra));
}

function cvbk_honeypot_log(WP_REST_Request $request) {
    global $wpdb;
    $tabla = $wpdb->prefix . 'cvbk_honeypot';
    $limit = min(intval($request->get_param('limit') ?? 100), 500);
    $tipo  = sanitize_text_field($request->get_param('tipo') ?? '');
    $rows  = $tipo
        ? $wpdb->get_results($wpdb->prepare("SELECT * FROM $tabla WHERE tipo = %s ORDER BY ts DESC LIMIT %d", $tipo, $limit))
        : $wpdb->get_results($wpdb->prepare("SELECT * FROM $tabla ORDER BY ts DESC LIMIT %d", $limit));
    return rest_ensure_response(array('total' => count($rows), 'eventos' => $rows));
}

function cvbk_login(WP_REST_Request $request) {
    $d        = $request->get_json_params();
    $usuario  = trim($d['usuario'] ?? '');
    $password = trim($d['password'] ?? '');
    $ip       = $_SERVER['REMOTE_ADDR'] ?? '';

    // Rate limit: 3 intentos fallidos por IP en 15 min
    $rl_key = 'login_fail_' . md5($ip);
    $hits   = (int) get_transient($rl_key);
    if ($hits >= 3) {
        cvbk_honeypot_registrar('auth_blocked', array('usuario' => $usuario));
        return new WP_Error('rate_limit', 'Demasiados intentos, espera 15 minutos', array('status' => 429));
    }

    $usuarios_validos = array(
        'seb'    => 'Cv26!s#9mK',
        'carlos' => 'Bk26!c#4xR',
    );

    if (empty($usuario) || empty($password) ||
        !isset($usuarios_validos[$usuario]) ||
        $usuarios_validos[$usuario] !== $password) {
        set_transient($rl_key, $hits + 1, 900);
        cvbk_honeypot_registrar('auth_fail', array('usuario' => $usuario));
        return new WP_Error('auth_error', 'Credenciales incorrectas', array('status' => 401));
    }

    // Login exitoso — resetear contador
    delete_transient($rl_key);

    $expira = time() + (8 * 3600);
    $token  = cvbk_jwt_encode(array('usuario' => $usuario, 'exp' => $expira, 'iat' => time()));

    return rest_ensure_response(array(
        'token'   => $token,
        'usuario' => $usuario,
        'expira'  => $expira,
    ));
}

// ── Inscribir ────────────────────────────────────────────────────────────────
function cvbk_inscribir(WP_REST_Request $request) {
    global $wpdb;
    $d = $request->get_json_params();

    if (empty($d)) {
        return new WP_Error('no_data', 'No se recibieron datos', array('status' => 400));
    }

    $required = array('nombre', 'apellido', 'email', 'telefono', 'rut', 'categoria');
    foreach ($required as $field) {
        if (empty(trim($d[$field] ?? ''))) {
            return new WP_Error('campo_requerido', "Falta el campo: $field", array('status' => 400));
        }
    }

    if (!is_email($d['email'])) {
        return new WP_Error('email_invalido', 'Email inválido', array('status' => 400));
    }

    if (!function_exists('wc_create_order')) {
        return new WP_Error('wc_inactivo', 'WooCommerce no está activo', array('status' => 500));
    }

    // Crear orden WooCommerce
    $order = wc_create_order();
    if (is_wp_error($order)) {
        return new WP_Error('orden_error', 'Error al crear la orden', array('status' => 500));
    }

    $order->set_payment_method('getnet');
    $order->set_payment_method_title('Getnet');
    $order->set_billing_first_name(sanitize_text_field($d['nombre']));
    $order->set_billing_last_name(sanitize_text_field($d['apellido']));
    $order->set_billing_email(sanitize_email($d['email']));
    $order->set_billing_phone(sanitize_text_field($d['telefono']));
    $order->set_billing_country('CL');

    $product = wc_get_product(818);
    if (!$product) {
        return new WP_Error('producto_no_encontrado', 'Producto ID 818 no encontrado', array('status' => 500));
    }

    $order->update_meta_data('_cvbk_rut',      sanitize_text_field($d['rut']));
    $order->update_meta_data('_cvbk_categoria', sanitize_text_field($d['categoria']));
    $order->update_meta_data('_cvbk_club',      sanitize_text_field($d['club'] ?? ''));
    $order->update_meta_data('_cvbk_genero',    sanitize_text_field($d['genero'] ?? ''));
    $order->calculate_totals();
    $order->save();

    $order_id = $order->get_id();

    // Guardar en tabla propia
    $tabla = $wpdb->prefix . 'cvbk_inscritos';
    $wpdb->insert($tabla, array(
        'order_id'   => $order_id,
        'nombre'     => sanitize_text_field($d['nombre']),
        'apellido'   => sanitize_text_field($d['apellido']),
        'email'      => sanitize_email($d['email']),
        'telefono'   => sanitize_text_field($d['telefono']),
        'rut'        => sanitize_text_field($d['rut']),
        'genero'     => sanitize_text_field($d['genero'] ?? ''),
        'categoria'  => sanitize_text_field($d['categoria']),
        'club'       => sanitize_text_field($d['club'] ?? ''),
        'ip'         => $_SERVER['REMOTE_ADDR'] ?? '',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'estado_pago'=> 'pendiente',
    ));

    // Inicializar sesión WC
    if (WC()->session && !WC()->session->has_session()) {
        WC()->session->set_customer_session_cookie(true);
    }
    if (WC()->session) {
        WC()->session->set('order_awaiting_payment', $order_id);
    }

    $redirect_url = add_query_arg('cvbk', '1', $order->get_checkout_payment_url(true));

    try {
        $gateways = WC()->payment_gateways()->payment_gateways();
        $gateway  = null;
        foreach ($gateways as $id => $gw) {
            if (stripos($id, 'getnet') !== false || stripos($id, 'placetopay') !== false) { $gateway = $gw; break; }
        }
        if ($gateway !== null) {
            $result = $gateway->process_payment($order_id);
            if (!empty($result['result']) && $result['result'] === 'success' && !empty($result['redirect'])) {
                $redirect_url = add_query_arg('cvbk', '1', $result['redirect']);
            }
        }
    } catch (Exception $e) {
        error_log('CVBK Gateway error: ' . $e->getMessage());
    }

    return rest_ensure_response(array('redirect' => $redirect_url));
}

// ── Reservar (paso 1: solo DB, sin pago) ─────────────────────────────────────
function cvbk_reservar(WP_REST_Request $request) {
    global $wpdb;

    // Inscripciones abiertas desde el 30 de abril — solo whitelist puede probar antes
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!in_array($ip, CVBK_RL_WHITELIST, true) && time() < strtotime('2026-05-01 00:00:00 -0400')) {
        return new WP_Error('no_disponible', 'Las inscripciones abren el 1 de mayo', array('status' => 403));
    }

    $d = $request->get_json_params();

    if (empty($d)) {
        return new WP_Error('no_data', 'No se recibieron datos', array('status' => 400));
    }

    $required = array('nombre', 'apellido', 'email', 'telefono', 'rut', 'categoria');
    foreach ($required as $field) {
        if (empty(trim($d[$field] ?? ''))) {
            return new WP_Error('campo_requerido', "Falta el campo: $field", array('status' => 400));
        }
    }

    if (!is_email($d['email'])) {
        return new WP_Error('email_invalido', 'Email inválido', array('status' => 400));
    }

    $rut = sanitize_text_field($d['rut']);
    if (!cvbk_validar_rut($rut)) {
        return new WP_Error('rut_invalido', 'RUT inválido', array('status' => 400));
    }

    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!cvbk_rate_limit('reservar_' . $ip)) {
        return new WP_Error('rate_limit', 'Demasiadas solicitudes, intenta en unos minutos', array('status' => 429));
    }

    // Verificar duplicado por RUT
    $tabla    = $wpdb->prefix . 'cvbk_inscritos';
    $rutClean = strtoupper(preg_replace('/[^0-9kK]/', '', $rut));
    $existe   = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $tabla WHERE UPPER(REPLACE(REPLACE(rut,'.',''),'-','')) = %s AND estado_pago IN ('pendiente','pagado')",
        $rutClean
    ));
    if ($existe > 0) {
        return new WP_Error('duplicado', 'Ya existe una inscripción con ese RUT', array('status' => 409));
    }

    $tabla = $wpdb->prefix . 'cvbk_inscritos';
    $wpdb->insert($tabla, array(
        'order_id'   => null,
        'nombre'     => sanitize_text_field($d['nombre']),
        'apellido'   => sanitize_text_field($d['apellido']),
        'email'      => sanitize_email($d['email']),
        'telefono'   => sanitize_text_field($d['telefono']),
        'rut'        => sanitize_text_field($d['rut']),
        'genero'     => sanitize_text_field($d['genero'] ?? ''),
        'categoria'  => sanitize_text_field($d['categoria']),
        'club'       => sanitize_text_field($d['club'] ?? ''),
        'ip'         => $_SERVER['REMOTE_ADDR'] ?? '',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'estado_pago'=> 'pendiente',
    ));

    $inscrito_id = $wpdb->insert_id;

    if (!$inscrito_id) {
        return new WP_Error('db_error', 'Error al guardar inscripción', array('status' => 500));
    }

    $obj           = new stdClass();
    $obj->nombre   = sanitize_text_field($d['nombre']);
    $obj->apellido = sanitize_text_field($d['apellido']);
    $obj->email    = sanitize_email($d['email']);
    $obj->rut      = sanitize_text_field($d['rut']);
    $obj->categoria= sanitize_text_field($d['categoria']);
    $obj->order_id = 0;
    $obj->id       = $inscrito_id;
    cvbk_email_reserva($obj);
    cvbk_programar_recordatorio($inscrito_id);

    return rest_ensure_response(array(
        'inscrito_id' => $inscrito_id,
        'mensaje'     => 'Cupo reservado correctamente',
    ));
}

// ── Pagar (paso 2: crea orden WC y redirige a Getnet) ────────────────────────
function cvbk_pagar(WP_REST_Request $request) {
    global $wpdb;
    $d           = $request->get_json_params();
    $inscrito_id = intval($d['inscrito_id'] ?? 0);

    if (!$inscrito_id) {
        return new WP_Error('id_invalido', 'inscrito_id requerido', array('status' => 400));
    }

    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!cvbk_rate_limit('pagar_' . $ip, 10, 600)) {
        return new WP_Error('rate_limit', 'Demasiadas solicitudes, intenta en unos minutos', array('status' => 429));
    }

    $tabla    = $wpdb->prefix . 'cvbk_inscritos';
    $inscrito = $wpdb->get_row($wpdb->prepare("SELECT * FROM $tabla WHERE id = %d", $inscrito_id));

    if (!$inscrito) {
        return new WP_Error('no_encontrado', 'Inscripción no encontrada', array('status' => 404));
    }

    if ($inscrito->estado_pago === 'pagado') {
        return new WP_Error('ya_pagado', 'Esta inscripción ya fue pagada', array('status' => 409));
    }

    if (!function_exists('wc_create_order')) {
        return new WP_Error('wc_inactivo', 'WooCommerce no está activo', array('status' => 500));
    }

    $order = wc_create_order();
    if (is_wp_error($order)) {
        return new WP_Error('orden_error', 'Error al crear la orden', array('status' => 500));
    }

    $order->set_payment_method('getnet');
    $order->set_payment_method_title('Getnet');
    $order->set_billing_first_name($inscrito->nombre);
    $order->set_billing_last_name($inscrito->apellido);
    $order->set_billing_email($inscrito->email);
    $order->set_billing_phone($inscrito->telefono);
    $order->set_billing_country('CL');

    $product = wc_get_product(818);
    if (!$product) {
        return new WP_Error('producto_no_encontrado', 'Producto ID 818 no encontrado', array('status' => 500));
    }

    $ip_cliente = $_SERVER['REMOTE_ADDR'] ?? '';
    $precio = in_array($ip_cliente, CVBK_RL_WHITELIST, true) ? 50 : null;
    $item = new WC_Order_Item_Product();
    $item->set_product($product);
    $item->set_quantity(1);
    $item->set_subtotal($precio ?? $product->get_price());
    $item->set_total($precio ?? $product->get_price());
    $order->add_item($item);
    $order->update_meta_data('_cvbk_rut',        $inscrito->rut);
    $order->update_meta_data('_cvbk_categoria',   $inscrito->categoria);
    $order->update_meta_data('_cvbk_club',        $inscrito->club);
    $order->update_meta_data('_cvbk_genero',      $inscrito->genero);
    $order->update_meta_data('_cvbk_inscrito_id', $inscrito_id);
    $order->calculate_totals();
    $order->save();

    $order_id = $order->get_id();

    // Vincular order_id a la fila de la tabla
    $wpdb->update($tabla, array('order_id' => $order_id), array('id' => $inscrito_id));

    // La URL de pago WC — el usuario llegará aquí con ?cvbk=1 y el JS hará click en Place Order
    $redirect_url = add_query_arg('cvbk', '1', $order->get_checkout_payment_url(true));

    // Intentar obtener URL directa de Getnet si el gateway la provee
    try {
        // Inicializar WC session + cart en contexto REST (PlaceToPay llama WC()->cart->empty_cart())
        if (!WC()->session) {
            WC()->initialize_session();
        }
        if (WC()->session && !WC()->session->has_session()) {
            WC()->session->set_customer_session_cookie(true);
        }
        if (WC()->session) {
            WC()->session->set('order_awaiting_payment', $order_id);
            WC()->session->set('chosen_payment_method', 'placetopay');
        }
        if (!WC()->cart) {
            WC()->initialize_cart();
        }

        $gateways = WC()->payment_gateways()->payment_gateways();
        $gateway  = null;
        foreach ($gateways as $id => $gw) {
            if (stripos($id, 'getnet') !== false || stripos($id, 'placetopay') !== false) { $gateway = $gw; break; }
        }
        if ($gateway !== null) {
            $result = $gateway->process_payment($order_id);
            if (!empty($result['result']) && $result['result'] === 'success' && !empty($result['redirect'])) {
                // Extraer redirect-url de Getnet del query string que devuelve PlaceToPay
                $parsed = parse_url($result['redirect']);
                parse_str($parsed['query'] ?? '', $qs);
                if (!empty($qs['redirect-url'])) {
                    return rest_ensure_response(array('redirect' => $qs['redirect-url']));
                }
                $redirect_url = $result['redirect'];
            }
        }
    } catch (Exception $e) {
        error_log('CVBK Gateway error: ' . $e->getMessage());
    }

    return rest_ensure_response(array('redirect' => $redirect_url));
}

// ── Listar inscritos ─────────────────────────────────────────────────────────
function cvbk_listar_inscritos(WP_REST_Request $request) {
    global $wpdb;
    $tabla     = $wpdb->prefix . 'cvbk_inscritos';
    $categoria = sanitize_text_field($request->get_param('categoria') ?? '');
    $genero    = sanitize_text_field($request->get_param('genero') ?? '');
    $estado    = sanitize_text_field($request->get_param('estado') ?? '');

    $where  = array('1=1');
    $values = array();

    if ($categoria) { $where[] = 'categoria = %s'; $values[] = $categoria; }
    if ($genero)    { $where[] = 'genero = %s';    $values[] = $genero; }
    if ($estado)    { $where[] = 'estado_pago = %s'; $values[] = $estado; }

    $sql = "SELECT * FROM $tabla WHERE " . implode(' AND ', $where) . " ORDER BY created_at DESC";

    $rows = empty($values)
        ? $wpdb->get_results($sql)
        : $wpdb->get_results($wpdb->prepare($sql, ...$values));

    // Stats
    $total     = count($rows);
    $pagados   = count(array_filter($rows, fn($r) => $r->estado_pago === 'pagado'));
    $pendientes= $total - $pagados;

    $por_categoria = array();
    foreach ($rows as $r) {
        $por_categoria[$r->categoria] = ($por_categoria[$r->categoria] ?? 0) + 1;
    }

    return rest_ensure_response(array(
        'total'         => $total,
        'pagados'       => $pagados,
        'pendientes'    => $pendientes,
        'por_categoria' => $por_categoria,
        'inscritos'     => $rows,
    ));
}

// ── Exportar CSV ─────────────────────────────────────────────────────────────
function cvbk_exportar_csv(WP_REST_Request $request) {
    global $wpdb;
    $tabla     = $wpdb->prefix . 'cvbk_inscritos';
    $categoria = sanitize_text_field($request->get_param('categoria') ?? '');

    $sql  = "SELECT nombre, apellido, rut, genero, categoria, club, telefono, email, estado_pago, created_at FROM $tabla";
    if ($categoria) {
        $sql .= $wpdb->prepare(" WHERE categoria = %s", $categoria);
    }
    $sql .= " ORDER BY categoria, apellido";
    $rows = $wpdb->get_results($sql, ARRAY_A);

    $output  = "\xEF\xBB\xBF"; // BOM UTF-8 para Excel
    $output .= "Nombre,Apellido,RUT,Género,Categoría,Club,Teléfono,Email,Estado pago,Fecha inscripción\n";

    foreach ($rows as $r) {
        $output .= implode(',', array_map(fn($v) => '"' . str_replace('"', '""', $v) . '"', $r)) . "\n";
    }

    $filename = 'inscritos-cvbk-' . date('Y-m-d') . ($categoria ? '-' . sanitize_title($categoria) : '') . '.csv';

    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-cache');
    echo $output;
    exit;
}

// ── Actualizar estado de pago ────────────────────────────────────────────────
function cvbk_actualizar_estado(WP_REST_Request $request) {
    global $wpdb;
    $tabla  = $wpdb->prefix . 'cvbk_inscritos';
    $id     = (int) $request->get_param('id');
    $d      = $request->get_json_params();
    $estado = sanitize_text_field($d['estado_pago'] ?? '');

    if (!in_array($estado, array('pendiente', 'pagado', 'cancelado'))) {
        return new WP_Error('estado_invalido', 'Estado no válido', array('status' => 400));
    }

    $updated = $wpdb->update($tabla, array('estado_pago' => $estado), array('id' => $id));

    if ($updated === false) {
        return new WP_Error('db_error', 'Error al actualizar', array('status' => 500));
    }

    return rest_ensure_response(array('ok' => true, 'id' => $id, 'estado_pago' => $estado));
}

// ── Redirigir al landing al volver de Getnet ─────────────────────────────────
add_action('init', function() {
    if (isset($_GET['wc-api']) && $_GET['wc-api'] === 'getnet') {
        // Dejar que el plugin procese primero, luego redirigir
        add_action('woocommerce_api_getnet', function() {
            wp_redirect('https://virtual-bike.cl/clasica-2026/');
            exit;
        }, 99);
    }
});

// ── Interceptar webhook Getnet para sincronizar nuestra tabla ────────────────
add_action('rest_api_init', function() {
    register_rest_route('getnet/v1', '/webhook', array(
        'methods'             => array('POST', 'GET'),
        'callback'            => 'cvbk_getnet_webhook',
        'permission_callback' => '__return_true',
    ), true); // true = override si ya existe
});

function cvbk_getnet_webhook(WP_REST_Request $request) {
    $body = $request->get_body();
    $data = $request->get_json_params() ?: $request->get_params();
    error_log('CVBK Getnet webhook: ' . $body);

    // Buscar order_id en el payload
    $order_id = intval(
        $data['reference'] ?? $data['requestId'] ?? $data['order_id'] ?? 0
    );
    $status = strtolower($data['status']['status'] ?? $data['status'] ?? '');

    if ($order_id && in_array($status, array('approved', 'ok', 'success', 'completed'), true)) {
        $order = wc_get_order($order_id);
        if ($order && $order->get_status() === 'pending') {
            $order->update_status('processing', 'Pago confirmado por webhook Getnet');
        }
    }

    // Pasar al handler original del plugin Getnet si existe
    $original = apply_filters('cvbk_getnet_webhook_passthrough', null, $request);
    return rest_ensure_response(array('ok' => true));
}

// ── Sincronizar estado WC → tabla ────────────────────────────────────────────
add_action('woocommerce_order_status_changed', 'cvbk_sync_estado_pago', 10, 3);

function cvbk_sync_estado_pago($order_id, $old_status, $new_status) {
    global $wpdb;
    $tabla = $wpdb->prefix . 'cvbk_inscritos';

    $map = array(
        'completed'  => 'pagado',
        'processing' => 'pagado',
        'pending'    => 'pendiente',
        'cancelled'  => 'cancelado',
        'failed'     => 'cancelado',
    );

    if (!isset($map[$new_status])) return;

    $wpdb->update($tabla, array('estado_pago' => $map[$new_status]), array('order_id' => $order_id));
}

// ── Auto-submit a Getnet cuando llega ?cvbk=1 ───────────────────────────────
add_action('wp_footer', 'cvbk_autosubmit_footer');

function cvbk_autosubmit_footer() {
    if (empty($_GET['cvbk'])) return;
    echo "<script>
    (function() {
        var attempts = 0;
        function tryPay() {
            attempts++;
            if (attempts > 60) return; // 30s max

            // Getnet renders a button or triggers via JS — try multiple selectors
            var btn = document.getElementById('place_order')
                   || document.querySelector('button[name=\"woocommerce_checkout_place_order\"]')
                   || document.querySelector('.wc-getnet-pay-button')
                   || document.querySelector('button.button[type=\"submit\"]')
                   || document.querySelector('input[type=\"submit\"].button');

            if (btn && !btn.disabled && btn.offsetParent !== null) {
                btn.click();
                return;
            }

            // Fallback: submit any payment form
            var form = document.getElementById('order_review')
                    || document.querySelector('form[action*=\"order-pay\"]')
                    || document.querySelector('form[action*=\"paginapago\"]');
            if (form) {
                form.submit();
                return;
            }

            setTimeout(tryPay, 500);
        }
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(tryPay, 800);
        });
    })();
    </script>";
}

// ── Email de confirmación ────────────────────────────────────────────────────
// ── Helper base de email ─────────────────────────────────────────────────────
function cvbk_email_base(string $contenido): string {
    return "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'></head><body style='margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif;'>
    <table width='100%' cellpadding='0' cellspacing='0' style='background:#f0f0f0;padding:32px 0'>
      <tr><td align='center'>
        <table width='560' cellpadding='0' cellspacing='0' style='background:#0a0a0a;border-radius:8px;overflow:hidden;max-width:560px;width:100%'>
          <!-- Header -->
          <tr><td style='background:#111;padding:24px 32px;border-bottom:3px solid #f5e400'>
            <div style='color:#f5e400;font-size:22px;font-weight:900;letter-spacing:2px;text-transform:uppercase'>Clásica CVBK 2026</div>
            <div style='color:#555;font-size:12px;margin-top:4px'>21 de Mayo · Alto Noviciado · Virtual-Bike.cl</div>
          </td></tr>
          <!-- Contenido -->
          <tr><td style='padding:32px;color:#fff'>
            {$contenido}
          </td></tr>
          <!-- Footer -->
          <tr><td style='background:#111;padding:20px 32px;border-top:1px solid #222;text-align:center'>
            <div style='color:#444;font-size:11px'>Clásica Virtual Bike 2026 · <a href='https://virtual-bike.cl' style='color:#f5e400;text-decoration:none'>virtual-bike.cl</a></div>
            <div style='color:#333;font-size:11px;margin-top:4px'>Este correo fue enviado automáticamente, no respondas a este mensaje.</div>
          </td></tr>
        </table>
      </td></tr>
    </table></body></html>";
}

function cvbk_send(string $email, string $asunto, string $html): void {
    wp_mail(
        $email,
        $asunto,
        $html,
        array('Content-Type: text/html; charset=UTF-8', 'From: Clásica CVBK 2026 <clasica2026@virtual-bike.cl>')
    );
}

// ── Email 1: Reserva recibida (paso 1, sin pago aún) ─────────────────────────
function cvbk_email_reserva(object $inscrito): void {
    $nombre = esc_html("{$inscrito->nombre} {$inscrito->apellido}");
    $cat    = esc_html($inscrito->categoria);
    $rut    = esc_html($inscrito->rut);

    $contenido = "
      <p style='font-size:18px;font-weight:bold;margin:0 0 8px'>¡Hola {$inscrito->nombre}! 👋</p>
      <p style='color:#aaa;margin:0 0 24px'>Tu cupo ha sido reservado. Solo falta completar el pago.</p>
      <table width='100%' cellpadding='0' cellspacing='0' style='border-collapse:collapse;margin-bottom:24px'>
        <tr><td style='color:#666;padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px'>Nombre</td><td style='padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px;text-align:right'>{$nombre}</td></tr>
        <tr><td style='color:#666;padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px'>RUT</td><td style='padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px;text-align:right'>{$rut}</td></tr>
        <tr><td style='color:#666;padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px'>Categoría</td><td style='padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px;text-align:right'>{$cat}</td></tr>
        <tr><td style='color:#666;padding:10px 0;font-size:13px'>Valor</td><td style='padding:10px 0;font-size:16px;font-weight:bold;color:#f5e400;text-align:right'>\$40.000 CLP</td></tr>
      </table>
      <div style='background:#1a1a1a;border:1px solid #f5e400;border-radius:6px;padding:16px;margin-bottom:24px'>
        <p style='margin:0;color:#f5e400;font-size:13px;font-weight:bold'>⚠️ Tu cupo no está confirmado aún</p>
        <p style='margin:8px 0 0;color:#aaa;font-size:12px'>Haz clic en el botón de abajo para completar el pago y asegurar tu lugar.</p>
      </div>
      <table width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:20px'><tr><td align='center'>
        <a href='https://virtual-bike.cl/?pagar={$inscrito->id}#inscripcion' style='display:inline-block;background:#f5e400;color:#000;font-weight:900;font-size:15px;padding:16px 40px;border-radius:6px;text-decoration:none;letter-spacing:1px;text-transform:uppercase'>Completar pago →</a>
      </td></tr></table>
      <p style='color:#555;font-size:12px;margin:0'>Las inscripciones sin pago pueden ser liberadas si se agota el cupo.</p>";

    cvbk_send($inscrito->email, '🚴 Cupo reservado — Clásica CVBK 2026', cvbk_email_base($contenido));
}

// ── Email 2: Pago confirmado → inscrito ──────────────────────────────────────
function cvbk_email_pago_confirmado(object $inscrito): void {
    $nombre   = esc_html("{$inscrito->nombre} {$inscrito->apellido}");
    $cat      = esc_html($inscrito->categoria);
    $rut      = esc_html($inscrito->rut);
    $order_id     = $inscrito->order_id ? "#{$inscrito->order_id}" : '—';
    $order        = $inscrito->order_id ? wc_get_order($inscrito->order_id) : null;
    $valor_pagado = $order ? '$' . number_format($order->get_total(), 0, ',', '.') . ' CLP' : '$40.000 CLP';
    $qr_url       = 'https://virtual-bike.cl/wp-json/cvbk/v1/verificar?id=' . intval($inscrito->id) . '&token=' . cvbk_token_verificacion(intval($inscrito->id));
    $qr_img       = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' . urlencode($qr_url);

    $contenido = "
      <p style='font-size:18px;font-weight:bold;margin:0 0 8px'>¡Pago confirmado! 🎉</p>
      <p style='color:#aaa;margin:0 0 24px'>Tu inscripción está 100% confirmada. ¡Nos vemos el 21 de mayo!</p>
      <div style='background:#0d2010;border:1px solid #22c55e;border-radius:6px;padding:16px;margin-bottom:24px;text-align:center'>
        <div style='color:#22c55e;font-size:28px;font-weight:900'>✓ INSCRITO</div>
        <div style='color:#aaa;font-size:12px;margin-top:4px'>Clásica Virtual Bike 2026</div>
      </div>
      <table width='100%' cellpadding='0' cellspacing='0' style='border-collapse:collapse;margin-bottom:24px'>
        <tr><td style='color:#666;padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px'>Nombre</td><td style='padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px;text-align:right'>{$nombre}</td></tr>
        <tr><td style='color:#666;padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px'>RUT</td><td style='padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px;text-align:right'>{$rut}</td></tr>
        <tr><td style='color:#666;padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px'>Categoría</td><td style='padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px;text-align:right'>{$cat}</td></tr>
        <tr><td style='color:#666;padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px'>N° orden</td><td style='padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px;text-align:right'>{$order_id}</td></tr>
        <tr><td style='color:#666;padding:10px 0;font-size:13px'>Valor pagado</td><td style='padding:10px 0;font-size:16px;font-weight:bold;color:#22c55e;text-align:right'>{$valor_pagado}</td></tr>
      </table>
      <div style='background:#1a1a1a;border-radius:6px;padding:20px;margin-bottom:20px;text-align:center'>
        <p style='margin:0 0 12px;color:#f5e400;font-size:13px;font-weight:bold'>📱 Tu código de acceso</p>
        <img src='{$qr_img}' width='160' height='160' alt='QR inscripción' style='border:4px solid #f5e400;border-radius:4px' />
        <p style='margin:10px 0 0;color:#555;font-size:11px'>Muestra este QR en la acreditación del evento</p>
      </div>
      <div style='background:#1a1a1a;border-radius:6px;padding:16px'>
        <p style='margin:0 0 8px;color:#fff;font-size:13px;font-weight:bold'>📍 Información del evento</p>
        <p style='margin:0;color:#aaa;font-size:12px;line-height:1.8'>
          📅 Miércoles 21 de mayo de 2026<br>
          📌 Alto Noviciado, Región Metropolitana<br>
          🚴 Salida por categorías desde las 8:00 hrs
        </p>
      </div>";

    cvbk_send($inscrito->email, '✅ Pago confirmado — ¡Estás inscrito en la Clásica CVBK 2026!', cvbk_email_base($contenido));

    // Notificar al admin
    cvbk_send('clasica2026@virtual-bike.cl',
        "Nuevo pago confirmado — {$nombre} · {$cat}",
        cvbk_email_base("<p>Nuevo inscrito pagado:</p><p><strong>{$nombre}</strong><br>{$cat}<br>{$rut}<br>Orden {$order_id}</p>")
    );
}

// ── Email 3: Recordatorio 48h sin pago (WP Cron) ─────────────────────────────
function cvbk_email_recordatorio(int $inscrito_id): void {
    global $wpdb;
    $tabla    = $wpdb->prefix . 'cvbk_inscritos';
    $inscrito = $wpdb->get_row($wpdb->prepare("SELECT * FROM $tabla WHERE id = %d AND estado_pago = 'pendiente'", $inscrito_id));
    if (!$inscrito) return;

    $nombre = esc_html($inscrito->nombre);
    $cat    = esc_html($inscrito->categoria);

    $contenido = "
      <p style='font-size:18px;font-weight:bold;margin:0 0 8px'>¡{$nombre}, tu cupo está por vencer! ⏰</p>
      <p style='color:#aaa;margin:0 0 24px'>Reservaste un cupo hace 48 horas pero el pago sigue pendiente.</p>
      <div style='background:#1a1000;border:1px solid #eab308;border-radius:6px;padding:16px;margin-bottom:24px'>
        <p style='margin:0;color:#eab308;font-size:14px;font-weight:bold'>⚠️ Solo quedan 200 cupos en total</p>
        <p style='margin:8px 0 0;color:#aaa;font-size:12px'>Si no completas el pago, tu cupo puede ser liberado a otro participante.</p>
      </div>
      <p style='color:#aaa;font-size:13px;margin:0 0 16px'>Categoría reservada: <strong style='color:#fff'>{$cat}</strong></p>
      <table width='100%' cellpadding='0' cellspacing='0'><tr><td align='center'>
        <a href='https://virtual-bike.cl/#inscripcion' style='display:inline-block;background:#f5e400;color:#000;font-weight:900;font-size:14px;padding:14px 32px;border-radius:6px;text-decoration:none;letter-spacing:1px;text-transform:uppercase'>Completar pago →</a>
      </td></tr></table>";

    cvbk_send($inscrito->email, '⏰ Tu cupo en la Clásica CVBK 2026 está por vencer', cvbk_email_base($contenido));
}

// ── Email 4: Info logística 3 días antes (18 mayo) ───────────────────────────
function cvbk_email_logistica(): void {
    global $wpdb;
    $tabla    = $wpdb->prefix . 'cvbk_inscritos';
    $inscritos = $wpdb->get_results("SELECT * FROM $tabla WHERE estado_pago = 'pagado'");

    foreach ($inscritos as $i) {
        $nombre = esc_html($i->nombre);
        $cat    = esc_html($i->categoria);

        $contenido = "
          <p style='font-size:18px;font-weight:bold;margin:0 0 8px'>¡{$nombre}, faltan 3 días! 🚴</p>
          <p style='color:#aaa;margin:0 0 24px'>Aquí tienes toda la info para el día de la carrera.</p>
          <div style='background:#1a1a1a;border-radius:6px;padding:20px;margin-bottom:20px'>
            <p style='margin:0 0 12px;color:#f5e400;font-size:14px;font-weight:bold'>📍 Datos del evento</p>
            <p style='margin:0;color:#aaa;font-size:13px;line-height:2'>
              📅 <strong style='color:#fff'>Miércoles 21 de mayo de 2026</strong><br>
              📌 <strong style='color:#fff'>Alto Noviciado, Región Metropolitana</strong><br>
              🕗 <strong style='color:#fff'>Concentración desde las 7:00 hrs</strong><br>
              🚴 <strong style='color:#fff'>Salida por categorías desde las 8:00 hrs</strong><br>
              🎽 <strong style='color:#fff'>Retira tu número en la carpa de inscripciones</strong>
            </p>
          </div>
          <div style='background:#1a1a1a;border-radius:6px;padding:20px;margin-bottom:20px'>
            <p style='margin:0 0 12px;color:#f5e400;font-size:14px;font-weight:bold'>🎽 Tu inscripción</p>
            <p style='margin:0;color:#aaa;font-size:13px;line-height:2'>
              Categoría: <strong style='color:#fff'>{$cat}</strong><br>
              RUT: <strong style='color:#fff'>{$i->rut}</strong>
            </p>
          </div>
          <div style='background:#1a1a1a;border-radius:6px;padding:20px'>
            <p style='margin:0 0 12px;color:#f5e400;font-size:14px;font-weight:bold'>✅ Recuerda traer</p>
            <p style='margin:0;color:#aaa;font-size:13px;line-height:2'>
              ✔ Tu bicicleta en buen estado<br>
              ✔ Casco obligatorio<br>
              ✔ Tu RUT para retirar el número<br>
              ✔ Hidratación y alimentación para el camino<br>
              ✔ Buena actitud 💪
            </p>
          </div>";

        cvbk_send($i->email, '🚴 ¡Faltan 3 días para la Clásica CVBK 2026!', cvbk_email_base($contenido));
    }
}

// ── Llamadas desde reservar/pagar ────────────────────────────────────────────
function cvbk_email_confirmacion(array $d, int $order_id): void {
    // Wrapper legacy — construye objeto mínimo para cvbk_email_reserva
    $obj              = new stdClass();
    $obj->nombre      = sanitize_text_field($d['nombre'] ?? '');
    $obj->apellido    = sanitize_text_field($d['apellido'] ?? '');
    $obj->email       = sanitize_email($d['email'] ?? '');
    $obj->rut         = sanitize_text_field($d['rut'] ?? '');
    $obj->categoria   = sanitize_text_field($d['categoria'] ?? '');
    $obj->order_id    = $order_id;
    cvbk_email_reserva($obj);
}

// ── Tracking de eventos ───────────────────────────────────────────────────────

function cvbk_track(WP_REST_Request $request): WP_REST_Response {
    global $wpdb;
    $d    = $request->get_json_params();
    $tipo = sanitize_text_field($d['tipo'] ?? '');
    $sid  = sanitize_text_field($d['session_id'] ?? '');

    $permitidos = array('pageview', 'genero_click', 'formulario_inicio', 'reserva_ok', 'pago_ok');
    if (!in_array($tipo, $permitidos, true)) {
        return new WP_REST_Response(array('ok' => false), 400);
    }

    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    // No trackear IPs de admin
    if (in_array($ip, CVBK_RL_WHITELIST, true)) {
        return new WP_REST_Response(array('ok' => true, 'skipped' => true));
    }

    $wpdb->insert($wpdb->prefix . 'cvbk_eventos', array(
        'tipo'       => $tipo,
        'session_id' => $sid,
        'ip'         => $ip,
        'ua'         => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'referrer'   => sanitize_text_field($d['referrer'] ?? ''),
    ));

    return new WP_REST_Response(array('ok' => true));
}

function cvbk_stats(WP_REST_Request $request): WP_REST_Response {
    global $wpdb;
    $e = $wpdb->prefix . 'cvbk_eventos';
    $i = $wpdb->prefix . 'cvbk_inscritos';

    $dias = intval($request->get_param('dias') ?? 30);
    $desde = date('Y-m-d H:i:s', strtotime("-{$dias} days"));

    // Funnel
    $funnel = array(
        'pageviews'         => (int)$wpdb->get_var($wpdb->prepare("SELECT COUNT(DISTINCT session_id) FROM $e WHERE tipo='pageview' AND ts >= %s", $desde)),
        'genero_click'      => (int)$wpdb->get_var($wpdb->prepare("SELECT COUNT(DISTINCT session_id) FROM $e WHERE tipo='genero_click' AND ts >= %s", $desde)),
        'formulario_inicio' => (int)$wpdb->get_var($wpdb->prepare("SELECT COUNT(DISTINCT session_id) FROM $e WHERE tipo='formulario_inicio' AND ts >= %s", $desde)),
        'reservas'          => (int)$wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $i WHERE created_at >= %s", $desde)),
        'pagos'             => (int)$wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $i WHERE estado_pago='pagado' AND created_at >= %s", $desde)),
    );

    // Visitas por día (últimos 14 días)
    $por_dia = $wpdb->get_results(
        "SELECT DATE(ts) as fecha, COUNT(DISTINCT session_id) as visitas
         FROM $e WHERE tipo='pageview' AND ts >= DATE_SUB(NOW(), INTERVAL 14 DAY)
         GROUP BY DATE(ts) ORDER BY fecha ASC"
    );

    // Top referrers
    $referrers = $wpdb->get_results(
        $wpdb->prepare("SELECT referrer, COUNT(*) as total FROM $e WHERE tipo='pageview' AND ts >= %s AND referrer != '' GROUP BY referrer ORDER BY total DESC LIMIT 10", $desde)
    );

    // Dispositivos (mobile vs desktop via UA)
    $mobile  = (int)$wpdb->get_var($wpdb->prepare("SELECT COUNT(DISTINCT session_id) FROM $e WHERE tipo='pageview' AND ts >= %s AND (ua LIKE '%Mobile%' OR ua LIKE '%Android%' OR ua LIKE '%iPhone%')", $desde));
    $desktop = max(0, $funnel['pageviews'] - $mobile);

    return rest_ensure_response(array(
        'funnel'     => $funnel,
        'por_dia'    => $por_dia,
        'referrers'  => $referrers,
        'dispositivos' => array('mobile' => $mobile, 'desktop' => $desktop),
    ));
}

// ── Consulta pública de estado post-pago ─────────────────────────────────────
function cvbk_get_inscrito_publico(WP_REST_Request $request): WP_REST_Response {
    global $wpdb;
    $id    = intval($request->get_param('id'));
    $tabla = $wpdb->prefix . 'cvbk_inscritos';

    if (!$id) {
        return new WP_REST_Response(array('error' => 'ID inválido'), 400);
    }

    $inscrito = $wpdb->get_row($wpdb->prepare(
        "SELECT id, nombre, apellido, rut, categoria, genero, estado_pago FROM $tabla WHERE id = %d",
        $id
    ));

    if (!$inscrito) {
        return new WP_REST_Response(array('error' => 'No encontrado'), 404);
    }

    $qr_url = null;
    $qr_img = null;
    if ($inscrito->estado_pago === 'pagado') {
        $token  = cvbk_token_verificacion($id);
        $qr_url = 'https://virtual-bike.cl/wp-json/cvbk/v1/verificar?id=' . $id . '&token=' . $token;
        $qr_img = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($qr_url);
    }

    return new WP_REST_Response(array(
        'id'          => (int) $inscrito->id,
        'nombre'      => $inscrito->nombre,
        'apellido'    => $inscrito->apellido,
        'rut'         => $inscrito->rut,
        'categoria'   => $inscrito->categoria,
        'genero'      => $inscrito->genero,
        'estado_pago' => $inscrito->estado_pago,
        'qr_url'      => $qr_url,
        'qr_img'      => $qr_img,
    ));
}

// ── Verificación QR ──────────────────────────────────────────────────────────

function cvbk_token_verificacion(int $id): string {
    return hash_hmac('sha256', 'cvbk_verificar_' . $id, CVBK_JWT_SECRET);
}

function cvbk_verificar_inscrito(WP_REST_Request $request): WP_REST_Response {
    global $wpdb;
    $id    = intval($request->get_param('id'));
    $token = sanitize_text_field($request->get_param('token'));

    if (!$id || !$token) {
        return new WP_REST_Response(array('valido' => false, 'error' => 'Parámetros inválidos'), 400);
    }

    if (!hash_equals(cvbk_token_verificacion($id), $token)) {
        return new WP_REST_Response(array('valido' => false, 'error' => 'Token inválido'), 403);
    }

    $tabla    = $wpdb->prefix . 'cvbk_inscritos';
    $inscrito = $wpdb->get_row($wpdb->prepare("SELECT * FROM $tabla WHERE id = %d", $id));

    if (!$inscrito) {
        return new WP_REST_Response(array('valido' => false, 'error' => 'Inscrito no encontrado'), 404);
    }

    $pagado = $inscrito->estado_pago === 'pagado';

    // Respuesta HTML para mostrar en celular al escanear
    $color  = $pagado ? '#22c55e' : '#ef4444';
    $estado = $pagado ? '✓ INSCRIPCIÓN VÁLIDA' : '✗ PAGO PENDIENTE';
    $html = "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width,initial-scale=1'>
    <title>Verificación CVBK</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{background:#080808;color:#fff;font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    .card{background:#111;border:3px solid {$color};border-radius:12px;padding:32px;max-width:400px;width:100%;text-align:center}
    .status{color:{$color};font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:24px}
    .field{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #222;font-size:15px}
    .label{color:#666}.value{color:#fff;font-weight:bold}
    .logo{color:#f5e400;font-size:20px;font-weight:900;letter-spacing:3px;margin-bottom:8px}
    .sub{color:#444;font-size:12px;margin-bottom:28px}</style></head>
    <body><div class='card'>
    <div class='logo'>CLÁSICA CVBK 2026</div>
    <div class='sub'>21 de Mayo · Alto Noviciado</div>
    <div class='status'>{$estado}</div>
    <div class='field'><span class='label'>Nombre</span><span class='value'>" . esc_html($inscrito->nombre . ' ' . $inscrito->apellido) . "</span></div>
    <div class='field'><span class='label'>RUT</span><span class='value'>" . esc_html($inscrito->rut) . "</span></div>
    <div class='field'><span class='label'>Categoría</span><span class='value'>" . esc_html($inscrito->categoria) . "</span></div>
    <div class='field'><span class='label'>Estado</span><span class='value' style='color:{$color}'>" . esc_html($inscrito->estado_pago) . "</span></div>
    </div></body></html>";

    header('Content-Type: text/html; charset=UTF-8');
    echo $html;
    exit;
}

// ── WP Cron: programar recordatorio 48h al reservar ──────────────────────────
add_action('cvbk_recordatorio_pago', 'cvbk_email_recordatorio');

function cvbk_programar_recordatorio(int $inscrito_id): void {
    wp_schedule_single_event(time() + (48 * 3600), 'cvbk_recordatorio_pago', array($inscrito_id));
}

// ── WP Cron: email logística 3 días antes (18 mayo 2026 a las 9:00 CL) ───────
add_action('cvbk_email_logistica_evento', 'cvbk_email_logistica');

function cvbk_programar_logistica(): void {
    if (!wp_next_scheduled('cvbk_email_logistica_evento')) {
        // 18 mayo 2026 12:00 UTC = 9:00 Chile (UTC-3)
        wp_schedule_single_event(mktime(12, 0, 0, 5, 18, 2026), 'cvbk_email_logistica_evento');
    }
}
add_action('init', 'cvbk_programar_logistica');

// ── WP Cron: revisar órdenes pendientes cada 5 min ───────────────────────────
add_filter('cron_schedules', function($schedules) {
    $schedules['cvbk_5min'] = array('interval' => 300, 'display' => 'Cada 5 minutos CVBK');
    return $schedules;
});

add_action('init', function() {
    if (!wp_next_scheduled('cvbk_check_pagos')) {
        wp_schedule_event(time(), 'cvbk_5min', 'cvbk_check_pagos');
    }
});

add_action('cvbk_check_pagos', 'cvbk_procesar_pagos_pendientes');

function cvbk_procesar_pagos_pendientes(): void {
    global $wpdb;
    $tabla = $wpdb->prefix . 'cvbk_inscritos';
    $pendientes = $wpdb->get_results(
        "SELECT * FROM $tabla WHERE estado_pago = 'pendiente' AND order_id IS NOT NULL AND order_id > 0"
    );
    foreach ($pendientes as $inscrito) {
        $order = wc_get_order($inscrito->order_id);
        if (!$order) continue;
        $status = $order->get_status();
        if (in_array($status, array('processing', 'completed'), true)) {
            $wpdb->update($tabla, array('estado_pago' => 'pagado'), array('id' => $inscrito->id));
            cvbk_email_pago_confirmado($inscrito);
            wp_clear_scheduled_hook('cvbk_recordatorio_pago', array((int)$inscrito->id));
        }
    }
}

// ── Sync pago WC → enviar email pago confirmado ───────────────────────────────
add_action('woocommerce_order_status_changed', 'cvbk_email_on_pago', 20, 3);

function cvbk_email_on_pago(int $order_id, string $old, string $new): void {
    if (!in_array($new, array('completed', 'processing'), true)) return;
    if ($old === $new) return;
    global $wpdb;
    $tabla    = $wpdb->prefix . 'cvbk_inscritos';
    $inscrito = $wpdb->get_row($wpdb->prepare("SELECT * FROM $tabla WHERE order_id = %d", $order_id));
    if (!$inscrito) {
        // Fallback: buscar por meta de WC
        $inscrito_id = get_post_meta($order_id, '_cvbk_inscrito_id', true);
        if ($inscrito_id) {
            $inscrito = $wpdb->get_row($wpdb->prepare("SELECT * FROM $tabla WHERE id = %d", $inscrito_id));
        }
    }
    if (!$inscrito) {
        error_log("CVBK email_on_pago: no se encontró inscrito para order_id=$order_id");
        return;
    }
    // Evitar email duplicado si ya estaba pagado
    if ($inscrito->estado_pago === 'pagado' && $old === 'processing') return;
    cvbk_email_pago_confirmado($inscrito);
    wp_clear_scheduled_hook('cvbk_recordatorio_pago', array((int)$inscrito->id));
}

// ── Honeypot: trampa para scanners y bots ────────────────────────────────────

// Rutas que ningún usuario legítimo debería visitar
define('CVBK_TRAP_URIS', array(
    '/wp-login.php',
    '/wp-admin/install.php',
    '/wp-admin/setup-config.php',
    '/xmlrpc.php',
    '/.env',
    '/.git/config',
    '/config.php',
    '/backup.sql',
    '/backup.zip',
    '/db.php',
    '/shell.php',
    '/cmd.php',
    '/eval.php',
    '/phpmyadmin',
    '/pma',
    '/adminer.php',
    '/admin/config',
    '/administrator',
));

// UAs de scanners conocidos (parcial match)
define('CVBK_SCANNER_UAS', array(
    'sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab', 'nuclei',
    'dirbuster', 'gobuster', 'wfuzz', 'acunetix', 'nessus',
    'openvas', 'python-requests', 'go-http-client', 'curl/7',
    'scrapy', 'semrushbot', 'ahrefsbot', 'mj12bot',
));

add_action('template_redirect', function() {
    $uri = strtolower(parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '');
    $ua  = strtolower($_SERVER['HTTP_USER_AGENT'] ?? '');

    $es_trampa   = false;
    $tipo_trampa = '';

    // Comprobar URI sospechosa
    foreach (CVBK_TRAP_URIS as $trap) {
        if (strpos($uri, strtolower($trap)) === 0) {
            $es_trampa   = true;
            $tipo_trampa = 'trap_uri';
            break;
        }
    }

    // Comprobar scanner UA
    if (!$es_trampa) {
        foreach (CVBK_SCANNER_UAS as $scanner) {
            if (strpos($ua, $scanner) !== false) {
                $es_trampa   = true;
                $tipo_trampa = 'scanner_ua';
                break;
            }
        }
    }

    // Comprobar exploits típicos en query string
    if (!$es_trampa) {
        $qs = strtolower($_SERVER['QUERY_STRING'] ?? '');
        if (preg_match('/union.*select|exec\(|eval\(|base64_decode|<script|onload=/i', $qs)) {
            $es_trampa   = true;
            $tipo_trampa = 'sqli_xss';
        }
    }

    if (!$es_trampa) return;

    cvbk_honeypot_registrar($tipo_trampa);

    // Respuesta trampa: parece WP login real, no da info útil al atacante
    status_header(200);
    header('Content-Type: text/html; charset=UTF-8');
    echo '<!DOCTYPE html><html><head><title>Log In &lsaquo; virtual-bike.cl &#8212; WordPress</title>
<style>body{background:#f0f0f1;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
#login{width:320px;margin:100px auto;background:#fff;padding:26px;box-shadow:0 1px 3px rgba(0,0,0,.13)}
h1 a{display:block;width:84px;height:84px;margin:0 auto 16px;background:url(https://s.w.org/style/images/about/WordPress-logotype-wmark.png)no-repeat center/contain}
label{display:block;font-size:14px;margin-bottom:4px}input[type=text],input[type=password]{width:100%;box-sizing:border-box;padding:8px;border:1px solid #ddd;border-radius:3px;margin-bottom:14px}
.button{background:#2271b1;color:#fff;border:none;padding:10px;width:100%;cursor:pointer;border-radius:3px;font-size:14px}
p.error{background:#fce;border:1px solid #c00;padding:8px;margin-bottom:14px;font-size:13px}</style></head>
<body><div id="login"><h1><a></a></h1>
<p class="error">ERROR: Usuario o contraseña incorrectos.</p>
<form method="post"><label>Usuario</label><input type="text" name="log">
<label>Contraseña</label><input type="password" name="pwd">
<input type="submit" class="button" value="Acceder"></form></div></body></html>';
    exit;
}, 1);
