document.addEventListener('DOMContentLoaded', () => {

    // Intersection Observer for Fade-in Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => observer.observe(el));

    // Smooth Scrolling for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.textContent = navLinks.classList.contains('active') ? 'Close' : 'Menu';
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuBtn.textContent = 'Menu';
            });
        });
    }

    // Mobile Login Link Trigger
    const mobileLoginLink = document.getElementById('mobileLoginLink');
    if (mobileLoginLink) {
        mobileLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    // Login Modal Logic
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const closeBtn = document.querySelector('.close-btn');
    const loginForm = document.querySelector('.login-form');

    if (loginBtn && loginModal && closeBtn) {
        // Open Modal
        loginBtn.addEventListener('click', () => {
            loginModal.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });

        // Close Modal via X button
        closeBtn.addEventListener('click', () => {
            loginModal.classList.remove('show');
            document.body.style.overflow = '';
        });

        // Close Modal via Outside Click
        window.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    }

    // Handle Login Submit -> Redirect to Dashboard
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Simulate login delay or validation here if needed
            window.location.href = 'dashboard.html';
        });
    }

    // Speed Test Simulation Logic
    const startTestBtn = document.getElementById('startTestBtn');
    const speedDisplay = document.getElementById('speedDisplay');
    const speedStatus = document.getElementById('speedStatus');
    const needle = document.querySelector('.needle');
    const pingResult = document.getElementById('pingResult');
    const downloadResult = document.getElementById('downloadResult');
    const uploadResult = document.getElementById('uploadResult');

    if (startTestBtn) {
        startTestBtn.addEventListener('click', () => {
            startTestBtn.disabled = true;
            startTestBtn.textContent = "Testing...";

            // Reset
            pingResult.textContent = '--';
            downloadResult.textContent = '--';
            uploadResult.textContent = '--';
            needle.style.transform = 'rotate(-90deg)'; // Starting position

            // Simulation Sequence
            runSpeedTestSequence();
        });
    }

    function runSpeedTestSequence() {
        // Phase 1: Ping (Quick)
        speedStatus.textContent = "Checking Ping...";
        setTimeout(() => {
            const ping = Math.floor(Math.random() * (25 - 5) + 5); // 5-25ms
            pingResult.textContent = ping;

            // Phase 2: Download
            speedStatus.textContent = "Testing Download...";
            animateNeedle(true);
        }, 1000);
    }

    function animateNeedle(isDownload) {
        let currentSpeed = 0;
        const targetSpeed = isDownload ? Math.floor(Math.random() * (150 - 90) + 90) : Math.floor(Math.random() * (100 - 50) + 50); // DL: 90-150, UL: 50-100

        // Animate Needle & Numbers
        const interval = setInterval(() => {
            // Random fluctuation for "realism"
            const increment = Math.random() * 5 + 1;
            currentSpeed += increment;

            if (currentSpeed >= targetSpeed) {
                currentSpeed = targetSpeed;
                clearInterval(interval);

                // Phase Complete
                if (isDownload) {
                    downloadResult.textContent = targetSpeed.toFixed(1);
                    // Pause then Upload
                    setTimeout(() => {
                        needle.style.transform = 'rotate(-90deg)'; // Reset needle for Upload start
                        setTimeout(() => {
                            speedStatus.textContent = "Testing Upload...";
                            animateNeedle(false);
                        }, 500);
                    }, 1000);
                } else {
                    uploadResult.textContent = targetSpeed.toFixed(1);
                    finishTest();
                }
            }

            // Update UI
            speedDisplay.textContent = currentSpeed.toFixed(1);

            // Map speed 0-160 to degrees -90 to 90
            // -90deg = 0 Mbps, 90deg = 160 Mbps (Max Gauge)
            const maxGaugeSpeed = 160;
            const degree = -90 + (currentSpeed / maxGaugeSpeed) * 180;
            needle.style.transform = `rotate(${degree}deg)`;

        }, 50); // Update every 50ms
    }

    function finishTest() {
        speedStatus.textContent = "Test Completed";
        startTestBtn.textContent = "Test Again";
        startTestBtn.disabled = false;
        needle.style.transform = 'rotate(-90deg)'; // Reset needle
        speedDisplay.textContent = "0.0";
    }
});
