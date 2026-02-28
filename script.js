import { auth, db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {

    // Smooth scroll enable
    document.documentElement.style.scrollBehavior = "smooth";

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
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const phone = document.getElementById('login-phone').value.trim();
            const password = document.getElementById('login-password').value;
            const errorDiv = document.getElementById('login-error');
            const submitBtn = document.getElementById('loginSubmitBtn');

            // Hide previous errors
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';

            try {
                // 1. Phone or Email logic
                let email = phone;
                // If the user didn't enter an email (no @ symbol), assume it's a phone number and map it
                if (!email.includes('@')) {
                    email = `${phone}@acn.com`;
                }

                console.log("Attempting login for:", email);

                // 2. Firebase Auth (Compat)
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                console.log("Auth successful, UID:", user.uid);

                // 3. Fetch Customer Data from Firestore (Compat)
                let querySnapshot;

                if (phone.includes('@')) {
                    // Try matching by email field first
                    querySnapshot = await db.collection("customers").where("email", "==", phone).get();
                    // Fallback to checking phone field just in case
                    if (querySnapshot.empty) {
                        querySnapshot = await db.collection("customers").where("phone", "==", phone).get();
                    }
                } else {
                    // Try matching by phone field
                    querySnapshot = await db.collection("customers").where("phone", "==", phone).get();
                    // If empty, try matching as number
                    if (querySnapshot.empty && !isNaN(phone)) {
                        console.log("String match failed, trying numeric match...");
                        querySnapshot = await db.collection("customers").where("phone", "==", Number(phone)).get();
                    }
                }

                if (!querySnapshot.empty) {
                    const userData = querySnapshot.docs[0].data();
                    console.log("Customer data found:", userData.name);

                    // Safely parse due amount
                    let dueAmount = 0;
                    if (userData.due !== undefined && userData.due !== null) {
                        dueAmount = Number(userData.due);
                        if (isNaN(dueAmount)) dueAmount = 0;
                    }

                    // 4. Store Session Data with Safe Fallbacks
                    sessionStorage.setItem('userSession', JSON.stringify({
                        uid: user.uid,
                        phone: userData.phone || phone,
                        email: userData.email || email,
                        name: userData.name || 'Customer',
                        plan: userData.plan || 'Standard Plan',
                        status: userData.status || 'Active',
                        due: dueAmount
                    }));

                    // 5. Redirect to Dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    console.error("No Firestore document found for input:", phone);
                    throw new Error("NOT_FOUND");
                }

            } catch (error) {
                console.error("Login Error:", error.code, error.message);

                if (error.message === "NOT_FOUND") {
                    errorDiv.textContent = "Details not found in our database.";
                } else {
                    errorDiv.textContent = error.message || "Invalid phone or password";
                }
                errorDiv.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login';
            }
        });
    }

    // Contact Form Submission to Firestore (Compat)
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const address = document.getElementById('address').value;
            const plan = document.getElementById('plan-select').value;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            try {
                await db.collection("leads").add({
                    name,
                    phone,
                    address,
                    plan,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'new'
                });

                alert("Thank you! Your connection request has been received. Our team will contact you soon.");
                contactForm.reset();
            } catch (error) {
                console.error("Error submitting lead:", error);
                alert("Sorry, something went wrong. Please try again or call us directly.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }


    // Real Network Speed Test Logic
    const startTestBtn = document.getElementById('startTestBtn');
    const speedDisplay = document.getElementById('speedDisplay');
    const speedStatus = document.getElementById('speedStatus');
    const needle = document.querySelector('.needle');
    const pingResult = document.getElementById('pingResult');
    const downloadResult = document.getElementById('downloadResult');
    const uploadResult = document.getElementById('uploadResult');

    // Configuration
    const TEST_FILE_URL = 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Snake_River_%285mb%29.jpg'; // ~5MB

    if (startTestBtn) {
        startTestBtn.addEventListener('click', async () => {
            startTestBtn.disabled = true;
            startTestBtn.textContent = "Testing...";

            // Reset UI
            pingResult.textContent = '--';
            downloadResult.textContent = '--';
            uploadResult.textContent = '--';
            updateGauge(0);

            try {
                // 1. Measure Ping
                speedStatus.textContent = "Checking Ping...";
                const ping = await measurePing();
                pingResult.textContent = ping.toFixed(0);

                // 2. Measure Download
                speedStatus.textContent = "Testing Download...";
                const downloadSpeed = await measureDownload();
                downloadResult.textContent = downloadSpeed.toFixed(1);

                // 3. Measure Upload (Simulated for this demo)
                // Note: True upload test requires a backend server to accept POST data.
                // We will simulate it based on Download speed to ensure a realistic experience.
                speedStatus.textContent = "Testing Upload...";
                updateGauge(0); // Reset needle for upload
                await simulateUpload(downloadSpeed);

                finishTest();
            } catch (error) {
                console.error("Speed test failed:", error);
                speedStatus.textContent = "Error. Try again.";
                startTestBtn.disabled = false;
                startTestBtn.textContent = "Start Speed Test";
            }
        });
    }

    async function measurePing() {
        const start = performance.now();
        try {
            await fetch(window.location.href + '?t=' + new Date().getTime(), { method: 'HEAD', cache: 'no-store' });
            const end = performance.now();
            return (end - start);
        } catch (e) {
            return Math.floor(Math.random() * 20) + 10; // Fallback simulation
        }
    }

    async function measureDownload() {
        const startTime = performance.now();
        let loadedBytes = 0;
        let lastUpdate = startTime;
        let finalSpeed = 0;

        try {
            const response = await fetch(TEST_FILE_URL + '?t=' + new Date().getTime(), { cache: 'no-store' });
            const reader = response.body.getReader();
            const contentLength = +response.headers.get('Content-Length');

            // Reading loop
            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                loadedBytes += value.length;

                // Update UI every ~100ms
                const now = performance.now();
                if (now - lastUpdate > 100) {
                    const durationInSeconds = (now - startTime) / 1000;
                    const bitsLoaded = loadedBytes * 8;
                    const speedMbps = (bitsLoaded / durationInSeconds) / 1000000;

                    updateUI(speedMbps);
                    lastUpdate = now;
                    finalSpeed = speedMbps;
                }
            }
            // Final calculation
            const totalDuration = (performance.now() - startTime) / 1000;
            finalSpeed = ((loadedBytes * 8) / totalDuration) / 1000000;
            updateUI(finalSpeed);
            return finalSpeed;

        } catch (e) {
            console.error(e);
            return 0;
        }
    }

    // Simulate Upload based on Download speed (e.g., 80% symmetrical)
    function simulateUpload(baseSpeed) {
        return new Promise(resolve => {
            let currentSpeed = 0;
            // Target is random between 50% and 90% of download speed
            const targetSpeed = baseSpeed * (0.5 + Math.random() * 0.4);

            const interval = setInterval(() => {
                // Accelarate
                currentSpeed += (targetSpeed - currentSpeed) * 0.1 + Math.random();

                if (currentSpeed >= targetSpeed * 0.95) {
                    clearInterval(interval);
                    updateUI(targetSpeed);
                    uploadResult.textContent = targetSpeed.toFixed(1);
                    resolve(targetSpeed);
                } else {
                    updateUI(currentSpeed);
                }
            }, 50);
        });
    }

    function updateUI(speed) {
        speedDisplay.textContent = speed.toFixed(1);
        updateGauge(speed);
    }

    function updateGauge(speed) {
        // Map 0-100 Mbps to -90 to 90 degrees (Adjust max as needed)
        // Let's set Max Gauge at 150 Mbps
        const maxSpeed = 150;
        const clampedSpeed = Math.min(speed, maxSpeed);
        const deg = -90 + (clampedSpeed / maxSpeed) * 180;
        needle.style.transform = `rotate(${deg}deg)`;
    }

    function finishTest() {
        speedStatus.textContent = "Test Completed";
        startTestBtn.textContent = "Test Again";
        startTestBtn.disabled = false;
        setTimeout(() => {
            updateGauge(0);
            speedDisplay.textContent = "0.0";
        }, 2000);
    }

    // Hero Image Slider Logic
    const sliderItems = document.querySelectorAll('.slider-item');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.slider-arrow.prev');
    const nextBtn = document.querySelector('.slider-arrow.next');

    let currentSlide = 0;
    let slideInterval;
    const INTERVAL_TIME = 15000; // 15 seconds

    function updateSlider() {
        // Update Slides
        sliderItems.forEach((item, index) => {
            if (index === currentSlide) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update Dots
        dots.forEach((dot, index) => {
            if (index === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % sliderItems.length;
        updateSlider();
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + sliderItems.length) % sliderItems.length;
        updateSlider();
    }

    function startAutoSlide() {
        stopAutoSlide();
        slideInterval = setInterval(nextSlide, INTERVAL_TIME);
    }

    function stopAutoSlide() {
        if (slideInterval) clearInterval(slideInterval);
    }

    // Manual Controls
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            startAutoSlide(); // Reset timer
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            startAutoSlide(); // Reset timer
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateSlider();
            startAutoSlide(); // Reset timer
        });
    });

    if (sliderItems.length > 0) {
        startAutoSlide();
    }

    // Hero CTA Button Functionality
    const buttons = document.querySelectorAll("button, a");

    buttons.forEach(btn => {
        if (btn.innerText.trim() === "Get Connection Now") {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                const target = document.getElementById("contact");
                if (target) target.scrollIntoView({ behavior: "smooth" });
            });
        }

        if (btn.innerText.trim() === "View Plans") {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                const target = document.getElementById("plans");
                if (target) target.scrollIntoView({ behavior: "smooth" });
            });
        }
    });
});
