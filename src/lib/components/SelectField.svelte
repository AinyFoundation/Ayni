<script lang="ts">
  /**
   * A dropdown that behaves like a form field.
   *
   * Why not a styled `<select>`: the parts that matter visually — the option
   * list, its typeface, the selected mark — are drawn by the operating system
   * and cannot be reached by CSS, so a native control can be made to match
   * the site's fields only until it is opened. This draws the whole thing.
   *
   * What is given up, honestly: the OS picker on phones, which is genuinely
   * good. In exchange the list is styled once and used everywhere, and the
   * options get 44px touch targets (see `.dropdown-option` under
   * `pointer: coarse`). The trigger inherits `.input`'s metrics exactly, so
   * it lines up with the text fields beside it rather than approximating them.
   *
   * It still submits like a field: a hidden input carries `name`/`value`, so
   * `new FormData(form)` sees exactly what a `<select>` would have given.
   *
   * Keyboard, per the ARIA listbox pattern: Enter/Space/Down/Up open, arrows
   * and Home/End move, Enter/Space commit, Escape closes and returns focus,
   * Tab closes. Printable keys jump to the next option starting with that
   * letter, which is the behaviour people carry over from native selects.
   */
  import { tick } from 'svelte';

  type Props = {
    /** Submitted field name. */
    name: string;
    /** Ties the trigger to its `<label for>`. */
    id: string;
    options: readonly string[];
    value?: string;
    /** Accessible name for the list itself. */
    listLabel: string;
  };

  let { name, id, options, value = $bindable(options[0] ?? ''), listLabel }: Props = $props();

  let open = $state(false);
  /** Which option the keyboard is on. Separate from `value`: moving through
   *  the list must not commit until the reader says so. */
  let activeIndex = $state(0);
  let root = $state<HTMLDivElement>();
  let triggerEl = $state<HTMLButtonElement>();
  let panelEl = $state<HTMLUListElement>();

  /** Typeahead buffer, cleared after a pause like a native select's. */
  let typed = '';
  let typedTimer: ReturnType<typeof setTimeout>;

  const optionId = (i: number) => `${id}-option-${i}`;

  async function openPanel(startAt = options.indexOf(value)) {
    activeIndex = startAt < 0 ? 0 : startAt;
    open = true;
    await tick();
    panelEl?.focus();
  }

  function closePanel(returnFocus = true) {
    open = false;
    if (returnFocus) triggerEl?.focus();
  }

  function commit(index: number) {
    value = options[index];
    closePanel();
  }

  function onTriggerKey(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPanel();
    }
  }

  function onPanelKey(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        activeIndex = (activeIndex + 1) % options.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        activeIndex = (activeIndex - 1 + options.length) % options.length;
        break;
      case 'Home':
        event.preventDefault();
        activeIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        activeIndex = options.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commit(activeIndex);
        break;
      case 'Escape':
        event.preventDefault();
        closePanel();
        break;
      case 'Tab':
        // Let focus leave naturally, but do not leave a list hanging open.
        closePanel(false);
        break;
      default:
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          typed += event.key.toLowerCase();
          clearTimeout(typedTimer);
          typedTimer = setTimeout(() => (typed = ''), 500);
          const hit = options.findIndex((o) => o.toLowerCase().startsWith(typed));
          if (hit >= 0) activeIndex = hit;
        }
    }
  }

  /** Close when the reader's attention goes elsewhere. */
  $effect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (root && !root.contains(event.target as Node)) closePanel(false);
    };
    // `focusin` covers the keyboard path that a pointer listener misses.
    const onFocusIn = (event: FocusEvent) => {
      if (root && !root.contains(event.target as Node)) closePanel(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  });
</script>

<div class="dropdown" bind:this={root}>
  <!-- The value the form actually submits. A `<select>` would have carried
       this itself; a button cannot, so it is stated explicitly. -->
  <input type="hidden" {name} {value} />

  <button
    {id}
    class="dropdown-trigger"
    type="button"
    bind:this={triggerEl}
    aria-haspopup="listbox"
    aria-expanded={open}
    onclick={() => (open ? closePanel() : openPanel())}
    onkeydown={onTriggerKey}
  >
    <span>{value}</span>
    <svg class="dropdown-caret" viewBox="0 0 10 6" fill="none" aria-hidden="true">
      <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    </svg>
  </button>

  {#if open}
    <ul
      class="dropdown-panel select-panel"
      bind:this={panelEl}
      role="listbox"
      tabindex="-1"
      aria-label={listLabel}
      aria-activedescendant={optionId(activeIndex)}
      onkeydown={onPanelKey}
    >
      {#each options as option, i (option)}
        <li>
          <!-- The option is a plain element, not a button: the LIST holds
               focus and drives selection through aria-activedescendant, which
               is what keeps one tab stop instead of one per option.

               `tabindex="-1"` is that pattern's requirement, not an oversight:
               an option must be reachable programmatically and never by Tab.

               The keyboard warning is answered on the list, not here — every
               key that selects an option is handled by `onPanelKey`, which is
               the only place that CAN handle it while focus lives on the list.
               A keyboard handler on each option would be dead code. -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            id={optionId(i)}
            class="dropdown-option"
            class:is-active={i === activeIndex}
            role="option"
            tabindex="-1"
            aria-selected={option === value}
            onclick={() => commit(i)}
            onmousemove={() => (activeIndex = i)}
          >
            <span>{option}</span>
            {#if option === value}<span class="dropdown-mark" aria-hidden="true"></span>{/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  /* Lifted out of the flow so the list covers what follows it instead of
     pushing the rest of the form down as it opens. */
  .select-panel {
    position: absolute;
    top: calc(100% + var(--spacing-s-2));
    left: 0;
    right: 0;
    z-index: 20;
  }
</style>
