import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';

import { configureApi } from '@regintel/api';
import { TokenStorage } from '@regintel/auth';
import { colors } from '@regintel/ui-tokens';
import { useControls, useCopilot } from '@regintel/hooks';
import { formatDate, getRiskColor, getStatusColor } from '@regintel/utils';

// ── SecureStore Storage Adapter for Mobile ──
class MobileSecureTokenStorage implements TokenStorage {
  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('rg_token');
  }
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('rg_token', token);
  }
  async clearToken(): Promise<void> {
    await SecureStore.deleteItemAsync('rg_token');
  }
}

const mobileStorage = new MobileSecureTokenStorage();

// Configure @regintel/api to use Mobile SecureStore adapter
configureApi({ tokenStorage: mobileStorage });

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'controls' | 'copilot' | 'evidence' | 'profile'>('dashboard');
  const { controls, loading, refresh } = useControls();
  const { messages, sending, sendMessage } = useCopilot();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RegintelAI Mobile</Text>
        <Text style={styles.headerSubtitle}>Continuous Compliance OS</Text>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {activeTab === 'dashboard' && (
          <ScrollView style={styles.tabScroll}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Compliance Score</Text>
              <Text style={styles.scoreText}>94%</Text>
              <Text style={styles.cardSubtitle}>37 Controls Monitored • Enterprise Tier</Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>High Priority Controls</Text>
            </View>

            {loading ? (
              <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 20 }} />
            ) : (
              controls.slice(0, 5).map((ctrl) => (
                <View key={ctrl.id} style={styles.controlCard}>
                  <View style={styles.controlRow}>
                    <Text style={styles.controlCode}>{ctrl.code}</Text>
                    <View style={[styles.badge, { backgroundColor: getRiskColor(ctrl.risk_level) }]}>
                      <Text style={styles.badgeText}>{ctrl.risk_level}</Text>
                    </View>
                  </View>
                  <Text style={styles.controlName}>{ctrl.name}</Text>
                  <Text style={styles.controlStatus}>Status: {ctrl.status}</Text>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {activeTab === 'controls' && (
          <ScrollView style={styles.tabScroll}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Compliance Controls ({controls.length})</Text>
              <TouchableOpacity onPress={refresh} style={styles.refreshBtn}>
                <Text style={styles.refreshBtnText}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {controls.map((ctrl) => (
              <View key={ctrl.id} style={styles.controlCard}>
                <View style={styles.controlRow}>
                  <Text style={styles.controlCode}>{ctrl.code}</Text>
                  <View style={[styles.badge, { backgroundColor: getStatusColor(ctrl.status) }]}>
                    <Text style={styles.badgeText}>{ctrl.status}</Text>
                  </View>
                </View>
                <Text style={styles.controlName}>{ctrl.name}</Text>
                <Text style={styles.controlDesc} numberOfLines={2}>{ctrl.description}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {activeTab === 'copilot' && (
          <View style={styles.tabScroll}>
            <ScrollView style={{ flex: 1 }}>
              {messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.chatBubble,
                    m.sender === 'user' ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  <Text style={styles.chatText}>{m.content}</Text>
                  <Text style={styles.chatTime}>{formatDate(m.timestamp)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {activeTab === 'evidence' && (
          <ScrollView style={styles.tabScroll}>
            <Text style={styles.sectionTitle}>Evidence Upload</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Mobile Native Camera</Text>
              <Text style={styles.cardSubtitle}>Capture physical security audit artifacts or documents directly via mobile camera.</Text>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>📸 Snap & Upload Artifact</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {activeTab === 'profile' && (
          <ScrollView style={styles.tabScroll}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Organization Profile</Text>
              <Text style={styles.cardSubtitle}>Enterprise Multi-Tenant Tenant ID</Text>
              <Text style={{ color: colors.textLight, marginTop: 10 }}>User: compliance-admin@regintel.ai</Text>
              <Text style={{ color: colors.textMuted }}>Role: ADMIN</Text>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        {(['dashboard', 'controls', 'copilot', 'evidence', 'profile'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={styles.navItem}
          >
            <Text
              style={[
                styles.navText,
                activeTab === tab && styles.navTextActive,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  headerTitle: {
    color: colors.textLight,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.primary,
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  tabScroll: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: colors.cardDark,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  cardTitle: {
    color: colors.textMuted,
    fontSize: 14,
  },
  scoreText: {
    color: colors.success,
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshBtn: {
    backgroundColor: colors.cardDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshBtnText: {
    color: colors.primary,
    fontSize: 12,
  },
  controlCard: {
    backgroundColor: colors.cardDark,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  controlCode: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  controlName: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
  controlStatus: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  controlDesc: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  chatBubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: colors.cardDark,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  chatText: {
    color: colors.textLight,
    fontSize: 14,
  },
  chatTime: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  actionBtn: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.cardDark,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    paddingVertical: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  navTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});
