<script lang="ts">
	let { label, value, hint }: { label: string; value: string | number; hint: string } = $props();
</script>

<div class="metric-card">
	<span>{label}</span>
	<strong>{value}</strong>
	<small>{hint}</small>
</div>

<style>
	.metric-card { padding: 18px 20px; border: 1px solid #e8edf5; border-radius: 14px; background: linear-gradient(145deg, #fff, #f8faff); box-shadow: 0 8px 20px #203b6810; }
	.metric-card span, .metric-card small { display: block; color: #8a95a8; font-size: 12px; }
	.metric-card strong { display: block; margin: 8px 0 4px; color: #34415a; font-size: 25px; }
	.metric-card small { font-size: 11px; }
</style>
