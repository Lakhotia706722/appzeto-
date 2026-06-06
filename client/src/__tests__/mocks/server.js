import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          _id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
          preferences: { theme: 'dark', notifications: true },
        },
      },
    });
  }),

  http.get('/api/boards', () => {
    return HttpResponse.json({
      success: true,
      data: {
        boards: [
          {
            _id: 'board1',
            title: 'Test Board',
            coverColor: '#6366f1',
            members: [],
            isStarred: [],
            columns: [
              { id: 'todo', title: 'To Do', color: '#71717a', position: 1000 },
              { id: 'in-progress', title: 'In Progress', color: '#3b82f6', position: 2000 },
              { id: 'review', title: 'Review', color: '#f59e0b', position: 3000 },
              { id: 'done', title: 'Done', color: '#22c55e', position: 4000 },
            ],
          },
        ],
      },
    });
  }),

  http.get('/api/boards/:boardId/tasks', () => {
    return HttpResponse.json({
      success: true,
      data: {
        tasks: [
          {
            _id: 'task1',
            title: 'Test Task',
            columnId: 'todo',
            position: 1000,
            priority: 'medium',
            status: 'todo',
            assignedTo: [],
            labels: [],
            checklist: [],
            attachments: [],
          },
        ],
      },
    });
  }),

  http.get('/api/notifications/unread-count', () => {
    return HttpResponse.json({ success: true, data: { count: 0 } });
  }),
];

export const server = setupServer(...handlers);
