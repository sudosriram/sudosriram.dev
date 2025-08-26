document.querySelectorAll(".contact .form-group input, .contact .form-group textarea").forEach(field => {
    const caret = document.createElement("div");
    caret.className = "fake-caret";
    caret.style.display = "none";
    field.parentNode.appendChild(caret);

    let typingTimeout;

    function updateCaret() {
        const selectionStart = field.selectionStart;
        const textBefore = field.value.substring(0, selectionStart);

        // Mirror span to measure text width
        const mirror = document.createElement("span");
        const style = window.getComputedStyle(field);

        mirror.style.position = "absolute";
        mirror.style.visibility = "hidden";
        mirror.style.whiteSpace = "pre"; // force exact spacing like <input type="text">
        mirror.style.fontFamily = style.fontFamily;
        mirror.style.fontSize = style.fontSize;
        mirror.style.fontWeight = style.fontWeight;
        mirror.style.letterSpacing = style.letterSpacing;
        mirror.style.textTransform = style.textTransform;
        mirror.style.fontVariantLigatures = "none"; // prevent ligatures

        mirror.textContent = textBefore.replace(/\s/g, "\u00a0");

        document.body.appendChild(mirror);
        const textWidth = mirror.getBoundingClientRect().width;
        mirror.remove();

        caret.style.left = (field.offsetLeft + textWidth + parseInt(style.paddingLeft)) + "px";
        caret.style.top = (field.offsetTop + parseInt(style.paddingTop)) + "px";
        caret.style.height = style.lineHeight;
        caret.style.display = "block";
    }

    function solidCaretThenBlink() {
        caret.classList.add("typing");
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            caret.classList.remove("typing");
        }, 0); // wait a bit before blinking
    }

    field.addEventListener("input", () => { updateCaret(); solidCaretThenBlink(); });
    field.addEventListener("keydown", () => { updateCaret(); solidCaretThenBlink(); });
    field.addEventListener("click", updateCaret);
    field.addEventListener("focus", updateCaret);
    field.addEventListener("keyup", updateCaret);
    field.addEventListener("blur", () => caret.style.display = "none");
});