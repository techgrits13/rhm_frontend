import api from './api';

export interface Note {
  id: number;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NotesResponse {
  success: boolean;
  count: number;
  notes: Note[];
}

export const notesService = {
  // Get all notes for a user
  getNotes: async (userId: string): Promise<Note[]> => {
    try {
      const response = await api.get<NotesResponse>(`/notes?user_id=${userId}`);
      return response.data.notes;
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  },

  // Create a new note
  createNote: async (userId: string, title: string, content: string): Promise<Note> => {
    try {
      const response = await api.post('/notes', {
        user_id: userId,
        title,
        content,
      });
      return response.data.note;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  },

  // Update a note
  updateNote: async (noteId: number, title?: string, content?: string): Promise<Note> => {
    try {
      const response = await api.put(`/notes/${noteId}`, {
        title,
        content,
      });
      return response.data.note;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },

  // Delete a note
  deleteNote: async (noteId: number): Promise<void> => {
    try {
      await api.delete(`/notes/${noteId}`);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  },
};
