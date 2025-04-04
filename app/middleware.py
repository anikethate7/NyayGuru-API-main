import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import logging
from prometheus_client import Counter, Histogram
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("nyayguru")

# Prometheus metrics
REQUEST_COUNT = Counter(
    'nyayguru_requests_total',
    'Total count of requests',
    ['method', 'endpoint', 'status_code']
)
REQUEST_LATENCY = Histogram(
    'nyayguru_request_duration_seconds',
    'Request duration in seconds',
    ['method', 'endpoint']
)
ERROR_COUNT = Counter(
    'nyayguru_errors_total',
    'Total count of errors',
    ['method', 'endpoint', 'exception_type']
)
CHAT_REQUEST_COUNT = Counter(
    'nyayguru_chat_requests_total',
    'Total count of chat requests',
    ['category', 'language']
)

class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        method = request.method
        path = request.url.path
        
        # Simplify paths with IDs to avoid metric explosion
        endpoint = path
        if '/chat/' in path or '/categories/' in path or '/auth/' in path:
            parts = path.split('/')
            simplified_parts = []
            for part in parts:
                # If part is a UUID or has special characters, replace with {id}
                if len(part) > 20 or (len(part) > 0 and not part.isalnum()):
                    simplified_parts.append('{id}')
                else:
                    simplified_parts.append(part)
            endpoint = '/'.join(simplified_parts)
        
        try:
            response = await call_next(request)
            
            # Record metrics
            status_code = response.status_code
            duration = time.time() - start_time
            REQUEST_COUNT.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
            REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)
            
            # Log request
            logger.info(
                f"Request: {method} {path} - Status: {status_code} - Duration: {duration:.3f}s"
            )
            
            # Track chat requests for monitoring
            if '/api/chat' in path and method == 'POST':
                try:
                    # Try to read and log chat details for analytics
                    body = await request.body()
                    # Make a copy of the request body
                    request._body = body
                    data = json.loads(body)
                    
                    category = data.get('category', 'unknown')
                    language = data.get('language', 'English')
                    
                    CHAT_REQUEST_COUNT.labels(category=category, language=language).inc()
                    
                    # Don't log sensitive information
                    logger.info(f"Chat request - Category: {category}, Language: {language}")
                except Exception as e:
                    # If parsing fails, just continue without logging
                    pass
            
            return response
        except Exception as exc:
            # Record error
            duration = time.time() - start_time
            ERROR_COUNT.labels(method=method, endpoint=endpoint, exception_type=type(exc).__name__).inc()
            
            # Log error
            logger.error(
                f"Request failed: {method} {path} - Error: {str(exc)}"
            )
            
            # Re-raise the exception
            raise

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Generate request ID for tracking
        request_id = f"{int(time.time())}-{hash(request)}"
        
        # Log request details
        logger.info(f"Request {request_id} started: {request.method} {request.url.path}")
        
        # Process request
        try:
            response = await call_next(request)
            
            # Log response
            logger.info(f"Request {request_id} completed: Status {response.status_code}")
            
            return response
        except Exception as exc:
            # Log exception
            logger.exception(f"Request {request_id} failed with exception: {str(exc)}")
            raise 