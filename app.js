function cancelWobbleAnimation(el) {
    el.classList.remove('loaded'); // remove the animation class
    el.style.animation = 'none';   // force it to stop
    void el.offsetWidth;            // reflow to reset styles
}


document.addEventListener('DOMContentLoaded', function () {
    const face = document.querySelector('.face-folder');
    // Stop wobble if user interacts
    ['pointerdown', 'touchstart', 'mousedown'].forEach(event => {
        face.addEventListener(event, () => {
            if (face.classList.contains('loaded')) {
                cancelWobbleAnimation(face);
            }
        });
    });
    const folders = document.querySelectorAll('.face-folder, .desc-folder, .rating-folder');

    // click toggling
    folders.forEach(folder => {
        folder.addEventListener('click', function () {
            if (this.classList.contains('active')) {
                folders.forEach(f => f.classList.remove('active'));
                face.classList.add('active'); // default back to face
            } else {
                folders.forEach(f => f.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // default active on load
    face.classList.add('active');

    const fders = document.querySelectorAll('.desc-folder, .face-folder, .rating-folder');

    fders.forEach(folder => {
        folder.classList.add('loaded');

        if (folder.classList.contains('face-folder')) {
            // face-folder needs TWO animations
            let count = 0;
            folder.addEventListener('animationend', () => {
                count++;
                if (count === 2) {
                    folder.classList.remove('loaded');
                }
            });
        } else {
            // desc + rating remove after first animation
            folder.addEventListener('animationend', () => {
                folder.classList.remove('loaded');
            }, { once: true });
        }
    });
});