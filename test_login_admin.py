import requests

def test_admin_login():
    # Use form data format (not JSON!)
    url = "http://localhost:8000/api/auth/token"
    data = {
        "username": "admin",
        "password": "password123"
    }
    
    print(f"Testing login with username: {data['username']}")
    
    # Important: use data parameter for form data, not json!
    response = requests.post(url, data=data)
    
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.text}")
    
    return response.status_code == 200

if __name__ == "__main__":
    test_admin_login() 