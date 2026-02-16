import Constants from 'expo-constants';

const BACKEND_URL = 'https://rhm-backend-2.onrender.com';

export interface BreakingNewsUpload {
    type: 'text' | 'image' | 'video' | 'poll';
    content: string;
    mediaUri?: string;
    pollOptions?: string[];
}

export interface MusicUpload {
    title: string;
    artist: string;
    album?: string;
    audioUri: string;
    coverUri?: string;
}

const UPLOAD_TIMEOUT = 60000; // 60 seconds

/**
 * Helper to fetch with timeout
 */
async function fetchWithTimeout(resource: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT);
    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

/**
 * Upload Breaking News post via backend API
 */
export async function uploadBreakingNews(data: BreakingNewsUpload): Promise<{ success: boolean; error?: string }> {
    try {
        const formData = new FormData();
        formData.append('type', data.type);
        formData.append('content', data.content);

        // Handle media file upload
        if (data.mediaUri && (data.type === 'image' || data.type === 'video')) {
            const filename = data.mediaUri.split('/').pop() || 'media';
            const match = /\.(\w+)$/.exec(filename);
            const type = data.type === 'image' ? 'image/jpeg' : 'video/mp4';

            formData.append('media', {
                uri: data.mediaUri,
                name: filename,
                type: type,
            } as any);
        }

        // Handle poll options
        if (data.type === 'poll' && data.pollOptions && data.pollOptions.length > 0) {
            formData.append('poll_options_text', data.pollOptions.join('\n'));
        }

        const response = await fetchWithTimeout(`${BACKEND_URL}/api/mobile-admin/breaking-news`, {
            method: 'POST',
            body: formData,
            headers: {
                // Don't set Content-Type - let the browser set it with boundary
            },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Upload failed: ${response.status} - ${text}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Upload Breaking News Error:', error);
        const msg = error.name === 'AbortError' ? 'Upload timed out after 60s' : (error.message || 'Upload failed');
        return { success: false, error: msg };
    }
}

/**
 * Upload Music Track via backend API
 */
export async function uploadMusicTrack(data: MusicUpload): Promise<{ success: boolean; error?: string }> {
    try {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('artist', data.artist);
        if (data.album) formData.append('album', data.album);

        // Upload audio file
        const audioFilename = data.audioUri.split('/').pop() || 'audio.mp3';
        formData.append('audio', {
            uri: data.audioUri,
            name: audioFilename,
            type: 'audio/mpeg',
        } as any);

        // Upload cover image (optional)
        if (data.coverUri) {
            const coverFilename = data.coverUri.split('/').pop() || 'cover.jpg';
            formData.append('cover', {
                uri: data.coverUri,
                name: coverFilename,
                type: 'image/jpeg',
            } as any);
        }

        const response = await fetchWithTimeout(`${BACKEND_URL}/api/mobile-admin/music`, {
            method: 'POST',
            body: formData,
            headers: {
                // Don't set Content-Type - let the browser set it with boundary
            },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Upload failed: ${response.status} - ${text}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Upload Music Error:', error);
        const msg = error.name === 'AbortError' ? 'Upload timed out after 60s' : (error.message || 'Upload failed');
        return { success: false, error: msg };
    }
}
