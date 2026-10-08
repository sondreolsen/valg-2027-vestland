(() => {
  const update = () => {
    const card = [...document.querySelectorAll('#candidate-grid .candidate-card')]
      .find(item => item.querySelector('.candidate-copy h3')?.textContent.trim() === 'Olav Eggebø Aanonsen');
    const photo = card?.querySelector('.candidate-photo-wrap');
    if (!photo) return;
    let status = photo.querySelector('.candidate-status');
    if (!status) {
      status = document.createElement('span');
      status.className = 'candidate-status';
      photo.append(status);
    }
    status.textContent = 'Valgt';
  };
  new MutationObserver(update).observe(document.body, {childList:true, subtree:true});
  update();
})();
