I see that the code has a lot of issues! Let me help you fix it.

Here is the corrected code:
```python
# Import the necessary libraries
import requests

# Send a GET request to the URL
response = requests.get('https://example.com')

# Check if the request was successful
if response.status_code == 200:
    # Get the content of the response
    html_content =