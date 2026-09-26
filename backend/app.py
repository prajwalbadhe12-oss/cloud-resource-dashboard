from flask import Flask, jsonify, request
from flask_cors import CORS
import boto3
from datetime import datetime, timedelta, timezone
import json
import os


# =========================================================
# FLASK APPLICATION
# =========================================================

app = Flask(__name__)
CORS(app)


# =========================================================
# AWS CONFIGURATION
# =========================================================

AWS_REGION = "ap-south-1"

# Cost Explorer is accessed through us-east-1
COST_EXPLORER_REGION = "us-east-1"


# =========================================================
# ACTIVITY LOG CONFIGURATION
# =========================================================

ACTIVITY_LOG_FILE = os.path.join(
    os.path.dirname(__file__),
    "activity_logs.json"
)


def add_activity_log(operation, resource, action, status, message):
    """
    Add an operation to the local activity log file.
    """

    log_entry = {
        "operation": operation,
        "resource": resource,
        "action": action,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "message": message
    }

    try:
        with open(
            ACTIVITY_LOG_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            logs = json.load(file)

            if not isinstance(logs, list):
                logs = []

    except (FileNotFoundError, json.JSONDecodeError):

        logs = []

    logs.append(log_entry)

    with open(
        ACTIVITY_LOG_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            logs,
            file,
            indent=4
        )


# =========================================================
# ACTIVITY LOGS API
# =========================================================

@app.get("/api/activity-logs")
def get_activity_logs():

    try:

        with open(
            ACTIVITY_LOG_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            logs = json.load(file)

            if not isinstance(logs, list):
                logs = []

        return jsonify({
            "status": "success",
            "count": len(logs),
            "logs": logs
        })

    except (FileNotFoundError, json.JSONDecodeError):

        return jsonify({
            "status": "success",
            "count": 0,
            "logs": []
        })


# =========================================================
# AWS CLIENTS
# =========================================================

ec2 = boto3.client(
    "ec2",
    region_name=AWS_REGION
)

cloudwatch = boto3.client(
    "cloudwatch",
    region_name=AWS_REGION
)

s3 = boto3.client(
    "s3",
    region_name=AWS_REGION
)

# Cost Explorer client
ce = boto3.client(
    "ce",
    region_name=COST_EXPLORER_REGION
)


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/api/health")
def health_check():

    return jsonify({
        "status": "success",
        "message": "Cloud Resource Dashboard API is running"
    })


# =========================================================
# EC2 MANAGEMENT
# =========================================================

@app.get("/api/ec2/instances")
def get_ec2_instances():

    search = request.args.get(
        "search",
        ""
    ).strip().lower()

    state_filter = request.args.get(
        "state",
        ""
    ).strip().lower()

    try:

        response = ec2.describe_instances()

        instances = []

        for reservation in response.get(
            "Reservations",
            []
        ):

            for instance in reservation.get(
                "Instances",
                []
            ):

                # -----------------------------------------
                # GET EC2 NAME
                # -----------------------------------------

                instance_name = "Unnamed"

                for tag in instance.get(
                    "Tags",
                    []
                ):

                    if tag.get("Key") == "Name":

                        instance_name = tag.get(
                            "Value",
                            "Unnamed"
                        )

                        break

                # -----------------------------------------
                # INSTANCE DATA
                # -----------------------------------------

                instance_data = {
                    "instance_id": instance["InstanceId"],
                    "name": instance_name,
                    "state": instance["State"]["Name"],
                    "instance_type": instance["InstanceType"],
                    "availability_zone": instance["Placement"]["AvailabilityZone"]
                }

                # -----------------------------------------
                # SEARCH
                # -----------------------------------------

                if search:

                    if (
                        search not in instance_data["instance_id"].lower()
                        and search not in instance_data["name"].lower()
                    ):

                        continue

                # -----------------------------------------
                # STATE FILTER
                # -----------------------------------------

                if state_filter:

                    if (
                        instance_data["state"].lower()
                        != state_filter
                    ):

                        continue

                instances.append(instance_data)

        return jsonify({
            "status": "success",
            "count": len(instances),
            "instances": instances
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


# =========================================================
# EC2 START
# =========================================================

@app.post("/api/ec2/<instance_id>/start")
def start_ec2_instance(instance_id):

    try:

        response = ec2.start_instances(
            InstanceIds=[instance_id]
        )

        message = (
            f"EC2 instance {instance_id} "
            f"start request submitted"
        )

        add_activity_log(
            operation="EC2",
            resource=instance_id,
            action="START",
            status="success",
            message=message
        )

        return jsonify({
            "status": "success",
            "message": message,
            "instance_id": instance_id,
            "response": response
        })

    except Exception as e:

        add_activity_log(
            operation="EC2",
            resource=instance_id,
            action="START",
            status="failure",
            message=str(e)
        )

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


# =========================================================
# EC2 STOP
# =========================================================

@app.post("/api/ec2/<instance_id>/stop")
def stop_ec2_instance(instance_id):

    try:

        response = ec2.stop_instances(
            InstanceIds=[instance_id]
        )

        message = (
            f"EC2 instance {instance_id} "
            f"stop request submitted"
        )

        add_activity_log(
            operation="EC2",
            resource=instance_id,
            action="STOP",
            status="success",
            message=message
        )

        return jsonify({
            "status": "success",
            "message": message,
            "instance_id": instance_id,
            "response": response
        })

    except Exception as e:

        add_activity_log(
            operation="EC2",
            resource=instance_id,
            action="STOP",
            status="failure",
            message=str(e)
        )

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


# =========================================================
# EC2 INSTANCE DETAILS
# =========================================================

@app.get("/api/ec2/<instance_id>/details")
def get_ec2_instance_details(instance_id):

    try:

        # -----------------------------------------
        # GET INSTANCE DETAILS
        # -----------------------------------------

        response = ec2.describe_instances(
            InstanceIds=[instance_id]
        )

        reservations = response.get(
            "Reservations",
            []
        )

        if (
            not reservations
            or not reservations[0].get("Instances")
        ):

            return jsonify({
                "status": "error",
                "message": "EC2 instance not found"
            }), 404

        instance = reservations[0]["Instances"][0]

        # -----------------------------------------
        # GET INSTANCE NAME
        # -----------------------------------------

        instance_name = "Unnamed"

        for tag in instance.get(
            "Tags",
            []
        ):

            if tag.get("Key") == "Name":

                instance_name = tag.get(
                    "Value",
                    "Unnamed"
                )

                break

        # -----------------------------------------
        # GET NETWORK INFORMATION
        # -----------------------------------------

        private_ip = instance.get(
            "PrivateIpAddress"
        )

        public_ip = instance.get(
            "PublicIpAddress"
        )

        subnet_id = instance.get(
            "SubnetId"
        )

        vpc_id = instance.get(
            "VpcId"
        )

        security_groups = []

        for group in instance.get(
            "SecurityGroups",
            []
        ):

            security_groups.append({
                "group_id": group.get("GroupId"),
                "group_name": group.get("GroupName")
            })

        # -----------------------------------------
        # GET BLOCK DEVICE INFORMATION
        # -----------------------------------------

        volumes = []

        for device in instance.get(
            "BlockDeviceMappings",
            []
        ):

            ebs = device.get("Ebs")

            if not ebs:
                continue

            volumes.append({
                "device_name": device.get(
                    "DeviceName"
                ),
                "volume_id": ebs.get(
                    "VolumeId"
                ),
                "delete_on_termination": ebs.get(
                    "DeleteOnTermination"
                )
            })

        # -----------------------------------------
        # GET IAM PROFILE
        # -----------------------------------------

        iam_profile = instance.get(
            "IamInstanceProfile"
        )

        iam_profile_arn = None

        if iam_profile:

            iam_profile_arn = iam_profile.get(
                "Arn"
            )

        # -----------------------------------------
        # FORMAT INSTANCE DETAILS
        # -----------------------------------------

        instance_details = {

            "instance_id": instance.get(
                "InstanceId"
            ),

            "name": instance_name,

            "state": instance.get(
                "State",
                {}
            ).get(
                "Name"
            ),

            "instance_type": instance.get(
                "InstanceType"
            ),

            "availability_zone": instance.get(
                "Placement",
                {}
            ).get(
                "AvailabilityZone"
            ),

            "region": AWS_REGION,

            "launch_time": (
                instance.get(
                    "LaunchTime"
                ).isoformat()
                if instance.get("LaunchTime")
                else None
            ),

            "private_ip": private_ip,

            "public_ip": public_ip,

            "vpc_id": vpc_id,

            "subnet_id": subnet_id,

            "key_name": instance.get(
                "KeyName"
            ),

            "iam_instance_profile": iam_profile_arn,

            "security_groups": security_groups,

            "volumes": volumes,

            "architecture": instance.get(
                "Architecture"
            ),

            "platform": instance.get(
                "PlatformDetails"
            ),

            "monitoring": instance.get(
                "Monitoring",
                {}
            ).get(
                "State"
            )
        }

        return jsonify({
            "status": "success",
            "instance": instance_details
        })

    except Exception as e:

        print(
            "EC2 Details Error:",
            str(e)
        )

        return jsonify({
            "status": "error",
            "message": str(e),
            "instance_id": instance_id
        }), 400


# =========================================================
# CLOUDWATCH EC2 CPU UTILIZATION
# =========================================================

@app.get("/api/cloudwatch/ec2/<instance_id>/cpu")
def get_ec2_cpu(instance_id):

    try:

        # -----------------------------------------
        # TIME RANGE
        # Last 1 hour
        # -----------------------------------------

        end_time = datetime.now(
            timezone.utc
        )

        start_time = end_time - timedelta(
            hours=1
        )

        # -----------------------------------------
        # CLOUDWATCH CPU METRIC
        # -----------------------------------------

        response = cloudwatch.get_metric_statistics(
            Namespace="AWS/EC2",
            MetricName="CPUUtilization",
            Dimensions=[
                {
                    "Name": "InstanceId",
                    "Value": instance_id
                }
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=[
                "Average"
            ],
            Unit="Percent"
        )

        # -----------------------------------------
        # FORMAT DATAPOINTS
        # -----------------------------------------

        datapoints = []

        for point in response.get(
            "Datapoints",
            []
        ):

            timestamp = point.get(
                "Timestamp"
            )

            average = point.get(
                "Average"
            )

            if timestamp is None or average is None:
                continue

            datapoints.append({
                "timestamp": timestamp.isoformat(),
                "average": round(
                    float(average),
                    2
                )
            })

        # -----------------------------------------
        # SORT OLDEST → NEWEST
        # -----------------------------------------

        datapoints.sort(
            key=lambda item: item["timestamp"]
        )

        return jsonify({
            "status": "success",
            "instance_id": instance_id,
            "metric": "CPUUtilization",
            "unit": "Percent",
            "period": 300,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "datapoints": datapoints
        })

    except Exception as e:

        print(
            "CloudWatch CPU Error:",
            str(e)
        )

        return jsonify({
            "status": "error",
            "message": str(e),
            "instance_id": instance_id
        }), 400


# =========================================================
# CLOUDWATCH / SNS ALERTS
# =========================================================

@app.get("/api/alerts")
def get_cloudwatch_alerts():

    try:

        response = cloudwatch.describe_alarms()

        alarms = []

        for alarm in response.get(
            "MetricAlarms",
            []
        ):

            # -----------------------------------------
            # SNS ACTION CHECK
            # -----------------------------------------

            alarm_actions = alarm.get(
                "AlarmActions",
                []
            )

            ok_actions = alarm.get(
                "OKActions",
                []
            )

            insufficient_data_actions = alarm.get(
                "InsufficientDataActions",
                []
            )

            # -----------------------------------------
            # DETECT SNS
            # -----------------------------------------

            sns_actions = [
                action
                for action in alarm_actions
                if action.startswith("arn:aws:sns:")
            ]

            # -----------------------------------------
            # FORMAT LAST STATE UPDATE
            # -----------------------------------------

            state_updated_timestamp = alarm.get(
                "StateUpdatedTimestamp"
            )

            if state_updated_timestamp:

                state_updated = (
                    state_updated_timestamp.isoformat()
                )

            else:

                state_updated = None

            # -----------------------------------------
            # ALARM DATA
            # -----------------------------------------

            alarm_data = {

                "name": alarm.get(
                    "AlarmName"
                ),

                "state": alarm.get(
                    "StateValue",
                    "UNKNOWN"
                ),

                "state_reason": alarm.get(
                    "StateReason",
                    ""
                ),

                "state_updated": state_updated,

                "metric_name": alarm.get(
                    "MetricName",
                    ""
                ),

                "namespace": alarm.get(
                    "Namespace",
                    ""
                ),

                "statistic": alarm.get(
                    "Statistic",
                    ""
                ),

                "period": alarm.get(
                    "Period",
                    0
                ),

                "evaluation_periods": alarm.get(
                    "EvaluationPeriods",
                    0
                ),

                "threshold": alarm.get(
                    "Threshold",
                    0
                ),

                "comparison_operator": alarm.get(
                    "ComparisonOperator",
                    ""
                ),

                "alarm_actions": alarm_actions,

                "sns_actions": sns_actions,

                "sns_enabled": len(sns_actions) > 0,

                "ok_actions": ok_actions,

                "insufficient_data_actions": (
                    insufficient_data_actions
                )
            }

            alarms.append(alarm_data)

        # -----------------------------------------
        # SORT
        # -----------------------------------------

        alarms.sort(
            key=lambda item: item["name"] or ""
        )

        # -----------------------------------------
        # SUMMARY
        # -----------------------------------------

        total_alarms = len(alarms)

        alarm_count = sum(
            1
            for item in alarms
            if item["state"] == "ALARM"
        )

        ok_count = sum(
            1
            for item in alarms
            if item["state"] == "OK"
        )

        insufficient_data_count = sum(
            1
            for item in alarms
            if item["state"] == "INSUFFICIENT_DATA"
        )

        sns_enabled_count = sum(
            1
            for item in alarms
            if item["sns_enabled"]
        )

        return jsonify({

            "status": "success",

            "summary": {
                "total": total_alarms,
                "alarm": alarm_count,
                "ok": ok_count,
                "insufficient_data": (
                    insufficient_data_count
                ),
                "sns_enabled": sns_enabled_count
            },

            "alarms": alarms
        })

    except Exception as e:

        print(
            "CloudWatch Alerts Error:",
            str(e)
        )

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


# =========================================================
# AWS COST VISIBILITY
# =========================================================

@app.get("/api/cost")
def get_aws_cost():

    try:

        # -----------------------------------------
        # CURRENT DATE
        # -----------------------------------------

        now = datetime.now(
            timezone.utc
        )

        # -----------------------------------------
        # CURRENT MONTH START
        # -----------------------------------------

        start_date = now.strftime(
            "%Y-%m-01"
        )

        # -----------------------------------------
        # NEXT MONTH START
        # Cost Explorer End date is exclusive
        # -----------------------------------------

        if now.month == 12:

            next_month = now.replace(
                year=now.year + 1,
                month=1,
                day=1
            )

        else:

            next_month = now.replace(
                month=now.month + 1,
                day=1
            )

        end_date = next_month.strftime(
            "%Y-%m-%d"
        )

        # -----------------------------------------
        # GET COST FROM AWS COST EXPLORER
        # -----------------------------------------

        response = ce.get_cost_and_usage(
            TimePeriod={
                "Start": start_date,
                "End": end_date
            },
            Granularity="MONTHLY",
            Metrics=[
                "UnblendedCost"
            ]
        )

        # -----------------------------------------
        # GET RESULT
        # -----------------------------------------

        results = response.get(
            "ResultsByTime",
            []
        )

        if results:

            cost_data = (
                results[0]
                .get("Total", {})
                .get("UnblendedCost", {})
            )

            amount = float(
                cost_data.get(
                    "Amount",
                    0
                )
            )

            currency = cost_data.get(
                "Unit",
                "USD"
            )

        else:

            amount = 0.0
            currency = "USD"

        return jsonify({

            "status": "success",

            "period": {
                "start": start_date,
                "end": end_date
            },

            "cost": round(
                amount,
                2
            ),

            "currency": currency
        })

    except Exception as e:

        print(
            "AWS Cost Error:",
            str(e)
        )

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


# =========================================================
# S3 MANAGEMENT
# =========================================================

@app.get("/api/s3/buckets")
def get_s3_buckets():

    try:

        response = s3.list_buckets()

        buckets = []

        for bucket in response.get(
            "Buckets",
            []
        ):

            buckets.append({

                "name": bucket["Name"],

                "creation_date": (
                    bucket["CreationDate"].isoformat()
                )
            })

        return jsonify({

            "status": "success",

            "count": len(buckets),

            "buckets": buckets
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


# =========================================================
# S3 BUCKET DETAILS
# =========================================================

@app.get("/api/s3/buckets/<bucket_name>/details")
def get_s3_bucket_details(bucket_name):

    try:

        # -----------------------------------------
        # CHECK BUCKET ACCESS
        # -----------------------------------------

        s3.head_bucket(
            Bucket=bucket_name
        )

        # -----------------------------------------
        # GET BUCKET CREATION DATE
        # -----------------------------------------

        buckets_response = s3.list_buckets()

        bucket_creation_date = None

        for bucket in buckets_response.get(
            "Buckets",
            []
        ):

            if bucket.get("Name") == bucket_name:

                creation_date = bucket.get(
                    "CreationDate"
                )

                if creation_date:

                    bucket_creation_date = (
                        creation_date.isoformat()
                    )

                break

        # -----------------------------------------
        # GET BUCKET REGION
        # -----------------------------------------

        location_response = s3.get_bucket_location(
            Bucket=bucket_name
        )

        bucket_region = location_response.get(
            "LocationConstraint"
        )

        # AWS returns None for us-east-1
        if bucket_region is None:

            bucket_region = "us-east-1"

        # -----------------------------------------
        # GET OBJECT INFORMATION
        # -----------------------------------------

        object_count = 0

        total_size = 0

        latest_object = None

        latest_modified_datetime = None

        paginator = s3.get_paginator(
            "list_objects_v2"
        )

        for page in paginator.paginate(
            Bucket=bucket_name
        ):

            for obj in page.get(
                "Contents",
                []
            ):

                object_count += 1

                total_size += obj.get(
                    "Size",
                    0
                )

                # ---------------------------------
                # CURRENT OBJECT MODIFICATION TIME
                # ---------------------------------

                current_modified = obj.get(
                    "LastModified"
                )

                # ---------------------------------
                # FIND LATEST OBJECT
                # ---------------------------------

                if (
                    current_modified
                    and (
                        latest_modified_datetime is None
                        or current_modified
                        > latest_modified_datetime
                    )
                ):

                    latest_modified_datetime = (
                        current_modified
                    )

                    latest_object = {

                        "key": obj.get(
                            "Key"
                        ),

                        "size": obj.get(
                            "Size",
                            0
                        ),

                        "last_modified": (
                            current_modified.isoformat()
                        )
                    }

        # -----------------------------------------
        # RETURN DETAILS
        # -----------------------------------------

        return jsonify({

            "status": "success",

            "bucket": {

                "name": bucket_name,

                "creation_date": (
                    bucket_creation_date
                ),

                "region": bucket_region,

                "accessible": True,

                "object_count": object_count,

                "total_size_bytes": total_size,

                "latest_object": latest_object
            }

        })

    except Exception as e:

        print(
            "S3 Bucket Details Error:",
            str(e)
        )

        return jsonify({

            "status": "error",

            "message": str(e),

            "bucket_name": bucket_name
        }), 400


# =========================================================
# S3 OBJECT LIST
# =========================================================

@app.get("/api/s3/buckets/<bucket_name>/objects")
def get_s3_objects(bucket_name):

    try:

        response = s3.list_objects_v2(
            Bucket=bucket_name
        )

        objects = []

        for obj in response.get(
            "Contents",
            []
        ):

            objects.append({

                "key": obj["Key"],

                "size": obj["Size"],

                "last_modified": (
                    obj["LastModified"].isoformat()
                )
            })

        return jsonify({

            "status": "success",

            "bucket": bucket_name,

            "count": len(objects),

            "objects": objects
        })

    except Exception as e:

        return jsonify({

            "status": "error",

            "message": str(e)
        }), 400


# =========================================================
# S3 FILE UPLOAD
# =========================================================

@app.post("/api/s3/buckets/<bucket_name>/upload")
def upload_s3_file(bucket_name):

    # -----------------------------------------
    # CHECK FILE
    # -----------------------------------------

    if "file" not in request.files:

        add_activity_log(
            operation="S3",
            resource=bucket_name,
            action="UPLOAD",
            status="failure",
            message="No file provided"
        )

        return jsonify({
            "status": "error",
            "message": "No file provided"
        }), 400

    file = request.files["file"]

    # -----------------------------------------
    # CHECK FILENAME
    # -----------------------------------------

    if file.filename == "":

        add_activity_log(
            operation="S3",
            resource=bucket_name,
            action="UPLOAD",
            status="failure",
            message="No filename provided"
        )

        return jsonify({
            "status": "error",
            "message": "No filename provided"
        }), 400

    try:

        # -----------------------------------------
        # CHECK BUCKET
        # -----------------------------------------

        s3.head_bucket(
            Bucket=bucket_name
        )

        # -----------------------------------------
        # UPLOAD
        # -----------------------------------------

        s3.upload_fileobj(
            file,
            bucket_name,
            file.filename
        )

        message = (
            f"File {file.filename} uploaded successfully "
            f"to bucket {bucket_name}"
        )

        add_activity_log(
            operation="S3",
            resource=bucket_name,
            action="UPLOAD",
            status="success",
            message=message
        )

        return jsonify({

            "status": "success",

            "message": "File uploaded successfully",

            "bucket": bucket_name,

            "file_name": file.filename
        })

    except Exception as e:

        add_activity_log(
            operation="S3",
            resource=bucket_name,
            action="UPLOAD",
            status="failure",
            message=str(e)
        )

        return jsonify({

            "status": "error",

            "message": f"Upload failed: {str(e)}"
        }), 400


# =========================================================
# S3 DELETE OBJECT
# =========================================================

@app.delete(
    "/api/s3/buckets/<bucket_name>/objects/<path:object_key>"
)
def delete_s3_object(bucket_name, object_key):

    try:

        # -----------------------------------------
        # CHECK OBJECT
        # -----------------------------------------

        s3.head_object(
            Bucket=bucket_name,
            Key=object_key
        )

    except Exception:

        add_activity_log(
            operation="S3",
            resource=bucket_name,
            action="DELETE_OBJECT",
            status="failure",
            message=f"Object {object_key} not found"
        )

        return jsonify({

            "status": "error",

            "message": "Object not found"
        }), 404

    try:

        # -----------------------------------------
        # DELETE OBJECT
        # -----------------------------------------

        s3.delete_object(
            Bucket=bucket_name,
            Key=object_key
        )

        message = (
            f"Object {object_key} deleted successfully "
            f"from bucket {bucket_name}"
        )

        add_activity_log(
            operation="S3",
            resource=bucket_name,
            action="DELETE_OBJECT",
            status="success",
            message=message
        )

        return jsonify({

            "status": "success",

            "message": "Object deleted successfully",

            "bucket": bucket_name,

            "object_key": object_key
        })

    except Exception as e:

        add_activity_log(
            operation="S3",
            resource=bucket_name,
            action="DELETE_OBJECT",
            status="failure",
            message=str(e)
        )

        return jsonify({

            "status": "error",

            "message": str(e)
        }), 400


# =========================================================
# S3 CREATE BUCKET
# =========================================================

@app.post("/api/s3/buckets")
def create_s3_bucket():

    data = request.get_json()

    # -----------------------------------------
    # VALIDATE REQUEST
    # -----------------------------------------

    if not data or "bucket_name" not in data:

        add_activity_log(
            operation="S3",
            resource="unknown",
            action="CREATE_BUCKET",
            status="failure",
            message="bucket_name is required"
        )

        return jsonify({

            "status": "error",

            "message": "bucket_name is required"
        }), 400

    bucket_name = data["bucket_name"].strip()

    if not bucket_name:

        add_activity_log(
            operation="S3",
            resource="unknown",
            action="CREATE_BUCKET",
            status="failure",
            message="Bucket name cannot be empty"
        )

        return jsonify({

            "status": "error",

            "message": "Bucket name cannot be empty"
        }), 400

    try:

        # -----------------------------------------
        # CREATE BUCKET
        # -----------------------------------------

        s3.create_bucket(
            Bucket=bucket_name,
            CreateBucketConfiguration={
                "LocationConstraint": AWS_REGION
            }
        )

        message = (
            f"S3 bucket {bucket_name} "
            f"created successfully"
        )

        add_activity_log(
            operation="S3",
            resource=bucket_name,
            action="CREATE_BUCKET",
            status="success",
            message=message
        )

        return jsonify({

            "status": "success",

            "message": "S3 bucket created successfully",

            "bucket": bucket_name
        }), 201

    except Exception as e:

        add_activity_log(
            operation="S3",
            resource=bucket_name,
            action="CREATE_BUCKET",
            status="failure",
            message=str(e)
        )

        return jsonify({

            "status": "error",

            "message": str(e)
        }), 400


# =========================================================
# S3 DELETE BUCKET
# =========================================================

@app.delete("/api/s3/buckets/<bucket_name>")
def delete_s3_bucket(bucket_name):

    try:

        # -----------------------------------------
        # CHECK WHETHER BUCKET CONTAINS OBJECTS
        # -----------------------------------------

        response = s3.list_objects_v2(
            Bucket=bucket_name
        )

        if response.get(
            "KeyCount",
            0
        ) > 0:

            message = (
                "Bucket is not empty. "
                "Delete all objects first."
            )

            add_activity_log(
                operation="S3",
                resource=bucket_name,
                action="DELETE_BUCKET",
                status="failure",
                message=message
            )

            return jsonify({

                "status": "error",

                "message": message
            }), 400

        # -----------------------------------------
        # DELETE BUCKET
        # -----------------------------------------

        s3.delete_bucket(
            Bucket=bucket_name
        )

        message = (
            f"S3 bucket {bucket_name} "
            f"deleted successfully"
        )

        add_activity_log(
            operation="S3",
            resource=bucket_name,
            action="DELETE_BUCKET",
            status="success",
            message=message
        )

        return jsonify({

            "status": "success",

            "message": "S3 bucket deleted successfully",

            "bucket": bucket_name
        })

    except Exception as e:

        add_activity_log(
            operation="S3",
            resource=bucket_name,
            action="DELETE_BUCKET",
            status="failure",
            message=str(e)
        )

        return jsonify({

            "status": "error",

            "message": str(e)
        }), 400


# =========================================================
# START FLASK SERVER
# =========================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )