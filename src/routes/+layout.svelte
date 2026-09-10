<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children } = $props();
	let mobileMenuOpen = $state(false);

	const navigation = [
		{ href: '/', label: '工作台', icon: '⌂' },
		{ href: '/apply', label: '发起申请', icon: '+' },
		{ href: '/applications', label: '申请管理', icon: '▤' },
		{ href: '/statistics', label: '数据统计', icon: '◫' }
	];

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
			{#each navigation as item}
				<a href={item.href} class:active={isActive(item.href)} onclick={() => (mobileMenuOpen = false)}>
					<span class="nav-icon" aria-hidden="true">{item.icon}</span>{item.label}
				</a>
			{/each}
		</nav>

		<div class="sidebar-profile">
			<div class="avatar">张</div>
			<div><strong>张三</strong><span>研发部 · 前端开发</span></div>
		</div>
	</aside>

	{#if mobileMenuOpen}
		<button class="backdrop" aria-label="关闭导航" onclick={() => (mobileMenuOpen = false)}></button>
	{/if}

	<div class="main-area">
		<header class="topbar">
			<button class="menu-button" aria-label="打开导航" onclick={() => (mobileMenuOpen = true)}>☰</button>
			<div class="topbar-title"><span>企业服务中心</span><strong>差旅申请管理</strong></div>
			<div class="topbar-actions"><button class="icon-button" aria-label="通知">♢</button><div class="header-avatar">张</div></div>
		</header>
		<main class="page-container">{@render children()}</main>
	</div>
</div>
