(() => {
  'use strict';

  const setScopedCount = (root, selector, value) => {
    const counter = root.querySelector(selector);
    if (counter) counter.textContent = String(value);
  };

  const syncSiteHeaderHeight = () => {
    const header = document.querySelector('.site-header');
    document.documentElement.style.setProperty('--site-header-height', `${header ? header.offsetHeight : 0}px`);
  };
  syncSiteHeaderHeight();
  window.addEventListener('resize', syncSiteHeaderHeight);

  for (const tabList of document.querySelectorAll('[data-actor-tabs]')) {
    const buttons = Array.from(tabList.querySelectorAll('[data-actor-tab]'));
    const panels = Array.from(document.querySelectorAll('[data-actor-tab-panel]'));
    if (!buttons.length || !panels.length) continue;

    const tabForHash = () => {
      const raw = decodeURIComponent(location.hash.slice(1));
      if (!raw) return 'activity';
      if (raw.startsWith('evidence-') || raw === 'view-evidence') return 'evidence';
      if (raw.startsWith('tar_activity_') || raw === 'view-activity') return 'activity';
      if (raw === 'view-techniques') return 'techniques';
      if (raw === 'view-relationships') return 'relationships';
      const target = document.getElementById(raw);
      const panel = target?.closest('[data-actor-tab-panel]');
      return panel?.dataset.actorTabPanel || 'activity';
    };

    const activate = (name, {focus = false, preserveTarget = true} = {}) => {
      const selected = buttons.find((item) => item.dataset.actorTab === name) || buttons[0];
      for (const button of buttons) {
        const active = button === selected;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
        button.tabIndex = active ? 0 : -1;
      }
      for (const panel of panels) panel.hidden = panel.dataset.actorTabPanel !== selected.dataset.actorTab;
      if (focus) selected.focus();
      if (preserveTarget && location.hash) {
        requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({block: 'start'}));
      }
    };

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => {
        const name = button.dataset.actorTab;
        history.replaceState(null, '', `#view-${name}`);
        activate(name, {focus: true, preserveTarget: false});
      });
      button.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = buttons.length - 1;
        buttons[next].click();
      });
    });
    window.addEventListener('hashchange', () => activate(tabForHash()));
    activate(tabForHash());
  }

  for (const root of document.querySelectorAll('[data-relationship-filter-root]')) {
    const filterPanel = root.querySelector('[data-relationship-filters]');
    const items = Array.from(root.querySelectorAll('.searchable'));
    if (!filterPanel) continue;
    const search = filterPanel.querySelector('[data-filter-search]');
    const targetType = filterPanel.querySelector('[data-filter-target-type]');
    const confidence = filterPanel.querySelector('[data-filter-confidence]');
    const source = filterPanel.querySelector('[data-filter-source]');
    const reset = filterPanel.querySelector('[data-filter-reset]');

    const update = () => {
      const query = (search?.value || '').trim().toLocaleLowerCase();
      const selectedType = targetType?.value || '';
      const selectedConfidence = confidence?.value || '';
      const selectedSource = source?.value || '';
      let visible = 0;
      for (const item of items) {
        const sourceIds = (item.dataset.sourceIds || '').split(/\s+/).filter(Boolean);
        const match =
          (!query || (item.dataset.searchText || '').toLocaleLowerCase().includes(query)) &&
          (!selectedType || item.dataset.targetType === selectedType) &&
          (!selectedConfidence || item.dataset.confidence === selectedConfidence) &&
          (!selectedSource || sourceIds.includes(selectedSource));
        item.hidden = !match;
        if (match) visible += 1;
      }
      setScopedCount(filterPanel, '[data-visible-count]', visible);
    };

    for (const control of [search, targetType, confidence, source]) {
      if (!control) continue;
      control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', update);
    }
    reset?.addEventListener('click', () => {
      if (search) search.value = '';
      if (targetType) targetType.value = '';
      if (confidence) confidence.value = '';
      if (source) source.value = '';
      update();
      search?.focus();
    });
    update();
  }

  for (const root of document.querySelectorAll('[data-timeline-root]')) {
    const filterPanel = root.querySelector('[data-timeline-filters]');
    const list = root.querySelector('[data-timeline-list]');
    const items = Array.from(root.querySelectorAll('[data-timeline-item]'));
    if (!filterPanel || !list) continue;
    const search = filterPanel.querySelector('[data-timeline-search]');
    const targetType = filterPanel.querySelector('[data-timeline-target-type]');
    const confidence = filterPanel.querySelector('[data-timeline-confidence]');
    const source = filterPanel.querySelector('[data-timeline-source]');
    const order = filterPanel.querySelector('[data-timeline-order]');
    const reset = filterPanel.querySelector('[data-timeline-reset]');

    const sortItems = () => {
      const selectedOrder = order?.value || 'newest';
      const sorted = [...items].sort((left, right) => {
        const leftDate = left.dataset.eventDate || '';
        const rightDate = right.dataset.eventDate || '';
        if (!leftDate && !rightDate) {
          return (left.dataset.eventId || '').localeCompare(right.dataset.eventId || '');
        }
        if (!leftDate) return 1;
        if (!rightDate) return -1;
        const compared = leftDate.localeCompare(rightDate);
        if (compared !== 0) return selectedOrder === 'oldest' ? compared : -compared;
        return (left.dataset.eventId || '').localeCompare(right.dataset.eventId || '');
      });
      for (const item of sorted) list.appendChild(item);
    };

    const update = () => {
      sortItems();
      const query = (search?.value || '').trim().toLocaleLowerCase();
      const selectedType = targetType?.value || '';
      const selectedConfidence = confidence?.value || '';
      const selectedSource = source?.value || '';
      let visible = 0;
      for (const item of items) {
        const match =
          (!query || (item.dataset.searchText || '').toLocaleLowerCase().includes(query)) &&
          (!selectedType || item.dataset.targetType === selectedType) &&
          (!selectedConfidence || item.dataset.confidence === selectedConfidence) &&
          (!selectedSource || item.dataset.sourceId === selectedSource);
        item.hidden = !match;
        if (match) visible += 1;
      }
      setScopedCount(filterPanel, '[data-timeline-visible-count]', visible);
    };

    for (const control of [search, targetType, confidence, source, order]) {
      if (!control) continue;
      control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', update);
    }
    reset?.addEventListener('click', () => {
      if (search) search.value = '';
      if (targetType) targetType.value = '';
      if (confidence) confidence.value = '';
      if (source) source.value = '';
      if (order) order.value = 'newest';
      update();
      search?.focus();
    });
    update();
  }

  for (const simpleInput of document.querySelectorAll('[data-search-input]')) {
    const panel = simpleInput.closest('.search-panel');
    const items = Array.from(document.querySelectorAll('.searchable'));
    const update = () => {
      const query = simpleInput.value.trim().toLocaleLowerCase();
      let visible = 0;
      for (const item of items) {
        const text = (item.dataset.searchText || '').toLocaleLowerCase();
        const match = !query || text.includes(query);
        item.hidden = !match;
        if (match) visible += 1;
      }
      if (panel) setScopedCount(panel, '[data-visible-count]', visible);
    };
    simpleInput.addEventListener('input', update);
    update();
  }
})();
