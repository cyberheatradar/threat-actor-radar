(() => {
  'use strict';
  const items = Array.from(document.querySelectorAll('.searchable'));
  const counter = document.querySelector('[data-visible-count]');
  const filterPanel = document.querySelector('[data-relationship-filters]');
  const simpleInput = document.querySelector('[data-search-input]');

  const setVisibleCount = (value) => {
    if (counter) counter.textContent = String(value);
  };

  if (filterPanel) {
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
      setVisibleCount(visible);
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
    return;
  }

  if (!simpleInput) return;
  const update = () => {
    const query = simpleInput.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const item of items) {
      const text = (item.dataset.searchText || '').toLocaleLowerCase();
      const match = !query || text.includes(query);
      item.hidden = !match;
      if (match) visible += 1;
    }
    setVisibleCount(visible);
  };
  simpleInput.addEventListener('input', update);
  update();
})();
