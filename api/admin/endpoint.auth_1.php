<?php
require_once("endpoint.class.php");

$_user_ = 'test';
$_password_ = 'test';

session_start();

$url_action = (empty($_REQUEST['action'])) ? 'logIn' : $_REQUEST['action'];
$auth_realm = (isset($auth_realm)) ? $auth_realm : '';

if (isset($url_action)) {
    if (is_callable($url_action)) {
        call_user_func($url_action);
    } else {
        echo 'Function does not exist, request terminated';
    };
};

function logIn() {
    global $auth_realm;

    if (!isset($_SESSION['username'])) {
        if (!isset($_SESSION['login'])) {
            $_SESSION['login'] = TRUE;
            header('WWW-Authenticate: Basic realm="'.$auth_realm.'"');
            header('HTTP/1.0 401 Unauthorized');
            echo 'You must enter a valid login and password';
            echo '<p><a href="?action=logOut">Try again</a></p>';
            exit;
        } else {
            $user = isset($_SERVER['PHP_AUTH_USER']) ? $_SERVER['PHP_AUTH_USER'] : '';
            $password = isset($_SERVER['PHP_AUTH_PW']) ? $_SERVER['PHP_AUTH_PW'] : '';
            $result = authenticate($user, $password);
            if ($result == 0) {
                $_SESSION['username'] = $user;
            } else {
                session_unset($_SESSION['login']);
                errMes($result);
                echo '<p><a href="">Try again</a></p>';
                exit;
            };
        };
    };
}

function authenticate($user, $password) {
    global $_user_;
    global $_password_;

    if (($user == $_user_)&&($password == $_password_)) { return 0; }
    else { return 1; };
}

function errMes($errno) {
    switch ($errno) {
        case 0:
            break;
        case 1:
            echo 'The username or password you entered is incorrect';
            break;
        default:
            echo 'Unknown error';
    };
}

function logOut() {

    session_destroy();
    if (isset($_SESSION['username'])) {
        session_unset($_SESSION['username']);
        echo "You've successfully logged out<br>";
        echo '<p><a href="?action=logIn">LogIn</a></p>';
    } else {
        header("Location: ?action=logIn", TRUE, 301);
    };
    if (isset($_SESSION['login'])) { session_unset($_SESSION['login']); };
    exit;
}

?>
----------
<?php
session_start();

$authorized = false;

# LOGOUT
if (isset($_GET['logout']) && !isset($_GET["login"]) && isset($_SESSION['auth']))
{
    $_SESSION = array();
    unset($_COOKIE[session_name()]);
    session_destroy();
    echo "logging out...";
}

# checkup login and password
if (isset($_SERVER['PHP_AUTH_USER']) && isset($_SERVER['PHP_AUTH_PW']))
{
    $user = 'test';
    $pass = 'test';
    if (($user == $_SERVER['PHP_AUTH_USER']) && ($pass == ($_SERVER['PHP_AUTH_PW'])) && isset($_SESSION['auth']))
    {
    $authorized = true;
    }
}

# login
if (isset($_GET["login"]) && !$authorized ||
# relogin
    isset($_GET["login"]) && isset($_GET["logout"]) && !isset($_SESSION['reauth']))
{
    header('WWW-Authenticate: Basic Realm="Login please"');
    header('HTTP/1.0 401 Unauthorized');
    $_SESSION['auth'] = true;
    $_SESSION['reauth'] = true;
    echo "Login now or forever hold your clicks...";
    exit;
}
$_SESSION['reauth'] = null;
?>
<h1>you have <? echo ($authorized) ? (isset($_GET["login"]) && isset($_GET["logout"]) ? 're' : '') : 'not '; ?>logged!</h1>



------------------------------

?php

$username = null;
$password = null;

// mod_php
if (isset($_SERVER['PHP_AUTH_USER'])) {
    $username = $_SERVER['PHP_AUTH_USER'];
    $password = $_SERVER['PHP_AUTH_PW'];

// most other servers
} elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {

        if (strpos(strtolower($_SERVER['HTTP_AUTHORIZATION']),'basic')===0)
          list($username,$password) = explode(':',base64_decode(substr($_SERVER['HTTP_AUTHORIZATION'], 6)));

}

if (is_null($username)) {

    header('WWW-Authenticate: Basic realm="My Realm"');
    header('HTTP/1.0 401 Unauthorized');
    echo 'Text to send if user hits Cancel button';

    die();

} else {
    echo "<p>Hello {$username}.</p>";
    echo "<p>You entered {$password} as your password.</p>";
}

?>
