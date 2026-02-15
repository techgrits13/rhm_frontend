import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Share,
    Platform
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { musicService, MusicTrack } from '../services/musicService';
import MusicAdBanner from '../components/MusicAdBanner'; // Adaptive banner

// Define param list for typing
type RootStackParamList = {
    MusicPlayer: { trackId: number; playlist: MusicTrack[] };
};

const { width } = Dimensions.get('window');

export default function MusicPlayerScreen() {
    const route = useRoute<RouteProp<RootStackParamList, 'MusicPlayer'>>();
    const navigation = useNavigation<any>();
    const { trackId, playlist = [] } = route.params || {};

    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(true);

    // Configure audio session for background playback
    useEffect(() => {
        const configureAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: true,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                });
            } catch (error) {
                console.error('Audio configuration error:', error);
            }
        };
        configureAudio();
    }, []);

    // Load track info
    useEffect(() => {
        if (playlist.length > 0 && trackId) {
            const track = playlist.find((t: MusicTrack) => t.id === trackId);
            if (track) {
                loadTrack(track);
            }
        }
        return () => {
            // Cleanup
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [trackId]);

    const loadTrack = async (track: MusicTrack) => {
        try {
            setLoading(true);
            if (sound) await sound.unloadAsync();

            setCurrentTrack(track);

            // Check favorite status
            const favs = await musicService.getFavorites();
            setIsFavorite(favs.includes(track.id));

            // Update play count
            musicService.incrementPlayCount(track.id);

            const { sound: newSound, status } = await Audio.Sound.createAsync(
                { uri: track.audio_url },
                { shouldPlay: true },
                onPlaybackStatusUpdate
            );

            setSound(newSound);
            setIsPlaying(true);
            setLoading(false);
        } catch (error) {
            console.error('Error loading sound', error);
            setLoading(false);
        }
    };

    const onPlaybackStatusUpdate = (status: any) => {
        if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || 0);
            setIsPlaying(status.isPlaying);

            if (status.didJustFinish) {
                playNext();
            }
        }
    };

    const playNext = () => {
        if (!currentTrack || !playlist.length) return;
        const currentIndex = playlist.findIndex((t: MusicTrack) => t.id === currentTrack.id);
        const nextIndex = (currentIndex + 1) % playlist.length;
        navigation.setParams({ trackId: playlist[nextIndex].id });
    };

    const playPrev = () => {
        if (!currentTrack || !playlist.length) return;
        const currentIndex = playlist.findIndex((t: MusicTrack) => t.id === currentTrack.id);
        const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        navigation.setParams({ trackId: playlist[prevIndex].id });
    };

    const togglePlay = async () => {
        if (!sound) return;
        if (isPlaying) {
            await sound.pauseAsync();
        } else {
            await sound.playAsync();
        }
    };

    const toggleFav = async () => {
        if (!currentTrack) return;
        const newState = await musicService.toggleFavorite(currentTrack.id);
        setIsFavorite(newState);
    };

    const formatTime = (millis: number) => {
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const onSeek = async (value: number) => {
        if (sound) {
            await sound.setPositionAsync(value);
        }
    };

    if (!currentTrack) return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Artwork */}
            <View style={styles.artContainer}>
                <Image
                    source={currentTrack.cover_url ? { uri: currentTrack.cover_url } : require('../assets/icon.png')}
                    style={styles.artwork}
                />
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
                <View>
                    <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
                    <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
                </View>
                <TouchableOpacity onPress={toggleFav}>
                    <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={28} color={isFavorite ? "red" : "#333"} />
                </TouchableOpacity>
            </View>

            {/* Slider */}
            <View style={styles.sliderContainer}>
                <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0}
                    maximumValue={duration}
                    value={position}
                    onSlidingComplete={onSeek}
                    minimumTrackTintColor="#6200ee"
                    maximumTrackTintColor="#ccc"
                    thumbTintColor="#6200ee"
                />
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{formatTime(position)}</Text>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity onPress={playPrev}>
                    <Ionicons name="play-skip-back" size={35} color="#333" />
                </TouchableOpacity>

                <TouchableOpacity onPress={togglePlay} style={styles.playButton}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#fff" />
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={playNext}>
                    <Ionicons name="play-skip-forward" size={35} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Adaptive Banner */}
            <View style={styles.adContainer}>
                <MusicAdBanner />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', paddingTop: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    artContainer: {
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        marginBottom: 30
    },
    artwork: { width: '100%', height: '100%', borderRadius: 20, backgroundColor: '#eee' },
    infoContainer: {
        width: '85%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    title: { fontSize: 22, fontWeight: 'bold', color: '#222' },
    artist: { fontSize: 16, color: '#666', marginTop: 4 },
    sliderContainer: { width: '85%', marginBottom: 20 },
    timeContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    timeText: { fontSize: 12, color: '#888' },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '60%',
        justifyContent: 'space-between',
        marginBottom: 30
    },
    playButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#6200ee',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5
    },
    adContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        alignItems: 'center'
    }
});
