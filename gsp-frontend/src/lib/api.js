// GSP API Client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://89.233.108.78:60';

// HTTP Client sınıfı
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = null;
  }

  // Token ayarlama
  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('gsp_token', token);
    }
  }

  // Token alma
  getToken() {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gsp_token');
    }
    return null;
  }

  // Token temizleme
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gsp_token');
    }
  }

  // HTTP istek wrapper
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, mergedOptions);
      
      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // GET isteği
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  // POST isteği
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT isteği
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE isteği
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // PATCH isteği
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

// API Client instance
const apiClient = new ApiClient();

// Auth API fonksiyonları
export const authAPI = {
  // Giriş yapma
  async login(credentials) {
    const response = await apiClient.post('/auth/login/', credentials);
    if (response.access) {
      apiClient.setToken(response.access);
    }
    return response;
  },

  // Kayıt olma
  async register(userData) {
    return apiClient.post('/auth/register/', userData);
  },

  // Çıkış yapma
  async logout() {
    try {
      await apiClient.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.clearToken();
    }
  },

  // Token yenileme
  async refreshToken(refreshToken) {
    const response = await apiClient.post('/auth/token/refresh/', {
      refresh: refreshToken,
    });
    if (response.access) {
      apiClient.setToken(response.access);
    }
    return response;
  },

  // Kullanıcı profili alma
  async getProfile() {
    return apiClient.get('/auth/profile/');
  },

  // Şifre sıfırlama
  async resetPassword(email) {
    return apiClient.post('/auth/password-reset/', { email });
  },

  // Şifre değiştirme
  async changePassword(data) {
    return apiClient.post('/auth/password-change/', data);
  },
};

// Generic API fonksiyonları
export const gspAPI = {
  // Kullanıcıları alma
  async getUsers(params = {}) {
    return apiClient.get('/users/', params);
  },

  // Tek kullanıcı alma
  async getUser(id) {
    return apiClient.get(`/users/${id}/`);
  },

  // Kullanıcı oluşturma
  async createUser(userData) {
    return apiClient.post('/users/', userData);
  },

  // Kullanıcı güncelleme
  async updateUser(id, userData) {
    return apiClient.put(`/users/${id}/`, userData);
  },

  // Kullanıcı silme
  async deleteUser(id) {
    return apiClient.delete(`/users/${id}/`);
  },
};

// Default export
export default apiClient;

// Utility fonksiyonları
export const apiUtils = {
  // Error handling
  handleApiError(error) {
    if (error.message.includes('Network')) {
      return 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.';
    }
    
    if (error.message.includes('401')) {
      return 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
    }
    
    if (error.message.includes('403')) {
      return 'Bu işlem için yetkiniz bulunmamaktadır.';
    }
    
    if (error.message.includes('404')) {
      return 'İstenen kaynak bulunamadı.';
    }
    
    if (error.message.includes('500')) {
      return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
    }
    
    return error.message || 'Bilinmeyen bir hata oluştu.';
  },

  // Token kontrolü
  isAuthenticated() {
    return !!apiClient.getToken();
  },

  // Token decode (basit)
  decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  },
}; 