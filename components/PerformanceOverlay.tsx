import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

export function PerformanceOverlay() {
  const [visible, setVisible] = useState(false);
  const { metrics, reset } = usePerformanceMonitor(visible);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Pressable
        onPress={() => setVisible((current) => !current)}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Text style={styles.fabText}>PERF</Text>
      </Pressable>

      {visible ? (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.title}>Performance Overlay</Text>
            <Pressable
              onPress={reset}
              style={({ pressed }) => [styles.resetButton, pressed && styles.resetButtonPressed]}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </Pressable>
          </View>

          <MetricRow label="FPS (30f avg)" value={`${metrics.fps}`} highlight />
          <MetricRow label="Frame drops (<45)" value={`${metrics.frameDrops}`} />
          <MetricRow
            label="JS thread"
            value={metrics.jsThreadBusy ? 'BUSY' : 'idle'}
            alert={metrics.jsThreadBusy}
          />

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Session summary</Text>
          <MetricRow label="p50 frame" value={`${metrics.p50FrameTime} ms`} />
          <MetricRow label="p95 frame" value={`${metrics.p95FrameTime} ms`} />
          <MetricRow label="Worst frame" value={`${metrics.worstFrameTime} ms`} />
          <MetricRow label="Total frames" value={`${metrics.totalFrames}`} />
          <MetricRow label="Window (max 600)" value={`${metrics.windowSamples}`} />
        </View>
      ) : null}
    </View>
  );
}

function MetricRow({
  label,
  value,
  highlight = false,
  alert = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text
        style={[
          styles.metricValue,
          highlight && styles.metricHighlight,
          alert && styles.metricAlert,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    top: 12,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabPressed: {
    opacity: 0.85,
  },
  fabText: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  panel: {
    position: 'absolute',
    right: 20,
    top: 80,
    width: 220,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    gap: 6,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  resetButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  resetButtonPressed: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
    marginVertical: 4,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  metricLabel: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  metricValue: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  metricHighlight: {
    color: '#4ADE80',
    fontSize: 16,
  },
  metricAlert: {
    color: '#F87171',
  },
});
