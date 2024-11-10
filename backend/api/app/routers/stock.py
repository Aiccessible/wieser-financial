import yfinance as yf
import os
from typing import Dict, Any, Union

from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.event_handler.api_gateway import Router, Response
from aws_lambda_powertools.event_handler import content_types
from aws_lambda_powertools.event_handler.exceptions import InternalServerError

# TODO
# from app import constants, datastore, utils

__all__ = ["router"]

tracer = Tracer()
logger = Logger(child=True)
metrics = Metrics()
router = Router()

from datetime import datetime


@router.get("/<ticker>/closing-prices")
@tracer.capture_method(capture_response=False)
def get_closing_prices(tickers: list, period: str, interval: str) -> Dict[str, Any]:

    # TODO
    # user_id: str = utils.authorize_request(router)
    # user_id: str = "test"

    print(f"Received request for ticker: {tickers}, period: {period}, interval: {interval}")

    # FIXME
    # logger.append_keys(ticker=ticker, user_id=user_id)
    # tracer.put_annotation(key="Ticker", value=ticker)
    # tracer.put_annotation(key="UserId", value=user_id)

    # Convert date strings to datetime objects

    # Retrieve stock data using yfinance
    try:

        print(
            f"Fetching historical data for {tickers} for period {period} with interval {interval}"
        )
        data = {}
        for ticker in tickers:
            stock_data = yf.download(ticker, period=period, interval=interval)
            data[ticker] = stock_data[["Close", "Volume"]]
        print(f"Retrieved data: {data}")
        logger.debug(f"Retrieved data: {data}")
        metrics.add_metric(name="ClosingPricesFetchSuccess", unit=MetricUnit.Count, value=1)
    except Exception as e:
        logger.exception("Failed to retrieve closing prices")
        print(f"Error retrieving closing prices: {str(e)}")
        metrics.add_metric(name="ClosingPricesFetchFailed", unit=MetricUnit.Count, value=1)
        raise InternalServerError("Could not retrieve closing prices") from e

    response = Response(status_code=200, content_type=content_types.APPLICATION_JSON, body=data)

    print(f"Returning response with closing prices: {data}")
    return response


# ... existing code ...

if __name__ == "__main__":
    import json

    # Test parameters
    tickers = ["AAPL", "TSLA"]  # Example ticker

    # Call the function directly
    try:
        # Simulate the request context
        response = get_closing_prices(tickers, "1y", "1d")
        print("Response:", json.dumps(response.body, indent=2))  # Print the closing prices
    except Exception as e:
        print("Error:", str(e))
