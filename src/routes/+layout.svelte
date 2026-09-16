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
	<title>差旅申请管理</title>
	<meta name="description" content="企业差旅申请与审批管理系统" />
</svelte:head>

<div class="app-shell">
	<aside class:open={mobileMenuOpen} class="sidebar">
		<div class="brand">
			<div class="brand-mark">旅</div>
			<div><strong>TravelFlow</strong><span>差旅申请管理</span></div>
		</div>

		<nav aria-label="主导航">
			<p class="nav-heading">工作空间</p>
			{#each navigation as item (item.href)}
				<a href={item.href} class:active={isActive(item.href)} onclick={() => (mobileMenuOpen = false)}>
					<span class="nav-icon" aria-hidden="true">{item.icon}</span>{item.label}
				</a>
			{/each}
		</nav>

		<div class="sidebar-switcher">
			<select
				class="user-switcher"
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
		<button class="backdrop" aria-label="关闭导航" onclick={() => (mobileMenuOpen = false)}></button>
	{/if}

	<div class="main-area">
		<header class="topbar">
			<button class="menu-button" aria-label="打开导航" onclick={() => (mobileMenuOpen = true)}>☰</button>
			<div class="topbar-title"><span>企业服务中心</span><strong>差旅申请管理</strong></div>
			<div class="topbar-actions">
				<div class="header-user">
					<strong>{currentUser?.name ?? '未登录'}</strong><span
						>{currentUser ? `${currentUser.department} · ${currentUser.position ?? '用户'}` : '请选择演示用户'}</span
					>
				</div>
				<div class="header-avatar">{currentUser?.name?.slice(0, 1) ?? '?'}</div>
			</div>
		</header>
		<main class="page-container">{@render children()}</main>
	</div>
</div>
