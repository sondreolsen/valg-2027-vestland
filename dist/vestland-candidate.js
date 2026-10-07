(() => {
  const addCandidate = () => {
    const heading = document.querySelector('#county-detail-card h2');
    const grid = document.querySelector('#county-candidates .county-candidate-grid');
    if (!heading || !grid || heading.textContent.trim() !== 'Vestland' || grid.querySelector('[data-jon-olav-okland], img[alt="Jon Olav Økland"]')) return;
    const card = document.createElement('article');
    card.className = 'county-candidate';
    card.dataset.jonOlavOkland = 'true';
    card.innerHTML = '<div class="county-candidate-party"><img src="assets/logos/krf.png" alt="Kristelig Folkeparti"><span>Kristelig Folkeparti</span></div><div class="county-candidate-photo"><img src="assets/candidates/jon-olav-okland.jpg" alt="Jon Olav Økland"></div><h3>Jon Olav Økland</h3><p>Innstilt</p>';
    grid.append(card);
  };
  new MutationObserver(addCandidate).observe(document.body, {childList:true, subtree:true});
  addCandidate();
})();
