import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

// Initialize Supabase client
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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
 * Upload Breaking News post
 */
// Max file size: 1GB in bytes
const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024;
const UPLOAD_TIMEOUT = 300000; // 5 minutes

/**
 * Helper: Validate file size
 */
async function validateFileSize(uri: string): Promise<void> {
    try {
        const info = await FileSystem.getInfoAsync(uri);
        if (info.exists && info.size > MAX_FILE_SIZE) {
            throw new Error(`File is too large. Max size is 1GB. Current size: ${(info.size / (1024 * 1024)).toFixed(2)}MB`);
        }
    } catch (error: any) {
        throw new Error(error.message || 'Failed to check file size');
    }
}

/**
 * Upload Breaking News post
 */
export async function uploadBreakingNews(data: BreakingNewsUpload): Promise<{ success: boolean; error?: string }> {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');

        // Validate media size
        if (data.mediaUri) {
            await validateFileSize(data.mediaUri);
        }

        let mediaUrl: string | null = null;

        // Upload media file if provided
        if (data.mediaUri && (data.type === 'image' || data.type === 'video')) {
            const fileExt = data.mediaUri.split('.').pop() || 'jpg';
            const fileName = `news-${Date.now()}.${fileExt}`;
            const bucket = 'news_media';

            // Read file as base64
            const fileData = await FileSystem.readAsStringAsync(data.mediaUri, { encoding: 'base64' });
            const blob = base64ToBlob(fileData, data.type === 'image' ? 'image/jpeg' : 'video/mp4');

            // Upload with timeout race
            const uploadPromise = supabase.storage
                .from(bucket)
                .upload(fileName, blob, {
                    contentType: data.type === 'image' ? 'image/jpeg' : 'video/mp4',
                    upsert: false,
                });

            const { error: uploadError } = await Promise.race([
                uploadPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Upload timeout')), UPLOAD_TIMEOUT))
            ]) as any;

            if (uploadError) throw new Error(`Media upload failed: ${uploadError.message}`);

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
            mediaUrl = publicUrl;
        }

        // Prepare poll options
        let pollOptions: any = null;
        if (data.type === 'poll' && data.pollOptions && data.pollOptions.length > 0) {
            pollOptions = data.pollOptions.map((text, index) => ({
                id: index,
                text,
                votes: 0,
            }));
        }

        // Insert into database
        const { error: dbError } = await supabase
            .from('breaking_news')
            .insert([{
                type: data.type,
                content: data.content,
                media_url: mediaUrl,
                poll_options: pollOptions,
            }]);

        if (dbError) throw new Error(`Database insert failed: ${dbError.message}`);

        return { success: true };
    } catch (error: any) {
        console.error('Upload Breaking News Error:', error);
        return { success: false, error: error.message || 'Upload failed' };
    }
}

/**
 * Upload Music Track
 */
export async function uploadMusicTrack(data: MusicUpload): Promise<{ success: boolean; error?: string }> {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');

        // Validate file sizes
        await validateFileSize(data.audioUri);
        if (data.coverUri) await validateFileSize(data.coverUri);

        // Upload audio file
        const audioExt = data.audioUri.split('.').pop() || 'mp3';
        const audioFileName = `music-${Date.now()}.${audioExt}`;

        const audioData = await FileSystem.readAsStringAsync(data.audioUri, { encoding: 'base64' });
        const audioBlob = base64ToBlob(audioData, 'audio/mpeg');

        const { error: audioError } = await supabase.storage
            .from('music_files')
            .upload(audioFileName, audioBlob, { contentType: 'audio/mpeg', upsert: false });

        if (audioError) throw new Error(`Audio upload failed: ${audioError.message}`);

        const { data: { publicUrl: audioUrl } } = supabase.storage
            .from('music_files')
            .getPublicUrl(audioFileName);

        // Upload cover image (optional)
        let coverUrl: string | null = null;
        if (data.coverUri) {
            try {
                const coverExt = data.coverUri.split('.').pop() || 'jpg';
                const coverFileName = `cover-${Date.now()}.${coverExt}`;
                const coverData = await FileSystem.readAsStringAsync(data.coverUri, { encoding: 'base64' });
                const coverBlob = base64ToBlob(coverData, 'image/jpeg');

                const { error: coverError } = await supabase.storage
                    .from('music_covers')
                    .upload(coverFileName, coverBlob, { contentType: 'image/jpeg', upsert: false });

                if (!coverError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('music_covers')
                        .getPublicUrl(coverFileName);
                    coverUrl = publicUrl;
                }
            } catch (e) {
                console.warn('Cover upload failed, skipping:', e);
            }
        }

        // Insert into database
        const { error: dbError } = await supabase
            .from('music')
            .insert([{
                title: data.title,
                artist: data.artist,
                album: data.album || null,
                audio_url: audioUrl,
                cover_url: coverUrl,
                duration: 0,
            }]);

        if (dbError) throw new Error(`Database insert failed: ${dbError.message}`);

        return { success: true };
    } catch (error: any) {
        console.error('Upload Music Error:', error);
        return { success: false, error: error.message || 'Upload failed' };
    }
}

/**
 * Helper: Convert base64 to Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}
