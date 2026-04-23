<script lang="ts">
	import 'leaflet/dist/leaflet.css';
	import { onMount, onDestroy } from 'svelte';

	interface BranchPin {
		id: string;
		name: string;
		lat: number;
		lng: number;
		location?: string;
	}

	interface Props {
		branches?: BranchPin[];
		pickMode?: boolean;
		pickedLat?: number | null;
		pickedLng?: number | null;
		onPick?: (lat: number, lng: number) => void;
	}

	let {
		branches = [],
		pickMode = false,
		pickedLat = null,
		pickedLng = null,
		onPick
	}: Props = $props();

	let mapEl: HTMLElement;
	let map: any = null;

	const CEBU: [number, number] = [10.3157, 123.8854];

	onMount(async () => {
		const L = (await import('leaflet')).default;

		const pin = (color = '#6750A4') =>
			L.divIcon({
				html: `<div style="width:22px;height:22px;background:${color};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 10px rgba(0,0,0,0.3)"></div>`,
				iconSize: [22, 22],
				iconAnchor: [11, 22],
				popupAnchor: [0, -26],
				className: ''
			});

		const mappable = branches.filter((b) => b.lat && b.lng);

		let center: [number, number] = CEBU;
		if (pickedLat && pickedLng) center = [pickedLat, pickedLng];
		else if (mappable.length === 1) center = [mappable[0].lat, mappable[0].lng];

		map = L.map(mapEl).setView(center, 14);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
			maxZoom: 19
		}).addTo(map);

		const markers: any[] = [];
		for (const b of mappable) {
			const m = L.marker([b.lat, b.lng], { icon: pin() })
				.addTo(map)
				.bindPopup(
					`<div style="font-family:sans-serif;min-width:130px;padding:2px 0">` +
						`<strong style="font-size:13px">${b.name}</strong>` +
						(b.location
							? `<br><span style="font-size:11px;color:#888">${b.location}</span>`
							: '') +
						(!pickMode
							? `<br><a href="/management/branches/${b.id}" style="display:inline-block;margin-top:6px;font-size:11px;color:#6750A4;font-weight:700;text-decoration:none">View branch →</a>`
							: '') +
						`</div>`
				);
			markers.push(m);
		}

		if (mappable.length > 1) {
			map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2));
		}

		if (pickMode) {
			let pickMarker: any = null;

			const place = (lat: number, lng: number) => {
				if (pickMarker) {
					pickMarker.setLatLng([lat, lng]);
				} else {
					pickMarker = L.marker([lat, lng], { icon: pin(), draggable: true }).addTo(map);
					pickMarker.on('dragend', () => {
						const p = pickMarker.getLatLng();
						onPick?.(p.lat, p.lng);
					});
				}
				onPick?.(lat, lng);
			};

			if (pickedLat && pickedLng) place(pickedLat, pickedLng);

			map.on('click', (e: any) => place(e.latlng.lat, e.latlng.lng));
		}
	});

	onDestroy(() => map?.remove());
</script>

<div bind:this={mapEl} class="h-full w-full" style="isolation: isolate;"></div>
