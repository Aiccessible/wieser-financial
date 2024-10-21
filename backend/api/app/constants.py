#!/usr/bin/env python
# -*- coding: utf-8 -*-

from botocore.config import Config

__all__ = ["BOTO3_CONFIG", "TOKEN_EXPIRATION", "MAX_LIMIT"]

BOTO3_CONFIG = Config(
    retries={
        "max_attempts": 15,
        "mode": "standard",
    }
)

TOKEN_EXPIRATION = 5 * 60  # 5 minutes
TOKEN_ATTRIBUTE_NAME = "access_token"

MAX_LIMIT = 100
