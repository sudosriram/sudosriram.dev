// script.js
document.addEventListener('DOMContentLoaded', () => {
  const skipIntro = false; // set true while coding

  const quoteHero = document.getElementById('quote-hero');
  const mainHero  = document.getElementById('main-hero');

  const show = el => { if (el) el.style.display = 'block'; };
  const hide = el => { if (el) el.style.display = 'none'; };

  // Always wrap letters once the "visible" section is decided.
  const startMain = () => {
    show(mainHero);
    
    // Restart beam flicker animations
    restartBeamAnimations();
    
    // Start particles after lights stabilize (2s delay + 1.2s flicker = 3.2s)
    setTimeout(() => {
      startParticleAnimations();
    }, 3200);
    
    // Wait 2s for light beams to flicker and stabilize, then start text animation
    setTimeout(() => {
      startScramblingAnimation();
    }, 2000);
  };

  if (skipIntro) {
    hide(quoteHero);
    startMain(); // <-- call before returning so letters actually wrap
    return;
  }

  // If we're not skipping: only run the intro if the elements exist
  if (quoteHero) {
    const quoteHeroDiv = quoteHero.querySelector('.hero') || quoteHero;
    const glitchDuration = 6500;
    const exitDelay = 1000;
    const exitDuration = 1200;

    setTimeout(() => {
      quoteHeroDiv.classList.add('exit');
    }, glitchDuration);

    setTimeout(() => {
      hide(quoteHero);
      startMain();
    }, glitchDuration + exitDelay + exitDuration);
  } else {
    // No quote hero in the DOM — just start main
    startMain();
  }
});

// Restart beam flicker animations when main hero becomes visible
function restartBeamAnimations() {
  const beams = document.querySelectorAll('.beam');
  
  // Reset all beam animations by removing and re-adding the animation class
  beams.forEach((beam, index) => {
    // Remove existing animation
    beam.style.animation = 'none';
    
    // Force reflow to ensure the animation is truly reset
    beam.offsetHeight;
    
    // Re-apply the appropriate animation based on beam index
    if (index === 1 || index === 2 || index === 3) { // beams 2, 3, 4 (0-indexed)
      beam.style.animation = 'flicker 1.2s forwards cubic-bezier(.03,1.26,1,-0.68)';
    }
  });
}

// Start particle animations
function startParticleAnimations() {
  const particles = document.querySelectorAll('.particle');
  
  particles.forEach((particle, index) => {
    // Remove any existing animation
    particle.style.animation = 'none';
    particle.offsetHeight; // Force reflow
    
    // Get the original animation from CSS (particles are nth-child(6) through nth-child(10))
    const particleNumber = index + 1; // Convert to 1-based indexing for nth-child
    const delay = (particleNumber - 5) * 1000; // 1s, 2s, 3s, 4s, 5s delays
    
    setTimeout(() => {
      if (particleNumber === 1) particle.style.animation = 'circulate1 20s infinite linear';
      if (particleNumber === 2) particle.style.animation = 'circulate2 20s infinite linear';
      if (particleNumber === 3) particle.style.animation = 'circulate3 20s infinite linear';
      if (particleNumber === 4) particle.style.animation = 'circulate4 20s infinite linear';
      if (particleNumber === 5) particle.style.animation = 'circulate5 20s infinite linear';
    }, delay);
  });
}

// Start scroll animations after text is complete
function startScrollAnimations() {
  const scrollText = document.querySelector('.scroll > p');
  const scrollArrow = document.querySelector('.scroll .arrow');
  
  if (scrollText) {
    scrollText.style.animation = 'fade-in 1s linear forwards';
  }
  
  if (scrollArrow) {
    setTimeout(() => {
      scrollArrow.style.animation = 'move-arrow 1s infinite alternate ease-in-out';
      scrollArrow.style.opacity = '1';
    }, 1000); // 1s after text starts
  }
}

