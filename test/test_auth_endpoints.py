import requests
import json
import time

BASE_URL = "http://localhost:8000/api/auth"

def test_auth_api():
    # Test the test endpoint
    test_url = f"{BASE_URL}/test"
    response = requests.get(test_url)
    print(f"Test Endpoint Status: {response.status_code}")
    print(f"Test Endpoint Response: {response.text}")
    
    if response.status_code != 200:
        print("Auth API is not working properly!")
        return False
    
    return True

def create_user():
    # Create a unique test user using timestamp
    timestamp = int(time.time())
    username = f"testuser{timestamp}"
    email = f"test{timestamp}@example.com"
    
    url = f"{BASE_URL}/register"
    payload = {
        "username": username,
        "email": email,
        "password": "password123",
        "full_name": "Test User"
    }
    
    print(f"\nRegistering user: {username} with email: {email}")
    response = requests.post(url, json=payload)
    print(f"Register Status Code: {response.status_code}")
    print(f"Register Response: {response.text}")
    
    return username, email, response.status_code == 201

def login_user(username):
    url = f"{BASE_URL}/token"
    payload = {
        "username": username,
        "password": "password123"
    }
    
    print(f"\nLogging in user: {username}")
    response = requests.post(url, data=payload)
    print(f"Login Status Code: {response.status_code}")
    print(f"Login Response: {response.text}")
    
    if response.status_code == 200:
        try:
            token_data = json.loads(response.text)
            access_token = token_data.get("access_token")
            return access_token
        except json.JSONDecodeError:
            print("Failed to parse token response")
    
    return None

def get_user_info(token):
    url = f"{BASE_URL}/me"
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\nFetching user info")
    response = requests.get(url, headers=headers)
    print(f"Me Status Code: {response.status_code}")
    print(f"Me Response: {response.text}")
    
    return response.status_code == 200

def refresh_token(token):
    url = f"{BASE_URL}/refresh"
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\nRefreshing token")
    response = requests.post(url, headers=headers)
    print(f"Refresh Status Code: {response.status_code}")
    print(f"Refresh Response: {response.text}")
    
    return response.status_code == 200

if __name__ == "__main__":
    # First check if the auth API is working
    if not test_auth_api():
        print("Exiting tests as Auth API is not working properly!")
        exit(1)
    
    # Create user
    username, email, registered = create_user()
    if not registered:
        print("Failed to register user!")
        exit(1)
    
    # Login
    token = login_user(username)
    if not token:
        print("Failed to login!")
        exit(1)
    
    # Get user info
    if not get_user_info(token):
        print("Failed to get user info!")
        exit(1)
    
    # Refresh token
    if not refresh_token(token):
        print("Failed to refresh token!")
        exit(1)
    
    print("\nALL TESTS PASSED SUCCESSFULLY!") 