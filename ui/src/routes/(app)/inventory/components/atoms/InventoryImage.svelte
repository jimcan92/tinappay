<script lang="ts">
	import { pb } from '$lib/pocketbase';

	interface Props {
		record: any;
		imageClass?: string;
		fallbackClass?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
	}

	let { record, imageClass = '', fallbackClass = '', size = 'md' }: Props = $props();

	const sizeMap = {
		sm: 'h-10 w-10 text-xs',
		md: 'h-12 w-12 text-sm',
		lg: 'h-16 w-16 text-lg',
		xl: 'h-28 w-28 text-4xl'
	};
</script>

<div
	class="flex-shrink-0 overflow-hidden rounded-xl bg-surface-container shadow-inner {sizeMap[size]} {imageClass}"
>
	{#if record?.images?.length}
		<img
			src={pb.files.getUrl(record, record.images[0])}
			alt={record.name}
			class="h-full w-full object-cover"
		/>
	{:else}
		<div
			class="flex h-full w-full items-center justify-center font-black text-primary/30 uppercase {fallbackClass}"
		>
			{record?.name?.substring(0, 2) || '??'}
		</div>
	{/if}
</div>
