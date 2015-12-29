<?php
require_once("../classes/rest.class.php");
require_once("../classes/mysql.class.php");

abstract class endpoint extends rest
{
    public $db;
	
    public function __construct(){
        parent::__construct();		// Init parent contructor
        $this->db = new db() ;             // Initiate Database
    }
        
    public function processApi($that) {
        $func = "_".$this->_endpoint ; 
        if((int)method_exists($this, $func) > 0) {
            $this->$func();
        }  else {
            $this->response("No Endpoint: $this->endpoint", 404);
        }
    }	

    public function _list($sql){	
        if($this->get_request_method() != "GET"){
            $this->response('', 406);
        }

        $orderby = $this->_request['orderby'];
        $limit = $this->_request['limit'];
        if($orderby && $orderby != "") {
            $sql .= " ".$orderby;
        }
        if($limit && $limit != "") {
            $sql .= " ".$limit;
        }
     
        $post_data = array(
            'records' => $this->db->select($sql),
            'isSuccess' => true
        );

        $this->response($this->json($post_data), 200); 
    }
}
