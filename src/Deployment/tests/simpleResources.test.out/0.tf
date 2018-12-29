provider "aws" {
  assume_role = {
    role_arn = "arn:aws:iam::13371337:role/DeploymentRole"
  }

  region = "us-east-1"
}

resource "aws_s3_bucket" "terraform_state_prod" {
  acl    = "private"
  bucket = "terraform-state-prod"

  versioning = {
    enabled = true
  }
}
