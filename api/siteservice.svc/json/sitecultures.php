<?php

/* 
{
  "CultureHolder": [
    {
      "Id": 0,
      "SiteId": 1,
      "IsDefault": true,
      "CultureId": 3,
      "Culture": {
        "Id": 3,
        "Code": "fr-CA",
        "Name": "Français (Canada)",
        "Neutral": {
          "Id": 1,
          "Code": "fr",
          "Name": "Français",
          "Neutral": null,
          "NeutralId": null
        },
        "NeutralId": 1
      }
    },
    {
      "Id": 0,
      "SiteId": 1,
      "IsDefault": false,
      "CultureId": 6,
      "Culture": {
        "Id": 6,
        "Code": "en-CA",
        "Name": "English (Canada)",
        "Neutral": {
          "Id": 4,
          "Code": "en",
          "Name": "English",
          "Neutral": null,
          "NeutralId": null
        },
        "NeutralId": 4
      }
    }
  ]
}
 */

    class CultureHolder {
        public $Cultures;
    }
    class Cultures {
        public $Id;
        public $SiteId;
        public $IsDefault;
        public $CultureId;
        public $Culture;
    }
    class Culture {
        public $Id;
        public $Code;
        public $Name;
        public $Neutral; 
        public $NeutralId;
    }
    class Neutral {
        public $Id;
        public $Code;
        public $Name;
        public $Neutral;
        public $NeutralId;
    }
	
    $CultureHolder = new CultureHolder();
    $CultureHolder->Cultures = array();

    $Neutral = new Neutral();
    $Neutral->Id = 1;
    $Neutral->Code = "fr";
    $Neutral->Name = "Français";

    $Culture = new Culture();
    $Culture->Id = 3;
    $Culture->Code = "fr-CA";
    $Culture->Name = "Français (Canada)";
    $Culture->Neutral = $Neutral;
    $Culture->NeutralId = 1;
    
    $Cultures = new Cultures();
    $Cultures->Id = 0;
    $Cultures->SiteId =  1;
    $Cultures->IsDefault = true;
    $Cultures->CultureId = 3;
    $Cultures->Culture = $Culture;

    $CultureHolder->Cultures[] = $Cultures;

    $Neutral = new Neutral();
    $Neutral->Id = 4;
    $Neutral->Code = "en";
    $Neutral->Name = "English";

    $Culture = new Culture();
    $Culture->Id = 6;
    $Culture->Code = "en-CA";
    $Culture->Name = "English (Canada)";
    $Culture->Neutral = $Neutral;
    $Culture->NeutralId = 4;
   
    $Cultures = new Cultures();
    $Cultures->Id = 0;
    $Cultures->SiteId =  1;
    $Cultures->IsDefault = false;
    $Cultures->CultureId = 6;
    $Cultures->Culture = $Culture;

    $CultureHolder->Cultures[] = $Cultures;

   echo json_encode($CultureHolder);
   