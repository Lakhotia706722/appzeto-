import { create } from 'zustand';

const useUIStore = create((set) => ({
  activeModal: null,   // 'create-task' | 'task-detail' | 'invite' | 'create-board' | 'command-palette'
  activeTaskId: null,
  sidebarOpen: true,
  filters: {
    priority: [],
    assignee: [],
    label: [],
    dueDate: null,
    search: '',
  },

  setModal: (name, taskId = null) => set({ activeModal: name, activeTaskId: taskId }),
  closeModal: () => set({ activeModal: null, activeTaskId: null }),

  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  clearFilters: () =>
    set({ filters: { priority: [], assignee: [], label: [], dueDate: null, search: '' } }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

export default useUIStore;
