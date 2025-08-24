import webbrowser
import time

# Replace with your actual values
CLIENT_ID = "S_3UfffsLlPoxcz6nnUiGQ"
REDIRECT_URI = "http://localhost:8080"

auth_url = (
    f"https://www.reddit.com/api/v1/authorize?"
    f"client_id={CLIENT_ID}&"
    f"response_type=code&"
    f"state=MY_UNIQUE_STATE&"
    f"redirect_uri={REDIRECT_URI}&"
    f"duration=permanent&"
    f"scope=read"
)

print("Opening Reddit authorization page in your browser...")
time.sleep(2)
webbrowser.open(auth_url)

print("\nAfter clicking 'Allow', you will be redirected.")
print("Please copy the 'code' parameter from the URL in your browser.")

auth_code = input("\nEnter the authorization code here: ")
print(f"Authorization code copied: {auth_code}")

# You now have the code, and can proceed with the token exchange.