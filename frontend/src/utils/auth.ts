// Authentication utility functions

export interface User {
  id: number;
  username: string;
  email: string;
  email_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

// Get stored tokens
export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

export const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refresh_token');
  }
  return null;
};

// Get stored user
export const getStoredUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

// Store authentication data
export const storeAuthData = (tokens: AuthTokens, user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// Clear authentication data
export const clearAuthData = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getAccessToken() !== null;
};

// API call with authentication — automatically refreshes the access token on 401
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const makeRequest = (token: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
  };

  let response = await makeRequest(getAccessToken());

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await makeRequest(getAccessToken());
    } else {
      clearAuthData();
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
  }

  return response;
};

// Refresh token
export const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch('http://127.0.0.1:8000/api/auth/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      return true;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }

  return false;
};

// Logout
export const logout = async (): Promise<void> => {
  const refreshToken = getRefreshToken();
  
  if (refreshToken) {
    try {
      await fetch('http://127.0.0.1:8000/api/auth/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    }
  }

  clearAuthData();
};
