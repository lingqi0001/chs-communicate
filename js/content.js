/**
 * [文字资源库] content.js
 * 存放应用中所有超长文本（服务条款、更新日志等）
 */

// 1. 服务条款 (Terms of Service)
export const TOS_CONTENT = `
    <h1 class="text-2xl font-black text-black dark:text-white">Terms of Service for CHS-Communicate (CHSchat)</h1>
    <p class="text-xs text-gray-500 font-bold uppercase tracking-widest">Last Updated: May 2, 2026</p>

    <section class="space-y-2">
        <h2 class="font-bold text-black dark:text-white">1. Acceptance of Terms</h2>
        <p>By accessing or using CHS iMESSage Ultimate (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service. These Terms apply to all visitors, users, and others who access the Service.</p>
    </section>

    <section class="space-y-2">
        <h2 class="font-bold text-black dark:text-white">2. Eligibility and Account Security</h2>
        <p><strong>Authorized Users:</strong> This Service is designed for students and staff of Centennial High School and the Howard County Public School System (HCPSS).</p>
        <p><strong>Authentication:</strong> Users are required to authenticate using their official HCPSS-provided email addresses.</p>
        <p><strong>Account Responsibility:</strong> You are responsible for maintaining the confidentiality of your login credentials. You agree to accept responsibility for all activities that occur under your account.</p>
    </section>

    <section class="space-y-2">
        <h2 class="font-bold text-black dark:text-white">3. Nature of Service (Student Project Disclosure)</h2>
        <p><strong>Non-Commercial/Educational Use:</strong> CHS-Communicate is a non-profit, student-developed experimental project. It is not an official product of HCPSS or any commercial entity.</p>
        <p><strong>"As-Is" Provision:</strong> The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The developer makes no warranties, expressed or implied, regarding the reliability, availability, or lack of errors within the application.</p>
    </section>

    <section class="space-y-2">
        <h2 class="font-bold text-black dark:text-white">4. Third-Party Services and Infrastructure</h2>
        <p>The Service relies on third-party infrastructure to function:</p>
        <p><strong>Hosting:</strong> The Service is hosted via Vercel.</p>
        <p><strong>Database and Authentication:</strong> Data storage and user authentication are managed through Google Firebase.</p>
        <p><strong>Limitation of Third-Party Liability:</strong> You acknowledge that the developer has no control over the uptime or security practices of Vercel or Firebase. Any service interruptions or data loss caused by these third-party providers are outside the developer’s liability.</p>
    </section>

    <section class="space-y-2">
        <h2 class="font-bold text-black dark:text-white">5. User Conduct and Content Standards</h2>
        <p>To maintain a safe educational environment, you agree NOT to:</p>
        <ul class="list-disc ml-5 space-y-1">
            <li><strong>Harassment:</strong> Engage in bullying, stalking, or sending threatening/insulting messages to other users.</li>
            <li><strong>Impersonation:</strong> Use a name other than your own or attempt to impersonate school officials, teachers, or other students.</li>
            <li><strong>Illegal Activity:</strong> Post content that violates U.S. federal law, Maryland state law, or HCPSS Board of Education policies.</li>
            <li><strong>Malicious Use:</strong> Attempt to interfere with the Service’s operation, including but not limited to "spamming," "DDoS attacks," or unauthorized data scraping.</li>
        </ul>
    </section>

    <section class="space-y-2">
        <h2 class="font-bold text-black dark:text-white">6. Administrative Rights and Content Moderation</h2>
        <p>The developer and appointed administrators reserve the right to:</p>
        <ul class="list-disc ml-5 space-y-1">
            <li><strong>Monitor:</strong> Review content posted on the Service to ensure compliance with these Terms.</li>
            <li><strong>Remove:</strong> Delete any message, announcement, or post at their sole discretion without prior notice.</li>
            <li><strong>Suspend:</strong> Terminate or suspend access to the Service for any user who violates these Terms or school policies.</li>
        </ul>
    </section>

    <section class="space-y-2">
        <h2 class="font-bold text-black dark:text-white">7. Privacy and Data Access</h2>
        <p>While we strive to protect user data, please be aware that:</p>
        <p><strong>No Expectation of Privacy:</strong> As this is a school-focused communication tool, administrators may access message logs if required for safety, security, or disciplinary investigations.</p>
        <p><strong>Data Usage:</strong> Your HCPSS email and name are used solely for identification and functional purposes within the app.</p>
    </section>

    <section class="space-y-2">
        <h2 class="font-bold text-black dark:text-white">8. Limitation of Liability</h2>
        <p>To the maximum extent permitted by applicable law, in no event shall the developer (Moss Mo) be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, or other intangible losses, resulting from your access to or use of the Service.</p>
    </section>

    <section class="space-y-2">
        <h2 class="font-bold text-black dark:text-white">9. Indemnification</h2>
        <p>You agree to defend, indemnify, and hold harmless the developer from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses resulting from your use of the Service.</p>
    </section>

    <section class="space-y-2">
        <h2 class="font-bold text-black dark:text-white">10. Governing Law</h2>
        <p>These Terms shall be governed and construed in accordance with the laws of the State of Maryland, United States.</p>
    </section>

    <section class="space-y-2">
        <h2 class="font-bold text-black dark:text-white">11. Changes to Terms</h2>
        <p>We reserve the right to modify or replace these Terms at any time. Your continued use of the Service after such changes constitutes acceptance of the new Terms.</p>
    </section>
`;

