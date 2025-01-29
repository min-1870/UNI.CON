import { API_URL } from "./constants";
import axios from "axios";


const fetchNewAccessToken = async (navigate) => {
    
    const refreshToken = localStorage.getItem('refresh');
    const url = `${API_URL}/account/token/refresh`
    console.log("Refresh token:", refreshToken);

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
            }
        );
        localStorage.setItem('access', response.data.access);
    } catch (error) {
        logout(navigate);
    }

    return response.data.access
    
};
  
  
const logout = async (navigate) => {
    localStorage.clear()
    navigate("/")
    window.location.reload();
};


export { fetchNewAccessToken, logout };