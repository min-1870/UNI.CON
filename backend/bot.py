from lorem_text import lorem
import requests
import json
import time
import random

def post_article(access_token):
    url = "http://localhost:8000/api/community/article/"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    data = {
        "title": lorem.words(random.randint(3, 5)),
        "body": lorem.paragraph(),
        "unicon": False,
        "course_code": []
    }

    article_type = random.choice(["with_course", "without_course", "unicon"])
    if article_type == "with_course":
        data["course_code"] = [lorem.words(1)+str(random.randint(10, 99)) for _ in range(random.randint(1, 3))]
    elif article_type == "unicon":
        data["unicon"] = True
    
    response = requests.post(url, headers=headers, data=json.dumps(data))
    
    if response.status_code == 201:
        print("Article created successfully!")
    elif response.status_code == 401:
        print("Unauthorized! Check your access token.")
    else:
        print(f"Failed to create article. Status code: {response.status_code}")

def time_get_endpoint(endpoint,access_token):
    url = endpoint
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    
    start_time = time.time()
    response = requests.get(url, headers=headers)
    end_time = time.time()
    
    response_time = end_time - start_time
    
    if response.status_code == 200:
        return response_time
    elif response.status_code == 401:
        print("Unauthorized! Check your access token.")
    else:
        print(f"Failed to get articles. Status code: {response.status_code}")

ACCESS_TOKENS = [
    "",
    "",
    "",
    "",
    "",
]

'''
ENDPOINTS = {
    "recent": "http://localhost:8000/api/community/article/",
    "hot": "http://localhost:8000/api/community/article/hot/",
    "preference": "http://localhost:8000/api/community/article/preference/",
    "specific": "http://localhost:8000/api/community/article/10"
}

response_times = {
    "recent": [],
    "hot": [],
    "preference": [],
    "specific": []
}
    
for _ in range(100):
    for endpoint in ENDPOINTS.keys():
        response_time = time_get_endpoint(ENDPOINTS[endpoint], ACCESS_TOKEN)
        response_times[endpoint].append(response_time)

for endpoint in response_times.keys():
    print(f"Average response time for {endpoint} endpoint: {sum(response_times[endpoint])/100}")
'''

n = 100

for _ in range(100):
   for token in ACCESS_TOKENS:
       post_article(token)

