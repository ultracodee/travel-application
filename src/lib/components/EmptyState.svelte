<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		icon,
		children,
		class: className = ''
	}: {
		title?: string;
		description?: string;
		icon?: string;
		children?: Snippet;
		class?: string;
	} = $props();
</script>

<div
	class={`grid min-h-[220px] place-content-center justify-items-center gap-2 text-[13px] text-[#8a95a8] ${className}`}
>
	{#if icon}<div class="text-[30px] text-[#3975f6]">{icon}</div>{/if}
	{#if title}<strong class="text-base text-[#44516a]">{title}</strong>{/if}
	{#if description}<span>{description}</span>{/if}
	{#if !title && !description && children}{@render children()}{/if}
</div>
