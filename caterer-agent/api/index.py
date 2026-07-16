"""Vercel serverless entrypoint.

Vercel's Python runtime serves the ASGI `app` exposed here. We add the project
root to sys.path so `main` and the `src` package import cleanly from inside the
`api/` function directory, then re-export the FastAPI app unchanged.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app  # noqa: E402  (path set up above)

# `app` is what Vercel's @vercel/python serves.
__all__ = ["app"]
