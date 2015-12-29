<?php
require_once("../classes/rest.class.php");
require_once("../classes/mysql.class.php");

class summary extends rest
{
    public $db;
	
    public function __construct(){
        parent::__construct();		// Init parent contructor
        $this->db = new db() ;             // Initiate Database
    }
        
    public function processApi(){
        $func = "_".$this->_endpoint ; 
        if((int)method_exists($this,$func) > 0) {
            $this->$func();
        }  else {
            $this->response("No Endpoint: $this->endpoint",404);
        }
    }	
    public function getSummaryField($sql, $field){	
        $result = $this->db->select($sql);
	return $result[0][$field];
    }
        
    public function _list(){	
        if($this->get_request_method() != "GET"){
            $this->response('', 406);
        }

        $date = $this->_request['date'];
        $sql = "";
        
	$sql =  " SELECT COUNT(*) AS userentered FROM users WHERE usertype = 0 AND entereddate > '$date' ";
	$userentered = $this->getSummaryField($sql, 'userentered');

	$sql =  " SELECT COUNT(*) AS userlogin FROM users WHERE usertype = 0 AND logindate > '$date' ";
	$userlogin = $this->getSummaryField($sql, 'userlogin');

	$sql =  " SELECT COUNT(*) AS useractive FROM users WHERE usertype = 0 AND userstatus = 1 AND changeddate <= '$next' ";
	$useractive = $this->getSummaryField($sql, 'useractive');

	$sql =  " SELECT COUNT(*) AS usertotal FROM users WHERE usertype = 0 AND entereddate <= '$next' ";
	$usertotal = $this->getSummaryField($sql, 'usertotal');

	$sql  = " SELECT COUNT(*) AS todaylevel FROM userclimb WHERE userdate > '$date'  ";
	$todaylevel = $this->getSummaryField($sql, 'todaylevel');

	$sql =  " SELECT MAX(level)+1 AS userlevel FROM boxman WHERE minuserid IS NOT NULL AND minuserid <> '' ";
	$userlevel = $this->getSummaryField($sql, 'userlevel');

	$sql =  " SELECT COUNT(*) AS totallevel FROM boxman WHERE type > 0 ";
	$totallevel = $this->getSummaryField($sql, 'totallevel');

	$sql =  " SELECT COUNT(*) AS messagetotal FROM usermessage WHERE sentdate <= '$next'";
	$messagetotal = $this->getSummaryField($sql, 'messagetotal');

	$sql =  " SELECT COUNT(*) AS messagenumber FROM usermessage WHERE sentdate > '$date' ";
	$messagenumber = $this->getSummaryField($sql, 'messagenumber');

	$sql  = " SELECT COUNT(*) AS threadnumber FROM forum WHERE active=1 ";
	$threadnumber = $this->getSummaryField($sql, 'threadnumber');


	$sql  = " SELECT COUNT(DISTINCT itemnumber) AS purchasenumber FROM userpass WHERE errorcode=0 AND ipnflag >= 0 ";
	$purchasenumber = $this->getSummaryField($sql, 'purchasenumber');

	$sql  = " SELECT COUNT(DISTINCT itemnumber) AS badpurchasenumber FROM userpass WHERE errorcode<>0 AND ipnflag >= 0 ";
	$badpurchasenumber = $this->getSummaryField($sql, 'badpurchasenumber');

        
        $summary_data = array(
            'userentered' => $userentered,
            'userlogin' => $userlogin,
            'useractive' => $useractive,
            'usertotal' => $usertotal,
            'todaylevel' => $todaylevel,
            'userlevel' => $userlevel,
            'totallevel' => $totallevel,
            'messagetotal' => $messagetotal,
            'messagenumber' => $messagenumber,
            'threadnumber' => $threadnumber,
            'purchasenumber' => $purchasenumber,
            'badpurchasenumber' => $badpurchasenumber
        );
    
        $post_data = array(
            'summary' => $summary_data,
            'isSuccess' => true,
            'hasError' => false
        );
        
//$post_data = json_encode(array('item' => $post_data));
//$post_data = json_encode(array('item' => $post_data), JSON_FORCE_OBJECT);
        $this->response($this->json($post_data), 200); 
    }


}
		
$api = new summary;
$api->processApi();

?>

