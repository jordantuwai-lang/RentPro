#!/bin/bash
set -e
MOBILE="$HOME/rentpro/apps/mobile"
API="$HOME/rentpro/apps/api/src"
echo "Writing mobile app files..."

echo "  -> migrate-driver-auth.sh"
cat > "$HOME/rentpro/migrate-driver-auth.sh" << 'EOF_MIGRATE-DRIVER-AUTH_SH'
#!/bin/bash
# Run from ~/rentpro/apps/api
set -e

echo "Step 1: Adding passwordHash to User schema..."
python3 << 'PYEOF'
import os
path = os.path.expanduser('~/rentpro/apps/api/prisma/schema.prisma')
with open(path, 'r') as f:
    content = f.read()

# Add passwordHash after clerkId
content = content.replace(
    '  clerkId    String     @unique\n  email      String     @unique',
    '  clerkId    String?    @unique\n  email      String     @unique\n  passwordHash String?'
)

with open(path, 'w') as f:
    f.write(content)
print("schema.prisma updated")
PYEOF

echo "Step 2: Running migration..."
cd ~/rentpro/apps/api
npx prisma migrate dev --name add_driver_password
npx prisma generate

echo "Step 3: Installing bcrypt..."
cd ~/rentpro/apps/api
npm install bcrypt
npm install --save-dev @types/bcrypt

echo ""
echo "Done. Now apply the backend auth files:"
echo "  bash ~/rentpro/apply-driver-auth.sh"

EOF_MIGRATE-DRIVER-AUTH_SH

echo "  -> driver-auth.module.ts"
cat > "$HOME/rentpro/driver-auth.module.ts" << 'EOF_DRIVER-AUTH_MODULE_TS'
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DriverAuthController } from './driver-auth.controller';
import { DriverAuthService } from './driver-auth.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.DRIVER_JWT_SECRET || 'driver-secret-change-in-prod',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [DriverAuthController],
  providers: [DriverAuthService],
  exports: [DriverAuthService, JwtModule],
})
export class DriverAuthModule {}

EOF_DRIVER-AUTH_MODULE_TS

echo "  -> driver-auth.service.ts"
cat > "$HOME/rentpro/driver-auth.service.ts" << 'EOF_DRIVER-AUTH_SERVICE_TS'
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DriverAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { branch: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!['CSE_DRIVER', 'RECOVERY_AGENT'].includes(user.role)) {
      throw new UnauthorizedException('This account does not have driver access');
    }

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        branch: user.branch ? { id: user.branch.id, name: user.branch.name } : null,
      },
    };
  }

  async setPassword(userId: string, password: string) {
    const hash = await bcrypt.hash(password, 12);
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash },
    });
  }

  verifyToken(token: string) {
    return this.jwt.verify(token);
  }
}

EOF_DRIVER-AUTH_SERVICE_TS

echo "  -> driver-auth.controller.ts"
cat > "$HOME/rentpro/driver-auth.controller.ts" << 'EOF_DRIVER-AUTH_CONTROLLER_TS'
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { DriverAuthService } from './driver-auth.service';

@Controller('auth')
export class DriverAuthController {
  constructor(private readonly driverAuthService: DriverAuthService) {}

  @Post('driver-login')
  async login(@Body() body: { email: string; password: string }) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }
    return this.driverAuthService.login(body.email, body.password);
  }
}

EOF_DRIVER-AUTH_CONTROLLER_TS

mkdir -p "$MOBILE/src"
echo "  -> src/api.ts"
cat > "$MOBILE/src/api.ts" << 'EOF_SRC_API_TS'
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your Mac's local IP when testing on device
// For EAS builds pointing at Railway, use your Railway URL
const DEV_URL = 'http://192.168.1.88:3001';
const PROD_URL = 'https://YOUR_RAILWAY_URL';

export const API_BASE = __DEV__ ? DEV_URL : PROD_URL;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('driver_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

EOF_SRC_API_TS

mkdir -p "$MOBILE/src"
echo "  -> src/auth.ts"
cat > "$MOBILE/src/auth.ts" << 'EOF_SRC_AUTH_TS'
import * as SecureStore from 'expo-secure-store';
import api from './api';

export interface DriverUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  branch: { id: string; name: string } | null;
}

export async function login(email: string, password: string): Promise<DriverUser> {
  const res = await api.post('/auth/driver-login', { email, password });
  await SecureStore.setItemAsync('driver_token', res.data.token);
  await SecureStore.setItemAsync('driver_user', JSON.stringify(res.data.user));
  return res.data.user;
}

export async function logout() {
  await SecureStore.deleteItemAsync('driver_token');
  await SecureStore.deleteItemAsync('driver_user');
}

export async function getStoredUser(): Promise<DriverUser | null> {
  const raw = await SecureStore.getItemAsync('driver_user');
  return raw ? JSON.parse(raw) : null;
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync('driver_token');
}

EOF_SRC_AUTH_TS

mkdir -p "$MOBILE/src/tasks"
echo "  -> src/tasks/locationTask.ts"
cat > "$MOBILE/src/tasks/locationTask.ts" << 'EOF_SRC_TASKS_LOCATIONTASK_TS'
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { API_BASE } from '../api';

export const LOCATION_TASK = 'background-location-task';

