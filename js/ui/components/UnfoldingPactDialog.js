// Unfolding Pact Dialog – multi‑beat habit creation wizard
import * as S from '../../core/storage.js';
import { getStackingAnchors } from '../../domain/scorecard.js';

export class UnfoldingPactDialog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.step = 1;
    this.data = {
      identity: '',
      vote: '',
      category: '',
      stackedAfter: null,
      intention: null,
    };
  }

  setPrefill({ identity = '', vote = '' } = {}) {
    if (identity) this.data.identity = identity;
    if (vote) this.data.vote = vote;
    if (this.isConnected) this.render();
  }

  connectedCallback() { this.render(); }

  render() {
    const anchors = getStackingAnchors(S.load());

    const html = `
      <style>
        :host {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(2px);
          z-index: 9999;
          padding: 1rem;
          box-sizing: border-box;
        }
        .dialog {
          position: relative;
          padding: 1.5rem;
          background: var(--bg-card, #FAF8F5);
          color: var(--text-primary, #1F2937);
          border: 1px solid var(--border, #E5E7EB);
          border-radius: 12px;
          max-width: 460px;
          width: 100%;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.2);
          font-family: var(--font-ui, sans-serif);
          box-sizing: border-box;
        }
        h2 { font-family:var(--font-voice, Georgia, serif); font-size:1.25rem; margin-top:0; color:var(--text-primary, #1F2937); }
        .chips { display:flex; flex-wrap:wrap; gap:0.4rem; margin:0.5rem 0; }
        .chip { padding:0.4rem 0.8rem; border:1px solid var(--border, #888); border-radius:6px; cursor:pointer; background:var(--bg-page, #FAF8F5); color:var(--text-primary, #1F2937); }
        .chip.selected { background:var(--accent-future, #e0a94f); color:#fff; border-color:var(--accent-future, #e0a94f); }
        input, select, textarea { width:100%; box-sizing:border-box; padding:0.6rem; margin-top:0.4rem; border:1px solid var(--border, #ccc); border-radius:6px; font-size:15px; background:var(--bg-page, #fff); color:var(--text-primary, #1F2937); }
        .actions { margin-top:1.25rem; display:flex; justify-content:flex-end; gap:0.5rem; }
        button { padding:0.5rem 1rem; border-radius:6px; border:1px solid var(--border, #ccc); cursor:pointer; background:var(--bg-card, #fff); color:var(--text-primary, #1F2937); }
        button.primary { background:var(--action-bg, #1F2937); color:var(--action-fg, #fff); border-color:var(--action-bg, #1F2937); }
      </style>
      <div class="dialog">
        ${this.step === 1 ? `
          <h2>Who are you becoming?</h2>
          <input id="identity" value="${this.data.identity || ''}" placeholder="e.g. A reader, An energetic person" autofocus />
        ` : ''}

        ${this.step === 2 ? `
          <h2>What is one small daily vote for that person?</h2>
          <input id="vote" value="${this.data.vote || ''}" placeholder="e.g. Read 1 page, Morning workout" autofocus />
        ` : ''}

        ${this.step === 3 ? `
          <h2>Select a category</h2>
          <div class="chips">
            ${['Health', 'Learning', 'Creativity', 'Mindfulness', 'Connection']
          .map(c => `<button type="button" class="chip${this.data.category === c ? ' selected' : ''}" data-cat="${c}">${c}</button>`).join('')}
          </div>
        ` : ''}

        ${this.step === 4 ? `
          <h2>Optional: Stack after an anchor routine</h2>
          <select id="stackedAfter">
            <option value="">— none —</option>
            ${anchors.map(a => `<option value="${a.id}" ${this.data.stackedAfter === a.id ? 'selected' : ''}>${a.name} (${a.type})</option>`).join('')}
          </select>
        ` : ''}

        ${this.step === 5 ? `
          <h2>Life gets busy. Set a 2‑minute safety net?</h2>
          <textarea id="intention" placeholder="e.g. I will read 1 page on the couch before bed">${this.data.intention || ''}</textarea>
        ` : ''}

        <div class="actions">
          <button type="button" id="cancel">Cancel</button>
          ${this.step > 1 ? `<button type="button" id="back">Back</button>` : ''}
          ${this.step < 5 ? `<button type="button" id="next" class="primary">Next</button>` : `<button type="button" id="create" class="primary">I’m ready — create habit</button>`}
        </div>
      </div>`;

    this.shadowRoot.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    this.shadowRoot.querySelectorAll('#next,#back,#create,#cancel')
      .forEach(b => b.addEventListener('click', e => this.handle(e)));

    this.shadowRoot.querySelector('.dialog')?.addEventListener('click', e => e.stopPropagation());
    this.addEventListener('click', () => this.remove());

    const activeInput = this.shadowRoot.querySelector('input');
    if (activeInput) {
      activeInput.focus();
      activeInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handle({ target: { id: this.step === 5 ? 'create' : 'next' } });
        }
      });
    }

    if (this.step === 3) {
      this.shadowRoot.querySelectorAll('.chip')
        .forEach(chip => chip.addEventListener('click', e => {
          this.data.category = e.target.dataset.cat;
          this.shadowRoot.querySelectorAll('.chip')
            .forEach(c => c.classList.toggle('selected', c === e.target));
        }));
    }
  }

  handle(e) {
    const btnId = e.target?.id;
    if (btnId === 'cancel') {
      this.remove();
      return;
    }
    if (btnId === 'back') {
      this.step--;
    } else if (btnId === 'next') {
      if (this.step === 1) {
        const val = this.shadowRoot.getElementById('identity').value.trim();
        if (!val) return;
        this.data.identity = val;
      } else if (this.step === 2) {
        const val = this.shadowRoot.getElementById('vote').value.trim();
        if (!val) return;
        this.data.vote = val;
      } else if (this.step === 3) {
        if (!this.data.category) this.data.category = 'Health';
      } else if (this.step === 4) {
        this.data.stackedAfter = this.shadowRoot.getElementById('stackedAfter').value || null;
      }
      this.step++;
    } else if (btnId === 'create') {
      const intentionVal = this.shadowRoot.getElementById('intention')?.value?.trim() || null;
      this.data.intention = intentionVal;
      this.data.twoMinuteVersion = intentionVal;
      this.data.name = this.data.vote;
      this.dispatchEvent(new CustomEvent('habitCreated', { detail: this.data, bubbles: true, composed: true }));
      this.remove();
      return;
    }
    this.render();
  }
}

customElements.define('unfolding-pact-dialog', UnfoldingPactDialog);
