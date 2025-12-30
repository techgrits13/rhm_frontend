import api, { API_BASE_URL } from './api';
const ORIGIN_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export interface RadioStreamResponse {
  success: boolean;
  radioUrl: string;
  station: string;
  fallbackUrl?: string;
}

export interface SlideshowImage {
  id: number;
  type: string;
  title: string;
  content: string;
  media_url: string;
  published_at: string;
}

export const radioService = {
  // Get radio stream URL
  getStreamUrl: async (): Promise<RadioStreamResponse> => {
    try {
      const response = await api.get<RadioStreamResponse>('/radio/stream');
      return response.data;
    } catch (error) {
      console.error('Error fetching radio stream:', error);
      throw error;
    }
  },

  // Get slideshow images
  getSlideshowImages: async (): Promise<SlideshowImage[]> => {
    try {
      const response = await api.get('/radio/slideshow');
      const images: SlideshowImage[] = response.data.images || [];
      return images.map((img) => ({
        ...img,
        media_url: img.media_url?.startsWith('http') ? img.media_url : `${ORIGIN_BASE_URL}${img.media_url}`,
      }));
    } catch (error) {
      console.error('Error fetching slideshow:', error);
      return [];
    }
  },
};
