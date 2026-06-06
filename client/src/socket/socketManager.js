/**
 * Socket event handler that wires socket.io events to React Query cache + Zustand store.
 * Call registerSocketHandlers(socket, queryClient, boardId, currentUserId) when joining a board.
 */
import { queryKeys } from '../api/queryKeys';

export const registerSocketHandlers = (socket, queryClient, boardId, currentUserId) => {
  const boardTasksKey = queryKeys.boards.tasks(boardId, {});

  // ── Task events ────────────────────────────────────────────────────────────

  socket.on('task:created', ({ task }) => {
    queryClient.setQueryData(boardTasksKey, (old) =>
      old ? [...old, task] : [task]
    );
  });

  socket.on('task:updated', ({ taskId, changes }) => {
    queryClient.setQueryData(boardTasksKey, (old) =>
      old?.map((t) => (t._id === taskId ? { ...t, ...changes } : t))
    );
    // Also update detail cache
    queryClient.setQueryData(queryKeys.tasks.detail(taskId), (old) =>
      old ? { ...old, ...changes } : old
    );
  });

  socket.on('task:moved', ({ taskId, toColumn, position, movedBy }) => {
    if (movedBy === currentUserId) return; // already applied optimistically
    queryClient.setQueryData(boardTasksKey, (old) =>
      old?.map((t) =>
        t._id === taskId ? { ...t, columnId: toColumn, position } : t
      )
    );
  });

  socket.on('task:deleted', ({ taskId }) => {
    queryClient.setQueryData(boardTasksKey, (old) =>
      old?.filter((t) => t._id !== taskId)
    );
  });

  socket.on('task:archived', ({ taskId }) => {
    queryClient.setQueryData(boardTasksKey, (old) =>
      old?.filter((t) => t._id !== taskId)
    );
  });

  // ── Comment events ─────────────────────────────────────────────────────────

  socket.on('comment:added', ({ taskId, comment }) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.comments(taskId, 1) });
  });

  socket.on('comment:updated', ({ commentId, content }) => {
    // Invalidate comment queries that may contain this comment
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  });

  socket.on('comment:deleted', ({ commentId, taskId }) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.comments(taskId, 1) });
  });

  // ── Board events ───────────────────────────────────────────────────────────

  socket.on('board:updated', ({ board }) => {
    queryClient.setQueryData(queryKeys.boards.detail(boardId), (old) =>
      old ? { ...old, ...board } : board
    );
  });

  return () => {
    socket.off('task:created');
    socket.off('task:updated');
    socket.off('task:moved');
    socket.off('task:deleted');
    socket.off('task:archived');
    socket.off('comment:added');
    socket.off('comment:updated');
    socket.off('comment:deleted');
    socket.off('board:updated');
  };
};
