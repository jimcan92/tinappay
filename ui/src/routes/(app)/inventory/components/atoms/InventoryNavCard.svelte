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
		primary: 'bg-primary/5 text-primary border-primary/10 hover:bg-primary hover:text-white',
		secondary: 'bg-secondary/5 text-secondary border-secondary/10 hover:bg-secondary hover:text-white',
		tertiary: 'bg-tertiary/5 text-tertiary border-tertiary/10 hover:bg-tertiary hover:text-white'
	};
</script>

<a
	{href}
	class="group flex flex-col justify-between overflow-hidden rounded-[2.5rem] border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20 {colorMap[
		color
	]}"
>
	<div class="mb-12 flex items-start justify-between">
		<div
			class="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white shadow-sm transition-transform group-hover:scale-110"
		>
			<span class="material-symbols-outlined text-4xl">{icon}</span>
		</div>
		<span class="material-symbols-outlined opacity-0 transition-all group-hover:translate-x-2 group-hover:opacity-100"
			>arrow_forward_ios</span
		>
	</div>
	<div>
		<h3 class="mb-2 font-serif text-3xl font-black tracking-tight">{title}</h3>
		<p class="text-sm font-medium opacity-60 line-clamp-2">{description}</p>
	</div>
</a>
