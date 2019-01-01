provider "aws" {
  assume_role = {
    role_arn = "arn:aws:iam::13371337:role/DeploymentRole"
  }

  region = "eu-north-1"
}

terraform {
  backend "s3" {
    bucket = "terraform-state-prod"
    key    = "tijpetshopd8a0a94e.terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_iam_role_policy_attachment" "cloud_watch_role_attachment" {
  policy_arn = "${data.terraform_remote_state.tijpetshop325c5674.arn}"
  role       = "${data.terraform_remote_state.tijpetshop8e8646c4.name}"
}

data "terraform_remote_state" "tijpetshop8e8646c4" {
  backend = "s3"

  config = {
    bucket = "terraform-state-prod"
    key    = "tijpetshop8e8646c4.terraform.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "tijpetshop325c5674" {
  backend = "s3"

  config = {
    bucket = "terraform-state-prod"
    key    = "tijpetshop325c5674.terraform.tfstate"
    region = "us-east-1"
  }
}
