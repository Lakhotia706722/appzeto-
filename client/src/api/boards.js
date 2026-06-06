import api from './axios';

export const boardsApi = {
  getAll: () => api.get('/boards').then((r) => r.data.data.boards),
  getOne: (boardId) => api.get(`/boards/${boardId}`).then((r) => r.data.data.board),
  create: (data) => api.post('/boards', data).then((r) => r.data.data.board),
  update: (boardId, data) => api.put(`/boards/${boardId}`, data).then((r) => r.data.data.board),
  delete: (boardId) => api.delete(`/boards/${boardId}`).then((r) => r.data),
  archive: (boardId) => api.post(`/boards/${boardId}/archive`).then((r) => r.data),
  star: (boardId) => api.post(`/boards/${boardId}/star`).then((r) => r.data.data),
  inviteMember: (boardId, data) => api.post(`/boards/${boardId}/invite`, data).then((r) => r.data),
  updateMember: (boardId, userId, role) => api.put(`/boards/${boardId}/members/${userId}`, { role }).then((r) => r.data),
  removeMember: (boardId, userId) => api.delete(`/boards/${boardId}/members/${userId}`).then((r) => r.data),
  addColumn: (boardId, data) => api.post(`/boards/${boardId}/columns`, data).then((r) => r.data.data.column),
  updateColumn: (boardId, columnId, data) => api.put(`/boards/${boardId}/columns/${columnId}`, data).then((r) => r.data),
  deleteColumn: (boardId, columnId) => api.delete(`/boards/${boardId}/columns/${columnId}`).then((r) => r.data),
  reorderColumns: (boardId, columns) => api.put(`/boards/${boardId}/columns/reorder`, { columns }).then((r) => r.data),
  addLabel: (boardId, data) => api.post(`/boards/${boardId}/labels`, data).then((r) => r.data.data.label),
  updateLabel: (boardId, labelId, data) => api.put(`/boards/${boardId}/labels/${labelId}`, data).then((r) => r.data),
  deleteLabel: (boardId, labelId) => api.delete(`/boards/${boardId}/labels/${labelId}`).then((r) => r.data),
  getActivity: (boardId, page = 1) => api.get(`/boards/${boardId}/activity?page=${page}`).then((r) => r.data.data),
  getAnalytics: (boardId, range = 30) => api.get(`/boards/${boardId}/analytics?range=${range}`).then((r) => r.data.data),
};
