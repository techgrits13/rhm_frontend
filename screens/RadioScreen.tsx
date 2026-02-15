import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { radioService, SlideshowImage } from '../services/radioService';
import { recordingService } from '../services/recordingService';
import { useTheme } from '../context/ThemeContext';
import AdBanner from '../components/AdBanner';

export default function RadioScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [radioUrl, setRadioUrl] = useState('');
  const [stationName, setStationName] = useState('');
  const [images, setImages] = useState<SlideshowImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Configure audio session for background playback
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
    fetchRadioInfo();
    fetchSlideshow();

    return () => {
      sound?.unloadAsync();
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
    };
  }, []);

  useEffect(() => {
    if (!images.length) return;
    const id = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % images.length);
    }, 5000);
    return () => clearInterval(id);
  }, [images.length]);

  const fetchRadioInfo = async () => {
    try {
      const data = await radioService.getStreamUrl();
      setRadioUrl(data.radioUrl);
      setStationName(data.station);
    } catch (error) {
      console.error('Error fetching radio info:', error);
      setStationName('Radio Stream');
      // Set a fallback URL so user can still try to play
      setRadioUrl('');
      Alert.alert(
        'Connection Error',
        'Could not connect to server. Please check your network connection and ensure the backend is running.',
        [{ text: 'OK' }]
      );
    }
  };

  const fetchSlideshow = async () => {
    try {
      const imgs = await radioService.getSlideshowImages();
      setImages(imgs);
    } catch (e) {
      // ignore
    }
  };

  async function togglePlayback() {
    if (isLoading || !radioUrl) return;

    setIsLoading(true);
    if (isPlaying && sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setIsPlaying(false);
      setSound(null);

      // Stop recording if active
      if (isRecording) {
        await stopRecording();
      }
    } else {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: radioUrl },
          { shouldPlay: true }
        );

        // Monitor playback status for interruptions
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            // Handle interruptions (calls, alarms, etc.)
            if (!status.isPlaying && !status.didJustFinish && isPlaying) {
              console.log('Playback interrupted');
            }
          }
        });

        setSound(newSound);
        setIsPlaying(true);
      } catch (error) {
        console.error('Playback error:', error);
        Alert.alert('Error', 'Could not play the radio stream.');
      }
    }
    setIsLoading(false);
  }

  async function toggleRecording() {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }

  async function startRecording() {
    if (!isPlaying) {
      Alert.alert('Start Radio First', 'Please start playing the radio before recording.');
      return;
    }

    try {
      await recordingService.startRecording();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer to update duration
      const timer = setInterval(() => {
        setRecordingDuration(recordingService.getRecordingDuration());
      }, 1000);
      setRecordingTimer(timer);

      Alert.alert('Recording Started', 'Your radio recording has started!');
    } catch (error: any) {
      console.error('Recording error:', error);
      Alert.alert('Recording Error', error.message || 'Failed to start recording');
    }
  }

  async function stopRecording() {
    try {
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }

      const recording = await recordingService.stopRecording();
      setIsRecording(false);
      setRecordingDuration(0);

      Alert.alert(
        'Recording Saved!',
        `Your recording (${recordingService.formatDuration(recording.duration)}) has been saved.`,
        [
          { text: 'OK' },
          {
            text: 'View Recordings',
            onPress: () => (navigation as any).navigate('Recordings'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', 'Failed to save recording');
      setIsRecording(false);
      setRecordingDuration(0);
    }
  }

  // Dynamic styles that depend on the theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 20,
    },
    slideshowContainer: {
      width: '100%',
      maxWidth: 700,
      height: 200,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colors.card,
      marginBottom: 16,
    },
    slideshowImage: {
      width: '100%',
      height: '100%',
    },
    dotsContainer: {
      position: 'absolute',
      bottom: 8,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 3,
      backgroundColor: 'rgba(255,255,255,0.4)',
    },
    dotActive: {
      backgroundColor: '#fff',
    },
    stationName: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      color: colors.text,
      marginBottom: 12,
    },
    playButton: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 40,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    statusText: {
      fontSize: 16,
      color: colors.secondaryText,
      marginBottom: 20,
    },
    recordingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ff6b6b',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginBottom: 16,
      gap: 8,
    },
    recordingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#fff',
    },
    recordingText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
    },
    controlsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    controlButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      gap: 6,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    recordButton: {
      backgroundColor: '#ff6b6b',
    },
    recordButtonActive: {
      backgroundColor: '#d63031',
    },
    controlButtonText: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 14,
    },
    recordButtonText: {
      color: '#fff',
    },
    adContainer: {
      alignSelf: 'stretch',
      borderTopWidth: 1,
      borderTopColor: '#e5e5e5',
      backgroundColor: '#fff',
      paddingVertical: 4,
      marginTop: 12,
    },
  });

  return (
    <View style={styles.container}>
      {images.length > 0 && (
        <View style={styles.slideshowContainer}>
          <Image
            source={{ uri: images[currentIndex].media_url }}
            style={styles.slideshowImage}
            resizeMode="cover"
          />
          <View style={styles.dotsContainer}>
            {images.slice(0, 8).map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, idx === (currentIndex % Math.min(images.length, 8)) && styles.dotActive]}
              />
            ))}
          </View>
        </View>
      )}
      <Text style={styles.stationName}>{stationName || 'Loading...'}</Text>

      <TouchableOpacity style={styles.playButton} onPress={togglePlayback} disabled={!radioUrl}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={60} color="#fff" />
        )}
      </TouchableOpacity>

      <Text style={styles.statusText}>
        {isLoading ? 'Connecting...' : isPlaying ? 'Now Playing' : 'Tap to Play'}
      </Text>

      {/* Recording Indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>
            Recording {recordingService.formatDuration(recordingDuration)}
          </Text>
        </View>
      )}

      {/* Recording Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.recordButton,
            isRecording && styles.recordButtonActive,
          ]}
          onPress={toggleRecording}
          disabled={!isPlaying && !isRecording}
        >
          <Ionicons
            name={isRecording ? 'stop-circle' : 'radio-button-on'}
            size={20}
            color="#fff"
          />
          <Text style={[styles.controlButtonText, styles.recordButtonText]}>
            {isRecording ? 'Stop Recording' : 'Record'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => (navigation as any).navigate('Recordings')}
        >
          <Ionicons name="folder-open-outline" size={20} color={colors.text} />
          <Text style={styles.controlButtonText}>My Recordings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.adContainer}>
        <AdBanner />
      </View>
    </View>
  );
}
