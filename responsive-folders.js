document.addEventListener("DOMContentLoaded", () => {
    // ---------- ELEMENTS ----------
    const sideBar = document.querySelector(".side-bar");
    const sidebarItems = document.querySelectorAll(".side-bar .item");
    const folderArea = document.querySelector(".folder-area");

    // Status bar bits
    const root = document.querySelector(".status-bar .root");
    const slash = document.querySelector(".status-bar .slash");
    const statusItems = Array.from(document.querySelectorAll(".status-bar .status-item"));

    // ---------- HELPERS ----------
    // Touch detection that works on iPadOS (even with desktop UA)
    const isTouchLike = () =>
    (("ontouchstart" in window) ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(pointer: coarse)").matches);

    // Build Name -> Group map from actual folder tiles (non-README)
    const PROJECTS = (() => {
        const map = {};
        document.querySelectorAll(".folder-area .pair .f").forEach(f => {
            const pair = f.closest(".pair");
            const name = pair.querySelector(".fname")?.textContent.trim();
            const group = [...pair.classList].find(c => c !== "pair"); // e.g., "crypt", "book", etc.
            if (name && group) map[name] = group;
        });
        return map;
    })();

    // Active project tracking; helps us resolve README -> editor when data attrs are missing
    let currentProjectName = null;

    const getActiveProjectNameFromSidebar = () =>
        document.querySelector(".side-bar .item.active p")?.textContent?.trim() || null;

    // Try to infer a "project id" from a .pair tile (prefer data-project, then group class, then active sidebar)
    function getProjectIdFromPair(pair) {
        if (!pair) return null;
        const dataId = pair.dataset?.project?.trim?.();
        if (dataId) return dataId;

        const group = [...pair.classList].find(c => c !== "pair");
        if (group) return group;

        const fallback = getActiveProjectNameFromSidebar();
        return fallback && fallback !== "Projects" ? fallback : null;
    }

    // Try to find the matching editor by several common data attributes
    function findEditorByProjectId(projectId) {
        if (!projectId) return null;
        const selector =
            `.text-editor[data-project="${projectId}"],` +
            `.text-editor[data-group="${projectId}"],` +
            `.text-editor[data-project-name="${projectId}"]`;
        return document.querySelector(selector);
    }

    // ---------- VIEW CONTROLS ----------
    function setActiveSidebar(name) {
        sidebarItems.forEach(item => {
            const txt = item.querySelector("p")?.textContent.trim();
            item.classList.toggle("active", txt === name);
        });
    }

    function updateStatusBarDefault() {
        root.querySelectorAll("i, p").forEach(el => {
            el.classList.add("now");
            el.classList.remove("available");
            el.style.display = "inline-block";
        });

        if (slash) slash.style.display = "none";
        statusItems.forEach(item => {
            item.style.display = "none";
            item.querySelectorAll("i, p").forEach(el => {
                el.classList.remove("now");
                el.classList.add("available");
            });
        });
    }

    function updateStatusBarProject(projectName) {
        root.querySelectorAll("i, p").forEach(el => {
            el.classList.remove("now");
            el.classList.add("available");
            el.style.display = "inline-block";
        });

        if (slash) slash.style.display = "inline-block";

        statusItems.forEach(item => {
            const txt = item.querySelector("p")?.textContent.trim();
            const isCurrent = txt === projectName;
            item.style.display = isCurrent ? "inline-flex" : "none";
            item.querySelectorAll("i, p").forEach(el => {
                el.classList.toggle("now", isCurrent);
                el.classList.toggle("available", !isCurrent);
            });
        });
    }

    // Show only folder tiles (hide README tiles)
    function showDefaultFolders() {
        document.querySelectorAll(".folder-area .pair").forEach(pair => {
            const name = pair.querySelector(".fname")?.textContent.trim();
            pair.style.display = name === "README.md" ? "none" : "flex";
        });
    }

    // Show ONLY the README.md of the selected project; hide everything else
    function showOnlyReadmeOf(projectName) {
        const targetGroup = PROJECTS[projectName];
        document.querySelectorAll(".folder-area .pair").forEach(pair => {
            const fname = pair.querySelector(".fname")?.textContent.trim();
            const group = [...pair.classList].find(c => c !== "pair");
            const show = group === targetGroup && fname === "README.md";
            pair.style.display = show ? "flex" : "none";
        });
    }

    function goRoot() {
        currentProjectName = null;
        setActiveSidebar("Projects");
        updateStatusBarDefault();
        showDefaultFolders();
        // Hide all editors when going root
        document.querySelectorAll(".text-editor").forEach(ed => {
            ed.style.display = "none";
            const fi = ed.querySelector(".file-info");
            if (fi) fi.classList.remove("open");
        });
    }

    function openProject(projectName) {
        if (!(projectName in PROJECTS)) return; // safety
        currentProjectName = projectName;
        setActiveSidebar(projectName);
        updateStatusBarProject(projectName);
        showOnlyReadmeOf(projectName);
    }

    // Open README editor by a generic projectId (data-project/group/name)
    function openReadmeEditor(projectId) {
        const editor = findEditorByProjectId(projectId);
        // Hide all editors first
        document.querySelectorAll(".text-editor").forEach(ed => ed.style.display = "none");
        if (editor) {
            editor.style.display = "flex";
        } else {
            // As a fallback, try with the currentProjectName if different
            if (currentProjectName && currentProjectName !== projectId) {
                const alt = findEditorByProjectId(currentProjectName);
                if (alt) alt.style.display = "flex";
            } else {
                // Last resort: show the first editor so user isn't stuck (and log)
                const first = document.querySelector(".text-editor");
                if (first) first.style.display = "flex";
                console.warn("[portfolio] No editor matched for projectId:", projectId);
            }
        }
    }

    // ---------- EVENT HANDLERS ----------
    // Sidebar: single click always
    sideBar.addEventListener("click", (e) => {
        const a = e.target.closest("a.item");
        if (!a) return;
        e.preventDefault();
        const name = a.querySelector("p")?.textContent.trim();
        if (!name) return;

        if (name === "Projects") {
            goRoot();
        } else {
            openProject(name);
        }
    });

    // Status-bar root: click to go back
    if (root) {
        root.addEventListener("click", goRoot);
    }

    // Folder area: open a project by tapping a folder tile (NOT the README tile)
    folderArea.addEventListener("click", (e) => {
        if (!isTouchLike()) return; // desktop uses dblclick for folders too
        const pair = e.target.closest(".pair");
        if (!pair) return;
        const fname = pair.querySelector(".fname")?.textContent.trim();
        if (!fname || fname === "README.md") return; // ignore README tiles here
        openProject(fname);
    });

    folderArea.addEventListener("dblclick", (e) => {
        if (isTouchLike()) return; // touch uses single click
        const pair = e.target.closest(".pair");
        if (!pair) return;
        const fname = pair.querySelector(".fname")?.textContent.trim();
        if (!fname || fname === "README.md") return; // ignore README tiles here
        openProject(fname);
    });

    // README tile -> open editor (touch: single tap, desktop: double click)
    folderArea.addEventListener("click", (e) => {
        if (!isTouchLike()) return; // desktop ignores single click
        const pair = e.target.closest(".pair");
        if (!pair) return;
        const fname = pair.querySelector(".fname")?.textContent.trim();
        if (fname !== "README.md") return;

        const projectId = getProjectIdFromPair(pair) || currentProjectName || getActiveProjectNameFromSidebar();
        openReadmeEditor(projectId);
    });

    folderArea.addEventListener("dblclick", (e) => {
        if (isTouchLike()) return; // touch uses single click
        const pair = e.target.closest(".pair");
        if (!pair) return;
        const fname = pair.querySelector(".fname")?.textContent.trim();
        if (fname !== "README.md") return;

        const projectId = getProjectIdFromPair(pair) || currentProjectName || getActiveProjectNameFromSidebar();
        openReadmeEditor(projectId);
    });

    // Keep behavior consistent across resizes (handlers check isTouchLike at event time)
    window.addEventListener("resize", () => { /* no-op by design */ });

    // ---------- EDITOR WIRING ----------
    // Close & Info toggle + content-area tap-to-close (touch only)
    document.querySelectorAll(".text-editor").forEach(editor => {
        const closeBtn = editor.querySelector(".close-btn");
        const infoBtn = editor.querySelector(".btns .info");
        const fileInfo = editor.querySelector(".file-info");
        const contentArea = editor.querySelector(".content-area");

        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                editor.style.display = "none";
                if (fileInfo) fileInfo.classList.remove("open"); // also close sidebar when closing editor
            });
        }

        if (infoBtn && fileInfo) {
            infoBtn.addEventListener("click", () => {
                console.log('Info button clicked!', infoBtn);
                fileInfo.classList.toggle("open");
                console.log('File info classList after toggle:', fileInfo.classList);
            });
        } else {
            console.log('Missing elements:', { infoBtn, fileInfo });
        }

        // On touch devices, tapping inside .content-area closes the info sidebar
        if (contentArea && fileInfo) {
            contentArea.addEventListener("click", (ev) => {
                if (isTouchLike() && fileInfo.classList.contains("open")) {
                    fileInfo.classList.remove("open");
                    // Optional: prevent content click side-effects when closing
                    // ev.stopPropagation();
                }
            });
        }
    });

    // ---------- INIT ----------
    goRoot();
});
