import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useEffect } from 'react';
import api from '../api';
import { logout } from '../auth';
import { stopLocationTracking } from '../tasks/locationTask';
import { DriverUser } from '../auth';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: '#f59e0b',
  DISPATCHED: '#3b82f6',
  EN_ROUTE: '#8b5cf6',
  DELIVERED: '#01ae42',
  FAILED: '#ef4444',
};

const JOB_TYPE_LABELS: Record<string, string> = {
  DELIVERY: '🚐 Delivery',
  RETURN: '↩️ Return',
  EXCHANGE: '🔄 Exchange',
  IN_PROGRESS: '⏳ In Progress',
  DOCU_RESIGN: '📝 Doc Re-sign',
};

interface Props {
  user: DriverUser;
  onLogout: () => void;
  onSelectJob: (job: any) => void;
}

export default function JobsScreen({ user, onLogout, onSelectJob }: Props) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/logistics/today');
      // Filter to only this driver's jobs
      const myJobs = res.data.filter((j: any) => j.driverId === user.id);
      // Sort by scheduled time
      myJobs.sort((a: any, b: any) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
      setJobs(myJobs);
    } catch {
      Alert.alert('Error', 'Could not load your jobs. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await stopLocationTracking();
          await logout();
          onLogout();
        },
      },
    ]);
  };

  const renderJob = ({ item }: { item: any }) => {
    const time = new Date(item.scheduledAt).toLocaleTimeString('en-AU', {
      hour: '2-digit', minute: '2-digit',
    });
    const statusColor = STATUS_COLORS[item.status] || '#94a3b8';
    const isDone = item.status === 'DELIVERED' || item.status === 'FAILED';

    return (
      <TouchableOpacity
        style={[styles.jobCard, isDone && styles.jobCardDone]}
        onPress={() => onSelectJob(item)}
        activeOpacity={0.75}
      >
        <View style={styles.jobHeader}>
          <Text style={styles.jobTime}>{time}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.jobType}>{JOB_TYPE_LABELS[item.jobType] || item.jobType}</Text>

        <Text style={styles.customerName}>
          {item.reservation?.customer?.firstName} {item.reservation?.customer?.lastName}
        </Text>

        <Text style={styles.address}>
          {item.address}, {item.suburb}
        </Text>

        {item.reservation?.vehicle && (
          <Text style={styles.vehicle}>
            {item.reservation.vehicle.make} {item.reservation.vehicle.model} · {item.reservation.vehicle.registration}
          </Text>
        )}

        <View style={styles.arrow}>
          <Text style={styles.arrowText}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey, {user.firstName} 👋</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Location indicator */}
      <View style={styles.locationBar}>
        <View style={styles.locationDot} />
        <Text style={styles.locationText}>Location sharing active</Text>
      </View>

      {/* Jobs list */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#01ae42" />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJob}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchJobs(true)}
              tintColor="#01ae42"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No jobs scheduled for today</Text>
              <Text style={styles.emptySubtext}>Pull down to refresh</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#0a2e14',
    padding: 24,
    paddingTop: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#fff' },
  date: { fontSize: 13, color: '#86efac', marginTop: 2 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  locationDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#01ae42',
  },
  locationText: { fontSize: 13, color: '#16a34a', fontWeight: '500' },
  list: { padding: 16, gap: 12 },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  jobCardDone: { opacity: 0.6 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  jobTime: { fontSize: 15, fontWeight: '700', color: '#0a2e14' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  jobType: { fontSize: 13, color: '#64748b', marginBottom: 6 },
  customerName: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  address: { fontSize: 14, color: '#475569', marginBottom: 4 },
  vehicle: { fontSize: 13, color: '#94a3b8' },
  arrow: { position: 'absolute', right: 18, top: '50%' },
  arrowText: { fontSize: 24, color: '#cbd5e1' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#94a3b8' },
});

