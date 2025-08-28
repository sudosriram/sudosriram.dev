/* mobile-only snap + animations, with enable/disable by breakpoint */
(() => {
    let teardown = null;

    // Toggle based on viewport
    const mql = window.matchMedia("(max-width: 600px)");
    function onChange(e) { e.matches ? enable() : disable(); }
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange); // Safari fallback

    // Run once at load
    if (mql.matches) enable();

    function enable() {
        if (teardown) return;           // already active
        teardown = initMobileJS();      // returns a cleanup function
        // console.log("Mobile JS enabled");
    }

    function disable() {
        if (!teardown) return;          // nothing to stop
        teardown();                     // remove listeners + observers
        teardown = null;
        // console.log("Mobile JS disabled");
    }

    /* ===== Your original logic, wrapped so we can tear it down ===== */
    function initMobileJS() {
        // ----- Config -----
        const ORDER = [".hero", ".about", ".project", ".contact"];
        const HEADER_OFFSET = 0;
        const DECIDE_MIN = 10;
        const SWIPE_MIN = 50;
        const OFFSET = -190;

        // ----- Sections & Project refs -----
        const sections = ORDER.map(s => document.querySelector(s)).filter(Boolean);
        if (sections.length < 2) return () => { };
        const hero = document.querySelector(".hero");
        const project = document.querySelector(".project");
        const wrappers = project ? Array.from(project.querySelectorAll(".folder-wrapper")) : [];
        const projectIndexInSections = project ? sections.indexOf(project) : -1;

        // ----- Helpers -----
        function clampIndex(i) { return Math.max(0, Math.min(i, sections.length - 1)); }
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
        function atTopOfProject() {
            if (!project) return false;
            return project.scrollTop === 0 || window.pageYOffset <= project.offsetTop + 2;
        }
        function isPointInProject(x, y) {
            const el = document.elementFromPoint(x, y);
            return !!(el && el.closest && el.closest(".project"));
        }

        // Snap lock
        let snapping = false;
        function lockScroll() {
            if (snapping) return;
            snapping = true;
            document.body.style.overflow = "hidden";
            setTimeout(() => { document.body.style.overflow = ""; snapping = false; }, 600);
        }

        function smoothScrollToWrapper(element) {
            const top = element.getBoundingClientRect().top + window.scrollY + OFFSET;
            lockScroll();
            window.scrollTo({ top, behavior: "smooth" });
        }
        function scrollToSection(i) {
            i = clampIndex(i);
            const sec = sections[i];
            lockScroll();
            if (sec === hero) {
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                const y = sec.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
                window.scrollTo({ top: y, behavior: "smooth" });
            }
        }

        // ----- State -----
        let startX = 0, startY = 0;
        let decided = false, vertical = false;
        let intercept = false;
        let gestureStartedInsideProject = false;
        let projIndex = 0;

        // ----- Touch handlers (named so we can remove them) -----
        const handleTouchStart = (e) => {
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
        };

        const handleTouchMove = (e) => {
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
                    intercept = false; // allow pull-to-refresh at top
                } else {
                    intercept = true;
                }
            } else {
                intercept = true; // inside project → control snapping
            }

            if (intercept) e.preventDefault();
        };

        const handleTouchEnd = (e) => {
            const dy = e.changedTouches[0].clientY - startY;
            const absDy = Math.abs(dy);
            if (!decided || !vertical || absDy < SWIPE_MIN) return;

            const goingUp = dy < 0;
            const endTouch = e.changedTouches[0];
            const inProjectAtEnd = gestureStartedInsideProject || isPointInProject(endTouch.clientX, endTouch.clientY);

            if (inProjectAtEnd && project) {
                // recompute
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
                    if (projIndex === 1) {
                        if (projectIndexInSections >= 0) {
                            scrollToSection(projectIndexInSections);
                        } else {
                            const top = project.getBoundingClientRect().top + window.scrollY;
                            window.scrollTo({ top, behavior: "smooth" });
                        }
                        projIndex = 0;
                    } else if (projIndex > 1) {
                        projIndex--;
                        smoothScrollToWrapper(wrappers[projIndex]);
                    } else {
                        if (atTopOfProject()) {
                            const prev = sections[projectIndexInSections - 1];
                            if (prev) scrollToSection(projectIndexInSections - 1);
                        } else {
                            if (wrappers[0]) {
                                smoothScrollToWrapper(wrappers[0]);
                                projIndex = 0;
                            } else {
                                scrollToSection(projectIndexInSections);
                            }
                        }
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
                if (sections[currentIndex] === document.querySelector(".contact") && project && wrappers.length > 0) {
                    smoothScrollToWrapper(wrappers[wrappers.length - 1]);
                    projIndex = wrappers.length - 1;
                } else {
                    scrollToSection(currentIndex - 1);
                }
            }
        };

        // Attach listeners
        window.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleTouchEnd, { passive: true });

        // ----- IntersectionObserver animations -----
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    const trigger = entry.target;
                    let animatable;

                    if (trigger.classList.contains('about')) {
                        animatable = trigger.querySelectorAll(
                            '.about-title, .about-title h2, .c1, .c2, .about-beam'
                        );
                    } else if (trigger.classList.contains('project-title')) {
                        const projectSection = trigger.closest('.project');
                        animatable = projectSection.querySelectorAll(
                            '.project-title, .tech, .face-folder.loaded, .desc-folder.loaded, .rating-folder.loaded'
                        );
                    } else if (trigger.classList.contains('contact-header')) {
                        const contactSection = trigger.closest('.contact');
                        animatable = contactSection.querySelectorAll(
                            '.contact-header, .form, .g1, .g2, .g3, .g4, .g5, .fake-caret, .search, .search-icon, .search-placeholder, .text'
                        );
                    }

                    if (animatable) animatable.forEach(el => el.classList.add('visible'));
                    obs.unobserve(trigger);
                }
            });
        }, { threshold: 0.5 });

        const about = document.querySelector('.about');
        if (about) observer.observe(about);
        const projectTitle = document.querySelector('.project-title');
        if (projectTitle) observer.observe(projectTitle);
        const contactHeader = document.querySelector('.contact-header');
        if (contactHeader) observer.observe(contactHeader);

        // ---- return cleanup so we can fully stop it above 600px ----
        return function cleanup() {
            window.removeEventListener("touchstart", handleTouchStart, false);
            window.removeEventListener("touchmove", handleTouchMove, false);
            window.removeEventListener("touchend", handleTouchEnd, false);
            observer.disconnect();
        };
    }
})();
