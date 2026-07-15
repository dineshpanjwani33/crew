import type { BottomSheetBackdropProps, BottomSheetFooterProps } from "@gorhom/bottom-sheet";
import BottomSheet, { BottomSheetBackdrop, BottomSheetFooter, BottomSheetScrollView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useMockAiChat } from "@/hooks/useMockAiChat";
import { useChatStore } from "@/store";
import type { ChatMessage } from "@/types";

const INPUT_ROW_HEIGHT = 44;
const INPUT_PADDING = 12;

function ChatBubble({ message }: { message: ChatMessage }) {
	const isUser = message.role === "user";

	return (
		<View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant]}>
			<View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
				<Text style={[styles.bubbleText, isUser ? styles.userBubbleText : styles.assistantBubbleText]}>
					{message.content}
					{message.status === "streaming" ? <Text style={styles.cursor}>|</Text> : null}
				</Text>
			</View>
		</View>
	);
}

function ChatSheetFooter({ animatedFooterPosition, bottomInset }: BottomSheetFooterProps & { bottomInset: number }) {
	const [input, setInput] = useState("");
	const { sendMessage } = useMockAiChat();

	const handleSend = useCallback(async () => {
		if (!input.trim()) {
			return;
		}

		const text = input;
		setInput("");
		await sendMessage(text);
	}, [input, sendMessage]);

	return (
		<BottomSheetFooter animatedFooterPosition={animatedFooterPosition} bottomInset={bottomInset}>
			<View style={styles.inputBar}>
				<View style={styles.inputRow}>
					<BottomSheetTextInput
						value={input}
						onChangeText={setInput}
						placeholder="Ask about your trip..."
						placeholderTextColor={Colors.textSecondary}
						style={styles.input}
						maxLength={500}
						onSubmitEditing={handleSend}
					/>
					<Pressable onPress={handleSend} style={({ pressed }) => [styles.sendButton, pressed && styles.sendButtonPressed]}>
						<Text style={styles.sendButtonText}>Send</Text>
					</Pressable>
				</View>
			</View>
		</BottomSheetFooter>
	);
}

export function ChatBottomSheet() {
	const { height: screenHeight } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const [isSheetVisible, setIsSheetVisible] = useState(false);

	const messages = useChatStore((state) => state.messages);
	const { isAwaitingResponse } = useMockAiChat();

	const snapPoints = useMemo(() => [Math.round(screenHeight * 0.5), Math.round(screenHeight * 0.92)], [screenHeight]);

	const renderFooter = useCallback((props: BottomSheetFooterProps) => <ChatSheetFooter {...props} bottomInset={insets.bottom} />, [insets.bottom]);

	const renderBackdrop = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" opacity={0.5} />
		),
		[],
	);

	return (
		<>
			{!isSheetVisible ? (
				<Pressable onPress={() => setIsSheetVisible(true)} style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
					<Text style={styles.fabText}>Ask Crew</Text>
				</Pressable>
			) : null}

			{isSheetVisible ? (
				<BottomSheet
					index={0}
					snapPoints={snapPoints}
					enableDynamicSizing={false}
					enablePanDownToClose
					onChange={(index) => {
						if (index === -1) {
							setIsSheetVisible(false);
							Keyboard.dismiss();
						}
					}}
					footerComponent={renderFooter}
					backdropComponent={renderBackdrop}
					android_keyboardInputMode="adjustResize"
					backgroundStyle={styles.sheetBackground}
					handleIndicatorStyle={styles.sheetHandle}
				>
					<BottomSheetScrollView
						enableFooterMarginAdjustment
						contentContainerStyle={styles.messagesContent}
						keyboardShouldPersistTaps="handled"
					>
						<View style={styles.sheetHeader}>
							<Text style={styles.sheetTitle}>Ask Crew</Text>
							<Text style={styles.sheetSubtitle}>Your AI travel assistant</Text>
						</View>

						{messages.length === 0 ? (
							<Text style={styles.emptyState}>Ask about destinations, budgets, best time to visit, or trip ideas.</Text>
						) : null}

						{messages.map((message) => (
							<ChatBubble key={message.id} message={message} />
						))}

						{isAwaitingResponse ? (
							<View style={styles.loadingRow}>
								<ActivityIndicator color={Colors.primary} size="small" />
								<Text style={styles.loadingText}>Crew is thinking...</Text>
							</View>
						) : null}
					</BottomSheetScrollView>
				</BottomSheet>
			) : null}
		</>
	);
}

const styles = StyleSheet.create({
	fab: {
		position: "absolute",
		left: 20,
		bottom: 24,
		paddingHorizontal: 18,
		height: 56,
		borderRadius: 28,
		backgroundColor: Colors.primary,
		alignItems: "center",
		justifyContent: "center",
		elevation: 6,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		zIndex: 10,
	},
	fabPressed: {
		opacity: 0.9,
	},
	fabText: {
		color: Colors.surface,
		fontSize: 14,
		fontWeight: "700",
	},
	sheetBackground: {
		backgroundColor: Colors.surface,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
	},
	sheetHandle: {
		backgroundColor: Colors.border,
		width: 40,
	},
	sheetHeader: {
		paddingBottom: 8,
	},
	sheetTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: Colors.text,
	},
	sheetSubtitle: {
		marginTop: 2,
		fontSize: 13,
		color: Colors.textSecondary,
	},
	messagesContent: {
		paddingHorizontal: 20,
		gap: 10,
		paddingBottom: 8,
	},
	emptyState: {
		fontSize: 14,
		lineHeight: 20,
		color: Colors.textSecondary,
		paddingVertical: 8,
	},
	bubbleRow: {
		flexDirection: "row",
	},
	bubbleRowUser: {
		justifyContent: "flex-end",
	},
	bubbleRowAssistant: {
		justifyContent: "flex-start",
	},
	bubble: {
		maxWidth: "85%",
		borderRadius: 14,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	userBubble: {
		backgroundColor: Colors.primary,
	},
	assistantBubble: {
		backgroundColor: Colors.primaryLight,
		borderWidth: 1,
		borderColor: Colors.border,
	},
	bubbleText: {
		fontSize: 14,
		lineHeight: 20,
	},
	userBubbleText: {
		color: Colors.surface,
	},
	assistantBubbleText: {
		color: Colors.text,
	},
	cursor: {
		color: Colors.primary,
	},
	loadingRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingVertical: 4,
	},
	loadingText: {
		fontSize: 13,
		color: Colors.textSecondary,
	},
	inputBar: {
		borderTopWidth: 1,
		borderTopColor: Colors.border,
		paddingHorizontal: 20,
		paddingVertical: INPUT_PADDING,
		backgroundColor: Colors.surface,
	},
	inputRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	input: {
		flex: 1,
		height: INPUT_ROW_HEIGHT,
		borderWidth: 1,
		borderColor: Colors.border,
		borderRadius: 12,
		paddingHorizontal: 12,
		fontSize: 15,
		color: Colors.text,
		backgroundColor: Colors.background,
	},
	sendButton: {
		height: INPUT_ROW_HEIGHT,
		paddingHorizontal: 16,
		borderRadius: 12,
		backgroundColor: Colors.primary,
		alignItems: "center",
		justifyContent: "center",
	},
	sendButtonPressed: {
		opacity: 0.85,
	},
	sendButtonText: {
		color: Colors.surface,
		fontSize: 14,
		fontWeight: "700",
	},
});
