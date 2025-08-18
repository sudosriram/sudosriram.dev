// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const quoteHero = document.querySelector('#quote-hero');
    const mainHero = document.querySelector('#main-hero');
    const quoteHeroDiv = quoteHero.querySelector('.hero');
    
    // Quote animation timeline:
    // - Quote text appears: 0s, 1.5s, 3s, 5s
    // - Glitch animation: 6.5s duration
    // - Exit animation: 1s delay + 1.2s duration
    
    const glitchDuration = 6500; // 6.5s
    const exitDelay = 1000; // 1s
    const exitDuration = 1200; // 1.2s
    
    // Add exit class after glitch animation ends
    setTimeout(() => {
        quoteHeroDiv.classList.add('exit');
    }, glitchDuration);
    
    // Total duration: glitch + exit delay + exit duration
    const totalQuoteDuration = glitchDuration + exitDelay + exitDuration;
    
    // Show main hero after quote hero completes
    setTimeout(() => {
        quoteHero.style.display = 'none';
        mainHero.style.display = 'block';
    }, totalQuoteDuration);
});
