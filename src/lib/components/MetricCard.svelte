<script lang="ts">
	let { label, value, hint }: { label: string; value: string | number; hint: string } = $props();
</script>

<div
	class="rounded-[14px] border border-[#e8edf5] bg-[linear-gradient(145deg,#fff,#f8faff)] px-5 py-[18px] shadow-[0_8px_20px_#203b6810]"
>
	<span class="block text-xs text-[#8a95a8]">{label}</span>
	<strong class="my-1 block text-[25px] text-[#34415a]">{value}</strong>
	<small class="block text-[11px] text-[#8a95a8]">{hint}</small>
</div>
