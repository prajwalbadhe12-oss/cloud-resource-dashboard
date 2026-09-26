import boto3

ec2 = boto3.client("ec2", region_name="ap-south-1")

response = ec2.describe_instances()

instances = []

for reservation in response["Reservations"]:
    for instance in reservation["Instances"]:
        instances.append({
            "instance_id": instance["InstanceId"],
            "state": instance["State"]["Name"],
            "instance_type": instance["InstanceType"]
        })

print("AWS EC2 Connection Successful")
print("EC2 Instances:")

for instance in instances:
    print(instance)