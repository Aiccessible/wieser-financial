import yfinance as yf
import os
from typing import Dict, Any, Union

from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.event_handler.api_gateway import Router, Response
from aws_lambda_powertools.event_handler import content_types
from aws_lambda_powertools.event_handler.exceptions import InternalServerError
import json

# TODO
from app import constants, datastore, utils

__all__ = ["router"]

tracer = Tracer()
logger = Logger(child=True)
metrics = Metrics()
router = Router()

from datetime import datetime


@router.post("/<ticker>/closing-prices")
@tracer.capture_method(capture_response=False)
def get_closing_prices(ticker: str) -> Dict[str, Any]:
    body = json.loads(router.current_event.get("body", "{}"))
    start_date = body.get("start_date")
    end_date = body.get("end_date")
    # TODO
    user_id: str = utils.authorize_request(router)
    # user_id: str = "test"

    print(f"Received request for ticker: {ticker}, start_date: {start_date}, end_date: {end_date}")

    # FIXME
    # logger.append_keys(ticker=ticker, user_id=user_id)

    tracer.put_annotation(key="Ticker", value=ticker)
    tracer.put_annotation(key="UserId", value=user_id)

    # Convert date strings to datetime objects
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        print(f"Parsed dates - Start: {start}, End: {end}")
    except ValueError:
        logger.exception("Invalid date format")
        print("Invalid date format encountered.")
        raise InternalServerError("Invalid date format. Use YYYY-MM-DD.")

    # Retrieve stock data using yfinance
    try:
        stock_data = yf.Ticker(ticker)
        print(f"Fetching historical data for {ticker} from {start} to {end}")
        historical_data = stock_data.history(start=start, end=end)
        closing_prices = historical_data["Close"].tolist()  # Get closing prices
        print(f"Retrieved closing prices: {closing_prices}")
        logger.debug(
            f"Retrieved closing prices for {ticker} from {start_date} to {end_date}: {closing_prices}"
        )
        metrics.add_metric(name="ClosingPricesFetchSuccess", unit=MetricUnit.Count, value=1)
    except Exception as e:
        logger.exception("Failed to retrieve closing prices")
        print(f"Error retrieving closing prices: {str(e)}")
        metrics.add_metric(name="ClosingPricesFetchFailed", unit=MetricUnit.Count, value=1)
        raise InternalServerError("Could not retrieve closing prices") from e

    response = Response(
        status_code=200, content_type=content_types.APPLICATION_JSON, body=closing_prices
    )

    print(f"Returning response with closing prices: {closing_prices}")
    return response


# ... existing code ...

if __name__ == "__main__":
    import json

    # Test parameters
    ticker = "AAPL"  # Example ticker
    start_date = "2023-01-01"  # Example start date
    end_date = "2023-01-31"  # Example end date

    # Call the function directly
    try:
        # Simulate the request context
        response = get_closing_prices(ticker, start_date, end_date)
        print("Response:", json.dumps(response.body, indent=2))  # Print the closing prices
    except Exception as e:
        print("Error:", str(e))
