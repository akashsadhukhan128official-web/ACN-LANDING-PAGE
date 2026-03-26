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

    // --- Modal Toggling Logic ---
    const loginModal = document.getElementById('loginModal');
    const signUpModal = document.getElementById('signUpModal');

    // Open Login Modal buttons (Header & Mobile)
    const loginBtn = document.getElementById('loginBtn');
    const mobileLoginLink = document.getElementById('mobileLoginLink');

    const openLogin = (e) => {
        if (e) e.preventDefault();
        if (signUpModal) signUpModal.classList.remove('show');
        if (loginModal) loginModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    };

    if (loginBtn) loginBtn.addEventListener('click', openLogin);
    if (mobileLoginLink) mobileLoginLink.addEventListener('click', openLogin);

    // Close Modal via X buttons
    const closeLoginModalBtn = document.getElementById('closeLoginModal');
    const closeSignUpModalBtn = document.getElementById('closeSignUpModal');

    if (closeLoginModalBtn) closeLoginModalBtn.addEventListener('click', () => {
        loginModal.classList.remove('show');
        document.body.style.overflow = '';
    });
    if (closeSignUpModalBtn) closeSignUpModalBtn.addEventListener('click', () => {
        signUpModal.classList.remove('show');
        document.body.style.overflow = '';
    });

    // Close Models via Outside Click
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.classList.remove('show');
            document.body.style.overflow = '';
        }
        if (e.target === signUpModal) {
            signUpModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // Switch between Login and Sign Up Modals
    const openSignUpBtn = document.getElementById('openSignUpBtn');
    const backToLoginBtn = document.getElementById('backToLoginBtn');

    if (openSignUpBtn) openSignUpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (loginModal) loginModal.classList.remove('show');
        if (signUpModal) signUpModal.classList.add('show');
    });

    if (backToLoginBtn) backToLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (signUpModal) signUpModal.classList.remove('show');
        if (loginModal) loginModal.classList.add('show');
    });


    // --- Handle Sign Up Logic ---
    const signUpForm = document.getElementById('signUpForm');
    if (signUpForm) {
        signUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('signUpSubmitBtn');
            const errorDiv = document.getElementById('signup-error');
            
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const phone = document.getElementById('signup-phone').value.trim();
            const address = document.getElementById('signup-address').value.trim();
            const password = document.getElementById('signup-password').value;

            errorDiv.style.display = 'none';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';

            try {
                // 1. Create User in Firebase Auth
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // 2. Save Additional Info to Firestore
                await db.collection('customers').doc(user.uid).set({
                    name: name,
                    email: email,
                    phone: phone,
                    address: address,
                    plan: 'Standard Plan', // Default plan for new signups
                    status: 'Active',
                    due: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // 3. Store Session Data
                sessionStorage.setItem('userSession', JSON.stringify({
                    uid: user.uid,
                    phone: phone,
                    email: email,
                    name: name,
                    plan: 'Standard Plan',
                    status: 'Active',
                    due: 0
                }));

                // 4. Redirect to Dashboard
                window.location.href = 'dashboard.html';

            } catch (error) {
                console.error("Sign Up Error:", error);
                errorDiv.textContent = error.message || "Failed to create account.";
                errorDiv.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign Up';
            }
        });
    }

    // --- Handle Login Submit -> Redirect to Dashboard ---
    const loginForm = document.querySelector('.login-form'); // First form is login
    if (loginForm && !loginForm.id) { // Ensure we target the login form, not signup
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
                    // If no firestore document, still log them in using basic Auth details directly (Fallback for newly created accounts lacking Firestore docs in some edges cases)
                    sessionStorage.setItem('userSession', JSON.stringify({
                        uid: user.uid,
                        email: email,
                        name: 'Customer',
                        plan: 'Standard Plan',
                        status: 'Active',
                        due: 0
                    }));
                    window.location.href = 'dashboard.html';
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

    // --- Forgot Password Logic ---
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const phoneInput = document.getElementById('login-phone').value.trim();
            const errorDiv = document.getElementById('login-error');
            
            if (!phoneInput) {
                errorDiv.textContent = "Please enter your registered email address above.";
                errorDiv.style.display = 'block';
                return;
            }

            let email = phoneInput;
            if (!email.includes('@')) {
                 email = `${phoneInput}@acn.com`; // Fallback Mapping for phone numbers
            }

            try {
                forgotPasswordBtn.textContent = "Sending...";
                await auth.sendPasswordResetEmail(email);
                errorDiv.style.color = 'green';
                errorDiv.textContent = `Password reset link sent to ${email}`;
                errorDiv.style.display = 'block';
            } catch (error) {
                errorDiv.style.color = '#ff4d4d';
                errorDiv.textContent = error.message;
                errorDiv.style.display = 'block';
            } finally {
                setTimeout(() => { forgotPasswordBtn.textContent = "Forgot Password?"; }, 2000);
            }
        });
    }

    // Contact Form Submission to Firestore (Compat)
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const statusEl = document.getElementById('contactFormStatus');
            const originalText = submitBtn.textContent;

            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const address = document.getElementById('address').value;
            const plan = document.getElementById('plan-select').value;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            if (statusEl) {
                statusEl.textContent = '';
                statusEl.className = 'form-status';
            }

            try {
                await db.collection("leads").add({
                    name,
                    phone,
                    address,
                    plan,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'new'
                });

                contactForm.reset();
                if (statusEl) {
                    statusEl.textContent = 'Thanks! Your connection request has been received. Our team will contact you soon.';
                    statusEl.classList.add('success');
                }
            } catch (error) {
                console.error("Error submitting lead:", error);
                if (statusEl) {
                    statusEl.textContent = 'Sorry, something went wrong. Please try again or call us directly.';
                    statusEl.classList.add('error');
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    const callNowBtn = document.querySelector('.btn-action.call');
    const whatsappBtn = document.querySelector('.btn-action.whatsapp');

    if (callNowBtn) {
        callNowBtn.addEventListener('click', () => {
            window.location.href = 'tel:+919874026889';
        });
    }

    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            window.open('https://wa.me/919874026889?text=Hi%20ACN%20Broadband%2C%20I%20want%20a%20new%20connection.', '_blank', 'noopener');
        });
    }


    // Inline Speed Test Demo
    const startTestBtn = document.getElementById('startTestBtn');
    const speedDisplay = document.getElementById('speedDisplay');
    const speedStatus = document.getElementById('speedStatus');
    const needle = document.querySelector('.needle');
    const pingResult = document.getElementById('pingResult');
    const downloadResult = document.getElementById('downloadResult');
    const uploadResult = document.getElementById('uploadResult');
    let speedTestRunning = false;

    const updateGauge = (value) => {
        const normalized = Math.max(0, Math.min(value, 200));
        const angle = -90 + (normalized / 200) * 180;

        if (needle) {
            needle.style.transform = `rotate(${angle}deg)`;
        }

        if (speedDisplay) {
            speedDisplay.textContent = normalized.toFixed(1);
        }
    };

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const animateMetric = async (from, to, duration, label) => {
        const start = performance.now();

        return new Promise((resolve) => {
            const tick = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                const current = from + ((to - from) * progress);
                updateGauge(current);

                if (speedStatus) {
                    speedStatus.textContent = label;
                }

                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    resolve(current);
                }
            };

            requestAnimationFrame(tick);
        });
    };

    if (startTestBtn) {
        startTestBtn.addEventListener('click', function (e) {
            e.preventDefault();
            window.open('https://www.speedtest.net', '_blank');
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
    const heroGetStartedBtn = document.getElementById('heroGetStarted');
    if (heroGetStartedBtn) {
        heroGetStartedBtn.addEventListener("click", function (e) {
            e.preventDefault();
            const target = document.getElementById("get-connected");
            if (target) target.scrollIntoView({ behavior: "smooth" });
        });
    }

    const heroViewPlansBtn = document.getElementById('heroViewPlans');
    if (heroViewPlansBtn) {
        heroViewPlansBtn.addEventListener("click", function (e) {
            e.preventDefault();
            window.location.href = 'plans.html';
        });
    }
});
