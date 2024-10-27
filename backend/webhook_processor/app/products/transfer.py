#!/usr/bin/env python
# -*- coding: utf-8 -*-

from typing import Dict, Any, List, Union

from aws_lambda_powertools import Logger, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from boto3.dynamodb.conditions import Attr
import botocore
import plaid
from plaid.model.transactions_sync_request import TransactionsSyncRequest
from plaid.model.transactions_sync_response import TransactionsSyncResponse
from plaid.model.transactions_sync_request_options import TransactionsSyncRequestOptions
from plaid.model.transaction import Transaction
from plaid.model.removed_transaction import RemovedTransaction
import json
from app import utils, constants, exceptions, datastore
from app.products import AbstractProduct

__all__ = ["Transactions"]

logger = Logger(child=True)
metrics = Metrics()
PAYMENT_STATUS = {
    "NEW": "new",
    "INTENT_PENDING": "intent_pending",
    "DENIED": "denied",
    "PENDING": "pending",
    "POSTED": "posted",
    "SETTLED": "settled",
    "FAILED": "failed",
    "CANCELLED": "cancelled",
    "RETURNED": "returned",
}

EXPECTED_NEXT_STATES = {
    "new": ["pending"],
    "pending": [
        "pending",
        "failed",
        "posted",
        "cancelled",
    ],
    "posted": ["settled", "returned"],
    "settled": ["returned"],
}

class Transfer(AbstractProduct):
    def store_cursor(self, cursor: str) -> None:
        """
        Store the cursor value for the given item
        """

        now = utils.now_iso8601()
        params = {
            "Key": {
                "pk": f"TRANSFER_LAST_READ",
                "sk": "v0",
            },
            "UpdateExpression": "SET #c = :c, #ts = :ts",
            "ConditionExpression": Attr("pk").exists() & Attr("sk").exists(),
            "ExpressionAttributeNames": {
                "#c": constants.CURSOR_TRANSFER_ATTRIBUTE_NAME,
                "#ts": "updated_at",
            },
            "ExpressionAttributeValues": {
                ":c": cursor,
                ":ts": now,
            },
            "ReturnValues": "NONE",
        }

        try:
            self.dynamodb.update_item(**params)
            logger.debug(f"Updated cursor to {cursor}")
            metrics.add_metric(name="UpdateCursorSuccess", unit=MetricUnit.Count, value=1)
        except botocore.exceptions.ClientError:
            logger.exception(f"Failed to update cursor to {cursor}")
            metrics.add_metric(name="UpdateCursorFailed", unit=MetricUnit.Count, value=1)

    def store_transfer(self, transfer_id: str, last_event_body: str, status: str) -> None:
        """
        Store the cursor value for the given item
        """

        now = utils.now_iso8601()
        params = {
            "Key": {
                "pk": "TRANSFER",
                "sk": f"TRANSFER#${transfer_id}",
            },
            "UpdateExpression": "SET #c = :c, #ts = :ts",
            "ConditionExpression": Attr("pk").exists() & Attr("sk").exists(),
            "ExpressionAttributeNames": {
                "#c": "last_event_body",
                "#ts": "updated_at",
                "#d": "status"
            },
            "ExpressionAttributeValues": {
                ":c": last_event_body,
                ":ts": now,
                ":d": status
            },
            "ReturnValues": "NONE",
        }

        try:
            self.dynamodb.update_item(**params)
            logger.info(f"Updated transfer {transfer_id}")
            metrics.add_metric(name="UpdateTransferSuccess", unit=MetricUnit.Count, value=1)
        except botocore.exceptions.ClientError:
            logger.exception(f"Failed to update transfer to {transfer_id}")
            metrics.add_metric(name="UpdateTransferFailed", unit=MetricUnit.Count, value=1)

    def process_payment_event(self, event) -> None:
        logger.info("Begin transfers sync")
        existing_payment = datastore.get_transfer(event["transfer_id"])
        if not existing_payment:
            print(f"Could not find a payment with ID {event['transfer_id']}. It might belong to another application.")
            return

        print(f"Found payment {existing_payment}")

        # Validate if the event type exists in PAYMENT_STATUS
        if event["event_type"] not in PAYMENT_STATUS.values():
            print(f"Unknown event type {event['event_type']}")
            return

        print(f"The payment went from {existing_payment['status']} to {event['event_type']}!")

        # Check if the current status is valid in EXPECTED_NEXT_STATES
        if EXPECTED_NEXT_STATES.get(existing_payment["status"]) is None:
            print("Hmm... existing payment has a status I don't recognize")
            return

        # Validate if the transition from current status to the event's status is allowed
        if event["event_type"] not in EXPECTED_NEXT_STATES[existing_payment["status"]]:
            print(f"Not sure why a {existing_payment['status']} payment is going to a {event['event_type']} state. Skipping.")
            return
        # Update DB to new status
        self.store_transfer(transfer_id=event["transfer_id"], last_event_body=json.dumps(event), status=event['status'])

    def handle_webhook(
        self
    ) -> None:
        """
        Handle transaction webhooks
        """
        logger.info("Handling transaction web hook")
        try:
            cursor_last_read = datastore.get_transfer_last_read().get(constants.CURSOR_TRANSFER_ATTRIBUTE_NAME)
        except exceptions.ItemNotFoundException:
            logger.exception(f"Items not found in DynamoDB")
            metrics.add_metric(name="ItemNotFound", unit=MetricUnit.Count, value=1)
            cursor_last_read = 0

        fetch_more = True
        while fetch_more:
            # Fetch the next batch of transfer events
            next_batch = self.client.transfer_event_sync({
                "after_id": cursor_last_read,
                "count": 20,
            })
            logger.info("Fetched next batch")

            # Sort the transfer events by event_id
            sorted_events = sorted(next_batch.data["transfer_events"], key=lambda event: event["event_id"])

            # Process each event
            for event in sorted_events:
                try: 
                    self.process_payment_event(event)
                except Exception:
                    logger.exception("Failed to proceess payment")
                cursor_last_read = event["event_id"]

            # Check if more events need to be fetched
            fetch_more = next_batch.data["has_more"]
        self.store_cursor(cursor=cursor_last_read)