<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { getAuthState, hasRole, switchCurrentUser } from '$lib/client/auth';
	import type { User } from '$lib/types/user';

	let { children } = $props();
	let mobileMenuOpen = $state(false);
	let currentUser = $state<User | null>(null);
	let users = $state<User[]>([]);
	let switching = $state(false);

	$effect(() => {
		getAuthState().then((result) => {
			currentUser = result.data;
			users = result.users;
		});
	});

	async function switchUser(userId: string) {
		switching = true;
		try {
			currentUser = await switchCurrentUser(userId);
			window.location.assign('/');
			return;
		} finally {
			switching = false;
		}
	}

	let navigation = $derived([
		{ href: '/', label: '工作台', icon: '⌂' },
		...(!hasRole(currentUser, 'approver') ? [{ href: '/apply', label: '发起申请', icon: '+' }] : []),
		{ href: '/applications', label: hasRole(currentUser, 'approver') ? '审批管理' : '我的申请', icon: '▤' },
		...(hasRole(currentUser, 'approver') ? [{ href: '/statistics', label: '数据统计', icon: '◫' }] : [])
	]);

	function isActive(href: string) {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>通用申请管理</title>
	<meta name="description" content="企业通用申请与审批管理系统" />
</svelte:head>

<div class="min-h-screen">
	<aside
		class={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-[linear-gradient(180deg,#172b4d,#10213c)] px-[18px] py-6 text-[#dfe7f7] transition-transform duration-200 max-[800px]:-translate-x-full ${mobileMenuOpen ? 'max-[800px]:translate-x-0' : ''}`}
	>
		<div class="flex items-center gap-3 px-2 pb-7">
			<div class="grid h-10 w-10 place-items-center rounded-xl bg-[#3975f6] font-extrabold text-white">旅</div>
			<div>
				<strong class="block text-[17px] text-white">TravelFlow</strong><span class="block text-xs text-[#8fa5c7]"
					>通用申请管理</span
				>
			</div>
		</div>

		<nav aria-label="主导航">
			<p class="mb-2.5 ml-3 text-[11px] tracking-[0.12em] text-[#6f87ad]">工作空间</p>
			{#each navigation as item (item.href)}
				<a
					href={item.href}
					class={`my-1 flex min-h-[46px] items-center gap-3 rounded-[10px] px-[13px] text-sm font-semibold text-[#aebdda] transition-colors hover:bg-[#3975f6] hover:text-white ${isActive(item.href) ? 'bg-[#3975f6] text-white' : ''}`}
					onclick={() => (mobileMenuOpen = false)}
				>
					<span class="w-[22px] text-center text-[19px]" aria-hidden="true">{item.icon}</span>{item.label}
				</a>
			{/each}
		</nav>

		<div class="mt-auto border-t border-white/[0.09] px-2.5 pt-4">
			<select
				class="h-8 w-full rounded-md border border-white/[0.15] bg-white/[0.05] px-1.5 text-[11px] text-[#dfe7f7]"
				aria-label="切换演示用户"
				disabled={switching}
				value={currentUser?.id ?? ''}
				onchange={(event) => switchUser(event.currentTarget.value)}
			>
				<option value="" disabled>切换用户</option>
				{#each users as user (user.id)}<option value={user.id}
						>{user.name}（{hasRole(user, 'approver') ? '审批人' : '员工'}）</option
					>{/each}
			</select>
		</div>
	</aside>

	{#if mobileMenuOpen}
		<button
			class="fixed inset-0 z-30 block border-0 bg-[#0b152b80]"
			aria-label="关闭导航"
			onclick={() => (mobileMenuOpen = false)}
		></button>
	{/if}

	<div class="min-h-screen ml-[248px] max-[800px]:ml-0">
		<header
			class="flex h-[72px] items-center justify-between border-b border-[#e5e9f0] bg-white/[0.92] px-8 backdrop-blur-[12px] max-[800px]:px-[18px]"
		>
			<button
				class="hidden cursor-pointer border-0 bg-transparent text-[21px] text-[#63708a] max-[800px]:block"
				aria-label="打开导航"
				onclick={() => (mobileMenuOpen = true)}>☰</button
			>
			<div>
				<span class="block text-[11px] text-[#8b95a7]">企业服务中心</span><strong class="mt-0.5 block text-[15px]"
					>通用申请管理</strong
				>
			</div>
			<div class="flex items-center gap-3.5">
				<div class="text-right">
					<strong class="block text-[13px] text-[#34415a]">{currentUser?.name ?? '未登录'}</strong><span
						class="mt-0.5 block text-[11px] text-[#8b95a7]"
						>{currentUser ? `${currentUser.department} · ${currentUser.position ?? '用户'}` : '请选择演示用户'}</span
					>
				</div>
				<div
					class="grid h-[34px] w-[34px] place-items-center rounded-full bg-[#dce8ff] text-[13px] font-bold text-[#285fc8]"
				>
					{currentUser?.name?.slice(0, 1) ?? '?'}
				</div>
			</div>
		</header>
		<main class="mx-auto w-full max-w-[1180px] p-8 max-[800px]:px-[18px] max-[800px]:py-[22px]">
			{@render children()}
		</main>
	</div>
</div>
