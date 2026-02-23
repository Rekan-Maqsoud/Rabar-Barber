import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export const PrivacyPolicy = () => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 20, paddingBottom: 36 },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
    },
    updatedAt: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 14,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '800',
      marginTop: 14,
      marginBottom: 8,
    },
    body: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 22,
      fontWeight: '500',
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.updatedAt}>Last updated: February 23, 2026</Text>

        <Text style={styles.sectionTitle}>Overview</Text>
        <Text style={styles.body}>
          Rabar Barber respects your privacy. This app is designed to help customers join and track the queue and help staff manage queue operations.
        </Text>

        <Text style={styles.sectionTitle}>Information We Collect</Text>
        <Text style={styles.body}>
          We may collect your display name, queue selection details, anonymous device identifier, and notification tokens used only for queue updates.
        </Text>

        <Text style={styles.sectionTitle}>How We Use Information</Text>
        <Text style={styles.body}>
          We use collected data to: (1) place you in the queue, (2) show your position and service status, (3) send optional queue-related notifications, and (4) improve reliability and performance.
        </Text>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.body}>
          If you allow notifications, your device token is stored to deliver service and queue alerts. You can disable notifications at any time in your device settings.
        </Text>

        <Text style={styles.sectionTitle}>Data Sharing</Text>
        <Text style={styles.body}>
          We do not sell your personal information. Data is only used for barber shop queue functionality and related operations.
        </Text>

        <Text style={styles.sectionTitle}>Data Retention</Text>
        <Text style={styles.body}>
          Queue records are retained only as needed for active service operations, analytics, and business records. Old entries may be removed periodically.
        </Text>

        <Text style={styles.sectionTitle}>Security</Text>
        <Text style={styles.body}>
          We use reasonable technical safeguards to protect data; however, no system can guarantee absolute security.
        </Text>

        <Text style={styles.sectionTitle}>Children’s Privacy</Text>
        <Text style={styles.body}>
          This service is not specifically directed to children under 13, and we do not knowingly collect personal data from children.
        </Text>

        <Text style={styles.sectionTitle}>Your Choices</Text>
        <Text style={styles.body}>
          You can request removal from the queue, avoid entering optional information, and disable app notifications in your device settings.
        </Text>

        <Text style={styles.sectionTitle}>Policy Changes</Text>
        <Text style={styles.body}>
          We may update this Privacy Policy from time to time. Updates take effect when posted in this screen.
        </Text>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.body}>
          For privacy questions, contact the shop administration directly through official shop communication channels.
        </Text>
      </View>
    </ScrollView>
  );
};
