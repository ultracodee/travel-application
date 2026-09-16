<script lang="ts">
	import { onMount } from 'svelte';
	import { type TravelApplication } from '$lib/types/application';
	import { countByStatus } from '$lib/utils/applicationStatistics';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { getAuthState, hasRole } from '$lib/client/auth';

	let applications = $state<TravelApplication[]>([]);
	let isApprover = $state(false);
	onMount(async () => {
		const auth = await getAuthState();
		isApprover = hasRole(auth.data, 'approver');
		const response = await fetch('/api/applications');
		if (response.ok) applications = (await response.json()).data;
	});
	let counts = $derived(countByStatus(applications));
	let recent = $derived(applications.slice(0, 4));
</script>

<svelte:head><title>工作台 - 差旅管理</title></svelte:head>

<div class="page-heading">
	<div>
		<h1>工作台</h1>
		<p>欢迎回来，快速了解差旅申请处理情况。</p>
	</div>
	{#if !isApprover}<a class="primary-button" href="/apply">＋ 发起差旅申请</a>{/if}
</div>

<section class="metrics">
	{#each [{ label: '全部申请', value: applications.length, tone: 'blue' }, { label: '待审批', value: counts.pending, tone: 'amber' }, { label: '已通过', value: counts.approved, tone: 'green' }, { label: '已驳回', value: counts.rejected, tone: 'red' }] as metric (metric.label)}
		<div class="panel metric">
			<span>{metric.label}</span><strong class={`tone-${metric.tone}`}>{metric.value}</strong><small
				>较上月保持稳定</small
			>
		</div>
	{/each}
</section>

<section class="panel recent-panel">
	<div class="section-title">
		<div>
			<h2>最近申请</h2>
			<p>最新提交的差旅申请记录</p>
		</div>
		<a href="/applications">查看全部 →</a>
	</div>
	{#if recent.length === 0}<div class="empty">暂无申请记录</div>{:else}
		<div class="recent-list">
			{#each recent as item (item.id)}
				<a class="recent-item" href={`/applications/${item.id}`}
					><div class="route">
						<strong>{item.from} → {item.to}</strong><span>{item.id} · {item.applicant.name}</span>
					</div>
					<div class="recent-meta">
						<span>¥ {item.estimatedCost.toFixed(2)}</span><StatusBadge status={item.status} />
					</div></a
				>
			{/each}
		</div>
	{/if}
</section>

<style>
	.metrics {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
		margin-bottom: 18px;
	}
	.metric {
		padding: 20px;
	}
	.metric span,
	.metric small {
		display: block;
		color: #8a95a8;
		font-size: 12px;
	}
	.metric strong {
		display: block;
		margin: 12px 0 6px;
		font-size: 28px;
	}
	.metric small {
		color: #a4adbb;
		font-size: 11px;
	}
	.tone-blue {
		color: #3975f6;
	}
	.tone-amber {
		color: #d49b28;
	}
	.tone-green {
		color: #2eaa70;
	}
	.tone-red {
		color: #d45c68;
	}
	.recent-panel {
		padding: 22px 24px;
	}
	.section-title {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 12px;
	}
	.section-title h2 {
		margin: 0;
		font-size: 17px;
	}
	.section-title p {
		margin: 6px 0 0;
		color: #8a95a8;
		font-size: 12px;
	}
	.section-title a {
		color: #3975f6;
		font-size: 12px;
		font-weight: 650;
	}
	.recent-list {
		display: grid;
	}
	.recent-item {
		display: flex;
		justify-content: space-between;
		gap: 18px;
		padding: 16px 4px;
		border-top: 1px solid #edf0f5;
	}
	.route strong,
	.route span {
		display: block;
	}
	.route strong {
		color: #34415a;
		font-size: 14px;
	}
	.route span {
		margin-top: 5px;
		color: #9aa4b5;
		font-size: 11px;
	}
	.recent-meta {
		display: flex;
		align-items: center;
		gap: 16px;
		color: #46536b;
		font-size: 13px;
	}
	.empty {
		padding: 40px;
		color: #8a95a8;
		text-align: center;
	}
	@media (max-width: 800px) {
		.metrics {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 520px) {
		.metrics {
			gap: 10px;
		}
		.metric {
			padding: 15px;
		}
		.recent-item {
			align-items: flex-start;
			flex-direction: column;
			gap: 9px;
		}
	}
</style>
