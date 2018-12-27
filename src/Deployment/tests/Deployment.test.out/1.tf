resource "aws_dynamodb_table" "pets" {
  arn  = "${data.terraform_remote_state.tijdeptstproj649d9ba7.arn}"
  name = "tijdeptstprojd194bec0"

  provisionedRWs = {
    read  = 5
    write = 5
  }
}

data "terraform_remote_state" "tijdeptstproj649d9ba7" {
  backend = "s3"

  config = {
    bucket = "screed-terraform-state-2"
    key    = "tijdeptstproj649d9ba7.terraform.tfstate"
    region = "eu-central-1"
  }
}
