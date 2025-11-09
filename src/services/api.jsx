import axios from "axios";

const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const fallbackProdBase =
  import.meta.env.VITE_DEFAULT_PROD_API?.trim() ||
  "https://simplonservices.onrender.com/api";
const isBrowser = typeof window !== "undefined";
const defaultRelativeBase = "/api";

const resolveApiBaseUrl = () => {
  const isRelative = (value) => value?.startsWith("/");

  if (envApiBaseUrl) {
    if (import.meta.env.DEV || !isRelative(envApiBaseUrl)) {
      return envApiBaseUrl;
    }
    // In production a relative path would hit Vercel instead of Render, so fall back.
    return fallbackProdBase;
  }

  if (import.meta.env.DEV) {
    return defaultRelativeBase;
  }

  if (fallbackProdBase) {
    return fallbackProdBase;
  }

  if (isBrowser) {
    return `${window.location.origin}/api`;
  }

  return defaultRelativeBase;
};

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const excludedEndpoints = [
        "/auth/login/",
        "/auth/refresh/",
        "/auth/logout/",
      ];
      if (
        excludedEndpoints.some((endpoint) =>
          originalRequest.url?.includes(endpoint)
        )
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await refreshClient.post("/auth/refresh/", {});

        if (response.status === 200) {
          // console.log("Token refreshed successfully");
          processQueue(null);
          isRefreshing = false;

          return api(originalRequest);
        }
      } catch (refreshError) {
        // console.error("Token refresh failed:", refreshError);
        processQueue(refreshError, null);
        isRefreshing = false;

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const isAuthenticated = () => {
  return document.cookie.includes("access_token=");
};

export const authAPI = {
  login: (credentials) => api.post("/auth/login/", credentials),
  getCurrentUser: () => api.get("/auth/me/"),
  refreshToken: () => api.post("/auth/refresh/"),
  logout: () => api.post("/auth/logout/"),

  changePassword: (passwordData) =>
    api.post("/auth/change-password/", passwordData),

  updateProfile: (userId, profileData) =>
    api.patch(`/users/${userId}/`, profileData),
};

export const requestsAPI = {
  getRequests: (params = {}) => {
    const queryParams = new URLSearchParams();

    const mapping = {
      page: params.page,
      page_size: params.pageSize,
      status: params.status,
      urgency: params.urgency,
      search: params.search,
      date_from: params.dateFrom,
      date_to: params.dateTo,
      ordering: params.ordering,
      min_amount: params.minAmount,
      max_amount: params.maxAmount,
    };

    Object.entries(mapping).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();

    return api.get(`/requests/${queryString ? `?${queryString}` : ""}`);
  },
  getRequest: (id) => api.get(`/requests/${id}/`),
  createRequest: (data) => api.post("/requests/", data),

  validateRequest: (id, data) => {
    if (data.files && data.files.length > 0) {
      const formData = new FormData();

      formData.append("action", data.action);

      if (data.comment) {
        formData.append("comment", data.comment);
      }

      if (data.budget_available !== undefined) {
        formData.append("budget_available", data.budget_available);
      }
      if (data.final_cost) {
        formData.append("final_cost", data.final_cost);
      }

      data.files.forEach((fileData, index) => {
        if (fileData.file instanceof File) {
          formData.append(`file_${index}`, fileData.file);
          formData.append(
            `description_${index}`,
            fileData.description || fileData.file.name
          );
          formData.append(`file_type_${index}`, fileData.file_type || "other");
        }
      });

      formData.append("files_count", data.files.length);

      return api.post(`/requests/${id}/validate/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      return api.post(`/requests/${id}/validate/`, data);
    }
  },

  updateRejectionReason: (id, data) =>
    api.patch(`/requests/${id}/update-rejection/`, data),
};

export const attachmentsAPI = {
  getAttachments: (requestId) =>
    api.get(`/attachments/?request_id=${requestId}`),
  uploadAttachment: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });
    return api.post("/attachments/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteAttachment: (id) => api.delete(`/attachments/${id}/delete/`),
};

export const usersAPI = {
  createUser: (userData) => api.post("/auth/register/", userData),

  getUsers: (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page);
    if (params.search) queryParams.append("search", params.search);
    if (params.role) queryParams.append("role", params.role);
    if (params.created_by) queryParams.append("created_by", params.created_by);
    if (params.is_active !== undefined)
      queryParams.append("is_active", params.is_active);

    const queryString = queryParams.toString();
    return api.get(`/users/${queryString ? `?${queryString}` : ""}`);
  },

  getUser: (id) => api.get(`/users/${id}/`),
  updateUser: (id, userData) => api.patch(`/users/${id}/`, userData),
  getUsersStats: () => api.get("/users/stats/"),
  deleteUser: (id) => api.delete(`/users/${id}/`),
};

export const passwordResetAPI = {
  requestReset: (email) =>
    axios.post(
      `${API_BASE_URL}/auth/password-reset/request/`,
      { email },
      { withCredentials: true }
    ),

  verifyCode: (email, code) =>
    axios.post(
      `${API_BASE_URL}/auth/password-reset/verify/`,
      { email, code },
      { withCredentials: true }
    ),

  // Confirmer le nouveau mot de passe
  confirmReset: (token, newPassword, confirmPassword) =>
    axios.post(
      `${API_BASE_URL}/auth/password-reset/confirm/`,
      {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      },
      { withCredentials: true }
    ),
};

export const dashboardAPI = {
  getDashboard: () => api.get("/dashboard/"),
};

export default api;
