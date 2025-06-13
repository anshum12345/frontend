import axios from 'axios';

// Configure base URL - use environment variables for production
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create configured axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Include if using cookies
});

/**
 * Request interceptor for logging and auth headers
 */
api.interceptors.request.use(
  (config) => {
    console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    // Add auth token if exists
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling
 */
api.interceptors.response.use(
  (response) => {
    console.debug(`[API] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const errorData = {
      config: error.config,
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data
    };
    console.error('[API] Response error:', errorData);
    
    // Handle specific status codes
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., redirect to login)
    }
    
    return Promise.reject(formatError(error));
  }
);

/**
 * Standardizes error responses
 * @param {Error} error - Axios error object
 * @returns {ApiError} Formatted error object
 */
const formatError = (error) => {
  // Network error (no response)
  if (error.code === 'ECONNABORTED') {
    return {
      status: 408,
      message: 'Request timeout',
      details: 'The server did not respond in time'
    };
  }
  
  if (!error.response) {
    return {
      status: 503,
      message: 'Service unavailable',
      details: 'Could not connect to the server'
    };
  }

  // Standard API error response
  return {
    status: error.response.status,
    message: error.response.data?.message || 'API request failed',
    details: error.response.data?.details || null,
    validationErrors: error.response.data?.errors || null
  };
};

/**
 * Checks backend status with retry logic
 * @param {number} maxRetries - Maximum retry attempts (default: 2)
 * @param {number} retryDelay - Initial retry delay in ms (default: 1000)
 * @returns {Promise<ApiResponse>} Standardized response
 */
export const checkBackendStatus = async (maxRetries = 2, retryDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await api.get('/api/status');
      return {
        success: true,
        status: response.status,
        data: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }
  
  return {
    success: false,
    ...lastError
  };
};

/**
 * Fetches overlays from the backend
 * @returns {Promise<ApiResponse>} Standardized response
 */
export const getOverlays = async () => {
  try {
    const response = await api.get('/api/overlays');
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      ...error
    };
  }
};

/**
 * Creates a new overlay
 * @param {OverlayData} overlay - Overlay data to create
 * @returns {Promise<ApiResponse>} Standardized response
 */
export const createOverlay = async (overlay) => {
  try {
    const response = await api.post('/api/overlays', overlay);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      ...error
    };
  }
};

// Type definitions for documentation
/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request succeeded
 * @property {number} [status] - HTTP status code
 * @property {any} [data] - Response data
 * @property {string} [message] - Error message
 * @property {string} [details] - Error details
 * @property {Object} [validationErrors] - Field validation errors
 */

/**
 * @typedef {Object} OverlayData
 * @property {string} type - Overlay type (text/image)
 * @property {string} content - Overlay content
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {string} width - Width
 * @property {string} height - Height
 */

export default {
  checkBackendStatus,
  getOverlays,
  createOverlay,
  // Add other API methods here
};