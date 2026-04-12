<div class="flex flex-col items-center justify-center p-12">
	<div class="relative h-32 w-32">
		<!-- Oven Body -->
		<svg viewBox="0 0 100 100" class="h-full w-full fill-none">
			<!-- Outer Case -->
			<rect x="10" y="20" width="80" height="70" rx="12" class="stroke-on-surface-variant/30" stroke-width="4" />
			<!-- Glass Door -->
			<rect x="20" y="30" width="60" height="40" rx="6" class="fill-surface-container stroke-on-surface-variant/20" stroke-width="2" />
			<!-- Oven Glow (Animated) -->
			<rect x="22" y="32" width="56" height="36" rx="4" class="animate-pulse fill-primary/10" />
			
			<!-- Bread Loaf (Rising Animation) -->
			<g class="animate-rise">
				<path d="M35 65 Q 50 45 65 65" class="fill-primary/80 stroke-primary" stroke-width="2" />
				<!-- Scoring marks -->
				<path d="M42 55 L 48 50" class="stroke-white/30" stroke-width="1" />
				<path d="M52 53 L 58 48" class="stroke-white/30" stroke-width="1" />
			</g>

			<!-- Oven Knobs -->
			<circle cx="20" cy="80" r="3" class="fill-on-surface-variant/40" />
			<circle cx="30" cy="80" r="3" class="fill-on-surface-variant/40" />
			
			<!-- Vents/Steam -->
			<g class="animate-steam opacity-0">
				<path d="M45 15 Q 48 10 45 5" class="stroke-primary/20" stroke-width="2" />
				<path d="M55 15 Q 58 10 55 5" class="stroke-primary/20" stroke-width="2" />
			</g>
		</svg>
	</div>
	
	<p class="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse font-sans">
		Warming the kiln...
	</p>
</div>

<style>
	@keyframes rise {
		0%, 100% { transform: translateY(6px) scaleY(0.7); }
		50% { transform: translateY(0px) scaleY(1.15); }
	}

	@keyframes steam {
		0% { transform: translateY(0); opacity: 0; }
		50% { opacity: 0.4; }
		100% { transform: translateY(-12px); opacity: 0; }
	}

	.animate-rise {
		animation: rise 3.5s ease-in-out infinite;
		transform-origin: bottom;
	}

	.animate-steam {
		animation: steam 2.5s ease-in-out infinite;
	}
</style>
