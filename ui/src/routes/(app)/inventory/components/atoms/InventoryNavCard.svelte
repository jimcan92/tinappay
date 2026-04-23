<script lang="ts">
	interface Props {
		title: string;
		description: string;
		icon: string;
		href: string;
		color?: 'primary' | 'secondary' | 'tertiary';
	}

	let { title, description, icon, href, color = 'primary' }: Props = $props();

	const colorMap = {
		primary: 'bg-primary/5 text-primary border-primary/10 hover:bg-primary hover:text-on-primary',
		secondary: 'bg-secondary-container text-on-secondary-container border-secondary-container hover:shadow-secondary-container/20',
		tertiary: 'bg-tertiary-container text-on-tertiary-container border-tertiary-container hover:shadow-tertiary-container/20'
	};
</script>

<a
	{href}
	class="group flex flex-col justify-between overflow-hidden rounded-[2.5rem] border p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl {colorMap[
		color
	]}"
>
	<div class="mb-12 flex items-start justify-between">
		<div
			class="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white shadow-sm transition-all duration-700 group-hover:scale-110 group-hover:rotate-6"
		>
			<span class="material-symbols-outlined text-3xl font-black">{icon}</span>
		</div>
		<span class="material-symbols-outlined opacity-0 transition-all duration-500 group-hover:translate-x-2 group-hover:opacity-100"
			>arrow_forward</span
		>
	</div>
	<div>
		<h3 class="mb-3 font-serif text-3xl font-black tracking-tight leading-tight">{title}</h3>
		<p class="text-sm font-medium opacity-80 leading-relaxed line-clamp-2">{description}</p>
	</div>
</a>
