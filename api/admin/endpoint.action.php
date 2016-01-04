<?php
require_once("endpoint.class.php");
 
class action extends endpoint
{
    public function __construct(){
        parent::__construct();		// Init parent contructor
    }

    public function _summaryList() {
        $date = $this->_request['date'];
        $next = $this->_request['next'];
        $sql  = " SELECT ";
      	$sql .= "( SELECT COUNT(*) FROM users WHERE usertype = 0 AND entereddate > '$date' ) AS userentered,";
	$sql .= "( SELECT COUNT(*) FROM users WHERE usertype = 0 AND logindate > '$date' ) AS userlogin,";
	$sql .= "( SELECT COUNT(*) FROM users WHERE usertype = 0 AND userstatus = 1 AND changeddate <= '$next' ) AS useractive,";
	$sql .= "( SELECT COUNT(*) FROM users WHERE usertype = 0 AND entereddate <= '$next' ) AS usertotal,";
	$sql .= "( SELECT COUNT(*) FROM userclimb WHERE userdate > '$date' ) AS todaylevel,";
	$sql .= "( SELECT MAX(level)+1 FROM boxman WHERE minuserid IS NOT NULL AND minuserid <> '' ) AS userlevel,";
	$sql .= "( SELECT COUNT(*) FROM boxman WHERE type > 0 ) AS totallevel,";
	$sql .= "( SELECT COUNT(*) FROM usermessage WHERE sentdate <= '$next' ) AS messagetotal,";
	$sql .= "( SELECT COUNT(*) FROM usermessage WHERE sentdate > '$date' ) AS messagenumber,";
	$sql .= "( SELECT COUNT(*) FROM forum WHERE active=1 ) AS threadnumber,";
	$sql .= "( SELECT COUNT(DISTINCT itemnumber) FROM userpass WHERE errorcode=0 AND ipnflag >= 0 ) AS purchasenumber,";
	$sql .= "( SELECT COUNT(DISTINCT itemnumber) FROM userpass WHERE errorcode<>0 AND ipnflag >= 0 ) AS badpurchasenumber";
        parent::_list($sql);
    }
    public function _playerList() {
        $sql  =  " SELECT * FROM users ";
        $sql .= " WHERE usertype = 0 ";
        parent::_list($sql);
    }
    public function _activityList() {	
	$sql  = " SELECT users.id AS userid, users.username, usagelog.timelogin, usagelog.timelogout FROM usagelog, users ";
	$sql .= " WHERE users.usertype = 0 AND users.id = usagelog.userid ";
        parent::_list($sql);
    }
    public function _recordList() {
	$sql  = " SELECT userclimb.* FROM userclimb ";
	$sql .= " WHERE 1=1 ";
        parent::_list($sql);
    }
    public function _levelList() {
        $sql  = " SELECT level, type, estimate, minuserid, minusername, minsteps ";
	$sql .= " FROM boxman ";
        parent::_list($sql);
    }
    public function _passList() {
	$sql  = " SELECT users.id AS userid, userpass.userlevel+1 AS userlevel, users.username, userpass.firstname, userpass.lastname, userpass.paymentdate, userpass.paymentamount, userpass.paymentgross, userpass.paymentfee, userpass.payeremail  ";
	$sql .= " FROM userpass, users ";
	$sql .= " WHERE users.usertype=0 AND userpass.userid=users.id AND userpass.errorcode=0 AND userpass.ipnflag <> 0 ";
	$sql .= " ORDER BY userpass.id DESC ";
        parent::_list($sql);
    }
    public function _messageList() {
	$sql = " SELECT usermessage.* FROM usermessage WHERE 1=1 ORDER BY sentdate DESC ";
        parent::_list($sql);
    }
    public function _threadList() {
	$sql  = " SELECT forum.*, ";
	$sql .= " CASE WHEN judge=1 THEN id ELSE root END AS rid ";
	$sql .= " FROM forum ";
//	$sql .= " WHERE active=1 ";
	$sql .= " WHERE 1=1 ";
        parent::_list($sql);
    }
    public function authorization() {
        $username = $_SERVER['PHP_AUTH_USER'];
        $passwordmd5 = $_SERVER['PHP_AUTH_PW'];
        $sql = " SELECT * FROM users WHERE username = '$username' AND passwordmd5 = '$passwordmd5' ";
        if(count($this->db->select($sql)) != 1) {
            $this->response('', 404);
        }
    }
}
$api = new action;
$api->authorization();
$api->processApi(api);

?>

