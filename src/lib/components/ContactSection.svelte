<script lang="ts">
  /**
   * ContactSection — the form, and where we are.
   *
   * The site builds with adapter-static, so there is no server route to post
   * to. Rather than reach for a hosted form service (an external dependency in
   * the request path of a core feature, which the sovereignty rule forbids),
   * the form has two sovereign paths:
   *
   *   1. VITE_CONTACT_ENDPOINT is set  -> a real POST to the collective's own
   *      endpoint, via a plain <form> that works without JavaScript.
   *   2. It is not set (today)         -> progressive enhancement rewrites the
   *      submit into a mailto: compose, prefilled. No server involved at all.
   *
   * So the form is useful on day one and upgrades by setting one build-time
   * variable — no markup change, no rework.
   *
   * Spam handling is local by necessity and by choice: a honeypot field plus a
   * submit-time floor. Hosted CAPTCHA (reCAPTCHA, hCaptcha, Turnstile) is
   * excluded by the same rule as hosted form services.
   */
  import { onMount } from 'svelte';
  import ValleyMap from './ValleyMap.svelte';
  import SelectField from './SelectField.svelte';
  import { CONTACT_ENDPOINT, CONTACT_EMAIL, LOCATION, MAPS_URL } from '$lib/config';
  import { t, DEFAULT_LOCALE } from '$lib/i18n';

  /* $derived, not a plain const: the locale is a property of the URL and
   * becomes dynamic in Phase 3, at which point this recomputes on its own. */
  const m = $derived(t(DEFAULT_LOCALE).home.contact);

  /** Bots fill forms instantly; people do not. Anything faster than this is
   * treated as automated and silently dropped. */
  const MIN_FILL_MS = 3000;

  let mountedAt = 0;
  /** Honeypot. Hidden from sight AND from assistive tech, so no real person
   * can be tricked into filling it — only a script that reads the DOM. */
  let trap = $state('');
  let status: 'idle' | 'composing' | 'error' = $state('idle');

  onMount(() => {
    mountedAt = performance.now();
  });

  function handleSubmit(event: SubmitEvent) {
    const form = event.currentTarget as HTMLFormElement;

    if (trap.trim() !== '' || performance.now() - mountedAt < MIN_FILL_MS) {
      // Silent drop: never tell a bot which check it failed.
      event.preventDefault();
      return;
    }

    // A configured endpoint takes the native path, so the form still submits
    // with JavaScript disabled.
    if (CONTACT_ENDPOINT) return;

    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const reason = String(data.get('reason') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();

    const subject = m.mailSubject(reason, name);
    const body = `${message}\n\n—\n${name}\n${email}`;
    const href =
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    status = 'composing';
    window.location.href = href;
  }
</script>

<section class="contact" id="contact" data-nav-bg="#EADBC0" aria-labelledby="contact-heading">
  <div class="contact-inner">
    <div class="contact-form-col">
      <h2 id="contact-heading" class="heading-2 contact-title">{m.title}</h2>

      <p class="body-text contact-body">
        {m.body}
      </p>

      <form
        class="contact-form"
        method="post"
        action={CONTACT_ENDPOINT || undefined}
        onsubmit={handleSubmit}
      >
        <div class="field">
          <label class="label" for="contact-name">{m.form.name}</label>
          <input class="input" id="contact-name" name="name" type="text" required autocomplete="name" />
        </div>

        <div class="field">
          <label class="label" for="contact-email">{m.form.email}</label>
          <input
            class="input"
            id="contact-email"
            name="email"
            type="email"
            required
            autocomplete="email"
          />
        </div>

        <div class="field">
          <label class="label" for="contact-reason">{m.form.reason}</label>
          <!-- Label and submitted value are the same string on purpose; see
               the note on `contact.form.reasons` in the catalog.

               SelectField rather than a native `<select>`: an open native list
               is drawn by the operating system and cannot be styled, so it
               would break from the site the moment it is used. This one
               submits identically through a hidden input. -->
          <SelectField
            id="contact-reason"
            name="reason"
            options={m.form.reasons}
            listLabel={m.form.reason}
          />
        </div>

        <div class="field">
          <label class="label" for="contact-message">{m.form.message}</label>
          <textarea class="textarea" id="contact-message" name="message" rows="5" required
          ></textarea>
        </div>

        <!-- Honeypot. aria-hidden + tabindex -1 keep it away from keyboard and
             screen-reader users; only a script filling every input trips it. -->
        <div class="trap" aria-hidden="true">
          <label for="contact-company">{m.form.company}</label>
          <input
            id="contact-company"
            name="company"
            type="text"
            tabindex="-1"
            autocomplete="off"
            bind:value={trap}
          />
        </div>

        <div class="contact-actions">
          <button class="btn btn-primary btn-lg" type="submit">{m.form.submit}</button>
          <p class="hint contact-hint" role="status" aria-live="polite">
            {#if status === 'composing'}
              {m.hint.composing(CONTACT_EMAIL)}
            {:else if !CONTACT_ENDPOINT}
              {m.hint.mailto}
            {:else}
              {m.hint.endpoint}
            {/if}
          </p>
        </div>
      </form>
    </div>

    <div class="contact-map-col">
      <ValleyMap />

      <div class="contact-place">
        <p class="contact-place-line">
          {LOCATION.town} · {LOCATION.region} · {LOCATION.elevation}
        </p>
        <p class="small contact-place-note">
          {m.placeNote}
        </p>
        <a
          class="btn btn-secondary"
          href={MAPS_URL}
          target="_blank"
          rel="noreferrer noopener"
        >
          {m.openInMaps}
        </a>
      </div>
    </div>
  </div>
</section>

<style>
  .contact {
    position: relative;
    background: var(--surface-2);
    /* vw rather than vh: a phone is narrow but TALL, so vh padding spends the
     * most space exactly where there is least. Unchanged at 108px on
     * 1440×900, 48px instead of 101px on a phone. */
    padding: clamp(48px, 7.5vw, 120px) clamp(24px, 5vw, 80px);
    /* The footer's "Write to us" jumps here; clear the sticky 60px header. */
    scroll-margin-top: 60px;
  }

  .contact-inner {
    max-width: 1200px;
    margin-inline: auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
    gap: clamp(var(--spacing-s-7), 6vw, var(--spacing-s-8));
    align-items: start;
  }

  .contact-title {
    margin: 0 0 var(--spacing-s-4);
    font-weight: var(--weight-light);
  }

  .contact-body {
    max-width: 44ch;
    margin: 0 0 var(--spacing-s-7);
  }

  /* Inputs invert against this section's deeper paper, matching the card
   * convention elsewhere on the page. */
  .contact-form :global(.input),
  .contact-form :global(.textarea),
  .contact-form :global(.select) {
    background: var(--surface-1);
  }

  .contact-form :global(.textarea) {
    resize: vertical;
    min-height: 8rem;
  }

  /* Off-screen rather than display:none — some bots skip hidden inputs. */
  .trap {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  .contact-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-s-4);
  }

  .contact-hint {
    margin: 0;
    max-width: 36ch;
  }

  .contact-place {
    margin-top: var(--spacing-s-6);
  }

  .contact-place-line {
    font-family: var(--font-display);
    font-size: var(--text-h4);
    font-weight: var(--weight-light);
    color: var(--text);
    margin: 0 0 var(--spacing-s-2);
  }

  .contact-place-note {
    margin: 0 0 var(--spacing-s-5);
    max-width: 40ch;
  }

  @media (max-width: 900px) {
    .contact-inner {
      grid-template-columns: 1fr;
      gap: var(--spacing-s-7);
    }

    /* On a phone "where is this?" comes before "how do I write?" */
    .contact-map-col {
      order: -1;
    }
  }
</style>
