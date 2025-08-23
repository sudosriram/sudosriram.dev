
    (() => {
        const wrappers = document.querySelectorAll(".folder-wrapper");

        wrappers.forEach(wrapper => {
            let dragging = false;
            let startX = 0, startY = 0;
            let dx = 0, dy = 0;
            let activeCard = null;
            let animating = false;
            let isSwipe = false;

            function setContentsOpacity(card, value) {
                if (!card) return;
                card.querySelectorAll('.folder-info, .folder-links, .folder-content').forEach(el => {
                    el.style.opacity = value;
                });
            }

            function handleRatingVideo() {
                const ratingCard = wrapper.querySelector('.rating-folder');
                if (!ratingCard) return;
                const video = ratingCard.querySelector('video');
                if (!video) return;

                // keep video visible but opacity 0 by default
                video.style.display = "block";
                video.style.opacity = ratingCard.classList.contains('is-front') ? 1 : 0;
                video.muted = false;

                if (ratingCard.classList.contains('is-front')) {
                    video.play().catch(() => { });
                } else {
                    video.pause();
                    video.currentTime = 0;
                }
            }

            function restack() {
                const cards = Array.from(wrapper.children).filter(n => n.nodeType === 1);
                cards.forEach(c => c.classList.remove("is-front", "is-middle", "is-back"));
                if (cards[0]) cards[0].classList.add("is-front");
                if (cards[1]) cards[1].classList.add("is-middle");
                if (cards[2]) cards[2].classList.add("is-back");

                setContentsOpacity(wrapper.querySelector('.is-middle'), 0);
                setContentsOpacity(wrapper.querySelector('.is-back'), 0);

                handleRatingVideo();
            }

            function resetVars(card) {
                card.style.setProperty("--tx", "0px");
                card.style.setProperty("--rot", "0deg");
            }

            function sendToBack(card, direction) {
                if (animating) return;
                animating = true;
                const off = (wrapper.clientWidth || 600) + 120;
                card.style.setProperty("--tx", (direction > 0 ? off : -off) + "px");
                card.style.setProperty("--rot", (direction > 0 ? 16 : -16) + "deg");

                const onDone = (e) => {
                    if (e.propertyName !== "transform") return;
                    card.removeEventListener("transitionend", onDone);

                    wrapper.appendChild(card);
                    card.style.transition = "none";
                    resetVars(card);
                    setContentsOpacity(card, 0);
                    void card.offsetWidth;
                    card.style.transition = "";

                    restack();
                    animating = false;
                };
                card.addEventListener("transitionend", onDone);
            }

            function onPointerDown(e) {
                if (animating) return;
                const front = wrapper.querySelector(".is-front") || wrapper.firstElementChild;
                if (!front) return;
                activeCard = front;
                dragging = true;
                dx = dy = 0;
                isSwipe = false;
                startX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
                startY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

                setContentsOpacity(wrapper.querySelector('.is-middle'), 0);
            }

            function onPointerMove(e) {
                if (!dragging || !activeCard) return;
                const x = e.clientX ?? e.touches?.[0]?.clientX ?? startX;
                const y = e.clientY ?? e.touches?.[0]?.clientY ?? startY;
                dx = x - startX;
                dy = y - startY;

                if (!isSwipe) {
                    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
                        isSwipe = true;
                    } else if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.2) {
                        dragging = false;
                        return;
                    } else return;
                }

                const rot = Math.max(-10, Math.min(10, dx / 12));
                activeCard.style.setProperty("--tx", dx + "px");
                activeCard.style.setProperty("--rot", rot + "deg");

                // Fade in middle card contents based on swipe progress
                const middleCard = wrapper.querySelector('.is-middle');
                if (middleCard) {
                    const threshold = Math.max(80, wrapper.clientWidth * 0.18);
                    const progress = Math.min(1, Math.abs(dx) / threshold);

                    // Normal content opacity (not rating folder)
                    setContentsOpacity(middleCard, progress);

                    // Video fade-in for rating folder (capped at 0.25)
                    const video = middleCard.querySelector('video');
                    if (video) video.style.opacity = Math.min(progress, 0.25);
                }

                if (e.type === "touchmove" && isSwipe) e.preventDefault();
            }


            function onPointerUpCancel() {
                if (!dragging || !activeCard) return;
                dragging = false;

                const middleCard = wrapper.querySelector('.is-middle');
                const threshold = Math.max(80, wrapper.clientWidth * 0.18);

                if (isSwipe) {
                    if (Math.abs(dx) >= threshold) {
                        if (middleCard && !middleCard.classList.contains('rating-folder')) {
                            setContentsOpacity(middleCard, 1);
                        }
                        sendToBack(activeCard, Math.sign(dx));
                    } else {
                        resetVars(activeCard);
                        if (middleCard) {
                            if (!middleCard.classList.contains('rating-folder')) {
                                setContentsOpacity(middleCard, 0);
                            }
                            // 🔑 force rating video opacity back to 0 if swipe cancelled
                            const video = middleCard.querySelector('video');
                            if (video) video.style.opacity = 0;
                        }
                    }
                } else {
                    resetVars(activeCard);
                    if (middleCard) {
                        if (!middleCard.classList.contains('rating-folder')) {
                            setContentsOpacity(middleCard, 0);
                        }
                        // 🔑 also reset video opacity here
                        const video = middleCard.querySelector('video');
                        if (video) video.style.opacity = 0;
                    }
                }

                dx = dy = 0;
                activeCard = null;
                isSwipe = false;
            }

            restack();

            wrapper.addEventListener("pointerdown", onPointerDown);
            wrapper.addEventListener("pointermove", onPointerMove);
            wrapper.addEventListener("pointerup", onPointerUpCancel);
            wrapper.addEventListener("pointercancel", onPointerUpCancel);

            wrapper.addEventListener("touchstart", onPointerDown, { passive: true });
            wrapper.addEventListener("touchmove", onPointerMove, { passive: false });
            wrapper.addEventListener("touchend", onPointerUpCancel);
        });
    })();

// Rating video: show play button only when paused and front
document.querySelectorAll('.rating-folder').forEach(folder => {
    const video = folder.querySelector('video');
    if (!video) return;

    folder.style.position = 'relative';

    const playBtn = document.createElement('div');
    playBtn.textContent = '▶';
    playBtn.style.position = 'absolute';
    playBtn.style.top = '50%';
    playBtn.style.left = '50%';
    playBtn.style.transform = 'translate(-50%, -50%)';
    playBtn.style.fontSize = '3rem';
    playBtn.style.color = 'white';
    playBtn.style.cursor = 'pointer';
    playBtn.style.display = 'none';
    folder.appendChild(playBtn);

    function updatePlayButton() {
        if (video.paused && folder.classList.contains('is-front')) {
            playBtn.style.display = 'block';
        } else {
            playBtn.style.display = 'none';
        }
    }

    video.addEventListener('click', () => {
        if (video.paused) video.play();
        else video.pause();
        updatePlayButton();
    });

    playBtn.addEventListener('click', () => {
        video.play();
        updatePlayButton();
    });

    video.addEventListener('ended', updatePlayButton);

    const observer = new MutationObserver(updatePlayButton);
    observer.observe(folder, { attributes: true, attributeFilter: ['class'] });
});


const wrappers = document.querySelectorAll('.folder-wrapper');

wrappers.forEach((wrapper, i) => {
    const video = wrapper.querySelector('.rating-folder video');
    if (!video) return;

    // Example: give each video a different default volume
    video.volume = [0.4, 1.0, 0.5, 1.0][i] || 1.0;
});