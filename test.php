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
   
    $CultureHolder->Cultures[0] = new Cultures();
    $CultureHolder->Cultures[0]->Id = 0;
    $CultureHolder->Cultures[0]->SiteId =  1;
    $CultureHolder->Cultures[0]->IsDefault = true;
    $CultureHolder->Cultures[0]->CultureId = 3;
    $CultureHolder->Cultures[0]->Culture = new Culture();
    $CultureHolder->Cultures[0]->Culture->Id = 3;
    $CultureHolder->Cultures[0]->Culture->Code = "fr-CA";
    $CultureHolder->Cultures[0]->Culture->Name = "Français (Canada)";
    $CultureHolder->Cultures[0]->Neutral = new Culture();
    $CultureHolder->Cultures[0]->Neutral->Id = 1;
    $CultureHolder->Cultures[0]->Neutral->Code = "fr";
    $CultureHolder->Cultures[0]->Neutral->Name = "Français";
    $CultureHolder->Cultures[0]->NeutralId = 1;

    $CultureHolder->Cultures[1] = new Cultures();
    $CultureHolder->Cultures[1]->Id = 0;
    $CultureHolder->Cultures[1]->SiteId =  1;
    $CultureHolder->Cultures[1]->IsDefault = false;
    $CultureHolder->Cultures[1]->CultureId = 6;
    $CultureHolder->Cultures[1]->Culture = new Culture();
    $CultureHolder->Cultures[1]->Culture->Id = 6;
    $CultureHolder->Cultures[1]->Culture->Code = "en-CA";
    $CultureHolder->Cultures[1]->Culture->Name = "English (Canada)";
    $CultureHolder->Cultures[1]->Culture->Neutral = new Neutral();
    $CultureHolder->Cultures[1]->Culture->Neutral->Id = 4;
    $CultureHolder->Cultures[1]->Culture->Neutral->Code = "en";
    $CultureHolder->Cultures[1]->Culture->Neutral->Name = "English";
    $CultureHolder->Cultures[1]->Culture->NeutralId = 4;

   echo json_encode($CultureHolder);
   