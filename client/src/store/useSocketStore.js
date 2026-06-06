import { create } from 'zustand';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,
  onlineMembers: [],
  typingUsers: {}, // { taskId: [{ userId, userName }] }

  connect: (token) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => set({ isConnected: true }));
    socket.on('disconnect', () => set({ isConnected: false, onlineMembers: [] }));

    socket.on('members:online', ({ userIds }) => set({ onlineMembers: userIds }));

    socket.on('typing:start', ({ taskId, userId }) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [taskId]: [...(state.typingUsers[taskId] || []).filter((u) => u.userId !== userId), { userId }],
        },
      }));
    });

    socket.on('typing:stop', ({ taskId, userId }) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [taskId]: (state.typingUsers[taskId] || []).filter((u) => u.userId !== userId),
        },
      }));
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  joinBoard: (boardId) => {
    get().socket?.emit('join-board', { boardId });
  },

  leaveBoard: (boardId) => {
    get().socket?.emit('leave-board', { boardId });
  },

  emitTypingStart: (boardId, taskId) => {
    get().socket?.emit('typing:start', { boardId, taskId });
  },

  emitTypingStop: (boardId, taskId) => {
    get().socket?.emit('typing:stop', { boardId, taskId });
  },
}));

export default useSocketStore;
