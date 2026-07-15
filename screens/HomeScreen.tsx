import { useCallback, useMemo } from "react";
import { ActivityIndicator, Dimensions, FlatList, ListRenderItem, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatBottomSheet, FeedCard, PerformanceOverlay } from "@/components";
import { Colors } from "@/constants/theme";
import { MOCK_FETCH_DELAY_MS } from "@/data";
import { useTravelBundles } from "@/hooks";
import type { TravelBundle } from "@/types";

const LIST_HORIZONTAL_PADDING = 40;
const CARD_CONTENT_HEIGHT = 160;
const CARD_MARGIN_BOTTOM = 16;
const IMAGE_ASPECT_RATIO = 1.6;

const CARD_WIDTH = Dimensions.get("window").width - LIST_HORIZONTAL_PADDING;
const COLLAPSED_CARD_HEIGHT =
	CARD_WIDTH / IMAGE_ASPECT_RATIO + CARD_CONTENT_HEIGHT + CARD_MARGIN_BOTTOM;

export default function HomeScreen() {
	const { bundles, loading, error } = useTravelBundles();

	const renderItem: ListRenderItem<TravelBundle> = useCallback(({ item }) => <FeedCard bundle={item} />, []);

	const keyExtractor = useCallback((item: TravelBundle) => item.id, []);

	const getItemLayout = useCallback(
		(_data: ArrayLike<TravelBundle> | null | undefined, index: number) => ({
			length: COLLAPSED_CARD_HEIGHT,
			offset: COLLAPSED_CARD_HEIGHT * index,
			index,
		}),
		[],
	);

	const listHeader = useMemo(
		() => (
			<View style={styles.header}>
				<Text style={styles.brand}>Crew</Text>
				<Text style={styles.subtitle}>Discover your next trip</Text>
				<Text style={styles.feedMeta}>{bundles.length} bundles · FlatList virtualized</Text>
			</View>
		),
		[bundles.length],
	);

	if (loading) {
		return (
			<SafeAreaView style={styles.container} edges={["top"]}>
				<View style={styles.centered}>
					<ActivityIndicator color={Colors.primary} size="large" />
					<Text style={styles.loadingText}>Loading mock bundles ({MOCK_FETCH_DELAY_MS}ms delay)...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (error) {
		return (
			<SafeAreaView style={styles.container} edges={["top"]}>
				<View style={styles.centered}>
					<Text style={styles.errorText}>{error}</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<FlatList
				data={bundles}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				getItemLayout={getItemLayout}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				initialNumToRender={6}
				maxToRenderPerBatch={6}
				windowSize={5}
				updateCellsBatchingPeriod={50}
				removeClippedSubviews
				ListHeaderComponent={listHeader}
			/>
			<PerformanceOverlay />
			<ChatBottomSheet />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
		padding: 24,
	},
	loadingText: {
		fontSize: 14,
		color: Colors.textSecondary,
		textAlign: "center",
	},
	errorText: {
		fontSize: 14,
		color: Colors.error,
		textAlign: "center",
	},
	listContent: {
		paddingHorizontal: 20,
		paddingBottom: 100,
	},
	header: {
		paddingTop: 8,
		paddingBottom: 16,
	},
	brand: {
		fontSize: 28,
		fontWeight: "700",
		color: Colors.text,
		letterSpacing: -0.5,
	},
	subtitle: {
		marginTop: 4,
		fontSize: 15,
		color: Colors.textSecondary,
	},
	feedMeta: {
		marginTop: 8,
		fontSize: 13,
		color: Colors.textSecondary,
	},
});
