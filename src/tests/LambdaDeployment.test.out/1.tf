provider "aws" {
  assume_role = {
    role_arn = "arn:aws:iam::133713371337:role/DeploymentRole"
  }

  region = "eu-north-1"
}

terraform {
  backend "s3" {
    bucket = "terraform-state-prod"
    key    = "tijpetshop374485ae.terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_dynamodb_table" "pets" {
  description   = "pet lambda"
  function_name = "tijpetshop374485ae"
  handler       = "service.handler"
  memory_size   = 512
  role          = "${data.terraform_remote_state.tijpetshop8e721d9b.arn}"
  runtime       = "nodejs8.10"
  s3_bucket     = "pet-lambda-bucket"
  s3_key        = "tijpetshop374485ae"
  timeout       = 20
}

data "terraform_remote_state" "tijpetshop8e721d9b" {
  backend = "s3"

  config = {
    bucket = "terraform-state-prod"
    key    = "tijpetshop8e721d9b.terraform.tfstate"
    region = "us-east-1"
  }
}
