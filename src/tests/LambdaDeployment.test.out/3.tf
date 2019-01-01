provider "aws" {
  assume_role = {
    role_arn = "arn:aws:iam::133713371337:role/DeploymentRole"
  }

  region = "eu-north-1"
}

terraform {
  backend "s3" {
    bucket = "terraform-state-prod"
    key    = "tijpetshop6b14b9b1.terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_iam_role_policy_attachment" "cloud_watch_role_attachment" {
  policy_arn = "${data.terraform_remote_state.tijpetshop3ea74834.arn}"
  role       = "${data.terraform_remote_state.tijpetshop8e721d9b.name}"
}

data "terraform_remote_state" "tijpetshop8e721d9b" {
  backend = "s3"

  config = {
    bucket = "terraform-state-prod"
    key    = "tijpetshop8e721d9b.terraform.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "tijpetshop3ea74834" {
  backend = "s3"

  config = {
    bucket = "terraform-state-prod"
    key    = "tijpetshop3ea74834.terraform.tfstate"
    region = "us-east-1"
  }
}
