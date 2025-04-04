import requests

def test_simple_login():
    # This endpoint takes query parameters
    url = "http://localhost:8000/api/auth/login-test"
    params = {
        "username": "admin",
        "password": "password123"
    }
    
    print(f"Testing login with username: {params['username']}")
    
    # Send as query parameters
    response = requests.post(url, params=params)
    
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.text}")
    
    return response.status_code == 200

if __name__ == "__main__":
    test_simple_login() 