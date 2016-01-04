<?php
require_once("endpoint.class.php");

class auth extends endpoint
{
    public function __construct(){
        parent::__construct();		// Init parent contructor
    }

    public function _login() {
        if($this->get_request_method() != "POST"){
            $this->response('', 406);
        }

        $request = json_decode($this->_request, true);
       
        $username = $request['username'];
        $passwordmd5 = $request['passwordmd5'];

        $sql = " SELECT * FROM users WHERE username = '$username' ";
                               
        $records = $this->db->select($sql);
        if(count($records) != 1) {
            $this->send_response('', 401, 'Username and password do not match...');
        }
 
        $user = $records[0];
	if($user['passwordmd5'] != $passwordmd5) {
            $this->send_response('', 401, 'User name and password do not match.');
        }
        if($user['userstatus'] != 1) {
            $this->send_response('', 401, 'This user need active.');
        }
        if($user['userfrozen'] != 0) {
            $this->send_response('', 401, 'This user is frozen.');
        }
        if($user['usertype']  != 9) {
            $this->send_response('', 401, 'This user is not correct.');
        }

        $user['time'] = time();
        $user['authorization'] = base64_encode($user['username'].":".$user['passwordmd5']);

        $post_data = array(
            'user' => $user,
            'isSuccess' => true
        );
        $this->send_response($this->json($post_data), 200, 'Success'); 
    }
    public function _logout() {
        $sql  =  " SELECT * FROM users ";
        $sql .= " WHERE usertype = 0 ";
        parent::_list($sql);
    }
}
$api = new auth;
$api->processApi(api);

?>

