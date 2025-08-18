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
