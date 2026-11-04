from __future__ import annotations


class PipelineError(Exception):
    """A failure whose message is safe to show to the end user."""

    def __init__(self, message: str, status: int = 502) -> None:
        super().__init__(message)
        self.message = message
        self.status = status