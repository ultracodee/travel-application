<script lang="ts">
	import { onMount } from 'svelte';
	import { type TravelApplication } from '$lib/types/application';
	import { countByStatus } from '$lib/utils/applicationStatistics';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { getAuthState, hasRole } from '$lib/client/auth';
	import { getApplicationAmount, getApplicationSummary, getApplicationTypeLabel } from '$lib/utils/applicationDisplay';

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

<svelte:head><title>工作台 - 申请管理</title></svelte:head>

<div class="page-heading">
	<div>
		<h1>工作台</h1>
		<p>欢迎回来，快速了解申请处理情况。</p>
	</div>
	{#if !isApprover}<a class="primary-button" href="/apply">＋ 发起申请</a>{/if}
</div>

<section class="mb-[18px] grid grid-cols-1 gap-4 min-[521px]:grid-cols-2 min-[801px]:grid-cols-4">
	{#each [{ label: '全部申请', value: applications.length, tone: 'text-[#3975f6]' }, { label: '待审批', value: counts.pending, tone: 'text-[#d49b28]' }, { label: '已通过', value: counts.approved, tone: 'text-[#2eaa70]' }, { label: '已驳回', value: counts.rejected, tone: 'text-[#d45c68]' }] as metric (metric.label)}
		<div class="panel !p-5">
			<span class="block text-xs text-[#8a95a8]">{metric.label}</span>
			<strong class={`my-3 block text-[28px] ${metric.tone}`}>{metric.value}</strong>
			<small class="block text-[11px] text-[#a4adbb]">较上月保持稳定</small>
		</div>
	{/each}
</section>

<section class="panel !px-6 !py-[22px]">
	<div class="mb-3 flex items-start justify-between gap-4">
		<div>
			<h2 class="m-0 text-[17px]">最近申请</h2>
			<p class="mt-1.5 mb-0 text-xs text-[#8a95a8]">最新提交的申请记录</p>
		</div>
		<a class="text-xs font-semibold text-[#3975f6]" href="/applications">查看全部 →</a>
	</div>
	{#if recent.length === 0}
		<div class="grid min-h-[160px] place-content-center text-center text-[13px] text-[#8a95a8]">暂无申请记录</div>
	{:else}
		<div class="grid">
			{#each recent as item (item.id)}
				<a
					class="flex justify-between gap-[18px] border-t border-[#edf0f5] px-1 py-4 max-[520px]:flex-col max-[520px]:items-start max-[520px]:gap-2"
					href={`/applications/${item.id}`}
				>
					<div>
						<strong class="block text-sm text-[#34415a]">{getApplicationTypeLabel(item)} · {item.title}</strong>
						<span class="mt-1 block text-[11px] text-[#9aa4b5]"
							>{item.id} · {item.applicant.name} · {getApplicationSummary(item)}</span
						>
					</div>
					<div class="flex items-center gap-4 text-[13px] text-[#46536b]">
						{#if getApplicationAmount(item) !== undefined}<span>¥ {getApplicationAmount(item)?.toFixed(2)}</span>{/if}
						<StatusBadge status={item.status} />
					</div>
				</a>
			{/each}
		</div>
	{/if}
</section>
