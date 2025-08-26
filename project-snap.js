document.addEventListener("DOMContentLoaded", () => {
    const project = document.querySelector(".project");
    if (!project) return;

    const wrappers = project.querySelectorAll(".folder-wrapper");
    const OFFSET = -190;
    let index = 0;
    let startX = 0, startY = 0;
    let decided = false;
    let verticalIntent = false;
    let intercept = false;

    function smoothScrollTo(element) {
        const top = element.getBoundingClientRect().top + window.scrollY + OFFSET;
        window.scrollTo({ top, behavior: "smooth" });
    }

    function findNearestIndex() {
        let best = 0, bestDist = Infinity;
        wrappers.forEach((w, i) => {
            const dist = Math.abs(w.getBoundingClientRect().top);
            if (dist < bestDist) {
                best = i;
                bestDist = dist;
            }
        });
        return best;
    }

    project.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        decided = false;
        verticalIntent = false;
        intercept = false;
        index = findNearestIndex();
    }, { passive: true });

    project.addEventListener("touchmove", (e) => {
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;

        if (!decided) {
            if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
                verticalIntent = true;
                decided = true;

                if (dy > 0) {
                    // user swiping down
                    if (index === 0 && project.scrollTop === 0) {
                        intercept = false; // let native scroll/PTR handle it
                    } else {
                        intercept = true;
                    }
                } else {
    // swiping up
    if (index === wrappers.length - 1) {
        // last wrapper → let section-snap.js take over
        intercept = false;
    } else {
        intercept = true;
    }
}
            } else if (Math.abs(dx) > Math.abs(dy)) {
                // horizontal → ignore
                decided = true;
                verticalIntent = false;
            }
        }

        if (verticalIntent && intercept) {
            e.preventDefault(); // we take control
        }
    }, { passive: false });

    project.addEventListener("touchend", (e) => {
        if (!verticalIntent || !intercept) return;

        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dy) < 50) return; // too small

        if (dy < 0) {
            // swipe up
            if (index < wrappers.length - 1) {
                index++;
                smoothScrollTo(wrappers[index]);
            } else {
                project.scrollTo({ top: project.scrollHeight, behavior: "smooth" });
            }
        } else {
            // swipe down
            if (index === 1) {
                // special case → from second wrapper, jump to top of project section
                const top = project.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({ top, behavior: "smooth" });
                index = 0; // reset index
            } else if (index > 1) {
                index--;
                smoothScrollTo(wrappers[index]);
            } else if (project.scrollTop > 0) {
                project.scrollTo({ top: 0, behavior: "smooth" });
            }
        }
    }, { passive: true });
});
