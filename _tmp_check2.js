        window.showError = function (err) {
            console.error('App Error:', err);
            const overlay = document.getElementById('errorOverlay');
            const msgEl = document.getElementById('errorMessage');
            if (overlay && msgEl) {
                msgEl.textContent = err && err.stack ? err.stack : String(err);
                overlay.classList.remove('hidden');
            }
        };
        // Global UI helpers
        window.hideLoading = function () {
            if (window.AppModules && window.AppModules.Utils && window.AppModules.Utils.hideLoading) {
                AppModules.Utils.hideLoading(() => {
                    var cp = document.getElementById('compatibilityPage');
                    if (cp) cp.classList.remove('hidden');
                });
            } else {
                // Failsafe: hide loading directly if modules are lagging or failed to load
                console.warn('App: AppModules is not defined yet. Hiding loading page directly.');
                const lp = document.getElementById('loadingPage');
                if (lp) {
                    lp.classList.add('opacity-0');
                    setTimeout(() => {
                        lp.classList.add('hidden');
                    }, 500);
                }
                var cp = document.getElementById('compatibilityPage');
                if (cp) cp.classList.remove('hidden');

                // Notify user about network timeout with an English native alert
                setTimeout(() => {
                    alert("Network Timeout:\nIt is taking longer than usual to load application files due to a slow connection.\n\nIf the page remains empty or messages fail to load, please reload the page.");
                }, 600);
            }
        };

        window.dismissCompatibility = function () {
            localStorage.setItem('compatibility_dismissed', 'true');
            var cp = document.getElementById('compatibilityPage');
            if (cp) cp.classList.add('hidden');
        };

        // Removed redundant showCustomAlert definition

        // Removed redundant await AppModules.Modal.confirm( definition

        // Catch all uncaught errors
        window.addEventListener('error', function (e) { showError(e.error || e.message); });
        window.addEventListener('unhandledrejection', function (e) { showError(e.reason); });

        // Failsafe: Force hide loading after 10 seconds
        setTimeout(() => {
            const lp = document.getElementById('loadingPage');
            if (lp && !lp.classList.contains('hidden')) {
                console.warn('Initialization watchdog: Forcing hide loading.');
                window.hideLoading();
            }
        }, 10000);
