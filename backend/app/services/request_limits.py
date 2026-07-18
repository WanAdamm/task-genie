from starlette.formparsers import MultiPartException
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send


REQUEST_BODY_LIMIT_MESSAGE = "The selected files exceed the combined upload limit."


class RequestBodyLimitMiddleware:
    def __init__(self, app: ASGIApp, path: str, max_body_bytes: int):
        self.app = app
        self.path = path
        self.max_body_bytes = max_body_bytes

    async def __call__(
        self,
        scope: Scope,
        receive: Receive,
        send: Send,
    ) -> None:
        if (
            scope["type"] != "http"
            or scope.get("method") != "POST"
            or scope.get("path") != self.path
        ):
            await self.app(scope, receive, send)
            return

        content_length = next(
            (
                value
                for key, value in scope.get("headers", [])
                if key.lower() == b"content-length"
            ),
            None,
        )
        declared_too_large = False
        if content_length is not None:
            try:
                declared_too_large = int(content_length) > self.max_body_bytes
            except ValueError:
                declared_too_large = True

        received_bytes = 0

        async def limited_receive() -> Message:
            nonlocal received_bytes
            if declared_too_large:
                raise MultiPartException(REQUEST_BODY_LIMIT_MESSAGE)
            message = await receive()
            if message["type"] == "http.request":
                received_bytes += len(message.get("body", b""))
                if received_bytes > self.max_body_bytes:
                    raise MultiPartException(REQUEST_BODY_LIMIT_MESSAGE)
            return message

        try:
            await self.app(scope, limited_receive, send)
        except MultiPartException as error:
            if error.message != REQUEST_BODY_LIMIT_MESSAGE:
                raise
            await JSONResponse(
                status_code=413,
                content={"detail": "The selected files exceed the 15 MiB combined limit."},
            )(scope, receive, send)
