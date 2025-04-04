import requests
import json

def test_register():
    url = "http://localhost:8000/api/auth/register"
    payload = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User"
    }
    
    response = requests.post(url, json=payload)
    print(f"Register Status Code: {response.status_code}")
    print(f"Register Response: {response.text}")
    return response

def test_login():
    url = "http://localhost:8000/api/auth/token"
    payload = {
        "username": "testuser",
        "password": "password123"
    }
    
    response = requests.post(url, data=payload)
    print(f"Login Status Code: {response.status_code}")
    print(f"Login Response: {response.text}")
    return response

def test_me(token):
    url = "http://localhost:8000/api/auth/me"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    print(f"Me Status Code: {response.status_code}")
    print(f"Me Response: {response.text}")
    return response

if __name__ == "__main__":
    # Test register
    register_response = test_register()
    
    # Test login
    login_response = test_login()
    
    if login_response.status_code == 200:
        token_data = json.loads(login_response.text)
        access_token = token_data.get("access_token")
        
        # Test me endpoint
        if access_token:
            test_me(access_token) 