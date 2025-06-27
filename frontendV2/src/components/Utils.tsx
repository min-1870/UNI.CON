import axios from "axios";
import URLs from "@/constants/Urls";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to save data
const setData = async (key: string, value: any) => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
  } catch (e) {
    console.error('Error saving data', e);
  }
};

// Function to retrieve data
const getData = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      try {
        // Try to parse as JSON first
        return JSON.parse(value);
      } catch {
        // If parsing fails, return as string
        return value;
      }
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
    
    const refreshToken = getData('refresh');

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

type fetchAPIPProm = {error: boolean; data?: any };
const fetchAPI = async (url: string, { token = true, method = "GET", body = {} } = {}): Promise<fetchAPIPProm> => {
  const access = await getData('access');
  
  // Clean and encode URL for iOS compatibility
  const cleanUrl = url.trim().replace(/([^:]\/)\/+/g, "$1");
  
  const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${access}` }),
  };

  const request = async () => {
      try {
          console.log(`🌐 ${method} ${cleanUrl}`);
          
          const response = await axios({
              method,
              url: cleanUrl,
              headers,
              timeout: 15000, // 15 second timeout
              ...(method !== "GET" && { data: body }), // Only add body for non-GET requests
          });
          
          console.log(`✅ ${method} ${cleanUrl} - Success`);
          return { error: false, data: response.data };
      } catch (error) {
          console.error(`❌ ${method} ${cleanUrl} - Error:`, error);
          throw error; // Throw to be caught in the outer try-catch
      }
  };

  try {
      return await request();
  } catch (error) {
      try {
          console.log('🔄 Refreshing token and retrying...');
          const newToken = await fetchNewAccessToken();
          if (newToken) {
            return await request();
          } else {
            throw new Error('Token refresh failed');
          }
      } catch (error: unknown) {
          const err = error as any; // Explicitly cast error to any
          console.error('❌ Final error:', err);
          
          return {
              error: true,
              data: err.response?.data || err.message || "An error occurred",
          };
      }
  }
};


export { fetchAPI, setData, getData, removeData };