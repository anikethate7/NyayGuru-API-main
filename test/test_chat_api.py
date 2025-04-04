import requests
import json

# API URL for public chat endpoint
url = "http://localhost:8000/api/chat/public/criminal-law"

# Request payload
payload = {
    "query": "What is criminal law?",
    "category": "Criminal Law",
    "language": "English",
    "session_id": "test-session"
}

try:
    # Make the POST request
    response = requests.post(url, json=payload)
    
    # Print status code
    print(f"Status code: {response.status_code}")
    
    # Print response headers
    print("\nResponse headers:")
    for header, value in response.headers.items():
        print(f"{header}: {value}")
    
    # Print response text
    print("\nResponse body:")
    try:
        # Try to format as JSON
        formatted_json = json.dumps(response.json(), indent=2)
        print(formatted_json)
    except:
        # Fallback to raw text
        print(response.text)
        
except Exception as e:
    print(f"Error: {e}") 