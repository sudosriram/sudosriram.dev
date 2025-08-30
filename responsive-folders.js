document.addEventListener("DOMContentLoaded", () => {
    const sideBar = document.querySelector(".side-bar");
    const sidebarItems = document.querySelectorAll(".side-bar .item");
    const folderArea = document.querySelector(".folder-area");

    // Status bar bits
    const root = document.querySelector(".status-bar .root");
    const slash = document.querySelector(".status-bar .slash");
    const statusItems = Array.from(document.querySelectorAll(".status-bar .status-item"));

    // --- Build a robust Name -> Group map from actual folder tiles (not README) ---
    // Each project has two .pair for the same group: one with .f (folder), one README.md
    const PROJECTS = (() => {
        const map = {};
        document.querySelectorAll(".folder-area .pair .f").forEach(f => {
            const pair = f.closest(".pair");
            const name = pair.querySelector(".fname")?.textContent.trim();
            const group = [...pair.classList].find(c => c !== "pair"); // e.g., "crypt", "book", "xbank", "sriram"
            if (name && group) map[name] = group;
        });
        return map;
    })();

    // Helper: touch/small-screen vs desktop
    const isTouchLike = () =>
        /Mobi|Android|iPad|iPhone/i.test(navigator.userAgent) ||
        window.matchMedia("(max-width: 1024px)").matches;

    // ---------- VIEW CONTROLS ----------
    function setActiveSidebar(name) {
        sidebarItems.forEach(item => {
            const txt = item.querySelector("p")?.textContent.trim();
            item.classList.toggle("active", txt === name);
        });
    }

    function updateStatusBarDefault() {
        // Root visible & .now
        root.querySelectorAll("i, p").forEach(el => {
            el.classList.add("now");
            el.classList.remove("available");
            el.style.display = "inline-block";
        });

        // Hide slash and all project status items
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
        // Root visible but becomes .available
        root.querySelectorAll("i, p").forEach(el => {
            el.classList.remove("now");
            el.classList.add("available");
            el.style.display = "inline-block";
        });

        // Show slash
        if (slash) slash.style.display = "inline-block";

        // Show only the current project's status item and mark it .now
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

    // Show only folder tiles (default) / hide all README.md tiles
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
        setActiveSidebar("Projects");
        updateStatusBarDefault();
        showDefaultFolders();
    }

    function openProject(projectName) {
        if (!(projectName in PROJECTS)) return; // safety
        setActiveSidebar(projectName);
        updateStatusBarProject(projectName);
        showOnlyReadmeOf(projectName);
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

    // Folder area:
    // - On touch/small: SINGLE click opens
    // - On desktop: DOUBLE click opens
    folderArea.addEventListener("click", (e) => {
        if (!isTouchLike()) return; // desktop uses dblclick
        const pair = e.target.closest(".pair");
        if (!pair) return;
        const fname = pair.querySelector(".fname")?.textContent.trim();
        if (!fname || fname === "README.md") return; // ignore README tiles
        openProject(fname);
    });

    folderArea.addEventListener("dblclick", (e) => {
        if (isTouchLike()) return; // touch uses single click
        const pair = e.target.closest(".pair");
        if (!pair) return;
        const fname = pair.querySelector(".fname")?.textContent.trim();
        if (!fname || fname === "README.md") return; // ignore README tiles
        openProject(fname);
    });

    // No need to rebind on resize — the handlers check isTouchLike() at event time
    window.addEventListener("resize", () => {
        // If user resized back to wide desktop while inside a project, nothing to do.
        // Click method switches automatically due to isTouchLike() check above.
    });

    // ---------- INIT ----------
    goRoot();
});



document.addEventListener("DOMContentLoaded", () => {
    const editors = document.querySelectorAll(".text-editor");

    // Clicking README.md tile opens its editor
    document.querySelector(".folder-area").addEventListener("click", (e) => {
        const pair = e.target.closest(".pair");
        if (!pair) return;

        const fname = pair.querySelector(".fname")?.textContent.trim();
        const project = pair.dataset.project;
        if (fname !== "README.md" || !project) return;

        // Hide all editors first
        editors.forEach(ed => ed.style.display = "none");

        // Show the one for this project
        const editor = document.querySelector(`.text-editor[data-project="${project}"]`);
        if (editor) editor.style.display = "flex";
    });

    // Close & Info toggle inside each editor
    editors.forEach(editor => {
        const closeBtn = editor.querySelector(".close-btn");
        const infoBtn = editor.querySelector(".info");
        const fileInfo = editor.querySelector(".file-info");

        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                editor.style.display = "none";
                if (fileInfo) fileInfo.classList.remove("open"); // also close sidebar when closing editor
            });
        }

        if (infoBtn && fileInfo) {
            infoBtn.addEventListener("click", () => {
                fileInfo.classList.toggle("open");
            });
        }
    });
});