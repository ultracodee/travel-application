<script lang="ts">
	import type { Snippet } from 'svelte';
	import Panel from './Panel.svelte';
	import SectionHeading from './SectionHeading.svelte';

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
		children: Snippet;
		class?: string;
	} = $props();
</script>

<Panel class={`mb-[18px] p-6 ${className}`}>
	<SectionHeading {title} {description} {meta} />
	{@render children()}
</Panel>
