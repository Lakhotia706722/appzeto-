import api from './axios';

export const notificationsApi = {
  getAll: (page = 1) => api.get(`/notifications?page=${page}`).then((r) => r.data.data),
  getUnreadCount: () => api.get('/notifications/unread-count').then((r) => r.data.data.count),
  markRead: (id) => api.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.put('/notifications/read-all').then((r) => r.data),
  delete: (id) => api.delete(`/notifications/${id}`).then((r) => r.data),
};
