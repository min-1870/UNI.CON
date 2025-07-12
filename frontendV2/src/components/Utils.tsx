import axios from "axios";
import URLs from "@/constants/Urls";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to save data
const setData = async (key:string, value:any) => {
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
const removeData = async () => {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.error('Error removing all data', e);
  }
};


const passwordStrength = (
  password: string
): { overall: boolean; hasUpperCase: boolean; hasLowerCase: boolean; hasNumbers: boolean; isValidLength: boolean } => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const isValidLength = password.length >= 8;
  return {
    overall: hasUpperCase && hasLowerCase && hasNumbers && isValidLength,
    hasUpperCase: hasUpperCase,
    hasLowerCase: hasLowerCase,
    hasNumbers: hasNumbers,
    isValidLength: isValidLength,
  };
};


const fetchNewAccessToken = async () => {
    
    const refreshToken = await getData('refresh');

    try {
        const response = await axios.post(
            URLs.NEW_TOKEN,
            {
            refresh: refreshToken,
            },
            {
            headers: {
                "Content-Type": "application/json",
            },
            }
        );
        setData('access', response.data.access);
        return response.data.access
    } catch (error) {
        return false;
    }
};

type fetchAPIPProm = { error: boolean; data?: any; status?: number };
const fetchAPI = async (url: string, { token = true, method = "GET", body = {} } = {}): Promise<fetchAPIPProm> => {

  const request = async () => {
      try {
          const response = await axios({
              method,
              url,
              headers: { 
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${await getData('access')}` } : {})
              },
              ...(method !== "GET" ? { data: body } : {}), // Only add body for non-GET requests
          });
          // console.log(response.data)
            return { status: response.status, error: false, data: response.data };
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
          return {
              status: err.response?.status, 
              error: true,
              data: err.response?.data || "An error occurred",
          };
      }
  }
};


export { fetchAPI, setData, getData, removeData, passwordStrength};