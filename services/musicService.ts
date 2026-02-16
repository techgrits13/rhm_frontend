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

            const raw = (response as any)?.data;
            const list: MusicTrack[] = Array.isArray(raw?.data)
                ? raw.data
                : Array.isArray(raw)
                    ? raw
                    : [];

            const total = typeof raw?.total === 'number' ? raw.total : 0;

            return {
                data: list,
                total,
                hasMore: list.length === (params.limit || 20)
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
    },

    // Offline Download Methods
    DOWNLOADS_KEY: 'rhm_music_downloads',

    // Download track for offline playback
    downloadTrack: async (trackId: number, audioUrl: string, onProgress?: (progress: number) => void): Promise<{ success: boolean; localPath?: string; error?: string }> => {
        try {
            const FileSystem = require('expo-file-system');
            const downloadDir = `${FileSystem.documentDirectory}music/`;

            // Ensure directory exists
            const dirInfo = await FileSystem.getInfoAsync(downloadDir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
            }

            const fileExt = audioUrl.split('.').pop()?.split('?')[0] || 'mp3';
            const localPath = `${downloadDir}${trackId}.${fileExt}`;

            // Download file
            const downloadResumable = FileSystem.createDownloadResumable(
                audioUrl,
                localPath,
                {},
                onProgress ? (downloadProgress: any) => {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                    onProgress(progress);
                } : undefined
            );

            const result = await downloadResumable.downloadAsync();

            if (result && result.uri) {
                // Save to AsyncStorage
                const downloads = await musicService.getDownloads();
                downloads[trackId] = result.uri;
                await AsyncStorage.setItem(musicService.DOWNLOADS_KEY, JSON.stringify(downloads));

                return { success: true, localPath: result.uri };
            } else {
                throw new Error('Download failed');
            }
        } catch (error: any) {
            console.error('Download error:', error);
            return { success: false, error: error.message || 'Download failed' };
        }
    },

    // Get all downloads
    getDownloads: async (): Promise<Record<number, string>> => {
        try {
            const json = await AsyncStorage.getItem(musicService.DOWNLOADS_KEY);
            return json ? JSON.parse(json) : {};
        } catch (e) {
            return {};
        }
    },

    // Check if track is downloaded
    isDownloaded: async (trackId: number): Promise<boolean> => {
        const downloads = await musicService.getDownloads();
        return !!downloads[trackId];
    },

    // Get local path for downloaded track
    getLocalPath: async (trackId: number): Promise<string | null> => {
        const downloads = await musicService.getDownloads();
        return downloads[trackId] || null;
    },

    // Delete downloaded track
    deleteDownload: async (trackId: number): Promise<boolean> => {
        try {
            const FileSystem = require('expo-file-system');
            const downloads = await musicService.getDownloads();
            const localPath = downloads[trackId];

            if (localPath) {
                // Delete file
                await FileSystem.deleteAsync(localPath, { idempotent: true });

                // Remove from AsyncStorage
                delete downloads[trackId];
                await AsyncStorage.setItem(musicService.DOWNLOADS_KEY, JSON.stringify(downloads));

                return true;
            }
            return false;
        } catch (error) {
            console.error('Delete download error:', error);
            return false;
        }
    }
};
