<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		meta,
		children,
		class: className = ''
	}: {
		title: string;
		description?: string;
		meta?: string;
		children?: Snippet;
		class?: string;
	} = $props();
</script>

<div class={`flex items-start justify-between gap-4 ${className}`}>
	<div>
		<h2 class="m-0 text-[17px]">{title}</h2>
		{#if description}<p class="mt-[7px] mb-0 text-xs text-[#9aa4b5]">{description}</p>{/if}
	</div>
	{#if children}
		{@render children()}
	{:else if meta}
		<span class="text-[11px] whitespace-nowrap text-[#9aa4b5]">{meta}</span>
	{/if}
</div>
