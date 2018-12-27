resource "aws_iam_role" "pets" {
  allow = {
    dynamodb = "*"
  }

  name = "tijdeptstproj649d9ba7"
}

output "arn" {
  value = "${aws_iam_role.pets.arn}"
}
