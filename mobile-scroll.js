// merged-snap.js
document.addEventListener("DOMContentLoaded", () => {
    // ----- Config -----
    const ORDER = [".hero", ".about", ".project", ".contact"];
    const HEADER_OFFSET = 0;
    const DECIDE_MIN = 10;
    const SWIPE_MIN = 50;
    const OFFSET = -190;

    // ----- Sections & Project refs -----
    const sections = ORDER.map(s => document.querySelector(s)).filter(Boolean);
    if (sections.length < 2) return;

    const project = document.querySelector(".project");
    const wrappers = project ? Array.from(project.querySelectorAll(".folder-wrapper")) : [];
    const projectIndexInSections = project ? sections.indexOf(project) : -1;

    // ----- Helpers -----
    function clampIndex(i) {
        return Math.max(0, Math.min(i, sections.length - 1));
    }
    function scrollToSection(i) {
        i = clampIndex(i);
        const y = sections[i].getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
        window.scrollTo({ top: y, behavior: "smooth" });
    }
    function nearestSectionIndex() {
        let best = 0, dist = Infinity;
        sections.forEach((sec, i) => {
            const d = Math.abs(sec.getBoundingClientRect().top - HEADER_OFFSET);
            if (d < dist) { dist = d; best = i; }
        });
        return best;
    }
    function sectionAtViewportCenter() {
        const mid = window.innerHeight / 2;
        for (const sec of sections) {
            const r = sec.getBoundingClientRect();
            if (r.top <= mid && r.bottom >= mid) return sec;
        }
        return sections[nearestSectionIndex()];
    }
    function findNearestWrapperIndex() {
        if (!project || wrappers.length === 0) return 0;
        let best = 0, bestDist = Infinity;
        wrappers.forEach((w, i) => {
            const dist = Math.abs(w.getBoundingClientRect().top);
            if (dist < bestDist) { best = i; bestDist = dist; }
        });
        return best;
    }
    function smoothScrollToWrapper(element) {
        const top = element.getBoundingClientRect().top + window.scrollY + OFFSET;
        window.scrollTo({ top, behavior: "smooth" });
    }
    function atTopOfProject() {
        if (!project) return false;
        return project.scrollTop === 0 || window.pageYOffset <= project.offsetTop + 2;
    }
    function isPointInProject(x, y) {
        const el = document.elementFromPoint(x, y);
        return !!(el && el.closest && el.closest(".project"));
    }

    // ----- State -----
    let startX = 0, startY = 0;
    let decided = false, vertical = false;
    let intercept = false;
    let gestureStartedInsideProject = false;
    let projIndex = 0;

    // ----- Touch handlers -----
    window.addEventListener("touchstart", (e) => {
        const t0 = e.touches[0];
        startX = t0.clientX;
        startY = t0.clientY;
        decided = false;
        vertical = false;
        intercept = false;
        gestureStartedInsideProject = !!e.target.closest && !!e.target.closest(".project");
        if (gestureStartedInsideProject && project) {
            projIndex = findNearestWrapperIndex();
        }
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
        const t = e.touches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;

        if (!decided) {
            if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > DECIDE_MIN) {
                vertical = true; decided = true;
            } else if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > DECIDE_MIN) {
                decided = true; vertical = false;
            }
        }
        if (!vertical) return;

        const inProjectNow = gestureStartedInsideProject || isPointInProject(t.clientX, t.clientY);

        if (!inProjectNow) {
            if (window.scrollY === 0 && dy > 0) {
                intercept = false; // let pull-to-refresh happen
            } else {
                intercept = true;
            }
        } else {
            intercept = true; // inside project → we control
        }

        if (intercept) e.preventDefault();
    }, { passive: false });

    window.addEventListener("touchend", (e) => {
        const dy = e.changedTouches[0].clientY - startY;
        const absDy = Math.abs(dy);
        if (!decided || !vertical || absDy < SWIPE_MIN) return;

        const goingUp = dy < 0;
        const endTouch = e.changedTouches[0];
        const inProjectAtEnd = gestureStartedInsideProject || isPointInProject(endTouch.clientX, endTouch.clientY);

        if (inProjectAtEnd && project) {
            projIndex = findNearestWrapperIndex();
            if (goingUp) {
                if (projIndex < wrappers.length - 1) {
                    projIndex++;
                    smoothScrollToWrapper(wrappers[projIndex]);
                } else {
                    const contact = sections[projectIndexInSections + 1];
                    if (contact) scrollToSection(projectIndexInSections + 1);
                }
            } else {
                if (projIndex > 0) {
                    projIndex--;
                    smoothScrollToWrapper(wrappers[projIndex]);
                } else if (projIndex === 0 && atTopOfProject()) {
                    const prev = sections[projectIndexInSections - 1];
                    if (prev) scrollToSection(projectIndexInSections - 1);
                }
            }
            return;
        }

        // ----- Outside project: section snap -----
        const current = sectionAtViewportCenter();
        const currentIndex = sections.indexOf(current);

        if (goingUp && currentIndex < sections.length - 1) {
            scrollToSection(currentIndex + 1);
        } else if (!goingUp && currentIndex > 0) {
            if (sections[currentIndex] === document.querySelector(".contact") && project) {
                // ✅ Contact → Project → land on LAST WRAPPER
                smoothScrollToWrapper(wrappers[wrappers.length - 1]);
                projIndex = wrappers.length - 1;
            } else {
                scrollToSection(currentIndex - 1);
            }
        }
    }, { passive: true });
});
