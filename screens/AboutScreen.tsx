import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';

export default function AboutScreen() {
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open link:', error);
    }
  };

  const copyMpesaNumber = async () => {
    try {
      await Clipboard.setStringAsync('0719694582');
      Alert.alert('Copied!', 'M-Pesa number 0719694582 has been copied to clipboard.');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy number.');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.card,
      padding: 40,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    appName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 16,
    },
    version: {
      fontSize: 14,
      color: colors.placeholder,
      marginTop: 4,
    },
    section: {
      backgroundColor: colors.card,
      padding: 16,
      marginTop: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    featureText: {
      fontSize: 16,
      color: colors.secondaryText,
      marginLeft: 12,
      flex: 1,
    },
    description: {
      fontSize: 14,
      color: colors.secondaryText,
      lineHeight: 22,
    },
    linkItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    linkText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
      flex: 1,
    },
    supportButton: {
      flexDirection: 'row',
      backgroundColor: '#25D366', // WhatsApp/Mpesa green-ish
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    supportButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    footer: {
      padding: 20,
      alignItems: 'center',
      marginTop: 20,
    },
    footerText: {
      fontSize: 12,
      color: colors.placeholder,
      marginTop: 4,
      textAlign: 'center',
    },
    themeToggleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    themeToggleText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
      flex: 1,
    },
    mpesaContainer: {
      backgroundColor: isDarkMode ? '#1a2e1a' : '#e8f5e9',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#4caf50',
    },
    mpesaLabel: {
      fontSize: 14,
      color: isDarkMode ? '#81c784' : '#2e7d32',
      marginBottom: 8,
      fontWeight: '600',
    },
    mpesaNumberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    mpesaNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      letterSpacing: 1,
    },
    copyButton: {
      backgroundColor: '#4caf50',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    copyButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="home" size={60} color={colors.primary} />
          <Text style={styles.appName}>RHM Church App</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        {/* Theme Toggle Section */}
        <View style={styles.section}>
          <View style={styles.themeToggleContainer}>
            <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={24} color={colors.text} />
            <Text style={styles.themeToggleText}>Dark Mode</Text>
            <Switch
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={isDarkMode ? '#f4f3f4' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleTheme}
              value={isDarkMode}
            />
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureItem}>
            <Ionicons name="videocam" size={24} color={colors.primary} />
            <Text style={styles.featureText}>Watch church sermons and videos</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="radio" size={24} color={colors.primary} />
            <Text style={styles.featureText}>Listen to Jesus Is Lord Radio</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="book" size={24} color={colors.primary} />
            <Text style={styles.featureText}>Read and search the Bible</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="create" size={24} color={colors.primary} />
            <Text style={styles.featureText}>Take personal notes</Text>
          </View>
        </View>

        {/* Church Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Our Church</Text>
          <Text style={styles.description}>
            RHM Church - Spreading the Gospel through media and ministry.
            Stay connected with our community through this app.
          </Text>
        </View>

        {/* YouTube Channels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our YouTube Channels</Text>
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => openLink('https://www.youtube.com/@kayolemainworshipchannel')}
          >
            <Ionicons name="logo-youtube" size={24} color="#FF0000" />
            <Text style={styles.linkText}>Kayole Main Altar</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => openLink('https://www.youtube.com/@CrownTvkeOfficial')}
          >
            <Ionicons name="logo-youtube" size={24} color="#FF0000" />
            <Text style={styles.linkText}>Crown TV KE Official</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => openLink('https://www.youtube.com/@machdan_media')}
          >
            <Ionicons name="logo-youtube" size={24} color="#FF0000" />
            <Text style={styles.linkText}>Machdan Media</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support the Developer</Text>
          <View style={styles.mpesaContainer}>
            <Text style={styles.mpesaLabel}>M-PESA Donation Number:</Text>
            <View style={styles.mpesaNumberRow}>
              <Text style={styles.mpesaNumber}>0719694582</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={copyMpesaNumber}
              >
                <Text style={styles.copyButtonText}>COPY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => openLink('https://docs.google.com/spreadsheets/d/1bGZlm0IK-RmV4uoLpdevQ-kYy7eLW0vAvYN8jVMZkYU/edit?usp=sharing')}
          >
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => openLink('https://docs.google.com/spreadsheets/d/1bGZlm0IK-RmV4uoLpdevQ-kYy7eLW0vAvYN8jVMZkYU/edit?usp=sharing')}
          >
            <Ionicons name="document-text" size={24} color={colors.primary} />
            <Text style={styles.linkText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for RHM Church Community
          </Text>
          <Text style={styles.footerText}>© 2025 RHM Church</Text>
        </View>
      </ScrollView>
    </View>
  );
}