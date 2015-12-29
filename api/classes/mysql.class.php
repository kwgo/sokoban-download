<?php
class db {
    private $user = "miniinfo" ;
    private $password = "pass4MINI!";
    private $server = "miniinfo.db.4163763.hostedresource.com";
    private $dbase = "miniinfo";

    private $db;

    public function __construct()
    {
        //parent::__construct();// Init parent contructor
        $this->dbConnect();// Initiate Database connection
    }

    //Database connection
    private function dbConnect()
    {
//      $this->db = mysql_connect(self::DB_SERVER,self::DB_USER,self::DB_PASSWORD);
        $this->db = mysql_connect( $this->server, $this->user, $this->password );
        if($this->db)
            mysql_select_db( $this->dbase, $this->db );
    }

    
    function select($sql) {
        $result = mysql_query($sql, $this->db);
        $rows = array();
        //if(mysql_num_rows($result) > 0) {
        while($row = mysql_fetch_assoc($result)) {
            $rows[] = $row;
        }
        return $rows;
    }

    function insert($sql) {
        return update($sql);
    }
      
    function update($sql) {
        $result = mysql_query($sql, $this->db);
        if( $result )
            return mysql_affected_rows( $result );
        return -1;
    }

    function delete($sql) {
        return update($sql);
    }
}

