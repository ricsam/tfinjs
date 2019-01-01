provider "aws" {
  assume_role = {
    role_arn = "arn:aws:iam::13371337:role/DeploymentRole"
  }

  region = "eu-north-1"
}

terraform {
  backend "s3" {
    bucket = "terraform-state-prod"
    key    = "tijpetshop8e8646c4.terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_iam_role" "pets" {
  assume_role_policy = <<EOF
{"Version":"2012-10-17","Statement":[{"Action":"sts:AssumeRole","Principal":{"Service":"lambda.amazonaws.com"},"Effect":"Allow","Sid":""}]}
EOF
}

output "arn" {
  value = "${aws_iam_role.pets.arn}"
}

output "name" {
  value = "${aws_iam_role.pets.name}"
}
