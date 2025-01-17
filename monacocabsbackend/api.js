import axios from 'axios';

// Set up Axios instance
const API = axios.create({
  baseURL: 'http://192.168.224.14:5000', // Your backend URL
  timeout: 5000, // Optional timeout for requests
});

// Example API call: Test server connectivity
export const testConnection = async () => {
  try {
    const response = await API.get('/');
    return response.data;
  } catch (error) {
    console.error('Error connecting to the server:', error.message);
    throw error;
  }
};

export default API;
