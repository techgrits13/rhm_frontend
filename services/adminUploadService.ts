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

        const response = await fetch(`${BACKEND_URL}/admin-ui/news/create`, {
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
        return { success: false, error: error.message || 'Upload failed' };
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

        const response = await fetch(`${BACKEND_URL}/admin-ui/music/upload`, {
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
        return { success: false, error: error.message || 'Upload failed' };
    }
}
