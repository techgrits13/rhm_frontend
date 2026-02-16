import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
    Dimensions,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Text as SvgText, TextPath, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import api from '../services/api';
import AdBanner from '../components/AdBanner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

// Supabase client for realtime - using environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface NewsItem {
    id: number;
    type: 'text' | 'image' | 'video' | 'poll';
    content: string;
    media_url?: string;
    poll_options?: { id: number; text: string; votes: number }[];
    created_at: string;
    user_reaction?: string;
}

// Helper to format relative time
const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);

    // Validate date
    if (isNaN(past.getTime())) {
        return 'Recently';
    }

    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    try {
        return past.toLocaleDateString();
    } catch (error) {
        return 'Recently';
    }
};

export default function BreakingNewsScreen() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const channelRef = useRef<any>(null);

    useEffect(() => {
        loadUserId();
        fetchNews(1);
        subscribeToRealtime();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, []);

    const subscribeToRealtime = () => {
        const channel = supabase
            .channel('breaking_news_changes')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'breaking_news' },
                (payload: any) => {
                    console.log('✨ New post!', payload);
                    setNews(prev => [payload.new as NewsItem, ...prev]);
                }
            )
            .on('postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'breaking_news' },
                (payload: any) => {
                    console.log('🗑️ Post deleted', payload);
                    setNews(prev => prev.filter(item => item.id !== payload.old.id));
                }
            )
            .subscribe();

        channelRef.current = channel;
    };

    const loadUserId = async () => {
        let id = await AsyncStorage.getItem('user_identifier');
        if (!id) {
            id = 'user_' + Math.random().toString(36).substr(2, 9);
            await AsyncStorage.setItem('user_identifier', id);
        }
        setUserId(id || 'anon');
    };

    const fetchNews = async (pageNum: number) => {
        try {
            if (pageNum === 1) setLoading(true);
            else setLoadingMore(true);

            const response = await api.get('/breaking-news', {
                params: { page: pageNum, limit: 20 }
            });

            // BULLETPROOF: Validate response structure
            if (!response || !response.data) {
                console.warn('Invalid API response');
                if (pageNum === 1) setNews([]);
                setHasMore(false);
                return;
            }

            // SAFE: Ensure we have an array and filter out invalid items
            const rawItems = response.data?.data || [];
            const newItems = Array.isArray(rawItems)
                ? rawItems.filter(item => item && item.id && item.type)
                : [];

            if (pageNum === 1) {
                setNews(newItems);
            } else {
                setNews(prev => Array.isArray(prev) ? [...prev, ...newItems] : newItems);
            }

            setHasMore(newItems.length === 20);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching news:', error);
            // SAFE: Set empty array on error to prevent crash
            if (pageNum === 1) {
                setNews([]);
            }
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchNews(1);
    };

    const loadMore = () => {
        // Prevent loading more if already loading or no more items
        if (!loading && !loadingMore && hasMore) {
            fetchNews(page + 1);
        }
    };

    const handleReaction = async (item: NewsItem, reaction: string) => {
        // BULLETPROOF: Validate inputs
        if (!item || !item.id || !reaction || !userId) {
            console.warn('Invalid reaction data');
            return;
        }

        // Optimistic update
        const updated = Array.isArray(news)
            ? news.map(n => n && n.id === item.id ? { ...n, user_reaction: reaction } : n)
            : [];
        setNews(updated);

        try {
            await api.post(`/breaking-news/${item.id}/react`, {
                user_identifier: userId,
                reaction
            });
        } catch (e) {
            console.error("Reaction failed:", e);
            // SAFE: Silently fail, don't crash
        }
    };

    const handleVote = async (item: NewsItem, optionIndex: number) => {
        try {
            const res = await api.post(`/breaking-news/${item.id}/vote`, {
                option_index: optionIndex
            });
            const updated = news.map(n => n.id === item.id ? { ...n, poll_options: res.data.poll_options } : n);
            setNews(updated);
        } catch (e) {
            Alert.alert('Vote Failed', 'Could not register your vote.');
        }
    };

    const renderItem = ({ item }: { item: NewsItem }) => {
        // Null check - return null if item is invalid
        if (!item || !item.id) {
            console.warn('Invalid news item:', item);
            return null;
        }

        const isImage = item.type === 'image';
        const isVideo = item.type === 'video';
        const isPoll = item.type === 'poll';

        // Blue theme for all cards
        const cardBg = '#E3F2FD';
        const textColor = '#1565C0';

        return (
            <View style={[styles.card, { backgroundColor: cardBg }]}>
                <View style={styles.header}>
                    <LinearGradient
                        colors={['#2196F3', '#1976D2']}
                        style={styles.avatar}
                    >
                        <Ionicons name="megaphone" size={16} color="#fff" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.author, { color: textColor }]}>Admin Announcement</Text>
                        <Text style={styles.date}>{getRelativeTime(item.created_at)}</Text>
                    </View>
                </View>

                {item.content ? <Text style={[styles.content, { color: textColor }]}>{item.content}</Text> : null}

                {isImage && item.media_url && (
                    <Image
                        source={{ uri: item.media_url }}
                        style={styles.media}
                        resizeMode="cover"
                        onError={(error) => console.warn('Image failed to load:', error.nativeEvent.error)}
                    />
                )}

                {isVideo && item.media_url && (
                    <Video
                        style={styles.media}
                        source={{ uri: item.media_url }}
                        useNativeControls
                        resizeMode={ResizeMode.CONTAIN}
                        isLooping={false}
                        onError={(error) => console.warn('Video failed to load:', error)}
                    />
                )}

                {isPoll && Array.isArray(item.poll_options) && item.poll_options.length > 0 && (
                    <View style={styles.pollContainer}>
                        {item.poll_options.map((opt, idx) => {
                            if (!opt || typeof opt.text !== 'string') return null;
                            const totalVotes = item.poll_options!.reduce((acc, curr) => acc + (curr?.votes || 0), 0);
                            const percentage = totalVotes > 0 ? ((opt.votes || 0) / totalVotes) * 100 : 0;
                            return (
                                <TouchableOpacity key={idx} style={styles.pollOption} onPress={() => handleVote(item, idx)}>
                                    <LinearGradient
                                        colors={['#42A5F5', '#1E88E5']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.pollProgress, { width: `${percentage}%` }]}
                                    />
                                    <Text style={[styles.pollText, { color: textColor }]}>{opt.text}</Text>
                                    <Text style={styles.pollVotes}>{opt.votes || 0} ({percentage.toFixed(0)}%)</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                <View style={styles.footer}>
                    <View style={styles.reactions}>
                        {['👍', '❤️', '🙏', '🔥'].map(emoji => (
                            <TouchableOpacity key={emoji} onPress={() => handleReaction(item, emoji)} style={[styles.reactionBtn, item.user_reaction === emoji && styles.reactionActive]}>
                                <Text style={styles.emoji}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1976D2', '#2196F3', '#64B5F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.straightTextContainer}>
                    <Svg height="60" width={width}>
                        <Defs>
                            <SvgLinearGradient id="rainbow" x1="0" y1="0" x2="100%" y2="0">
                                <Stop offset="0%" stopColor="#FFD700" />
                                <Stop offset="20%" stopColor="#FFA500" />
                                <Stop offset="40%" stopColor="#FF69B4" />
                                <Stop offset="60%" stopColor="#00CED1" />
                                <Stop offset="80%" stopColor="#9370DB" />
                                <Stop offset="100%" stopColor="#FFD700" />
                            </SvgLinearGradient>
                        </Defs>
                        <SvgText
                            fill="url(#rainbow)"
                            fontSize="32"
                            fontWeight="bold"
                            letterSpacing="3"
                            x={width / 2}
                            y="40"
                            textAnchor="middle"
                        >
                            PREPARE THE WAY
                        </SvgText>
                    </Svg>
                </View>
            </LinearGradient>

            <FlatList
                data={news}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.list}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 20 }} color="#1976D2" /> : null}
            />
            <View style={styles.adContainer}>
                <AdBanner />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f8' },
    headerGradient: {
        paddingTop: 10,
        paddingBottom: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    straightTextContainer: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    adContainer: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        alignItems: 'center',
        paddingVertical: 4,
        marginTop: 10,
        marginBottom: 32, // Lift up the ad
    },
    list: { padding: 10, paddingBottom: 20 },
    card: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        borderLeftWidth: 4,
        borderLeftColor: '#1976D2',
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    avatar: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center', marginRight: 10
    },
    author: { fontWeight: 'bold', fontSize: 15 },
    date: { fontSize: 12, color: '#666', marginTop: 2 },
    content: { fontSize: 15, marginBottom: 8, lineHeight: 22, fontWeight: '500' },
    media: { width: '100%', height: 250, borderRadius: 8, backgroundColor: '#000', marginBottom: 8 },
    pollContainer: { marginTop: 8 },
    pollOption: {
        borderWidth: 1.5, borderColor: '#BBDEFB', borderRadius: 8,
        padding: 12, marginBottom: 8, position: 'relative', overflow: 'hidden',
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#fff'
    },
    pollProgress: {
        position: 'absolute', top: 0, bottom: 0, left: 0,
        opacity: 0.2
    },
    pollText: { fontWeight: '600', fontSize: 14, zIndex: 1 },
    pollVotes: { fontSize: 12, color: '#666', fontWeight: '600', zIndex: 1 },
    footer: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 8, marginTop: 6 },
    reactions: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
    reactionBtn: { padding: 6, borderRadius: 20 },
    reactionActive: { backgroundColor: 'rgba(25, 118, 210, 0.1)' },
    emoji: { fontSize: 22 },
});
