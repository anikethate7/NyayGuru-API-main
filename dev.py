#!/usr/bin/env python3
"""
Development server script for the Lawzo API.
Run this script to start the development server.
"""

import uvicorn

if __name__ == "__main__":
    print("Starting Lawzo API development server...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 