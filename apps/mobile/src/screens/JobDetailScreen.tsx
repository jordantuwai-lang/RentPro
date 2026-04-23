import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import api from '../api';

const STATUS_FLOW: Record<string, { label: string; next: string; color: string }[]> = {
  SCHEDULED: [
    { label: 'Mark Dispatched', next: 'DISPATCHED', color: '#3b82f6' },
  ],
  DISPATCHED: [
    { label: 'Mark En Route', next: 'EN_ROUTE', color: '#8b5cf6' },
  ],
  EN_ROUTE: [
    { label: '✅ Mark Delivered', next: 'DELIVERED', color: '#01ae42' },
    { label: '❌ Mark Failed', next: 'FAILED', color: '#ef4444' },
  ],
  DELIVERED: [],
  FAILED: [],
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: '#f59e0b',
  DISPATCHED: '#3b82f6',
  EN_ROUTE: '#8b5cf6',
  DELIVERED: '#01ae42',
  FAILED: '#ef4444',
};

interface Props {
  job: any;
  onBack: () => void;
  onUpdated: () => void;
}

export default function JobDetailScreen({ job: initialJob, onBack, onUpdated }: Props) {
  const [job, setJob] = useState(initialJob);
  const [updating, setUpdating] = useState(false);

  const r = job.reservation;
  const customer = r?.customer;
  const vehicle = r?.vehicle;

  const updateStatus = async (nextStatus: string) => {
    const confirmMessages: Record<string, string> = {
      DELIVERED: 'Confirm this job is delivered?',
      FAILED: 'Mark this delivery as failed?',
    };
    const msg = confirmMessages[nextStatus];
    if (msg) {
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert('Confirm', msg, [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Confirm', onPress: () => resolve(true) },
        ]);
      });
      if (!confirmed) return;
    }

    setUpdating(true);
    try {
      await api.patch(`/logistics/${job.id}/status`, { status: nextStatus });
      setJob({ ...job, status: nextStatus });
      onUpdated();
    } catch {
      Alert.alert('Error', 'Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const statusColor = STATUS_COLORS[job.status] || '#94a3b8';
  const actions = STATUS_FLOW[job.status] || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusColor + '15', borderColor: statusColor + '40' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusLabel, { color: statusColor }]}>{job.status}</Text>
          <Text style={styles.statusTime}>
            Scheduled {new Date(job.scheduledAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Customer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <Text style={styles.bigName}>{customer?.firstName} {customer?.lastName}</Text>
          {customer?.phone && (
            <Text style={styles.detail}>📞 {customer.phone}</Text>
          )}
        </View>

        {/* Delivery address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.bigName}>{job.address}</Text>
          <Text style={styles.detail}>{job.suburb}</Text>
        </View>

        {/* Vehicle */}
        {vehicle && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle</Text>
            <Text style={styles.bigName}>{vehicle.make} {vehicle.model}</Text>
            <Text style={styles.detail}>
              {vehicle.registration} · {vehicle.colour} · {vehicle.category}
            </Text>
          </View>
        )}

        {/* Reservation */}
        {r && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reservation</Text>
            <Text style={styles.detail}>File: {r.fileNumber || '—'}</Text>
            <Text style={styles.detail}>REZ: {r.reservationNumber}</Text>
          </View>
        )}

        {/* Notes */}
        {job.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.noteText}>{job.notes}</Text>
          </View>
        )}

        {/* Action buttons */}
        {actions.length > 0 && (
          <View style={styles.actions}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.next}
                style={[styles.actionBtn, { backgroundColor: action.color }, updating && styles.actionDisabled]}
                onPress={() => updateStatus(action.next)}
                disabled={updating}
                activeOpacity={0.8}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionText}>{action.label}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {actions.length === 0 && (
          <View style={styles.doneBox}>
            <Text style={styles.doneText}>
              {job.status === 'DELIVERED' ? '✅ This job is complete' : '❌ This job was marked as failed'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#0a2e14',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  backText: { color: '#86efac', fontSize: 18, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  content: { padding: 20, gap: 4 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 15, fontWeight: '700', flex: 1 },
  statusTime: { fontSize: 13, color: '#64748b' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  bigName: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  detail: { fontSize: 14, color: '#64748b', marginBottom: 2 },
  noteText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  actions: { gap: 12, marginTop: 8 },
  actionBtn: {
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  actionDisabled: { opacity: 0.6 },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  doneBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  doneText: { fontSize: 15, color: '#16a34a', fontWeight: '600' },
});

