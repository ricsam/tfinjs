provider "aws" {
  assume_role = {
    role_arn = "arn:aws:iam::13371337:role/DeploymentRole"
  }

  region = "eu-north-1"
}

terraform {
  backend "s3" {
    bucket = "terraform-state-prod"
    key    = "tijpetshop8251238a.terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_dynamodb_table" "pets" {
  description   = "pet lambda"
  function_name = "tijpetshop8251238a"
  handler       = "service.handler"
  memory_size   = 512
  role          = "${data.terraform_remote_state.tijpetshop8e8646c4.arn}"
  runtime       = "nodejs8.10"
  s3_bucket     = "pet-lambda-bucket"
  s3_key        = "tijpetshop8251238a"
  timeout       = 20
}

data "terraform_remote_state" "tijpetshop8e8646c4" {
  backend = "s3"

  config = {
    bucket = "terraform-state-prod"
    key    = "tijpetshop8e8646c4.terraform.tfstate"
    region = "us-east-1"
  }
}
