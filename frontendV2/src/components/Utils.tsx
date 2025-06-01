import axios from "axios";
import {API_URL} from "@/constants/Domains";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to save data
const setData = async (key:string, value:string) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.error('Error saving data', e);
  }
};

// Function to retrieve data
const getData = async (key:string) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return value;
    }
  } catch (e) {
    console.error('Error retrieving data', e);
  }
};

// Function to remove data
const removeData = async (key:string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('Error removing data', e);
  }
};


const fetchNewAccessToken = async () => {
    
    const refreshToken = await getData('refresh');
    const url = `${API_URL}/account/token/refresh`

    try {
        const response = await axios.post(
            url,
            {
            refresh: refreshToken,
            },
            {
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true,
            }
        );
        await setData('access', response.data.access);
        return response.data.access
    } catch (error) {
        console.error('Token refresh error:', error);
        return false;
    }
};

type fetchAPIPProm = {error: boolean; data?: any };
const fetchAPI = async (url: string, { token = true, method = "GET", body = {} } = {}): Promise<fetchAPIPProm> => {
  const access = await getData('access');
  const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${access}` }),
  };

  const request = async () => {
      try {
          const response = await axios({
              method,
              url,
              headers,
              withCredentials: true,
              ...(method !== "GET" && { data: body }), // Only add body for non-GET requests
          });
          // console.log(response.data)
          return { error: false, data: response.data };
      } catch (error) {
          throw error; // Throw to be caught in the outer try-catch
      }
  };

  try {
      return await request();
  } catch (error) {
      try {
          await fetchNewAccessToken();
          return await request();
      } catch (error: unknown) {
          const err = error as any; // Explicitly cast error to any
          console.error('API Error:', err.response?.data || err.message);
          return {
              error: true,
              data: err.response?.data || "An error occurred",
          };
      }
  }
};


export { fetchAPI, setData, getData, removeData };