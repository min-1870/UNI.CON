const DEBUG = false

let domain = "https://unicon.min1870.com/api"
if (DEBUG) {
    domain = "http://localhost:8000/api";
}

export const API_URL = domain;
