import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadBreakingNews, uploadMusicTrack } from '../services/adminUploadService';

type TabType = 'news' | 'music';
type NewsType = 'text' | 'image' | 'video' | 'poll';

export default function AdminDashboardScreen() {
    const [activeTab, setActiveTab] = useState<TabType>('news');

    return (
        <View style={styles.container}>
            {/* Tab Selector */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'news' && styles.tabActive]}
                    onPress={() => setActiveTab('news')}
                >
                    <Ionicons
                        name="megaphone"
                        size={20}
                        color={activeTab === 'news' ? '#fff' : '#6200ee'}
                    />
                    <Text style={[styles.tabText, activeTab === 'news' && styles.tabTextActive]}>
                        Breaking News
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'music' && styles.tabActive]}
                    onPress={() => setActiveTab('music')}
                >
                    <Ionicons
                        name="musical-notes"
                        size={20}
                        color={activeTab === 'music' ? '#fff' : '#6200ee'}
                    />
                    <Text style={[styles.tabText, activeTab === 'music' && styles.tabTextActive]}>
                        Music
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {activeTab === 'news' ? <BreakingNewsTab /> : <MusicTab />}
        </View>
    );
}

// Breaking News Tab Component
function BreakingNewsTab() {
    const [newsType, setNewsType] = useState<NewsType>('text');
    const [content, setContent] = useState('');
    const [mediaUri, setMediaUri] = useState<string | null>(null);
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [uploading, setUploading] = useState(false);

    const pickMedia = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: newsType === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setMediaUri(result.assets[0].uri);
        }
    };

    const handleUpload = async () => {
        if (!content.trim()) {
            Alert.alert('Error', 'Please enter some content');
            return;
        }

        if (newsType === 'poll' && pollOptions.filter(o => o.trim()).length < 2) {
            Alert.alert('Error', 'Poll must have at least 2 options');
            return;
        }

        setUploading(true);

        const result = await uploadBreakingNews({
            type: newsType,
            content: content.trim(),
            mediaUri: mediaUri || undefined,
            pollOptions: newsType === 'poll' ? pollOptions.filter(o => o.trim()) : undefined,
        });

        setUploading(false);

        if (result.success) {
            Alert.alert('Success', 'Breaking news posted successfully!');
            // Reset form
            setContent('');
            setMediaUri(null);
            setPollOptions(['', '']);
        } else {
            Alert.alert('Upload Failed', result.error || 'Please try again');
        }
    };

    return (
        <ScrollView style={styles.tabContent}>
            {/* Type Selector */}
            <Text style={styles.label}>Post Type</Text>
            <View style={styles.typeSelector}>
                {(['text', 'image', 'video', 'poll'] as NewsType[]).map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.typeButton, newsType === type && styles.typeButtonActive]}
                        onPress={() => {
                            setNewsType(type);
                            setMediaUri(null);
                        }}
                    >
                        <Text style={[styles.typeButtonText, newsType === type && styles.typeButtonTextActive]}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content Input */}
            <Text style={styles.label}>Content / Caption</Text>
            <TextInput
                style={styles.textArea}
                value={content}
                onChangeText={setContent}
                placeholder="Write your message..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
            />

            {/* Media Picker (Image/Video) */}
            {(newsType === 'image' || newsType === 'video') && (
                <>
                    <TouchableOpacity style={styles.mediaButton} onPress={pickMedia}>
                        <Ionicons name="cloud-upload" size={24} color="#6200ee" />
                        <Text style={styles.mediaButtonText}>
                            {mediaUri ? 'Change Media' : `Select ${newsType === 'image' ? 'Image' : 'Video'}`}
                        </Text>
                    </TouchableOpacity>
                    {mediaUri && newsType === 'image' && (
                        <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
                    )}
                    {mediaUri && newsType === 'video' && (
                        <View style={styles.videoPreview}>
                            <Ionicons name="videocam" size={40} color="#6200ee" />
                            <Text style={styles.videoPreviewText}>Video selected</Text>
                        </View>
                    )}
                </>
            )}

            {/* Poll Options */}
            {newsType === 'poll' && (
                <>
                    <Text style={styles.label}>Poll Options</Text>
                    {pollOptions.map((option, index) => (
                        <TextInput
                            key={index}
                            style={styles.input}
                            value={option}
                            onChangeText={(text) => {
                                const newOptions = [...pollOptions];
                                newOptions[index] = text;
                                setPollOptions(newOptions);
                            }}
                            placeholder={`Option ${index + 1}`}
                        />
                    ))}
                    {pollOptions.length < 5 && (
                        <TouchableOpacity
                            style={styles.addOptionButton}
                            onPress={() => setPollOptions([...pollOptions, ''])}
                        >
                            <Ionicons name="add-circle" size={20} color="#6200ee" />
                            <Text style={styles.addOptionText}>Add Option</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}

            {/* Upload Button */}
            <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={handleUpload}
                disabled={uploading}
            >
                {uploading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Ionicons name="send" size={20} color="#fff" />
                        <Text style={styles.uploadButtonText}>Post to Feed</Text>
                    </>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

// Music Tab Component
function MusicTab() {
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [album, setAlbum] = useState('');
    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [coverUri, setCoverUri] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const pickAudio = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'audio/*',
            copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets[0]) {
            setAudioUri(result.assets[0].uri);
        }
    };

    const pickCover = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setCoverUri(result.assets[0].uri);
        }
    };

    const handleUpload = async () => {
        if (!title.trim() || !artist.trim()) {
            Alert.alert('Error', 'Please enter title and artist');
            return;
        }

        if (!audioUri) {
            Alert.alert('Error', 'Please select an audio file');
            return;
        }

        setUploading(true);

        const result = await uploadMusicTrack({
            title: title.trim(),
            artist: artist.trim(),
            album: album.trim() || undefined,
            audioUri,
            coverUri: coverUri || undefined,
        });

        setUploading(false);

        if (result.success) {
            Alert.alert('Success', 'Music track uploaded successfully!');
            // Reset form
            setTitle('');
            setArtist('');
            setAlbum('');
            setAudioUri(null);
            setCoverUri(null);
        } else {
            Alert.alert('Upload Failed', result.error || 'Please try again');
        }
    };

    return (
        <ScrollView style={styles.tabContent}>
            {/* Title Input */}
            <Text style={styles.label}>Song Title *</Text>
            <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter song title"
            />

            {/* Artist Input */}
            <Text style={styles.label}>Artist *</Text>
            <TextInput
                style={styles.input}
                value={artist}
                onChangeText={setArtist}
                placeholder="Enter artist name"
            />

            {/* Album Input */}
            <Text style={styles.label}>Album (Optional)</Text>
            <TextInput
                style={styles.input}
                value={album}
                onChangeText={setAlbum}
                placeholder="Enter album name"
            />

            {/* Audio Picker */}
            <TouchableOpacity style={styles.mediaButton} onPress={pickAudio}>
                <Ionicons name="musical-note" size={24} color="#6200ee" />
                <Text style={styles.mediaButtonText}>
                    {audioUri ? 'Change Audio File' : 'Select Audio File *'}
                </Text>
            </TouchableOpacity>
            {audioUri && (
                <View style={styles.fileSelected}>
                    <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
                    <Text style={styles.fileSelectedText}>Audio file selected</Text>
                </View>
            )}

            {/* Cover Picker */}
            <TouchableOpacity style={styles.mediaButton} onPress={pickCover}>
                <Ionicons name="image" size={24} color="#6200ee" />
                <Text style={styles.mediaButtonText}>
                    {coverUri ? 'Change Cover Art' : 'Select Cover Art (Optional)'}
                </Text>
            </TouchableOpacity>
            {coverUri && (
                <Image source={{ uri: coverUri }} style={styles.coverPreview} />
            )}

            {/* Upload Button */}
            <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={handleUpload}
                disabled={uploading}
            >
                {uploading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Ionicons name="cloud-upload" size={20} color="#fff" />
                        <Text style={styles.uploadButtonText}>Upload Track</Text>
                    </>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    tabActive: {
        backgroundColor: '#6200ee',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6200ee',
    },
    tabTextActive: {
        color: '#fff',
    },
    tabContent: {
        flex: 1,
        padding: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 12,
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 12,
        minHeight: 100,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#6200ee',
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: '#6200ee',
    },
    typeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6200ee',
    },
    typeButtonTextActive: {
        color: '#fff',
    },
    mediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#6200ee',
        borderStyle: 'dashed',
        backgroundColor: '#f9f9f9',
        marginBottom: 12,
        gap: 8,
    },
    mediaButtonText: {
        fontSize: 16,
        color: '#6200ee',
        fontWeight: '600',
    },
    mediaPreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
    },
    videoPreview: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    videoPreviewText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    },
    coverPreview: {
        width: 120,
        height: 120,
        borderRadius: 8,
        marginBottom: 12,
    },
    fileSelected: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
        marginBottom: 12,
    },
    fileSelectedText: {
        fontSize: 14,
        color: '#2e7d32',
        fontWeight: '600',
    },
    addOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        marginBottom: 12,
    },
    addOptionText: {
        fontSize: 14,
        color: '#6200ee',
        fontWeight: '600',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6200ee',
        padding: 16,
        borderRadius: 8,
        marginTop: 24,
        marginBottom: 32,
        gap: 8,
    },
    uploadButtonDisabled: {
        opacity: 0.6,
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
