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
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM3NDY5MzMwLCJpYXQiOjE3Mzc0NjU3MzAsImp0aSI6ImUzOGVhNTA0MWM3MDQ0OTVhYjc3MTU2YTZhYjZiMDRkIiwidXNlcl9pZCI6MX0.5M6EFURjdfYrnx1KF16n6tgF2Wk7B5xp0_QfZqxcReA",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM3NDY4Njk5LCJpYXQiOjE3Mzc0NjUwOTksImp0aSI6IjM1NDJiNTIzNjQ3NzQ5MWFhMDFmYzdlY2U3MjE3NDRlIiwidXNlcl9pZCI6Mn0.5Mi18Pe5A0nxT1rdWMQUB2ZDh9Zz9HkEZu9ogDrjSMs",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM3NDY4NzYzLCJpYXQiOjE3Mzc0NjUxNjMsImp0aSI6ImUxZDkxNjMwNzY2NDQzYmViZjE0NjQ2MWJhZDNjOWRhIiwidXNlcl9pZCI6M30.D93nB0-XR6lb9SIAtWUa4wR292bQ9H1RMQT3VbV6uPA",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM3NDY4ODQ4LCJpYXQiOjE3Mzc0NjUyNDgsImp0aSI6IjE2NjczNzFmYzA3ODRmYzViZTg3MGUzZGNlNWY2MmUxIiwidXNlcl9pZCI6NH0.RtdvH1Ej4TdV1-zzVL_AtTtB64US6XrUHsBK-7Dn9R8",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM3NDY5MjQ0LCJpYXQiOjE3Mzc0NjU2NDQsImp0aSI6ImIxODVmYmM4ZjE1YzQ1YjM5Y2E0ODViNWUwYjg1M2UyIiwidXNlcl9pZCI6NX0.TZ3XQd4aZq1rlxSPaNPuFGwOaUKXDE2YCqtMONZJ0hI",
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

