document.addEventListener('DOMContentLoaded', function () {
    const face = document.querySelector('.face-folder');
    const folders = document.querySelectorAll('.face-folder, .desc-folder, .rating-folder');

    folders.forEach(folder => {
        folder.addEventListener('click', function () {
            // If the clicked one is already active
            if (this.classList.contains('active')) {
                // Reset all to default
                folders.forEach(f => f.classList.remove('active'));
                face.classList.add('active'); // face is default open
            } else {
                // Clear all active first
                folders.forEach(f => f.classList.remove('active'));
                // Activate only the clicked one
                this.classList.add('active');
            }
        });
    });

    // Set default on page load
    face.classList.add('active');
});

