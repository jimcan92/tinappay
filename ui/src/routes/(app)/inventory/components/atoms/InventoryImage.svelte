<script lang="ts">
	import { pb, fileUrl } from '$lib/pocketbase';

	interface Props {
		record: any;
		imageClass?: string;
		fallbackClass?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
	}

	let { record, imageClass = '', fallbackClass = '', size = 'md' }: Props = $props();

	const sizeMap = {
		sm: 'h-10 w-10 text-xs rounded-lg',
		md: 'h-12 w-12 text-sm rounded-xl',
		lg: 'h-16 w-16 text-lg rounded-2xl',
		xl: 'h-28 w-28 text-4xl rounded-[2rem]'
	};
</script>

<div
	class="flex-shrink-0 overflow-hidden bg-surface-container-high shadow-inner {sizeMap[size]} {imageClass} border border-outline-variant/5"
>
	{#if record?.images?.length}
		<img
			src={fileUrl(record, record.images[0])}
			alt={record.name}
			class="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
		/>
	{:else}
		<div
			class="flex h-full w-full items-center justify-center font-serif font-black text-primary/20 uppercase {fallbackClass}"
		>
			{record?.name?.substring(0, 2) || '??'}
		</div>
	{/if}
</div>
