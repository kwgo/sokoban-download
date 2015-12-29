<?php
require_once("../classes/rest.class.php");
require_once("../classes/mysql.class.php");

class player extends rest
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
    private function _save() {
		if($this->get_request_method() != "POST") {
			$this->response('',406);
		}

		if(!empty($this->_request) ){
			try {
                            $json_array = json_decode($this->_request,true);
                            $res = $this->db->insert($json_array);
                            if ( $res ) {
				   $result = array('return'=>'ok');
				   $this->response($this->json($result), 200);
                            } else {
                               $result = array('return'=>'not added');
                               $this->response($this->json($result), 200);
                            }
			} catch (Exception $e) {
				$this->response('', 400) ;
			}
		} else {
		  	$error = array('status' => "Failed", "msg" => "Invalid send data");
			$this->response($this->json($error), 400);
		}
	}

	public function _list(){	
		if($this->get_request_method() != "GET"){
			$this->response('',406);
		}
                
                //$json_array = json_decode($this->_request,true);
                //$orderby = $json_array['orderby'];
                //$limit = $json_array['limit'];
                $orderby = $this->_request['orderby'];
                $limit = $this->_request['limit'];
                
              	$sql =  " SELECT * FROM users ";
        	$sql .= " WHERE usertype = 0 ";
         	if($orderby && $orderby != "") {
                    $sql .= " ".$orderby;
                }
                if($limit && $limit != "") {
                    $sql .= " ".$limit;
        	}
                $result = $this->db->select($sql) ;  
		$this->response($this->json($result), 200); 
	        //$this->response('',204);	// If no records "No Content" status
	}

        private function _delete0() {
           $this->_delete(0);
        }

        private function _delete1() {
           $this->_delete(1);
        }
	
	private function _delete($flag){
		if($this->get_request_method() != "DELETE"){
			$this->response('',406);
		}
		$id = $this->_args[0];
		if(!empty($id)){				
                     $res = $this->db->delete($id,$flag);
                     if ( $res ) {
			    $success = array('status' => "Success", "msg" => "Successfully one record deleted. Record - ".$id);
			    $this->response($this->json($success),200);
                     } else {
                         $failed = array('status' => "Failed", "msg" => "No records deleted" );
                         $this->response($this->json($failed),200);
                     }
		}else {
			 $failed = array('status' => "No content", "msg" => "No records deleted" );
                         $this->response($this->json($failed),204);    // If no records "No Content" status
                }
	}
       
        private function _update0() {
           $this->_update(0);
        }

        private function _update1() {
           $this->_update(1);
        }

	private function _update($flag){
		if($this->get_request_method() != "PUT"){
			$this->response('',406);
		}
		$id = $this->_args[0];
                $json_array = json_decode($this->_request,true);;
		if(!empty($id)){
                     $res = $this->db->update($id,$json_array,$flag) ;				
                     if ( $res > 0 ) {
			   $success = array('status' => "Success", "msg" => "Successfully one record updated.");
			   $this->response($this->json($success),200);
                     } else {
			   $failed = array('status' => "Failed", "msg" => "No records updated.");
			   $this->response($this->json($failed),200);
                     }                        
		}else
			$this->response('',204);	// If no records "No Content" status		
	}

    }
		
    $api = new player;
    $api->processApi();

?>

