threatmodel "Tower of London" {
  description = "A historic castle"
  author = "@xntrik"

  attributes {
    new_initiative = "true"
    internet_facing = "true"
    initiative_size = "Small"
  }

  information_asset "crown jewels" {
    description = "including the imperial state crown"
    information_classification = "Confidential"
  }

  usecase {
    description = "The Queen can fetch the crown"
  }

  threat "Crown Theft" {
    description = "Someone who isn't the Queen steals the crown"
    impacts = ["Confidentiality"]

    control "Guards" {
      description = "Trained guards patrol tower"
      risk_reduction = 75
    }
  }
}
