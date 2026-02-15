import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MusicTrack {
    id: number;
    title: string;
    artist: string;
    album?: string;
    audio_url: string;
    cover_url?: string;
    lyrics?: string;
    duration?: number;
    created_at: string;
}

const FAVORITES_KEY = 'rhm_music_favorites';
const PLAY_COUNTS_KEY = 'rhm_music_play_counts';

export const musicService = {
    // Fetch all music
    getAllMusic: async (sort: 'az' | 'newest' = 'az') => {
        try {
            const response = await api.get<MusicTrack[]>('/music', {
                params: { sort: sort === 'newest' ? 'newest' : 'az' }
            });
            return response.data || [];
        } catch (error) {
            console.error('Failed to fetch music:', error);
            return [];
        }
    },

    // Fetch music with pagination (infinite scroll)
    getMusicPaginated: async (params: {
        limit?: number;
        offset?: number;
        sort?: 'az' | 'newest';
    }) => {
        try {
            const response = await api.get<{ data: MusicTrack[]; total: number }>('/music', {
                params: {
                    limit: params.limit || 20,
                    offset: params.offset || 0,
                    sort: params.sort || 'az'
                }
            });
            return {
                data: response.data?.data || response.data || [],
                total: response.data?.total || 0,
                hasMore: (response.data?.data || response.data || []).length === (params.limit || 20)
            };
        } catch (error) {
            console.error('Failed to fetch paginated music:', error);
            return { data: [], total: 0, hasMore: false };
        }
    },

    // Get favorites IDs
    getFavorites: async (): Promise<number[]> => {
        try {
            const json = await AsyncStorage.getItem(FAVORITES_KEY);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            console.error('Failed to load favorites', e);
            return [];
        }
    },

    // Toggle favorite
    toggleFavorite: async (id: number): Promise<boolean> => { // returns new state
        try {
            const favs = await musicService.getFavorites();
            const index = favs.indexOf(id);
            let newFavs;
            let isFav = false;

            if (index >= 0) {
                newFavs = favs.filter(fid => fid !== id);
            } else {
                newFavs = [...favs, id];
                isFav = true;
            }

            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
            return isFav;
        } catch (e) {
            console.error('Failed to toggle favorite', e);
            return false;
        }
    },

    // Get Play Counts
    getPlayCounts: async (): Promise<Record<string, number>> => {
        try {
            const json = await AsyncStorage.getItem(PLAY_COUNTS_KEY);
            return json ? JSON.parse(json) : {};
        } catch (e) {
            return {};
        }
    },

    // Increment Play Count
    incrementPlayCount: async (id: number) => {
        try {
            const counts = await musicService.getPlayCounts();
            counts[id] = (counts[id] || 0) + 1;
            await AsyncStorage.setItem(PLAY_COUNTS_KEY, JSON.stringify(counts));
        } catch (e) {
            console.error('Failed to increment play count', e);
        }
    }
};
