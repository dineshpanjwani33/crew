import { memo, useCallback, useMemo, useState } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import type { DayHighlight, TravelBundle, TripType } from '@/types';

const DETAILS_ANIMATION_MS = 250;
const IMAGE_ASPECT_RATIO = 1.6;
const DETAILS_TIMING = {
  duration: DETAILS_ANIMATION_MS,
  easing: Easing.inOut(Easing.cubic),
};

const BADGE_STYLES: Record<TripType, { backgroundColor: string }> = {
  'Flight + Stay': { backgroundColor: Colors.primaryLight },
  Villa: { backgroundColor: '#FEF3C7' },
  Experience: { backgroundColor: '#ECFDF5' },
  Hotel: { backgroundColor: '#F3E8FF' },
};

interface FeedCardProps {
  bundle: TravelBundle;
}

const HighlightItem = memo(function HighlightItem({ highlight }: { highlight: DayHighlight }) {
  return (
    <View style={styles.highlightCard}>
      <Text style={styles.highlightDay}>Day {highlight.day}</Text>
      <Text style={styles.highlightIcon}>{highlight.icon}</Text>
      <Text style={styles.highlightTitle}>{highlight.title}</Text>
    </View>
  );
});

export const FeedCard = memo(function FeedCard({ bundle }: FeedCardProps) {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const animatedHeight = useSharedValue(0);
  const measuredHeight = useSharedValue(0);
  const isClosing = useSharedValue(false);

  const detailsStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    overflow: 'hidden',
  }));

  const hideDetails = useCallback(() => {
    setDetailsVisible(false);
  }, []);

  const animateTo = useCallback(
    (target: number, onFinished?: () => void) => {
      cancelAnimation(animatedHeight);
      animatedHeight.value = withTiming(target, DETAILS_TIMING, (finished) => {
        'worklet';
        if (finished && onFinished) {
          runOnJS(onFinished)();
        }
      });
    },
    [animatedHeight],
  );

  const closeDetails = useCallback(() => {
    isClosing.value = true;
    animateTo(0, () => {
      isClosing.value = false;
      hideDetails();
    });
  }, [animateTo, hideDetails, isClosing]);

  const openDetails = useCallback(() => {
    setDetailsVisible(true);

    if (measuredHeight.value > 0) {
      animateTo(measuredHeight.value);
    }
  }, [animateTo, measuredHeight]);

  const onDetailsLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (isClosing.value || measuredHeight.value > 0) {
        return;
      }

      const height = event.nativeEvent.layout.height;

      if (height > 0) {
        measuredHeight.value = height;
        animateTo(height);
      }
    },
    [animateTo, isClosing, measuredHeight],
  );

  const toggleDetails = useCallback(() => {
    if (detailsVisible) {
      closeDetails();
      return;
    }

    openDetails();
  }, [closeDetails, detailsVisible, openDetails]);

  const badgeStyle = useMemo(() => [styles.badge, BADGE_STYLES[bundle.tripType]], [bundle.tripType]);

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: bundle.imageUrl }}
        style={styles.image}
        contentFit="cover"
        recyclingKey={bundle.id}
        cachePolicy="memory-disk"
        transition={0}
      />

      <View style={styles.content}>
        <View style={badgeStyle}>
          <Text style={styles.badgeText}>{bundle.tripType}</Text>
        </View>

        <Text style={styles.destination}>{bundle.destination}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.price}>${bundle.price}</Text>
          <Text style={styles.meta}>{bundle.duration}</Text>
          <Text style={styles.rating}>★ {bundle.rating}</Text>
        </View>

        <Pressable
          onPress={toggleDetails}
          style={({ pressed }) => [styles.detailsButton, pressed && styles.detailsButtonPressed]}
        >
          <Text style={styles.detailsButtonText}>
            {detailsVisible ? 'Hide Details' : 'Details'}
          </Text>
        </Pressable>

        <Animated.View style={detailsStyle}>
          {detailsVisible ? (
            <View style={styles.detailsContent} onLayout={onDetailsLayout}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.highlightsRow}
              >
                {bundle.highlights.map((highlight) => (
                  <HighlightItem key={`${bundle.id}-day-${highlight.day}`} highlight={highlight} />
                ))}
              </ScrollView>
            </View>
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    aspectRatio: IMAGE_ASPECT_RATIO,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  destination: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  meta: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  detailsButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  detailsButtonPressed: {
    opacity: 0.7,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  detailsContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  highlightsRow: {
    gap: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  highlightCard: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.primaryLight,
    gap: 6,
  },
  highlightDay: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  highlightIcon: {
    fontSize: 22,
  },
  highlightTitle: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
  },
});
