import logging
import traceback
from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework import exceptions
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger("django.security")

def custom_exception_handler(exc, context):
    """
    Custom exception handler for Django REST Framework.
    Logs detailed stack traces securely on the server and returns generic,
    non-disclosing error messages to clients for unexpected errors.
    """
    # Call REST framework's default exception handler first to get the standard error response.
    response = exception_handler(exc, context)

    # If an unexpected exception occurs (e.g. database error, AttributeError, etc.)
    # response will be None. We handle it here to return a clean 500 response.
    if response is None:
        # Securely log the detailed stack trace on the server
        request = context.get("request")
        path = request.path if request else "unknown"
        method = request.method if request else "unknown"
        user = request.user if request and request.user else "anonymous"
        
        log_message = (
            f"Unhandled exception during {method} request to {path} by user {user}:\n"
            f"{traceback.format_exc()}"
        )
        logger.error(log_message)

        # Return a generic error message to the client
        return Response(
            {"detail": "An internal server error occurred. Please try again later."},
            status=500,
        )

    # For APIExceptions (validation errors, permissions, auth, etc.), customize response if needed.
    # We want to make sure custom exception messages are clean and structured.
    if isinstance(exc, exceptions.APIException):
        # We can structure the errors consistently
        if isinstance(response.data, dict):
            # If response data is already a dict, we keep it but ensure a 'detail' or errors field is present
            if "detail" not in response.data and len(response.data) > 0:
                # Wrap field errors or non-field errors nicely
                response.data = {
                    "detail": "Validation failed.",
                    "errors": response.data,
                }
        elif isinstance(response.data, list):
            response.data = {
                "detail": response.data[0] if len(response.data) > 0 else "An error occurred."
            }

    return response