// 2. 工程日志 (Engineering Log / Changelog)
export const CHANGELOG_CONTENT = `
    <div class="space-y-10">
        <!-- v5.0 -->
        <section class="space-y-4">
            <div class="sticky top-0 bg-white dark:bg-[#1C1C1E] py-2 z-10 flex items-center gap-3 border-b border-gray-100 dark:border-white/5">
                <span class="bg-blue-500 text-white text-xs font-black px-2 py-0.5 rounded-md">v5.0</span>
                <h3 class="font-bold text-base">Real-time Engine & Automation</h3>
            </div>
            <div class="space-y-6">
                <div>
                    <h4 class="text-xs font-bold text-gray-400 uppercase mb-2">New Features</h4>
                    <ul class="list-disc ml-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li>Real-time news synchronization via Firebase onValue listeners</li>
                        <li>Asynchronous UI reconciliation with state-aware animations</li>
                        <li>Smart Linkify URL sanitization regex (Trailing punctuation exclusion)</li>
                        <li>Incremental Apps Script Sync (newer_than:1d) with star-based de-duplication</li>
                        <li>Automated tabType classification (Media/Club keyword scanning)</li>
                        <li>Intelligent Canvas divider & footer stripping logic</li>
                        <li>Automation runtime window constraints (07:00-17:00) for quota management</li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-[11px] font-bold text-blue-500 uppercase mb-2">Improvements</h4>
                    <ul class="list-disc ml-4 space-y-1 text-[13px] text-gray-600 dark:text-gray-400">
                        <li>Enhanced news rendering performance with targeted DOM updates</li>
                        <li>Added slide-in-from-bottom-2 keyframe transitions for new posts</li>
                        <li>Optimized Google Apps Script execution time and memory footprint</li>
                        <li>Improved CSS animation fluidity for announcement transitions</li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-[11px] font-bold text-red-500 uppercase mb-2">Bug Fixes</h4>
                    <ul class="list-disc ml-4 space-y-1 text-[13px] text-gray-600 dark:text-gray-400">
                        <li>Resolved saveLocalNews ReferenceError in news initialization</li>
                        <li>Fixed URL parsing bug capturing trailing parentheses in announcements</li>
                        <li>Corrected tabType mismatch for student community emails</li>
                    </ul>
                </div>
            </div>
        </section>

        <!-- v4.0 -->
        <section class="space-y-4">
            <div class="sticky top-0 bg-white dark:bg-[#1C1C1E] py-2 z-10 flex items-center gap-3 border-b border-gray-100 dark:border-white/5">
                <span class="bg-blue-500 text-white text-xs font-black px-2 py-0.5 rounded-md">v4.0</span>
                <h3 class="font-bold text-base">Performance & Storage</h3>
            </div>
            <div class="space-y-6">
                <div>
                    <h4 class="text-xs font-bold text-gray-400 uppercase mb-2">New Features</h4>
                    <ul class="list-disc ml-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li>Firebase Storage integration for cloud image hosting</li>
                        <li>Smart client-side image compression (800px max)</li>
                        <li>Optimized JPEG quality (0.6) for data savings</li>
                        <li>URL-based image messaging system</li>
                        <li>Native browser caching support for media</li>
                        <li>User image quota system (15 images limit)</li>
                        <li>Rolling FIFO (First-In-First-Out) overwrite mechanism</li>
                        <li>Pre-deletion confirmation prompts</li>
                        <li>Admin Purge Tool for centralized storage cleanup</li>
                        <li>Automated stale image cleanup logic</li>
                        <li>5-day auto-expiry strategy for non-essential media</li>
                        <li>"Image Expired" UI placeholders</li>
                        <li>Graceful image load error handling</li>
                        <li>Real-time upload status (Uploading...) feedback</li>
                        <li>Hardened error recovery for interrupted uploads</li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-[11px] font-bold text-blue-500 uppercase mb-2">Improvements</h4>
                    <ul class="list-disc ml-4 space-y-1 text-[13px] text-gray-600 dark:text-gray-400">
                        <li>90%+ reduction in image data consumption</li>
                        <li>Significant reduction in chat thread load times</li>
                        <li>Minimized server-side bandwidth overhead</li>
                        <li>Enhanced real-time message sync efficiency</li>
                        <li>True incremental sync (fetching new data only)</li>
                        <li>Removed redundant background consistency checks</li>
                        <li>Optimized local IndexDB cache strategy</li>
                        <li>Minimized Firebase request counts</li>
                        <li>Smart scrolling (auto-scroll only when at bottom)</li>
                        <li>Uninterrupted reading during new message arrival</li>
                        <li>Responsive UI interaction during heavy sync</li>
                        <li>Improved cloud storage utilization efficiency</li>
                        <li>Cost control and quota management optimization</li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-[11px] font-bold text-red-500 uppercase mb-2">Bug Fixes</h4>
                    <ul class="list-disc ml-4 space-y-1 text-[13px] text-gray-600 dark:text-gray-400">
                        <li>Fixed "Ghost Data" issue where deleted contacts reappeared</li>
                        <li>Resolved ID case-sensitivity sync bugs</li>
                        <li>Fixed global search result navigation</li>
                        <li>Corrected announcement jump positioning</li>
                        <li>Resolved message index positioning errors</li>
                        <li>Fixed multi-image stack rendering anomalies</li>
                        <li>Corrected toggleStack expansion logic</li>
                        <li>Improved image container adaptation for stacks</li>
                        <li>Fixed "Uploading..." hang issues</li>
                        <li>Resolved input field lock-up bugs</li>
                        <li>Added missing upload failure feedback</li>
                        <li>Fixed timeout handling for large files</li>
                        <li>Prevented crashes on corrupted image loads</li>
                        <li>Resolved URL parsing errors in image groups</li>
                        <li>Fixed local cache conflict anomalies</li>
                        <li>Resolved duplicate message loading</li>
                        <li>Fixed scroll jitter in long chat threads</li>
                        <li>Removed forced scroll-to-bottom on history load</li>
                        <li>Fixed UI stuttering during heavy media loads</li>
                        <li>Corrected image alignment offsets</li>
                    </ul>
                </div>
            </div>
        </section>

        <!-- v3.0 -->
        <section class="space-y-4">
            <div class="sticky top-0 bg-white dark:bg-[#1C1C1E] py-2 z-10 flex items-center gap-3 border-b border-gray-100 dark:border-white/5">
                <span class="bg-gray-200 dark:bg-white/10 text-gray-500 text-xs font-black px-2 py-0.5 rounded-md">v3.0</span>
                <h3 class="font-bold text-base">Experience & Accessibility</h3>
            </div>
            <div class="space-y-6">
                <div>
                    <h4 class="text-xs font-bold text-gray-400 uppercase mb-2">New Features</h4>
                    <ul class="list-disc ml-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li>Deployment on GitHub Pages for global access</li>
                        <li>Instant publishing capability with no quota caps</li>
                        <li>Forced Service Worker updates for live patching</li>
                        <li>Global unread message red-dot indicators</li>
                        <li>Minimalist login flow (Email + 8888 pass)</li>
                        <li>Automated account registration system</li>
                        <li>Admin push notifications for new sign-ups</li>
                        <li>Auto-generated welcome chats for new users</li>
                        <li>Step-by-step user onboarding flow</li>
                        <li>Full support for Chinese character usernames</li>
                        <li>Multi-language input method compatibility</li>
                        <li>Restored push notification functionality</li>
                        <li>Fixed notification script routing paths</li>
                        <li>Instant system activation upon entry</li>
                        <li>Streamlined onboarding paths</li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-[11px] font-bold text-blue-500 uppercase mb-2">Improvements</h4>
                    <ul class="list-disc ml-4 space-y-1 text-[13px] text-gray-600 dark:text-gray-400">
                        <li>Brand refresh to "CHS Chat & Social"</li>
                        <li>Pixel-perfect UI element alignment</li>
                        <li>Unified search bar height standards</li>
                        <li>Baseline alignment for announcement cards</li>
                        <li>Optimized Recent Chats sidebar alignment</li>
                        <li>Visual polish for selection and hover states</li>
                        <li>Enhanced background blending effects</li>
                        <li>Improved UI depth and layering</li>
                        <li>Visual consistency across all modules</li>
                        <li>Interaction fluidity enhancements</li>
                        <li>Simplified login flow UX</li>
                        <li>Shortened user task paths</li>
                        <li>Clearer page structure hierarchy</li>
                        <li>Reduced visual noise in chat threads</li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-[11px] font-bold text-red-500 uppercase mb-2">Bug Fixes</h4>
                    <ul class="list-disc ml-4 space-y-1 text-[13px] text-gray-600 dark:text-gray-400">
                        <li>Fixed App Check connection failures</li>
                        <li>Resolved reCAPTCHA loading blockages</li>
                        <li>Addressed Vercel deployment limitations</li>
                        <li>Fixed 404 errors on push notification scripts</li>
                        <li>Resolved data loading failures</li>
                        <li>Fixed multi-device connection instability</li>
                        <li>Resolved login hang issues</li>
                        <li>Fixed crashes during Chinese input</li>
                        <li>Resolved user creation failures</li>
                        <li>Fixed missing data for new accounts</li>
                        <li>Resolved initialization anomalies</li>
                        <li>Fixed UI misalignment issues</li>
                        <li>Resolved push notification trigger failures</li>
                        <li>Fixed unmarked unread messages</li>
                        <li>Resolved state loss on page refresh</li>
                        <li>Fixed Service Worker cache pollution</li>
                        <li>Resolved persistent old version residue</li>
                        <li>Fixed data synchronization issues</li>
                        <li>Resolved fragmented user experiences</li>
                    </ul>
                </div>
            </div>
        </section>
    </div>
`;
