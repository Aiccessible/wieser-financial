#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
from typing import List, Dict, Any

from aws_lambda_powertools import Logger
import boto3
import botocore
from mypy_boto3_dynamodb import DynamoDBServiceResource, DynamoDBClient
from mypy_boto3_dynamodb.paginator import QueryPaginator
from mypy_boto3_dynamodb.service_resource import Table
from dynamodb_encryption_sdk.encrypted.table import EncryptedTable
from dynamodb_encryption_sdk.identifiers import CryptoAction
from dynamodb_encryption_sdk.material_providers.aws_kms import AwsKmsCryptographicMaterialsProvider
from dynamodb_encryption_sdk.structures import AttributeActions
from mypy_boto3_dynamodb.service_resource import Table

from app import constants

__all__ = ["check_institution", "delete_transactions"]

KEY_ARN = os.getenv("KEY_ARN")
TABLE_NAME = os.getenv("TABLE_NAME")
STAGE = os.getenv("STAGE")

logger = Logger(child=True)

dynamodb: DynamoDBServiceResource = boto3.resource("dynamodb", config=constants.BOTO3_CONFIG)
table: Table = dynamodb.Table(TABLE_NAME)
aws_kms_cmp = AwsKmsCryptographicMaterialsProvider(key_id=KEY_ARN)
default_action = CryptoAction.ENCRYPT_AND_SIGN if (STAGE == 'prod') else CryptoAction.DO_NOTHING
actions = AttributeActions(
    default_action=default_action,
    attribute_actions={constants.TOKEN_ATTRIBUTE_NAME: CryptoAction.ENCRYPT_AND_SIGN},
)
encrypted_table = EncryptedTable(
    table=table,
    materials_provider=aws_kms_cmp,
    attribute_actions=actions,
)
dynamodb_client: DynamoDBClient = dynamodb.meta.client


def check_institution(user_id: str, institution_id: str) -> bool:
    """
    Check whether a given user has already linked to a specific institution ID
    """
    params = {
        "Key": {
            "pk": f"USER#{user_id}#INSTITUTIONS",
            "sk": f"INSTITUTION#{institution_id}",
        },
        "ProjectionExpression": "#pk, #sk",
        "ExpressionAttributeNames": {
            "#pk": "pk",
            "#sk": "sk",
        },
        "ConsistentRead": True,
    }

    try:
        response = table.get_item(**params)
    except botocore.exceptions.ClientError:
        logger.exception("Unable to get item from DynamoDB")
        raise

    return bool(response.get("Item", False))


def delete_items(user_id: str, item_id: str) -> None:
    params = {
        "TableName": TABLE_NAME,
        "Select": "SPECIFIC_ATTRIBUTES",
        "ProjectionExpression": "#pk, #sk",
        "KeyConditionExpression": "#pk = :pk",
        "ExpressionAttributeNames": {
            "#pk": "pk",
            "#sk": "sk",
        },
        "ExpressionAttributeValues": {
            ":pk": f"USER#{user_id}#ITEM#{item_id}",
        },
        "PaginationConfig": {
            "PageSize": 1000,
        },
    }
    paginator: QueryPaginator = dynamodb_client.get_paginator("query")
    page_iterator = paginator.paginate(**params)

    with table.batch_writer() as batch:
        for page in page_iterator:
            items: List[Dict[str, Any]] = page.get("Items", [])
            for item in items:
                key = {
                    "pk": item["pk"],
                    "sk": item["sk"],
                }
                batch.delete_item(Key=key)

# TODO: Duplicate
def get_item(user_id: str, item_id: str) -> Dict[str, Any]:
    """
    Get the item from DynamoDB
    """

    params = {
        "Key": {
            "pk": f"USER#{user_id}#ITEM#{item_id}",
            "sk": "v0",
        },
        "ConsistentRead": True,
    }
    logger.debug(params)

    try:
        response = encrypted_table.get_item(**params)
    except botocore.exceptions.ClientError as error:
        if error.response["Error"]["Code"] == "ResourceNotFoundException":
            raise f"Item {item_id} not found in DynamoDB"

        logger.exception("Failed to get item from DynamoDB")
        raise

    item = response.get("Item", {})
    if not item:
        raise f"Item {item_id} not found in DynamoDB"

    item = {
        k: v
        for k, v in item.items()
        if k in [constants.TOKEN_ATTRIBUTE_NAME]
    }

    return item
