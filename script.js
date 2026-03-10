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
        startTestBtn.addEventListener('click', () => {
            window.open('https://www.speedtest.net/', '_blank');
        });
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

    // Plan Details Modal Logic
    const planDetailsModal = document.getElementById('planDetailsModal');
    const closePlanModal = document.getElementById('closePlanModal');
    const moreDetailsBtns = document.querySelectorAll('.more-details-btn');
    const modalPlanName = document.getElementById('modalPlanName');
    const modalPlanFeatures = document.getElementById('modalPlanFeatures');

    const planData = {
        'Basic': {
            name: 'Basic Plan (₹499/mo)',
            features: [
                { icon: 'ph-speedometer', label: 'Speed', value: '50 Mbps' },
                { icon: 'ph-database', label: 'Data', value: 'Unlimited Data' },
                { icon: 'ph-wrench', label: 'Installation', value: 'Free Installation' },
                { icon: 'ph-router', label: 'Router', value: 'Available on request' },
                { icon: 'ph-television', label: 'OTT Apps', value: 'Not included' },
                { icon: 'ph-headset', label: 'Support', value: 'Standard Support' },
                { icon: 'ph-star', label: 'Benefits', value: 'Perfect for seamless daily browsing.' }
            ]
        },
        'Standard': {
            name: 'Standard Plan - Popular (₹699/mo)',
            features: [
                { icon: 'ph-speedometer', label: 'Speed', value: '100 Mbps' },
                { icon: 'ph-database', label: 'Data', value: 'Unlimited Data' },
                { icon: 'ph-wrench', label: 'Installation', value: 'Free Installation' },
                { icon: 'ph-router', label: 'Router', value: 'Free 5G Dual Band Router' },
                { icon: 'ph-television', label: 'OTT Apps', value: 'Prime Video, Hotstar, SonyLIV, Zee5 + 10 more' },
                { icon: 'ph-headset', label: 'Support', value: 'Priority Support' },
                { icon: 'ph-star', label: 'Benefits', value: 'Ideal for 4K streaming and WFH.' }
            ]
        },
        'Premium': {
            name: 'Premium Plan (₹999/mo)',
            features: [
                { icon: 'ph-speedometer', label: 'Speed', value: '200 Mbps' },
                { icon: 'ph-database', label: 'Data', value: 'Unlimited Data' },
                { icon: 'ph-wrench', label: 'Installation', value: 'Free Priority Installation' },
                { icon: 'ph-router', label: 'Router', value: 'Free Premium Wi-Fi 6 Router' },
                { icon: 'ph-television', label: 'OTT Apps', value: 'Netflix, Prime, Hotstar, SonyLIV + Live TV' },
                { icon: 'ph-headset', label: 'Support', value: '24x7 VIP Support' },
                { icon: 'ph-star', label: 'Benefits', value: 'Ultimate gaming and 8K streaming experience.' }
            ]
        }
    };

    if (planDetailsModal && closePlanModal) {
        moreDetailsBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const planType = btn.getAttribute('data-plan');
                const details = planData[planType];

                if (details) {
                    modalPlanName.textContent = details.name;

                    // Clear previous features
                    modalPlanFeatures.innerHTML = '';

                    // Populate features
                    details.features.forEach(feature => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <div class="feature-icon"><i class="ph ${feature.icon}"></i></div>
                            <div class="feature-text">
                                <span class="feature-label">${feature.label}:</span>
                                <span class="feature-value">${feature.value}</span>
                            </div>
                        `;
                        modalPlanFeatures.appendChild(li);
                    });

                    // Set contact form dropdown to match the plan
                    const planSelect = document.getElementById('plan-select');
                    if (planSelect) {
                        Array.from(planSelect.options).forEach(opt => {
                            if (opt.value.toLowerCase() === planType.toLowerCase()) {
                                opt.selected = true;
                            }
                        });
                    }

                    planDetailsModal.classList.add('show');
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        closePlanModal.addEventListener('click', () => {
            planDetailsModal.classList.remove('show');
            document.body.style.overflow = '';
        });

        window.addEventListener('click', (e) => {
            if (e.target === planDetailsModal) {
                planDetailsModal.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    }

    // Hero CTA Button Functionality
    const buttons = document.querySelectorAll("button, a");

    buttons.forEach(btn => {
        if (btn.innerText.trim() === "Get Connection Now") {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                const target = document.getElementById("get-connected");
                if (target) target.scrollIntoView({ behavior: "smooth" });
            });
        }

        if (btn.innerText.trim() === "View Plans") {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                const target = document.getElementById("choose-plan");
                if (target) target.scrollIntoView({ behavior: "smooth" });
            });
        }
    });
});
