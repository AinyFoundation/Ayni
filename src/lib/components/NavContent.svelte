<script lang="ts">
  const navLinks = [
    { href: '/wings', label: 'Wings' },
    { href: '/about', label: 'About' },
    { href: '/community', label: 'Community' },
    { href: '/sanctuary', label: 'Sanctuary' },
  ];
</script>

<a href="/" class="logo-link">
  <slot name="logo" />
</a>

<nav class="site-nav" aria-label="Main navigation">
  {#each navLinks as link}
    <a href={link.href} class="nav-link">{link.label}</a>
  {/each}
</nav>

<style>
  .logo-link {
    position: absolute;
    top: 4px;
    left: var(--spacing-s-4);
    display: inline-flex;
    align-items: center;
    text-decoration: none;
    flex-shrink: 0;
  }

  .site-nav {
    display: flex;
    align-items: center;
    gap: var(--spacing-s-4);
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .nav-link {
    font-family: var(--font-text);
    font-size: var(--text-sm);
    font-weight: var(--weight-med);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    text-decoration: none;
    padding: var(--spacing-s-1) 0;
    position: relative;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  }

  .nav-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 1px;
    background: var(--color-gold);
    transition: width var(--duration-normal) var(--ease);
  }

  .nav-link:hover::after {
    width: 100%;
  }

  @media (max-width: 768px) {
    .site-nav {
      gap: var(--spacing-s-3);
    }
    .nav-link {
      font-size: var(--text-xs);
    }
  }
</style>
