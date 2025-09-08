/* Simple scroll animations (only active when >= 601px) */
(() => {
    let teardown = null;

    const mql = window.matchMedia("(min-width: 601px)");
    function onChange(e) { e.matches ? enable() : disable(); }
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    if (mql.matches) enable();

    function enable() {
        if (teardown) return;
        teardown = initDesktopAnimations();
    }
    function disable() {
        if (!teardown) return;
        teardown();
        teardown = null;
    }

    function initDesktopAnimations() {
        // ---------------- smooth scroll functionality ----------------
        let isScrolling = false;
        let currentSectionIndex = 0;
        
        // Define all sections in order
        const sections = [
            document.querySelector('.hero'),
            document.querySelector('.about'),
            document.querySelector('.project'),
            document.querySelector('.contact')
        ].filter(Boolean); // Remove any null sections
        
        // Function to close all text editors
        function closeAllTextEditors() {
            const textEditors = document.querySelectorAll('.text-editor');
            textEditors.forEach(editor => {
                editor.style.display = 'none';
            });
        }
        
        // Function to navigate back to root in nautilus
        function navigateToRoot() {
            const rootElement = document.querySelector('.root');
            if (rootElement) {
                rootElement.click();
            }
        }
        
        // Function to scroll to a specific section
        function scrollToSection(index) {
            if (index < 0 || index >= sections.length || isScrolling) return;
            
            isScrolling = true;
            currentSectionIndex = index;
            
            sections[index].scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Close text editors with delay when leaving project section
            if (sections[index] && !sections[index].classList.contains('project')) {
                setTimeout(() => {
                    closeAllTextEditors();
                    navigateToRoot();
                }, 1000);
            }
            
            // Use a combination of timeout and scroll end detection for better responsiveness
            let scrollTimeout;
            let lastScrollTime = Date.now();
            
            const handleScrollEnd = () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    const now = Date.now();
                    if (now - lastScrollTime > 100) {
                        isScrolling = false;
                        window.removeEventListener('scroll', handleScrollEnd);
                    }
                }, 100);
            };
            
            const updateScrollTime = () => {
                lastScrollTime = Date.now();
            };
            
            window.addEventListener('scroll', updateScrollTime);
            window.addEventListener('scroll', handleScrollEnd);
            
            // Fallback timeout in case scroll events don't fire properly
            setTimeout(() => {
                isScrolling = false;
                window.removeEventListener('scroll', handleScrollEnd);
                window.removeEventListener('scroll', updateScrollTime);
            }, 800);
        }
        
        // Find current section index based on scroll position
        function getCurrentSectionIndex() {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;
            
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                const rect = section.getBoundingClientRect();
                const sectionTop = rect.top + scrollY;
                const sectionBottom = sectionTop + rect.height;
                
                // Check if current scroll position is within this section
                if (scrollY >= sectionTop - windowHeight * 0.3 && scrollY < sectionBottom - windowHeight * 0.3) {
                    return i;
                }
            }
            return currentSectionIndex;
        }
        
        // Enhanced trackpad detection and throttling variables
        let lastWheelTime = 0;
        let lastNavigationTime = 0;
        let wheelDeltaAccumulator = 0;
        let isTrackpad = false;
        let trackpadThreshold = 60; // Minimum delta accumulation for trackpad
        let wheelThreshold = 30; // Minimum delta for mouse wheel
        let debounceTime = 200; // Debounce time in milliseconds
        let navigationCooldown = 600; // Minimum time between section navigations
        let accumulatorResetTimeout = null;
        let consecutiveWheelEvents = 0;
        let wheelEventWindow = [];
        
        // Function to reset accumulator after a pause
        function resetAccumulator() {
            wheelDeltaAccumulator = 0;
            consecutiveWheelEvents = 0;
            wheelEventWindow = [];
        }
        
        // Enhanced function to detect if input is from trackpad or mouse wheel
        function detectInputType(e) {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastWheelTime;
            
            // Clear existing timeout and set new one
            clearTimeout(accumulatorResetTimeout);
            accumulatorResetTimeout = setTimeout(resetAccumulator, debounceTime);
            
            // Track wheel events in a sliding window
            wheelEventWindow.push({ time: currentTime, delta: Math.abs(e.deltaY) });
            wheelEventWindow = wheelEventWindow.filter(event => currentTime - event.time < 100);
            
            consecutiveWheelEvents++;
            
            // Enhanced trackpad detection
            // Trackpads: many small events in quick succession
            // Mouse wheels: fewer, larger events with gaps
            if (wheelEventWindow.length >= 3) {
                const avgDelta = wheelEventWindow.reduce((sum, event) => sum + event.delta, 0) / wheelEventWindow.length;
                if (avgDelta < 40 && wheelEventWindow.length > 5) {
                    isTrackpad = true;
                } else if (avgDelta > 80) {
                    isTrackpad = false;
                }
            }
            
            // Fallback detection
            if (timeDiff < 30 && Math.abs(e.deltaY) < 30) {
                isTrackpad = true;
            } else if (Math.abs(e.deltaY) > 100) {
                isTrackpad = false;
            }
            
            lastWheelTime = currentTime;
        }
        
        // Function to check if navigation is allowed (cooldown period)
        function canNavigate() {
            const currentTime = Date.now();
            return currentTime - lastNavigationTime >= navigationCooldown;
        }
        
        // Function to perform navigation with cooldown
        function performNavigation(direction) {
            if (!canNavigate()) {
                return false;
            }
            
            const currentTime = Date.now();
            lastNavigationTime = currentTime;
            
            currentSectionIndex = getCurrentSectionIndex();
            
            if (direction > 0) {
                scrollToSection(currentSectionIndex + 1);
            } else {
                scrollToSection(currentSectionIndex - 1);
            }
            
            resetAccumulator();
            return true;
        }
        
        // Wheel event handler for smooth scrolling
        function handleWheel(e) {
            if (isScrolling) {
                e.preventDefault();
                return;
            }
            
            const currentTime = Date.now();
            detectInputType(e);
            // Check if the scroll is happening within a text-editor or content-area
            let target = e.target;
            let scrollableElement = null;
            
            while (target && target !== document) {
                if (target.classList.contains('text-editor') || 
                    target.classList.contains('content-area')) {
                    scrollableElement = target;
                    break;
                }
                target = target.parentElement;
            }
            
            // If we're inside a scrollable element, check if we can still scroll
            if (scrollableElement) {
                const deltaY = e.deltaY;
                const scrollTop = scrollableElement.scrollTop;
                const scrollHeight = scrollableElement.scrollHeight;
                const clientHeight = scrollableElement.clientHeight;
                
                // Check if we're at the top and trying to scroll up
                const atTop = scrollTop <= 0;
                const atBottom = scrollTop + clientHeight >= scrollHeight - 1; // -1 for potential rounding
                
                // If scrolling down and we're at the bottom, or scrolling up and we're at the top
                if ((deltaY > 0 && atBottom) || (deltaY < 0 && atTop)) {
                    // Allow section navigation to take over
                    e.preventDefault();
                    
                    // Handle trackpad vs mouse wheel differently
                    if (isTrackpad) {
                        wheelDeltaAccumulator += deltaY;
                        
                        // Only navigate when accumulator exceeds threshold and cooldown allows
                        if (Math.abs(wheelDeltaAccumulator) >= trackpadThreshold) {
                            if (performNavigation(wheelDeltaAccumulator)) {
                                // Navigation successful
                            }
                        }
                    } else {
                        // Mouse wheel - direct navigation with cooldown
                        if (Math.abs(deltaY) >= wheelThreshold) {
                            performNavigation(deltaY);
                        }
                    }
                } else {
                    // Allow normal scrolling within the element
                    resetAccumulator();
                    return;
                }
            } else {
                // Not in a scrollable element, do section navigation
                const deltaY = e.deltaY;
                
                // Handle trackpad vs mouse wheel differently
                if (isTrackpad) {
                    wheelDeltaAccumulator += deltaY;
                    
                    // Only navigate when accumulator exceeds threshold and cooldown allows
                    if (Math.abs(wheelDeltaAccumulator) >= trackpadThreshold) {
                        e.preventDefault();
                        performNavigation(wheelDeltaAccumulator);
                    }
                } else {
                    // Mouse wheel - direct navigation with cooldown
                    if (Math.abs(deltaY) >= wheelThreshold) {
                        e.preventDefault();
                        performNavigation(deltaY);
                    }
                }
            }
        }
        
        // Add wheel event listener
        document.addEventListener('wheel', handleWheel, { passive: false });
        
        // ---------------- touch/swipe functionality ----------------
        // Touch variables
        let startX = 0, startY = 0;
        let decided = false, isVerticalSwipe = false;
        let touchStartTime = 0;
        const SWIPE_MIN_DISTANCE = 50; // Minimum distance for a swipe
        const SWIPE_MAX_TIME = 300; // Maximum time for a swipe (ms)
        const DECIDE_MIN = 10; // Minimum movement to decide direction
        
        // Touch event handlers
        function handleTouchStart(e) {
            if (isScrolling) return;
            
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            touchStartTime = Date.now();
            decided = false;
            isVerticalSwipe = false;
        }
        
        function handleTouchMove(e) {
            if (isScrolling) return;
            
            const touch = e.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            
            // Decide if this is a vertical or horizontal gesture
            if (!decided) {
                if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > DECIDE_MIN) {
                    isVerticalSwipe = true;
                    decided = true;
                } else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > DECIDE_MIN) {
                    isVerticalSwipe = false;
                    decided = true;
                }
            }
            
            // If it's a vertical swipe, check if we should handle it
            if (isVerticalSwipe) {
                // Check if we're in a scrollable element
                let target = e.target;
                let scrollableElement = null;
                
                while (target && target !== document) {
                    if (target.classList.contains('text-editor') || 
                        target.classList.contains('content-area')) {
                        scrollableElement = target;
                        break;
                    }
                    target = target.parentElement;
                }
                
                // If in scrollable element, let it handle normally unless at edges
                if (scrollableElement) {
                    const scrollTop = scrollableElement.scrollTop;
                    const scrollHeight = scrollableElement.scrollHeight;
                    const clientHeight = scrollableElement.clientHeight;
                    
                    const atTop = scrollTop <= 0;
                    const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
                    
                    // Only prevent default if we're at edges and trying to go beyond
                    if ((deltaY > 0 && atTop) || (deltaY < 0 && atBottom)) {
                        e.preventDefault();
                    }
                } else {
                    // Not in scrollable element, prevent default for our section navigation
                    e.preventDefault();
                }
            }
        }
        
        function handleTouchEnd(e) {
            if (isScrolling || !decided || !isVerticalSwipe) return;
            
            const touch = e.changedTouches[0];
            const deltaY = touch.clientY - startY;
            const deltaTime = Date.now() - touchStartTime;
            const distance = Math.abs(deltaY);
            
            // Check if this qualifies as a swipe
            if (distance < SWIPE_MIN_DISTANCE || deltaTime > SWIPE_MAX_TIME) {
                return;
            }
            
            // Check if we should handle this swipe
            let target = e.target;
            let scrollableElement = null;
            
            while (target && target !== document) {
                if (target.classList.contains('text-editor') || 
                    target.classList.contains('content-area')) {
                    scrollableElement = target;
                    break;
                }
                target = target.parentElement;
            }
            
            let shouldNavigate = false;
            
            if (scrollableElement) {
                const scrollTop = scrollableElement.scrollTop;
                const scrollHeight = scrollableElement.scrollHeight;
                const clientHeight = scrollableElement.clientHeight;
                
                const atTop = scrollTop <= 0;
                const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
                
                // Navigate if at edges
                if ((deltaY < 0 && atBottom) || (deltaY > 0 && atTop)) {
                    shouldNavigate = true;
                }
            } else {
                // Not in scrollable element, always navigate
                shouldNavigate = true;
            }
            
            if (shouldNavigate) {
                // Determine direction and navigate
                const direction = deltaY < 0 ? 1 : -1; // Swipe up = next section, swipe down = prev section
                performNavigation(direction * 100); // Use a value that will trigger navigation
            }
        }
        
        // Add touch event listeners
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        
        // ---------------- intersection animations ----------------
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
                
                const el = entry.target;
                
                // About section animations
                if (el.classList.contains("about")) {
                    el.querySelectorAll(".about-title, .about-title h2, .c1, .c2, .about-beam")
                        .forEach(x => x.classList.add("visible"));
                    observer.unobserve(el); // Only animate once
                } 
                
                // Contact section animations
                else if (el.classList.contains("contact")) {
                    el.querySelectorAll(".contact-header, .form, .g1, .g2, .g3, .g4, .g5, .fake-caret, .search, .search-icon, .search-placeholder, .text")
                        .forEach(x => x.classList.add("visible"));
                    observer.unobserve(el); // Only animate once
                }
            });
        }, { threshold: 0.5 });
        
        // Observe sections for animations
        const aboutEl = document.querySelector(".about"); 
        if (aboutEl) observer.observe(aboutEl);
        
        const contactEl = document.querySelector(".contact"); 
        if (contactEl) observer.observe(contactEl);

        // Project section animations
        const projectEl = document.querySelector(".project");
        if (projectEl) {
            projectEl.querySelectorAll(".section-title, .nautilus").forEach(element => {
                const projectObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                            entry.target.classList.add("visible"); 
                            projectObserver.unobserve(entry.target); // Only animate once
                        }
                    });
                }, { threshold: 0.5 });
                projectObserver.observe(element);
            });

            // Project folder animations
            const folderObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
                        const wrapper = entry.target;
                        
                        // Add visible class to all folders in this wrapper
                        const folders = wrapper.querySelectorAll('.face-folder, .desc-folder, .rating-folder');
                        folders.forEach(folder => {
                            folder.classList.add('loaded', 'visible');
                        });

                        // Add visible class to tech elements for shine animation
                        const techElements = wrapper.querySelectorAll('.tech');
                        techElements.forEach(tech => {
                            tech.classList.add('visible');
                        });

                        folderObserver.unobserve(wrapper); // Only animate once
                    }
                });
            }, { threshold: 0.3 });

            // Observe all folder wrappers
            const folderWrappers = projectEl.querySelectorAll('.folder-wrapper');
            folderWrappers.forEach(wrapper => {
                folderObserver.observe(wrapper);
            });
        }

        // ---------------- cleanup ----------------
        return function cleanup() {
            observer.disconnect();
            document.removeEventListener('wheel', handleWheel);
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            clearTimeout(accumulatorResetTimeout);
        };
    }
})();