// Scrambling letter animation
function startScramblingAnimation() {
  const nameLetters = document.querySelectorAll('.hero-text .name .letter');
  const subtitleLetters = document.querySelectorAll('.hero-text .subtitle .letter');
  
  // Characters to use for scrambling
  const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  
  // Function to get random character
  const getRandomChar = () => scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
  
  // Function to animate a single letter
  const animateLetter = (element, targetChar, delay, duration = 1000) => {
    const originalChar = targetChar;
    let scrambleInterval = null;
    
    setTimeout(() => {
      // Start scrambling with glitch colors immediately
      element.style.opacity = '1';
      element.classList.add('scrambling'); // Add scrambling class for glitch colors
      
      // Don't scramble spaces
      if (originalChar === ' ' || originalChar === '-') {
        element.textContent = originalChar;
        element.classList.remove('scrambling');
        element.classList.add('revealed');
        return;
      }
      
      // Scramble rapidly with glitch colors
      scrambleInterval = setInterval(() => {
        element.textContent = getRandomChar();
      }, 50);
      
      // Stop scrambling and reveal correct letter with normal colors
      setTimeout(() => {
        clearInterval(scrambleInterval);
        element.textContent = originalChar;
        element.classList.remove('scrambling'); // Remove glitch colors
        element.classList.add('revealed'); // Add normal styling
      }, duration);
      
    }, delay);
  };
  
  // Animate name letters (6 letters)
  nameLetters.forEach((letter, index) => {
    const targetChar = letter.getAttribute('data-letter');
    const delay = index * 200; // Stagger each letter by 200ms
    const duration = 800 + (index * 100); // Each letter scrambles longer
    animateLetter(letter, targetChar, delay, duration);
  });
  
  // Animate subtitle letters after name is done
  const nameAnimationDelay = nameLetters.length * 200 + 1000; // Wait for name to mostly finish
  subtitleLetters.forEach((letter, index) => {
    const targetChar = letter.getAttribute('data-letter');
    const delay = nameAnimationDelay + (index * 40); // Faster stagger for subtitle
    const duration = 400 + (index * 20); // Shorter scramble duration
    animateLetter(letter, targetChar, delay, duration);
  });
  
  // Start periodic glitch effect after all animations are done
  const totalAnimationTime = nameAnimationDelay + (subtitleLetters.length * 40) + 1000;
  setTimeout(() => {
    startPeriodicGlitchEffect();
  }, totalAnimationTime);
  
  // Start scroll animations after all text is complete
  setTimeout(() => {
    startScrollAnimations();
  }, totalAnimationTime + 500); // 500ms after text is fully assembled
}

// Periodic glitch effects - single letter only
function startPeriodicGlitchEffect() {
  const nameLetters = document.querySelectorAll('.hero-text .name .letter');
  const glitchChars = '!@#$%^&*(){}[]<>?/\\|~`+=';
  const getRandomGlitchChar = () => glitchChars[Math.floor(Math.random() * glitchChars.length)];
  
  // Single letter glitch from SRIRAM
  const glitchRandomLetter = () => {
    // Pick a random letter from SRIRAM
    const randomIndex = Math.floor(Math.random() * nameLetters.length);
    const letterElement = nameLetters[randomIndex];
    const originalChar = letterElement.getAttribute('data-letter');
    
    // Apply glitch class and change to random symbol
    letterElement.classList.add('glitch');
    letterElement.textContent = getRandomGlitchChar();
    
    // Revert back after glitch animation
    setTimeout(() => {
      letterElement.classList.remove('glitch');
      letterElement.textContent = originalChar;
    }, 300); // Match the CSS animation duration
  };
  
  // Start single letter glitch every 2 seconds
  setInterval(glitchRandomLetter, 2000);
}

// Wrap each character in .hero-text h1 and p with <span class="letter">
function wrapLettersInSpans() {
  const blocks = document.querySelectorAll('.hero-text');
  if (!blocks.length) return;

  blocks.forEach(block => {
    ['h1', 'p'].forEach(sel => {
      const el = block.querySelector(sel);
      if (!el) return;

      const text = el.textContent;
      const frag = document.createDocumentFragment();

      for (let i = 0; i < text.length; i++) {
        const span = document.createElement('span');
        span.textContent = text[i];
        span.className = text[i] === ' ' ? 'letter space' : 'letter';
        span.dataset.index = i; // handy for staggered animations
        frag.appendChild(span);
      }

      el.textContent = '';
      el.appendChild(frag);
    });
  });
}
