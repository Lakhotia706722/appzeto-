export const queryKeys = {
  boards: {
    all: () => ['boards'],
    detail: (boardId) => ['boards', boardId],
    tasks: (boardId, filters) => ['boards', boardId, 'tasks', filters],
    activity: (boardId, page) => ['boards', boardId, 'activity', page],
    analytics: (boardId, range) => ['boards', boardId, 'analytics', range],
  },
  tasks: {
    detail: (taskId) => ['tasks', taskId],
    comments: (taskId, page) => ['tasks', taskId, 'comments', page],
  },
  notifications: {
    list: (page) => ['notifications', page],
    unreadCount: () => ['notifications', 'unread-count'],
  },
  search: (query) => ['search', query],
  user: () => ['user', 'me'],
};
