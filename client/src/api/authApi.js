import axios from 'axios';
import config from '../config';

axios.defaults.baseURL = config.API_URL;

const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

const getStoredToken = () => {
  return localStorage.getItem('token');
};

const token = getStoredToken();
if (token) {
  setAuthToken(token);
}

export const login = async (credentials) => {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/auth/login`,
      credentials,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    const { token, user } = response.data;
    setAuthToken(token);
    return { user, token };
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const signup = async (userData) => {
  try {
    const response = await axios.post('/api/auth/signup', userData);
    const { token, user } = response.data;
    setAuthToken(token);
    return { user };
  } catch (error) {
    throw error.response?.data || { message: 'Error registering user' };
  }
};

export const verifyOTP = async (verifyData) => {
  try {
    const response = await axios.post('/api/auth/verify-otp', verifyData);
    const { token, user } = response.data;
    if (token) {
      setAuthToken(token);
    }
    return { user, token };
  } catch (error) {
    throw error.response?.data || { message: 'Error verifying OTP' };
  }
};

export const resendOTP = async (emailData) => {
  try {
    const response = await axios.post('/api/auth/resend-otp', emailData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error resending OTP' };
  }
};

export const logout = () => {
  setAuthToken(null);
};

export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No auth token found');
    }

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await axios.get('/api/auth/me', config);
    console.log('getCurrentUser response:', response.data); 
    return response.data;
  } catch (error) {
    console.error('getCurrentUser error:', error); 
    throw error.response?.data || { message: 'Error fetching user data' };
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await axios.post('/api/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error processing forgot password request' };
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await axios.post(`/api/auth/reset-password/${token}`, { password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error resetting password' };
  }
};

export const updateProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No auth token found');
    }

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await axios.put('/api/auth/profile', profileData, config);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error updating profile' };
  }
};

export const deleteAccount = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No auth token found');
    }

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await axios.delete('/api/auth/delete-account', config);
    setAuthToken(null); 
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error deleting account' };
  }
}; 

export const checkUsername = async (username) => {
  try {
    const response = await axios.post('/api/auth/check-username', { username });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error checking username availability' };
  }
};

export const checkEmail = async (email) => {
  try {
    const response = await axios.post('/api/auth/check-email', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error checking email availability' };
  }
};

export const checkServerStatus = async () => {
  try {
    const response = await fetch(`${config.API_URL}/api/health`, {
      ...config.API_CONFIG,
      method: 'GET'
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Server status check failed:', error);
    throw new Error('Unable to connect to server');
  }
}; 