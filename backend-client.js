const https = require('https');
const http = require('http');

/**
 * Backend HTTP Client for FastAPI communication
 * All requests include the INTERNAL_API_KEY header
 */
class BackendClient {
  constructor(baseURL = 'http://127.0.0.1:8000', apiKey = null) {
    this.baseURL = baseURL;
    this.apiKey = apiKey || process.env.INTERNAL_API_KEY;
    this.connectionStatus = 'unknown'; // 'connected', 'disconnected', 'connecting', 'unknown'
    this.retryAttempts = 3;
    this.retryDelay = 1000; // Initial delay in ms
    
    if (!this.apiKey) {
      console.warn('Warning: INTERNAL_API_KEY not set. Backend requests may fail.');
    }
  }

  /**
   * Health check endpoint - ping backend to verify connection
   * @returns {Promise<boolean>} True if backend is reachable
   */
  async healthCheck() {
    try {
      this.connectionStatus = 'connecting';
      const response = await this.request('GET', '/');
      this.connectionStatus = 'connected';
      return true;
    } catch (error) {
      this.connectionStatus = 'disconnected';
      console.warn('Backend health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get current connection status
   * @returns {string} Connection status
   */
  getConnectionStatus() {
    return this.connectionStatus;
  }

  /**
   * Sleep helper for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make HTTP request to backend with retry logic
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} path - API path (e.g., '/api/startups/fetch/all')
   * @param {object} data - Request body data (optional)
   * @param {number} retries - Number of retry attempts remaining
   * @returns {Promise<object>} Response data
   */
  async request(method, path, data = null, retries = this.retryAttempts) {
    const makeRequest = () => {
      return new Promise((resolve, reject) => {
        const url = new URL(path, this.baseURL);
        const isHttps = url.protocol === 'https:';
        const httpModule = isHttps ? https : http;

        const options = {
          method: method,
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname + url.search,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey || '',
          },
          timeout: 10000, // 10 second timeout
        };

        const req = httpModule.request(options, (res) => {
          let responseData = '';

          res.on('data', (chunk) => {
            responseData += chunk;
          });

          res.on('end', () => {
            try {
              const parsed = responseData ? JSON.parse(responseData) : {};
              
              if (res.statusCode >= 200 && res.statusCode < 300) {
                this.connectionStatus = 'connected';
                resolve(parsed);
              } else {
                // Don't retry on 4xx errors (client errors)
                if (res.statusCode >= 400 && res.statusCode < 500) {
                  this.connectionStatus = 'connected'; // Server is reachable
                  const error = new Error(parsed.detail || `HTTP ${res.statusCode}: ${res.statusMessage}`);
                  error.statusCode = res.statusCode;
                  error.response = parsed;
                  reject(error);
                } else {
                  // 5xx errors - retry
                  const error = new Error(parsed.detail || `HTTP ${res.statusCode}: ${res.statusMessage}`);
                  error.statusCode = res.statusCode;
                  error.response = parsed;
                  error.retryable = true;
                  reject(error);
                }
              }
            } catch (parseError) {
              const error = new Error(`Failed to parse response: ${parseError.message}`);
              error.statusCode = res.statusCode;
              error.originalError = parseError;
              reject(error);
            }
          });
        });

        req.on('error', (error) => {
          this.connectionStatus = 'disconnected';
          const enhancedError = new Error(`Backend request failed: ${error.message}`);
          enhancedError.originalError = error;
          enhancedError.code = error.code;
          enhancedError.retryable = error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT';
          reject(enhancedError);
        });

        req.on('timeout', () => {
          req.destroy();
          this.connectionStatus = 'disconnected';
          const error = new Error('Request timeout');
          error.code = 'ETIMEDOUT';
          error.retryable = true;
          reject(error);
        });

        if (data) {
          req.write(JSON.stringify(data));
        }

        req.end();
      });
    };

    try {
      return await makeRequest();
    } catch (error) {
      // Retry logic for retryable errors
      if (retries > 0 && error.retryable) {
        const delay = this.retryDelay * Math.pow(2, this.retryAttempts - retries);
        console.log(`Request failed, retrying in ${delay}ms... (${retries} attempts remaining)`);
        await this.sleep(delay);
        return this.request(method, path, data, retries - 1);
      }
      
      // Format error for better handling
      const formattedError = {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
        response: error.response,
        originalError: error.originalError
      };
      
      throw formattedError;
    }
  }

  // Startups API
  async fetchAllStartups() {
    return this.request('GET', '/api/startups/fetch/all');
  }

  async fetchStartupById(id) {
    return this.request('GET', `/api/startups/fetch/${id}`);
  }

  async createStartup(data) {
    return this.request('POST', '/api/startups/create', data);
  }

  async updateStartup(id, data) {
    return this.request('PUT', `/api/startups/update/${id}`, data);
  }

  async deleteStartup(id) {
    return this.request('DELETE', `/api/startups/delete/${id}`);
  }

  // Applications API
  async fetchAllApplications() {
    return this.request('GET', '/api/applications/fetch/all');
  }

  async fetchPendingApplications() {
    return this.request('GET', '/api/applications/fetch/pending');
  }

  async fetchApplicationById(id) {
    return this.request('GET', `/api/applications/fetch/${id}`);
  }

  async createApplication(data) {
    return this.request('POST', '/api/applications/create', data);
  }

  async updateApplication(id, data) {
    return this.request('PUT', `/api/applications/update/${id}`, data);
  }

  async deleteApplication(id) {
    return this.request('DELETE', `/api/applications/delete/${id}`);
  }

  async acceptApplication(id) {
    return this.request('POST', `/api/applications/accept/${id}`);
  }

  async rejectApplication(id) {
    return this.request('POST', `/api/applications/reject/${id}`);
  }

  // Meetings API
  async fetchAllMeetings() {
    return this.request('GET', '/api/meetings/fetch/all');
  }

  async fetchMeetingById(id) {
    return this.request('GET', `/api/meetings/fetch/${id}`);
  }

  async fetchMeetingsByVc(vcId) {
    return this.request('GET', `/api/meetings/fetch_by_vc/${vcId}`);
  }

  async createMeeting(data) {
    return this.request('POST', '/api/meetings/create', data);
  }

  async updateMeeting(data) {
    return this.request('PUT', '/api/meetings/update', data);
  }

  async deleteMeeting(id) {
    return this.request('DELETE', `/api/meetings/delete/${id}`);
  }
}

module.exports = BackendClient;

