// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const hero = document.querySelector('.hero');
    
    // The glitch animation duration is 6.5s (6500ms)
    const glitchDuration = 6500;
    
    // Add exit class after glitch animation ends
    setTimeout(() => {
        hero.classList.add('exit');
    }, glitchDuration);
});
