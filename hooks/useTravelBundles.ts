import { useEffect, useState } from "react";

import { getTravelBundles } from "@/data";
import type { TravelBundle } from "@/types";

interface UseTravelBundlesResult {
	bundles: TravelBundle[];
	loading: boolean;
	error: string | null;
}

export function useTravelBundles(): UseTravelBundlesResult {
	const [bundles, setBundles] = useState<TravelBundle[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;

		async function loadBundles() {
			try {
				const data = await getTravelBundles();

				if (isMounted) {
					setBundles(data);
					setError(null);
				}
			} catch {
				if (isMounted) {
					setError("Failed to load travel bundles.");
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		}

		loadBundles();

		return () => {
			isMounted = false;
		};
	}, []);

	return { bundles, loading, error };
}
