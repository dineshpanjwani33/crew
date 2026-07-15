import type { TravelBundle } from "@/types";

import travelBundles from "./travelBundles.json";

export const MOCK_FETCH_DELAY_MS = 800;

function delay(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
}

export async function getTravelBundles(): Promise<TravelBundle[]> {
	await delay(MOCK_FETCH_DELAY_MS);
	return travelBundles as TravelBundle[];
}

export function getTravelBundleCount(): number {
	return travelBundles.length;
}
