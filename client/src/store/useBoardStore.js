import { create } from 'zustand';

const useBoardStore = create((set, get) => ({
  boards: [],
  currentBoard: null,
  isLoading: false,

  setBoards: (boards) => set({ boards }),

  setCurrentBoard: (board) => set({ currentBoard: board }),

  updateBoardLocally: (changes) => {
    set((state) => ({
      currentBoard: state.currentBoard ? { ...state.currentBoard, ...changes } : null,
    }));
  },

  addTask: (task) => {
    set((state) => {
      const tasks = [...(state.currentBoard?.tasks || []), task];
      return { currentBoard: state.currentBoard ? { ...state.currentBoard, tasks } : null };
    });
  },

  updateTask: (taskId, changes) => {
    set((state) => {
      if (!state.currentBoard) return {};
      const tasks = (state.currentBoard.tasks || []).map((t) =>
        t._id === taskId ? { ...t, ...changes } : t
      );
      return { currentBoard: { ...state.currentBoard, tasks } };
    });
  },

  moveTask: (taskId, toColumn, position) => {
    set((state) => {
      if (!state.currentBoard) return {};
      const tasks = (state.currentBoard.tasks || []).map((t) =>
        t._id === taskId ? { ...t, columnId: toColumn, position } : t
      );
      return { currentBoard: { ...state.currentBoard, tasks } };
    });
  },

  removeTask: (taskId) => {
    set((state) => {
      if (!state.currentBoard) return {};
      const tasks = (state.currentBoard.tasks || []).filter((t) => t._id !== taskId);
      return { currentBoard: { ...state.currentBoard, tasks } };
    });
  },
}));

export default useBoardStore;
