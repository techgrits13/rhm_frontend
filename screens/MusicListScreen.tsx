import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { musicService, MusicTrack } from '../services/musicService';
import MusicAdBanner from '../components/MusicAdBanner';

type SortOption = 'az' | 'most_played' | 'favorites';

export default function MusicListScreen() {
    const navigation = useNavigation<any>();
    const [tracks, setTracks] = useState<MusicTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('az');
    const [favorites, setFavorites] = useState<number[]>([]);
    const [playCounts, setPlayCounts] = useState<Record<string, number>>({});

    const loadData = async () => {
        setLoading(true);
        try {
            const [allTracks, favs, counts] = await Promise.all([
                musicService.getAllMusic(),
                musicService.getFavorites(),
                musicService.getPlayCounts()
            ]);
            setTracks(allTracks);
            setFavorites(favs);
            setPlayCounts(counts);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const getSortedTracks = () => {
        let filtered = tracks;

        // Filter by search
        if (searchText) {
            const lower = searchText.toLowerCase();
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(lower) ||
                t.artist.toLowerCase().includes(lower)
            );
        }

        // Sort
        return filtered.sort((a, b) => {
            if (sortBy === 'favorites') {
                const aFav = favorites.includes(a.id) ? 1 : 0;
                const bFav = favorites.includes(b.id) ? 1 : 0;
                if (aFav !== bFav) return bFav - aFav;
                return a.title.localeCompare(b.title);
            }
            if (sortBy === 'most_played') {
                const aCount = playCounts[a.id] || 0;
                const bCount = playCounts[b.id] || 0;
                if (aCount !== bCount) return bCount - aCount;
                return a.title.localeCompare(b.title);
            }
            // Default A-Z
            return a.title.localeCompare(b.title);
        });
    };

    const renderItem = ({ item }: { item: MusicTrack }) => {
        const isFav = favorites.includes(item.id);
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('MusicPlayer', { trackId: item.id, playlist: getSortedTracks() })}
            >
                <Image
                    source={item.cover_url ? { uri: item.cover_url } : require('../assets/icon.png')}
                    style={styles.cover}
                />
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
                </View>
                <View style={styles.actions}>
                    {isFav && <Ionicons name="heart" size={16} color="red" style={{ marginRight: 8 }} />}
                    <Ionicons name="play-circle-outline" size={28} color="#6200ee" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Search & Filter Header */}
            <View style={styles.header}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#666" />
                    <TextInput
                        style={styles.input}
                        placeholder="Search songs..."
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>

                <View style={styles.filters}>
                    <TouchableOpacity
                        style={[styles.filterBtn, sortBy === 'az' && styles.filterBtnActive]}
                        onPress={() => setSortBy('az')}
                    >
                        <Text style={[styles.filterText, sortBy === 'az' && styles.filterTextActive]}>A-Z</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterBtn, sortBy === 'favorites' && styles.filterBtnActive]}
                        onPress={() => setSortBy('favorites')}
                    >
                        <Text style={[styles.filterText, sortBy === 'favorites' && styles.filterTextActive]}>Favorites</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterBtn, sortBy === 'most_played' && styles.filterBtnActive]}
                        onPress={() => setSortBy('most_played')}
                    >
                        <Text style={[styles.filterText, sortBy === 'most_played' && styles.filterTextActive]}>Top Played</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={getSortedTracks()}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={styles.empty}>No music found.</Text>
                    }
                />
            )}
            <MusicAdBanner />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f1f1',
        padding: 8,
        borderRadius: 8,
        marginBottom: 12
    },
    input: { flex: 1, marginLeft: 8, fontSize: 16 },
    filters: { flexDirection: 'row', justifyContent: 'space-between' },
    filterBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#eee'
    },
    filterBtnActive: { backgroundColor: '#6200ee' },
    filterText: { fontSize: 13, color: '#333' },
    filterTextActive: { color: '#fff', fontWeight: 'bold' },
    list: { padding: 16 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 10,
        marginBottom: 10,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 }
    },
    cover: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#eee' },
    info: { flex: 1, marginLeft: 12 },
    title: { fontSize: 16, fontWeight: '600', color: '#222' },
    artist: { fontSize: 14, color: '#666', marginTop: 2 },
    actions: { flexDirection: 'row', alignItems: 'center' },
    empty: { textAlign: 'center', marginTop: 40, color: '#666' }
});
