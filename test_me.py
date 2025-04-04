import requests
import json

def test_login_and_me():
    # Step 1: Login to get token
    login_url = "http://localhost:8000/api/auth/token"
    login_data = {
        "username": "newuser",
        "password": "password123"
    }
    
    print("Logging in...")
    login_response = requests.post(login_url, data=login_data)
    print(f"Login status code: {login_response.status_code}")
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return
    
    # Extract token
    token_data = json.loads(login_response.text)
    access_token = token_data.get("access_token")
    print(f"Got access token: {access_token[:20]}...")
    
    # Step 2: Use token to get user info
    me_url = "http://localhost:8000/api/auth/me"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    print("\nFetching user info...")
    me_response = requests.get(me_url, headers=headers)
    print(f"ME status code: {me_response.status_code}")
    print(f"ME response: {me_response.text}")
    
    return me_response.status_code == 200

if __name__ == "__main__":
    test_login_and_me() 