// Register the background task — must be called at top level, outside any component
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('[GPS Task] Error:', error.message);
    return;
  }

  if (!data?.locations?.length) return;

  const { latitude, longitude } = data.locations[0].coords;

  try {
    const token = await SecureStore.getItemAsync('driver_token');
    const userRaw = await SecureStore.getItemAsync('driver_user');
    if (!token || !userRaw) return;

    const user = JSON.parse(userRaw);

    await fetch(`${API_BASE}/users/${user.id}/location`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ lat: latitude, lng: longitude }),
    });
  } catch (err) {
    // Silent — we don't want background task crashes to surface to the user
    console.error('[GPS Task] Failed to send location:', err);
  }
});

export async function startLocationTracking() {
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') throw new Error('Foreground location permission denied');

  const { status: bg } = await Location.requestBackgroundPermissionsAsync();
  if (bg !== 'granted') throw new Error('Background location permission denied');

  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (isRunning) return;

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 15000,       // every 15 seconds
    distanceInterval: 0,       // regardless of distance
    foregroundService: {
      notificationTitle: 'RentPro Driver',
      notificationBody: 'Sharing your location with dispatch',
      notificationColor: '#01ae42',
    },
    pausesUpdatesAutomatically: false,
  });
}

export async function stopLocationTracking() {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
}

EOF_SRC_TASKS_LOCATIONTASK_TS

mkdir -p "$MOBILE/src/screens"
echo "  -> src/screens/LoginScreen.tsx"
cat > "$MOBILE/src/screens/LoginScreen.tsx" << 'EOF_SRC_SCREENS_LOGINSCREEN_TSX'
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { login } from '../auth';
import { startLocationTracking } from '../tasks/locationTask';

interface Props {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      await startLocationTracking();
      onLogin();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Login failed. Check your details and try again.';
      Alert.alert('Login failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>R2D</Text>
          </View>
          <Text style={styles.appName}>RentPro Driver</Text>
          <Text style={styles.subtitle}>Sign in to start your shift</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            placeholder="you@right2drive.com.au"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Contact your manager if you need help accessing your account.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 72,
    height: 72,
    backgroundColor: '#01ae42',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0a2e14',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  form: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  button: {
    backgroundColor: '#01ae42',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
});

EOF_SRC_SCREENS_LOGINSCREEN_TSX

mkdir -p "$MOBILE/src/screens"
echo "  -> src/screens/JobsScreen.tsx"
cat > "$MOBILE/src/screens/JobsScreen.tsx" << 'EOF_SRC_SCREENS_JOBSSCREEN_TSX'
import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [])
  );

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

EOF_SRC_SCREENS_JOBSSCREEN_TSX

mkdir -p "$MOBILE/src/screens"
echo "  -> src/screens/JobDetailScreen.tsx"
cat > "$MOBILE/src/screens/JobDetailScreen.tsx" << 'EOF_SRC_SCREENS_JOBDETAILSCREEN_TSX'
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

EOF_SRC_SCREENS_JOBDETAILSCREEN_TSX

echo "  -> App.tsx"
cat > "$MOBILE/App.tsx" << 'EOF_APP_TSX'
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

// Must import location task at top level before anything else
import './src/tasks/locationTask';

import { getStoredUser, DriverUser } from './src/auth';
import LoginScreen from './src/screens/LoginScreen';
import JobsScreen from './src/screens/JobsScreen';
import JobDetailScreen from './src/screens/JobDetailScreen';

type Screen = 'loading' | 'login' | 'jobs' | 'jobDetail';

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [user, setUser] = useState<DriverUser | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Check for existing session on app launch
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = await getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        setScreen('jobs');
      } else {
        setScreen('login');
      }
    };
    checkAuth();
  }, []);

  if (screen === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4' }}>
        <ActivityIndicator size="large" color="#01ae42" />
      </View>
    );
  }

  if (screen === 'login') {
    return (
      <LoginScreen
        onLogin={async () => {
          const storedUser = await getStoredUser();
          setUser(storedUser);
          setScreen('jobs');
        }}
      />
    );
  }

  if (screen === 'jobDetail' && selectedJob) {
    return (
      <JobDetailScreen
        job={selectedJob}
        onBack={() => setScreen('jobs')}
        onUpdated={() => {
          // Refresh will happen when going back via useFocusEffect
          setScreen('jobs');
        }}
      />
    );
  }

  return (
    <JobsScreen
      user={user!}
      onLogout={() => {
        setUser(null);
        setScreen('login');
      }}
      onSelectJob={(job) => {
        setSelectedJob(job);
        setScreen('jobDetail');
      }}
    />
  );
}

EOF_APP_TSX

# Wire DriverAuthModule into app.module.ts
python3 << 'PYEOF2'
import os
path = os.path.expanduser('~/rentpro/apps/api/src/app.module.ts')
with open(path, 'r') as f:
    c = f.read()
if 'DriverAuthModule' not in c:
    c = c.replace(
        "import { Module } from '@nestjs/common';",
        "import { Module } from '@nestjs/common';\nimport { DriverAuthModule } from './driver-auth/driver-auth.module';"
    )
    c = c.replace('imports: [', 'imports: [\n    DriverAuthModule,')
    with open(path, 'w') as f:
        f.write(c)
    print("app.module.ts updated")
else:
    print("DriverAuthModule already wired")
PYEOF2

echo ""
echo "Done! Next steps:"
echo "  1. bash ~/rentpro/migrate-driver-auth.sh   # run from terminal"
echo "  2. Edit apps/mobile/src/api.ts — replace YOUR_LOCAL_IP"
echo "  3. cd ~/rentpro/apps/mobile && npm install expo-location expo-secure-store expo-task-manager axios"
echo "  4. eas build --platform all --profile development"