import api from './api';

export interface BibleVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleVerseResponse {
  success: boolean;
  reference: string;
  text: string;
  translation: string;
  verses: BibleVerse[];
}

export interface BibleBooks {
  old_testament: string[];
  new_testament: string[];
}

export const bibleService = {
  // Get a specific verse
  getVerse: async (reference: string): Promise<BibleVerseResponse> => {
    try {
      const response = await api.get<BibleVerseResponse>(`/bible/verse/${encodeURIComponent(reference)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching verse:', error);
      throw error;
    }
  },

  // Get list of all Bible books
  getBooks: async (): Promise<BibleBooks> => {
    try {
      const response = await api.get('/bible/books');
      return response.data.books;
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  },

  // Search Bible verses (placeholder for now)
  searchVerses: async (query: string): Promise<any> => {
    try {
      const response = await api.get(`/bible/search?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching verses:', error);
      throw error;
    }
  },
};
