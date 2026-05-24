import { UIComponents } from './ui-components.js?v=20260522-1';

export function createNewsModule(deps) {
    const {
        db,
        ref,
        push,
        set,
        update,
        get,
        remove,
        getCurrentUser,
        getCurrentNewsTab,
        setCurrentNewsTab,
        isAdmin,
        confirm,
        alert,
        showCustom,
        globalDataSync
    } = deps;

    let isNavExpanded = false;
    let currentPrimaryTab = 'school';
    let currentSubTab = 'events';

    function renderCard(post, tabType) {
        if (!post) return '';
        return UIComponents.renderNewsCard(post, tabType, isAdmin());
    }

    function renderNewsContentFromData(posts, containerId, tabType) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const arr = Array.isArray(posts) ? posts : [];
        const sortedPosts = arr
            .filter(Boolean)
            .map(p => {
                const id = p.id || p.key || (p.compositeId ? String(p.compositeId).replace(`${tabType}_`, '') : null);
                return { ...p, id, key: p.key || id };
            })
            .filter(p => p.key)
            .sort((a, b) => {
                const pinDelta = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
                if (pinDelta !== 0) return pinDelta;
                return (b.timestamp || 0) - (a.timestamp || 0);
            });

        if (sortedPosts.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-400 py-10 font-semibold">No announcements yet.</div>';
            return;
        }

        container.innerHTML = sortedPosts.map(post => renderCard(post, tabType)).join('');
    }

    async function deleteNews(id, tabType) {
        if (!isAdmin()) return;
        const ok = await confirm('Delete Announcement', 'Are you sure you want to delete this announcement?', 'Delete');
        if (!ok) return;
        try {
            await remove(ref(db, `news/${tabType}/${id}`));
            alert('Deleted', 'Announcement deleted successfully.');
        } catch (e) {
            alert('Error', `Failed to delete: ${e.message}`);
        }
    }

    function setAddAnnouncementVisibility(type) {
        const addBtn = document.getElementById('addAnnouncementBtn');
        if (!addBtn) return;

        if (type !== 'school' && type !== 'club') {
            addBtn.classList.add('hidden');
            return;
        }

        if (window.AppModules && window.AppModules.User && (window.AppModules.User.isTeacher() || window.AppModules.User.isAdmin())) {
            addBtn.classList.remove('hidden');
        } else {
            addBtn.classList.add('hidden');
        }
    }

    function updatePrimaryTabUI() {
        const btnSchool = document.getElementById('btnSchoolNews');
        const btnClub = document.getElementById('btnClubNews');
        if (!btnSchool || !btnClub) return;

        const activePrimaryClass = "apple-morph flex-1 flex shrink-0 items-center justify-center text-xs font-bold h-full rounded-lg text-black dark:text-white bg-white dark:bg-[#2C2C2E] shadow-sm";
        const inactivePrimaryClass = "apple-morph flex-1 flex shrink-0 items-center justify-center text-xs font-bold h-full rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300";

        if (currentPrimaryTab === 'school') {
            btnSchool.className = activePrimaryClass;
            btnClub.className = inactivePrimaryClass;
        } else {
            btnSchool.className = inactivePrimaryClass;
            btnClub.className = activePrimaryClass;
        }
    }

    function updateSubTabUI(selectedSubTab) {
        const tabs = ['joint', 'discover', 'events'];
        tabs.forEach((id) => {
            const btn = document.getElementById(`subTab_${id}`);
            if (!btn) return;
            if (id === selectedSubTab) {
                btn.className = "flex-1 h-full bg-white text-black dark:bg-[#2C2C2E] dark:text-white rounded-lg text-center transition-colors whitespace-nowrap shadow-sm";
            } else {
                btn.className = "flex-1 h-full text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white text-center transition-colors whitespace-nowrap";
            }
        });
    }

    function expandDiscoverNav() {
        const schoolBtn = document.getElementById('btnSchoolNews');
        const clubBtn = document.getElementById('btnClubNews');
        const schoolText = document.getElementById('textSchoolFull');
        const clubText = document.getElementById('textClubFull');
        const schoolIcon = document.getElementById('iconSchoolNews');
        const clubIcon = document.getElementById('iconClubNews');
        const discoverBlock = document.getElementById('discoverPillBlock');
        const iconWrapper = document.getElementById('discoverIconWrapper');
        const subTabs = document.getElementById('subClubTabs');

        if (!schoolBtn || !clubBtn || !schoolText || !clubText || !discoverBlock || !iconWrapper || !subTabs) return;

        const inactiveClass = "apple-morph flex-1 flex shrink-0 items-center justify-center text-xs font-bold h-full rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300";
        schoolBtn.className = inactiveClass;
        clubBtn.className = inactiveClass;

        schoolText.style.maxWidth = '0px';
        schoolText.style.opacity = '0';
        schoolText.style.marginLeft = '0px';
        clubText.style.maxWidth = '0px';
        clubText.style.opacity = '0';
        clubText.style.marginLeft = '0px';

        if (schoolIcon) {
            schoolIcon.style.maxWidth = '16px';
            schoolIcon.style.opacity = '1';
        }
        if (clubIcon) {
            clubIcon.style.maxWidth = '16px';
            clubIcon.style.opacity = '1';
        }

        schoolBtn.style.maxWidth = '28px';
        clubBtn.style.maxWidth = '28px';

        discoverBlock.style.width = 'calc(100% - 72px)';
        iconWrapper.style.opacity = '0';
        iconWrapper.style.transform = 'scale(0.5)';
        subTabs.classList.remove('opacity-0', 'pointer-events-none');
        subTabs.classList.add('opacity-100');
        isNavExpanded = true;
    }

    function collapseDiscoverNav() {
        const schoolBtn = document.getElementById('btnSchoolNews');
        const clubBtn = document.getElementById('btnClubNews');
        const schoolText = document.getElementById('textSchoolFull');
        const clubText = document.getElementById('textClubFull');
        const schoolIcon = document.getElementById('iconSchoolNews');
        const clubIcon = document.getElementById('iconClubNews');
        const discoverBlock = document.getElementById('discoverPillBlock');
        const iconWrapper = document.getElementById('discoverIconWrapper');
        const subTabs = document.getElementById('subClubTabs');

        if (!schoolBtn || !clubBtn || !schoolText || !clubText || !discoverBlock || !iconWrapper || !subTabs) return;

        schoolText.style.maxWidth = '80px';
        schoolText.style.opacity = '1';
        schoolText.style.marginLeft = '0px';
        clubText.style.maxWidth = '80px';
        clubText.style.opacity = '1';
        clubText.style.marginLeft = '0px';

        if (schoolIcon) {
            schoolIcon.style.maxWidth = '0px';
            schoolIcon.style.opacity = '0';
        }
        if (clubIcon) {
            clubIcon.style.maxWidth = '0px';
            clubIcon.style.opacity = '0';
        }

        schoolBtn.style.maxWidth = '50%';
        clubBtn.style.maxWidth = '50%';

        discoverBlock.style.width = '32px';
        iconWrapper.style.opacity = '1';
        iconWrapper.style.transform = 'scale(1)';
        subTabs.classList.add('opacity-0', 'pointer-events-none');
        subTabs.classList.remove('opacity-100');
        isNavExpanded = false;
    }

    function showNewsContent(type) {
        const contentSchool = document.getElementById('schoolNewsContent');
        const contentClub = document.getElementById('clubNewsContent');
        const contentJoint = document.getElementById('jointClubsContent');
        const contentDiscover = document.getElementById('discoverClubsContent');
        const contentEvents = document.getElementById('eventsClubsContent');
        if (!contentSchool || !contentClub || !contentJoint || !contentDiscover || !contentEvents) return;

        const all = [contentSchool, contentClub, contentJoint, contentDiscover, contentEvents];
        all.forEach((el) => {
            if (!el.classList.contains('hidden')) {
                el.classList.add('opacity-0');
            }
        });

        setTimeout(() => {
            all.forEach((el) => el.classList.add('hidden'));

            const announcementsArea = document.getElementById('newsAnnouncementsScrollArea');
            if (announcementsArea) {
                if (type === 'school' || type === 'club' || type === 'discover' || type === 'events') {
                    announcementsArea.classList.remove('hidden');
                } else {
                    announcementsArea.classList.add('hidden');
                }
            }

            let target = contentSchool;
            if (type === 'club') target = contentClub;
            if (type === 'joint') target = contentJoint;
            if (type === 'discover') target = contentDiscover;
            if (type === 'events') target = contentEvents;
            if (type === 'clubs') target = contentEvents; // Default to events clubs when opening clubs tab

            target.classList.remove('hidden');
            void target.offsetWidth;
            target.classList.remove('opacity-0');

            if (type === 'joint') {
                renderJointClubs();
            } else if (type === 'discover') {
                renderDiscoverClubs();
            } else if (type === 'events') {
                renderGlobalEvents();
            }
        }, 150);
    }

    function selectPrimaryTab(tabType, e) {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        currentPrimaryTab = tabType;
        setCurrentNewsTab(tabType);

        if (isNavExpanded) {
            collapseDiscoverNav();
        }
        updatePrimaryTabUI();
        setAddAnnouncementVisibility(tabType);
        showNewsContent(tabType);
    }

    function selectSubTab(tabId, e) {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        currentSubTab = tabId;
        setCurrentNewsTab('clubs');
        updateSubTabUI(tabId);
        setAddAnnouncementVisibility('clubs');
        showNewsContent(tabId);
    }

    function toggleNewsTab(type, e) {
        if (type === 'school' || type === 'club') {
            selectPrimaryTab(type, e);
            return;
        }

        if (type === 'clubs') {
            setCurrentNewsTab('clubs');
            if (!isNavExpanded) {
                expandDiscoverNav();
            }
            selectSubTab('events', null);
            return;
        }

        if (type === 'joint' || type === 'discover' || type === 'events') {
            if (!isNavExpanded) {
                expandDiscoverNav();
            }
            selectSubTab(type, e);
        }
    }

    // --- Joined Clubs Layout Feature ---
    const rawClubsTSV = `Club Name?\tEmail Address\tSponsor(s) Last Name\tDay for meeting?\tRoom# for meeting\tTime for meeting\tFrequency of meeting\tWhat is your club's mission statement? (Keep it BRIEF!) This will be used on the CHS website. Long statements will be shorten.\tWill a club member attend the Joint Leadership team?\tWho JL mtg?
African Student Association\tlisa_robinson@hcpss.org\tRobinson\tThursday\tTBD\t2:40:00 PM\tBi-Weekly 1st & 3rd Weeks\tFoster a sense of belonging among African Students at CHS and expose all Centennial students to the beuaty of African culture\tYes\t
Alpha Achievers\ttina_turk@hcpss.org\tTurk\tWednesday\t301a\t9:25:00 AM\tBi-Weekly 1st & 3rd Weeks\tWe develop African American males by promoting academic excellence, leadership, and community service in Howard County, MD. We recognize students fostering a positive learning environment while facilitating the attainining/maintaining/and exceeding of a 3.0 grade point average. We develop character growth, leadership skills, and encourages its members to become full citizens of the school and the community. View all at: The Alpha Foundation of Howard County, Inc. | Columbia - AFHC; alphaachievers.org\tYes\t
American Cancer Society\tlori_estes@hcpss.org\tEstes\tThursday\tMedia Center\t2:35:00 PM\tMonthly\tTo improve the lives of people with cancer and their families through advocacy, research, and patient support, ensuring that everyone has the opportunity to prevent, detect, treat, and survive cancer.\tYes\t
American Heart Assoc.\terin_parisi@hcpss.org\tParisi\tWednesday\t511\t2:45:00 PM\tBi-Weekly 2nd & 4th Weeks\tCommitted to raising funds and awareness to support heart health, research, and education. Through fundraising events, school involvement and community outreach we empower students to make a meaningful impact in the fight against heart disease. \tNo\t
American Sign Language\tchristopher_bailey1@hcpss.org\tBailey\tWednesday\t202\t2:35:00 PM\tMonthly\tOur mission is to create a club where students can get together and learn American Sign Language. Meetings will include quick informational lessons on deaf culture, learning activities, and socialization through a new language.\tNo\t
Amnesty International\tkatherine_parker@hcpss.org\tParker\tTuesday\tPortable 2\t2:35:00 PM\tBi-Weekly 1st & 3rd Weeks\tRaise awareness about human rights abuses around the world\tNo\t
Anime\trona_li@hcpss.org\tLi\tWednesday\t614\t2:45:00 PM\tBi-Weekly 1st & 3rd Weeks\tTo share an appreciation of Japanese culture and anime/related media.\tNo\t
Aquila Literary Magazine\trus_vanwestervelt@hcpss.org\tVanWestervelt\tWednesday\t108\t2:35:00 PM\tWeekly\tTo publish the literary and artistic works of Centennial High writers.\tYes\t
Astronomy\ttodd_rosenfeld@hcpss.org\tRosenfeld\tWednesday\t409\t2:35:00 PM\tBi-Weekly 2nd & 4th Weeks\tTo promote public education and interest in various topics of Astronomy and Astronomy research\tYes\t
Awkward Improv\tjacob_traver@hcpss.org\tTraver\tThursday\t802\t2:45:00 PM\tWeekly\tAwkward Improv is dedicated to bringing high-quality improvisational comedy and sketches to Centennial High School. \tNo\t
Badminton\trobert_astri@hcpss.org\tAstri\tFriday\t505/gym2\t2:30:00 PM\tMonthly\tWe play badminton.\tNo\t
Black Student Union (BSU)\tkristin_taylor@hcpss.org\tTaylor/Moody\tWednesday\t610\t9:25:00 AM\tBi-Weekly 2nd & 4th Weeks\tA group that fosters a display of cultural pride, unity and advocacy within the school communty.\tYes\t
C# A cappella\trebecca_vanover@hcpss.org\tVanover\tMonday\t807\t2:45:00 PM\tWeekly\tC# is an opportunity for student-led music-making outside of the curricular school day. Students audition for placement.\tYes\t
CAD Club\tnancy_c_smith@hcpss.org\tNancy Smith\tThursday\t305\t2:35:00 PM\tBi-Weekly 1st & 3rd Weeks\tWe focus on teaching computer-aided design (CAD) software, fostering engineering principles and 21st-century skills like creative problem-solving, and providing a practical, hands-on platform for students to learn to design and bring ideas to life using 3D printing and other fabrication methods. The CAD clubs aim to prepare students for future careers by teaching industry-relevant skills and offer Autodesk Fusion 360 certification in a safe, collaborative environment. \tYes\t
Chess club\tjay_boring@hcpss.org\tJay Boring\tTuesday\t605\t2:35:00 PM\tWeekly\tThe mission of the Centennial High School Chess Club is to foster critical thinking, strategic skills, and sportsmanship among students by providing a welcoming environment to learn, play, and compete in chess.\tNo\t
Chinese Culture\thui_liang@hcpss.org\tLiang\tTuesday\t101\t2:40:00 PM\tBi-Weekly 2nd & 4th Weeks\tTo create a welcoming space where students can experience, enjoy, and learn about Chinese culture through fun, engaging activities and events - while building a sense of community and appreciation for cultural diversity.\tYes\t
Chinese Dance\thui_liang@hcpss.org\tLiang\tFriday\t101\t2:45:00 PM\tWeekly\tWe promote Chinese culture, foster a stress-free environment, provide a positive learning experience, and strengthen communities through dance.\tYes\t
Class of 2026\tcolin_moe@hcpss.org\tMoe/Engle\tWednesday\t502\t9:30:00 AM\tMonthly\tTo promote school spirit and plan and execute senior events. \tYes\t
Class of 2027\tteri_stevens@hcpss.org\tStevens/Carr\tWednesday\t509\t2:35:00 PM\tWeekly\tPromote, plan and execute junior activities\tYes\t
Class of 2028\terin_parisi@hcpss.org\tParisi/Holzman\tTuesday\t603\t2:45:00 PM\tWeekly\tTo help create memorable high school memories through event planning for the Class of 2028.\tYes\t
Class of 2029\tchristopher_bailey1@hcpss.org\tBailey, Nguyen, Lee, Valenti\tTuesday\t202\t2:35:00 PM\tMonthly\tOur mission is to cultivate a respectful and engaged class of 2029 that enjoys planned events and demonstrates extreme school spirit! \tNo\t
Classic Literature Club\tsophia_nguyen@hcpss.org\tNguyen \tTuesday\t210\t2:40:00 PM\tWeekly\tDo you enjoy Classic Literature but find yourself with nobody to discuss them with? If so, join us. \tYes\t
Competitive coding\tjay_boring@hcpss.org\tBoring\tThursday\t605\t2:35:00 PM\tWeekly\tDeveloping members' competitive programming/algorithmic problem-solving abilities, provide lessons on algorithmic programming concepts, and prepare for competitions, enabling students to improve their problem solving skills, compete with others, and learn about computer science.\tNo\t
Crochet\tpatricia_reese@hcpss.org\tReese\tWednesday\t615\t2:40:00 AM\tMonthly\tWe create pieces gifted to patients at hospitals. Whether you're a beginner who has never picked up a crochet hook before or an advanced knitter who can easily complete a project within minutes, join us to create together!\tYes\t
Culinary\tjoelle_miller@hcpss.org\tCummings\tMonday\t303\t2:40:00 PM\tMonthly\tWe will be cooking\tYes\t
Cyber Patriot\tnancy_c_smith@hcpss.org\tSmith, N\tThursday\t305\t2:40:00 PM\tBi-Weekly 1st & 3rd Weeks\tLearn skills to secure and harden a multitude of Operating Systems: Linux, Windows and Cisco Award Opportunities. Compete on state/national levels. Join a network of experienced high school coders who are passionate/dedicated coders. We welcome all, no experience needed.\tYes\t
Drill Team\tkimberly_tracy@hcpss.org\tTracy\tWednesday\tStudent Services or Dance Room\t10:00:00 AM\tWeekly\tWe are an audition-based, student-choreographed dance team that performs at pep rallies and basketball games.\tNo\t
Educator Rising\tpatricia_cummings@hcpss.org\tCummings\tMonday\t303\t3:30:00 PM\tMonthly\tTeaching student to teach others.\tNo\t
Empire Mock Trial\tkelli_mcdonough@hcpss.org\tMcDonough \tFriday\t106\t2:45:00 PM\tWeekly\tMock trial promotes public speaking and an interst in contemporary legal practices. This team travels to out-of-state competitions against teams from other states and countries.\tYes\t
Engineering Exploration\tmichael_hobson@hcpss.org\tHobson\tWednesday\t604\t2:45:00 PM\tMonthly\tThe Engineering Exploration Club gives students hands-on opportunities to learn about different branches of engineering through creative projects and activities. Members will explore how engineering applies to real world problems while building problem-solving, teamwork, and design skills.\tNo\t
Entrepreneur\tsophia_nguyen@hcpss.org\tNguyen/Green\tWednesday\t210\t2:40:00 PM\tWeekly\tBuild. Lead. Launch. Build projects with business impact and learn real start up skills. \tNo\t
Equality Now, Period\tsteven_parker@hcpss.org\tParker\tWednesday\t402\t2:40:00 PM\tBi-Weekly 2nd & 4th Weeks\tTo empower, educate, and support individuals affected by period poverty while promoting gender equity through community outreach, creative activism, and educational initiatives.\tYes\t
Ethics Bowl\tkatherine_parker@hcpss.org\tParker\tMonday\tPortable 2\t2:35:00 PM\tBi-Weekly 1st & 3rd Weeks\tTo promote respectful, supportive, and in-depth discussion of ethics\tNo\t
FBLA\tkristin_taylor@hcpss.org\tTaylor\tMonday\t610\t2:40:00 PM\tBi-Weekly 2nd & 4th Weeks\tFBLA inspires and prepares students to become community-minded business leaders in a global society through relevant career preparation and leadership experiences.\tYes\t
Fellowship of Christian Athletes (FCA)\tjada_lee@hcpss.org\tLee \tWednesday\t208\t7:15:00 AM\tWeekly\tTo lead both coaches and athletes into a growing relationship with Jesus Christ and His church.\tYes\t
FICC - Financial Investement\tpatricia_reese@hcpss.org\tReese\tThursday\t615\t2:40:00 AM\tWeekly\tWe transform the complex world of investing into an exciting adventure. We'll dive into the art of stock analysis through interactive games, lively discussions, and thrilling competitions.  Seasoned investor or beginning savers, our club offers the oportunity to learn while having fun. Come discover the secrets of the stock market, sharpen your financial skills, and create unforgettable memories. \tYes\t
Film and Photo Club\tsteven_parker@hcpss.org\tVan Gieson\tTuesday\t402\t2:35:00 PM\tBi-Weekly 2nd & 4th Weeks\tWe are a community of artistic individuals with a passion for film and photography that works to promote interest in film and photography.\tNo\t
French Club\tmarylynn_doff@hcpss.org\tDoff (ML)\tWednesday\t102\t2:40:00 PM\tMonthly\tTo promote French language and culture in a fun and informal setting.\tYes\t
Game Day Operations\t\tBossom/Clark\t\tGym\t\t\tWe train students interested in pursuing an opportunity in Athletic Management in high school as a preparation for college and post high school athletic positions.\t\t
Gaming Club\tchristopher_panzarella@hcpss.org\tCalkins\tTuesday\t512\t2:40:00 PM\tB-Weekly 1st & 3rd Weeks\tGaming club is a social club for students to meet and play various types of games; these include tabletop, board, and card games. and Pokemon\tYes\t
German Club\twill_funk-heiser@hcpss.org\tFunk-Heiser\tWednesday\t110\t9:25:00 AM\tWeekly\tTo increase awareness and enjoyment of German-speaking cultures at Centennial High School and HCPSS broadly\tYes\t
Girl STEMpowerment\trona_li@hcpss.org\tLi\tWednesday\t614\t2:45:00 PM\tMonthly\tGirl STEMpowerment MD strives to increase young girls�?interest in STEM through hands-on educational experiences, development in creativity, cooperative learning, a critical mind, and strong thinking skills.\tYes\t
Girl Up\tamy_seker@hcpss.org\tSeker\tTuesday\t503\t2:45:00 PM\tBi-Weekly 1st & 3rd Weeks\tA United Nations organization whos mission is to unify girls to change the world encouraging standing up for each other through the promotion of health, safety, and education.\tYes\t
Girls Who Code\tmichael_hobson@hcpss.org\tHobson\tThursday\t510\t2:45:00 PM\tMonthly\tMeets once a month on Thursdays. Girls Who Code strives to empower Centennial girls to excel in technology by fostering a supportive community, presenting unique opportunities, and paving the way for future leaders. \tYes\t
Graphics\tsteven_parker@hcpss.org\tVan Gieson\tTuesday\t402\t2:35:00 PM\tBi-Weekly 1st & 3rd Weeks\tBuild skills in digital art, logo design, and website building\tNo\t
Green\tlori_griffiths@hcpss.org\tGriffiths\tTuesday\t618\t2:45:00 PM\tWeekly\tTo promote awareness, education, and action regarding environmental issues.\tNo\t
Hearts In Action Initiative\tstacy_rosuck@hcpss.org\tRosuck\tThursday\tTBD\t2:45:00 PM\tBi-Weekly 1st & 3rd Weeks\tCreating safe/supportive spaces for students and providing volunteer work, fundraising, and donation drives for the community. By increasing student involvement with local mental health organizations/charities, we will strive to provide meaningful assistance to individuals in need and create a sense of belonging.\tYes\t
Henna\tpatricia_cummings@hcpss.org\tCummings\tFriday\t303\t2:35:00 PM\tMonthly\tCelebrating and Enjoying the rich cultural artistry of henna through student-led workshops, community service projects, and educational events that promote cross-cultural understanding and artistic expression in our high school community.\tNo\t
Hindu Student Association (HSU)\tprachi_uniyal@hcpss.org\tUniyal\tWednesday\t606\t2:40:00 PM\tBi-Weekly 1st & 3rd Weeks\tStriving to build a community and foster a safe space for Hindu and non-Hindu students.\tYes\t
Horizon\tlynn_devore@hcpss.org\tDeVore\tWednesday\tCafeteria\t9:25:00 AM\tBi-Weekly 1st & 3rd Weeks\tWe support local nonprofit organizations by volunteering at events and donating goods.  We also foster community within the CHS student body by organizing fun events such as Spikeball and Cornhole Tournaments.\tYes\t
HOSA\ttodd_rosenfeld@hcpss.org\tRosenfeld\tTuesday\t406\t2:35:00 PM\tBi-Weekly 1st & 3rd Weeks\tMeeting of students with an interest in careers in medicine and medical knowledge competition. \tYes\t
Humanities Advisory Board\tdavid_riddler@hcpss.org\tRiddler/Parker\tWednesday\t612\t9:20:00 AM\tBi-Weekly 2nd & 4th Weeks\tPlan enhancement activities for the Humanities program\tYes\t
Indian Dance Club\tprachi_uniyal@hcpss.org\tUniyal\tThursday\t606\t2:40:00 PM\tBi-Weekly 2nd & 4th Weeks\tWe will teach a fusion dance that comprises Bollywood and classical-style following the beat of the most famous Indian film songs.\tYes\t
International Thespian Society (ITS)\tjacob_traver@hcpss.org\tTraver\tWednesday\t802\t7:00:00 AM\tBi-Weekly 1st & 3rd Weeks\tInternational Thespian Society (ITS) is the Theatre honor society dedicated to developing students love and appreciation of the Theatre Arts.\tYes\t
It's Academic\t\tSeifter\tTuesday\tcafeteria\t2:35:00 PM\tWeekly\tsame as last year\tNo\t
Jewish Student Union (JSU)\ttodd_rosenfeld@hcpss.org\tRosenfeld\tThursday\t409\t2:35:00 PM\tBi-Weekly 2nd & 4th Weeks\tProvide a festive and safe environment for Jewish and non-Jewish students to celebrate Jewish culture.\tYes\t
Key\tjames_zehe@hcpss.org\tZehe\tFriday\t613\t2:40:00 PM\tBi-Weekly 2nd & 4th Weeks\tKey Club's mission is to give primacy to the human and spiritual, rather than to the material values of life, encouraging "the daily living of the Golden Rule" to promote higher standards and develop "a more intelligent, aggressive, and serviceable citizenship" through service, friendship, and community building.\tYes\t
Korean American Student Association (KASA)\trosemarie_ha@hcpss.org\tHa/Reinhardt\tTuesday\t103\t2:40:00 PM\tWeekly\tKASA brings students together to celebrate Korean culture through activities, events, and community service.\tNo\t
Kpop\tmatthew_boggs@hcpss.org\tBoggs\tWednesday\t805\t9:25:00 AM\tWeekly\tTo explore Korean pop music and dancing.\tNo\t
LatinX\tmyriam_montanez-comito@hcpss.org\tComito\tWednesday\t103\t9:25:00 AM\tWeekly\tMaintain relationships among hispanic/latino student community and support one another.\tNo\t
Letter Pals\tstephen_doff@hcpss.org\tDoff, S.\tWednesday\t109\t2:45:00 PM\t3rd Wednesday \tStudents will write letters to be brought to local adult living facilities.\tNo\t
Live Poets\tcorey_o'brien@hcpss.org\tO'Brien\tMonday\t209\t2:45:00 PM\tWeekly\tPromoting poetic styles and developing poetic voice.\tYes\t
Math Journal\trona_li@hcpss.org\tLi\tWednesday\t614\t9:15:00 AM\tMonthly\tAllow students to explore and research math topics of their choice and publish findings in the county math journal.\tNo\t
Math Team\tmichelle_flynn@hcpss.org\tFlynn\tWednesday\t601\t2:45:00 PM\tWeekly\tThe Centennial Math Team works together to have fun solving complex mathematics puzzles and problems. The team competes with other county high school teams in the Howard County Mathematics League.\tYes\t
Mock Trial\tkelli_mcdonough@hcpss.org\tMcDonough\tThursday\t106\t2:45:00 PM\tWeekly\tMock trial promotes public speaking and an interst in contemporary legal practices. \tYes\t
Model UN\tjames_zehe@hcpss.org\tParker/Zehe\tThursday\t613\t2:45:00 PM\tWeekly\tModel UN focuses on fostering an understanding of global issues and the United Nations through educational programs that develop participants' skills in debate, negotiation, research, and public speaking, ultimately preparing them to be active and engaged global citizens committed to peace and international cooperation \tYes\t
Morgan's Message\tjennifer_hopkins1@hcpss.org\tTracy\tWednesday\tTBD\t9:25:00 AM\tBi-Weekly 1st & 3rd Weeks\tTo raise awareness about the challenges student-athletes face; expand awareness of student-athlete mental health; to provide a platform for advocacy and community for student-athletes\tNo\t
Music Mentors\tmatthew_boggs@hcpss.org\tBoggs\tTuesday\t806\t2:35:00 PM\tMonthly\tMusic Mentors provides free music lessons to middle and elementary school students that are a part of Centennial High School's feeder system.\tNo\t
Music Outreach Program\tmatthew_boggs@hcpss.org\tBoggs\tMonday\t806\t2:35:00 PM\tMonthly\tTo provide an outlet for Centennial music students to perform in the community.\tNo\t
Muslim Student Association (MSA)\tchristopher_panzarella@hcpss.org\tPanzarella\tFriday\t624\t2:35:00 PM\tWeekly\tWorking to build a welcoming environment for Muslim/non-Muslim students. We Advocate for countries in distress to help raise awareness. Eid Parties which includes henna/food!! Weekly meetings after school.\tYes\t
National Art Honor Society (NAHS)\tmark_hanssen@hcpss.org\tHanssen\tThursday\t207/6\t2:45:00 PM\tWeekly\tNational Art Honor Society (NAHS) recognizes students showing outstanding ability in art. We foster excellence, a dedicated spirit, and the creative abilities/talents of its members. We also aim to bring art to the attention of the school community, aid members in attaining their highest potential, and strive to increase aesthetic awareness to all.\tYes\t
National Chinese Honor Society (NChHS)\thui_liang@hcpss.org\tLiang\tWednesday\t101\t2:40:00 PM\tMonthly\tEncouraging its members to be life-long learners for a better understanding of Chinese language and culture, as well as to play an active role as a contributing global citizen in the twenty-first century.\tYes\t
National Dance Honor Society Delta Eta Pi\trebecca_clark@hcpss.org\tClark\tTuesday\tDance Studio\t2:45:00 PM\tMonthly\tDelta Eta Pi promotes dance education, dance advocacy, and community service.\tYes\t
National English Honor Society (NEHS)\tkelli_mcdonough@hcpss.org\tMcDonough\tWednesday\t106\t2:45:00 PM\tMonthly\tNEHS is a content-based honor society that spreads a love of the English language and literature.\tYes\t
National French Honor Society (NFrHS)\tmarylynn_doff@hcpss.org\tDoff (ML)\tWednesday\t102\t2:40:00 PM\tMonthly\tThe National French Honor Society is a prestigious organization that seeks to highlight outstanding work in the French classroom.\tNo\t
National German Honor Society (NGrHS)\twill_funk-heiser@hcpss.org\tFunk-Heiser\tWednesday\t110\t9:30:00 AM\tMonthly\tTo recognize and encourage excellence in the German language classes\tNo\t
National History Honor Society (NHxHS)\tjessica_landi@hcpss.org\tLandi\tFriday\t619\t2:40:00 PM\tMonthly\tThe National History Honor Society aims to foster enthusiasm for history, develop character, encourage leadership, and promote responsible citizenship through service.\tYes\t
National Honor Society (NHS)\tthomas_wheeler@hcpss.org\tWheeler/Estes\tWednesday\tCafeteria\t7:00:00 PM\tMonthly\tTo create enthusiasm for scholarship, recognize outstanding students, stimulate a desire to render service, promote leadership, and develop character in secondary school students. It achieves this through its four core pillars: scholarship, service, leadership, and character. \tNo\t
National Math Honor Society (NMHS)\tkathryn_carr@hcpss.org\tCarr\tThursday\t508\t2:35:00 PM\tMonthly\tTo inspire growth in mathematics for all students by providing tutoring services and enrichment opportunties.\tYes\t
National Psi Alpha Honor Society (NPsychHS)\tkatherine_parker@hcpss.org\tParker\tWednesday\tPortable 2\t2:35:00 PM\tMonthly\tEnhance student awareness of newest research in the field psychology\tNo\t
National Quill and Scroll Honor Society (NQSHS)\trus_vanwestervelt@hcpss.org\tVanWestervelt\tThursday\t108\t2:40:00 PM\tMonthly\tJournalism Honor Society for student writers and journalists.\tYes\t
National Science Honor Society (SNHS)\tlori_griffiths@hcpss.org\tGriffiths\tWednesday\tcafeteria\t2:45:00 PM\tMonthly\tTo foster scientific interest and achievement by recognizing students who excel in science, encouraging deeper understanding and appreciation of scientific principles, and promoting leadership, community service, and careers in science-related fields. \tYes\t
National Social Studies Honor Society (NSSHS) Rho Kappa\tdavid_riddler@hcpss.org\tRiddler\tTuesday\t612\t2:45:00 PM\tMonthly\tPromoting scholarship/recognize academic excellence/encourage an interest in social studies in secondary school environments/community.\tYes\t
National Spanish Honor Society (NSpHS)\tshanna_grimes@hcpss.org\tGrimes\tWednesday\t105\t2:40:00 PM\tMonthly\tTo foster a love of the Spanish language and celebrate the cultures of Spanish-speaking countries\tYes\t
National Technical Honor Society (NTHS)\tnancy_c_smith@hcpss.org\tSmith/Taylor\tWednesday\t305\t9:30:00 AM\tMonthly\tThis is the honor society for Career & Technical Education (CTE) for both secondary/postsecondary schools. Activities are built around our Core Four Objectives of career development, leadership development, service, and recognition.  \tYes\t
One Love\trachel_valenti@hcpss.org\tValenti \tWednesday\t211\t9:25:00 AM\tMonthly\tRaising awareness about signs of healthy and unhealthy realtionships and empower students to be able to advoate for their health and create better, healthere friendships and realtionships. \tYes\t
Outdoor\tdavid_riddler@hcpss.org\tRiddler\tWednesday\t612\t9:30:00 AM\tMonthly\tTo discuss and participate in outdoor activities while being stewards of nature.\tNo\t
PAWS\temily_schelz@hcpss.org\tSchelz, Seker\tWednesday\t620/503\t9:25:00 AM\tMonthly\tprovide support for local animal shelter\tYes\t
Philosophy\tchristopher_bailey1@hcpss.org\tBailey\tThursday\t202\t2:35:00 PM\tBi-Weekly 2nd & 4th Weeks\tThe philosophy club is where we dive into life's most intriguing mysteries and debates. From ethics and morality to reality and knowledge, we'll challenge our minds and spark meaningful discussions.\tNo\t
Physics\ttimothy_watson@hcpss.org\tWatson\tThursday\t513\t2:35:00 PM\tBi-Weekly 1st & 3rd Weeks\tPromote interest in Physics, including Physics Olympiad.\tNo\t
Pre-Med\ttodd_rosenfeld@hcpss.org\tRosenfeld\tMonday\t409\t2:35:00 PM\tBi-Weekly 2nd & 4th Weeks\tProvide academic opportunities for future medical professionals to learn about various \tYes\t
Pyoneers\tmichael_hobson@hcpss.org\tHobson\tThursday\t604\t2:40:00 PM\tWeekly\tPromoting computer science education through student-organized, county-wide programming lessons and tournaments to expose students to programming and inspire them to explore the field of computer science.\tYes\t
Red Cross\tmyriam_montanez-comito@hcpss.org\tComito\tFriday\t103\t2:40:00 PM\tBi-Weekly 1st & 3rd Weeks\t(what we had last year)\tNo\t
Resonance\trebecca_vanover@hcpss.org\tVanover\tTuesday\t807\t2:45:00 PM\tWeekly\tResonance is a space for Tenors and Basses to sing together, even if they aren't enrolled in choir!\tYes\t
Robotics\ttimothy_watson@hcpss.org\tWatson\tMonday\t513\t2:35:00 PM\tWeekly\tDesign, build, and program a robot to compete in the FTC robotics competition\tNo\t
SAGA\tsteven_parker@hcpss.org\tS. Parker/Seker\tWednesday\t402\t9:25:00 AM\tBi-Weekly 1st & 3rd Weeks\tCreate a safe place for LGBTQ+ students and their allies.\tYes\t
Salvation Army\tpatricia_reese@hcpss.org\tReese/Holzman\tWednesday\t615\t2:40:00 PM\tWeekly\tSalvation Army serves our school and local community through volunteerism, compassion, and leadership. In partnership with The Salvation Army, we promote kindness, inclusion, and positive change.\tYes\t
Scholars Leadership Honors Program\tshalonda_holt@hcpss.org\tHolt/Robinson\tTuesday\t405\t2:45:00 PM\tBi-Weekly 1st & 3rd Weeks\tThe Scholars Leadership Honors Program is an honors program for female students in grades 10-12 with a cumulative unweighted GPA of 3.0 or higher. The program seeks to promote continued academic excellence, increase African American cultural awareness, and develop leadership skills through participation in workshop presentations, projects, and community service.\tYes\t
Science Bowl\trobert_astri@hcpss.org\tAstri\tFriday\t505\t2:30:00 PM\tWeekly\tCompete in Regional Competition \tNo\t
Science Olympiad\tjoelle_miller@hcpss.org\tMiller/Boring\tThursday\t605\t2:40:00 PM\tBi-Weekly 2nd & 4th Weeks\tScience Olympiad is a nationwide competition. Students compete in 23 events that include earth science, biology, chemistry, physics, and engineering. Science Olympiad is designed to increase a student’s interest in STEM fields and provide recognition for outstanding achievement in team events. Top teams advance from Regional to State to National levels.\tYes\t
Ski and Snowboard\tjarrett_emery@hcpss.org\tEmery\tWednesday\tLunch room\t9:25:00 AM\tWeekly\tSki Club is a place where all Snow enthusiasts can share and discuss their likes and interests regarding various ski and snowboarding equipment, technics and locations. This is an interest group only.  No school sanctions ski events will be held. \tNo\t
Skyward Theatre\tjacob_traver@hcpss.org\tTraver\tFriday\t802\t2:45:00 PM\tWeekly\tSkyward Theatre is Centennial's theatre program and department dedicated to providing an inclusive and rigorous theatre education to all students. \tYes\t
Soaring Catholics\tbethany_cunha@hcpss.org\tCunha\tTuesday\t622\t7:00:00 AM\tBi-Weekly 1st & 3rd Weeks\tOur mission is to be a beacon of faith, hope, and charity within our school. We seek to build a welcoming community for all students, rooted in prayer, service, and sacramental life of the Catholic Church, encouraging students to grow in virtue, deepen their relationship with Christ, support each other, and be a positive presence at Centennial.\tYes\t
South Asian Student Association (SASA)\tprachi_uniyal@hcpss.org\tUniyal\tTuesday\t606\t2:40:00 PM\tBi-Weekly 2nd & 4th Weeks\tA student-led club that celebrates and explores South Asian culture through fun events, food, and music. SASA hosts activities throughout the year, helps organize school-wide events, and creates a space for students to connect, share traditions, and take pride in their heritage.\tYes\t
Speech/Debate\t\tDavid/Jackson,B\tWednesday\t621\t2:45:00 PM\tWeekly\tsame as last Year\t\t
Sports4Kids\tdanielle_holzman@hcpss.org\tHolzman\tThursday\t603\t2:35:00 PM\tWeekly\tThe mission of this club is to empower kids and teach them the importance of physical activity.\tYes\t
Student Advocacy Organization\tfrances_galante@hcpss.org\tGalante\tMonday\t3rd Monday Rm621\t2:40:00 PM\tMonthly\tStudents gather to debate and discuss MD legislation\tNo\t
Student Government Association (SGA)\tkelli_mcdonough@hcpss.org\tMcDonough/Holt\tTuesday\t106\t7:15:00 AM\tBi-Weekly 1st & 3rd Weeks\tThe SGA amplifies student voice and creates a sense of community at school.\tYes\t
Table tennis club\tjarrett_emery@hcpss.org\tEmery\tWednesday\tgym/cafe\t2:45:00 PM\tMonthly\tTo learn and have fun playing table tennis\tNo\t
Teens against trafficking\tmatthew_boggs@hcpss.org\tBoggs\tMonday\t807\t2:35:00 PM\tBi-Weekly 1st & 3rd Weeks\t Educate teens about human trafficking, empower them to intervene, and mobilize the school community for prevention and support.\tYes\t
Tri-M Music Honor Society\tdavid_matchim@hcpss.org\tMatchim\tMonday\t806\t2:45:00 PM\tMonthly\tA national organization that recognizes secondary school students for their academic and musical achievement, leadership, and service to their school and community.  Members complete service hours each semester to maintain their membership.\tYes\t
Ultimate Disc\tmichael_hobson@hcpss.org\tHobson\tFriday\toutside field\t2:45:00 PM\tWeekly\tWe play Ultimate Frisbee! Come out to be active, make friends, and learn techniques. All are welcome, no prior experience necessary – we will teach you to throw & catch!  Remember to bring your water bottle and a friend.\tYes\t
UNICEF\tteri_stevens@hcpss.org\tStevens\tTuesday\t509\t2:35:00 PM\tBi-Weekly 2nd & 4th Weeks\tTo raise money and awareness of UNICEF and children in need\tYes\t
We Belong\tcolin_moe@hcpss.org\tMoe/Engle\tWednesday\tCafeteria\t2:45:00 PM\tMonthly\tTo promote inclusive practices among school students. \tNo\t
Web Development\tprachi_uniyal@hcpss.org\tUniyal\tTuesday\t606\t2:45:00 PM\tBi-Weekly 1st & 3rd Weeks\tEngage the community with Website Development through fun lessons and personal projects.\tNo\t
Weight Lifting \tchristian_phillips@hcpss.org\tPhillips\tFriday\tWeight Room \t2:45:00 PM\tWeekly\tEncouraging Healthy Lifestyles through weight lifting\tNo\t
Wounded Warriors\tbethany_cunha@hcpss.org\tCunha\tWednesday\t622\t2:45:00 PM\tBi-Weekly 1st & 3rd Weeks\twe will keep the same statement from last year\tYes\t
Writing Club\tcorey_o'brien@hcpss.org\tO'Brien\tThursday\t209\t2:45:00 PM\tWeekly\tThe mission for the CHS Writing Club is to help students of all grades expand their knowledge and familiarity with the realm of Creative Writing.\tYes\t
Young Dems\tcorey_o'brien@hcpss.org\tO'Brien\tThursday\t209\t3:00:00 PM\tBi-Weekly 2nd & 4th Weeks\tWill be working towards having a TedX event for "passionate individuals who seek to uncover new ideas and to share the latest research." Improve public speaking skills with a live audience. \tYes\t
Youth Alive\tvictoria_sattler@hcpss.org\tSattler\tFriday\t103\t7:30:00 AM\tBi-Weekly 1st & 3rd Weeks\tUniting students to deepen their relationship with God and impact their school for Christ.\tNo\t
Youth Climate Institute\tkaren_reynolds@hcpss.org\tReynolds\tWednesday\t506\t2:45:00 PM\tBi-Weekly 1st & 3rd Weeks\tThe Youth Climate Institute educates and certifies the next generation of leaders on climate science, environmental justice and real world solutions.\tYes\t
Zaching\tkathryn_carr@hcpss.org\tCarr\tMonday\tn/a\t12:00:00 AM\tBi-Weekly 1st & 3rd Weeks\tDO NOT list on website, please.\tNo\t
Interact\t\tGalante/Riddler\tTuesday\t612\t2:45:00 PM\tBi-Weekly 1st & 3rd Weeks\t\t\t`;

    const gradients = [
        'linear-gradient(135deg, #FF9500 0%, #FF5E36 100%)',
        'linear-gradient(135deg, #FF2D55 0%, #FF379A 100%)',
        'linear-gradient(135deg, #007AFF 0%, #00C6FF 100%)',
        'linear-gradient(135deg, #AF52DE 0%, #E056FD 100%)',
        'linear-gradient(135deg, #34C759 0%, #15D374 100%)',
        'linear-gradient(135deg, #5856D6 0%, #7E7DF9 100%)',
        'linear-gradient(135deg, #545456 0%, #8E8E93 100%)',
        'linear-gradient(135deg, #E67E22 0%, #F39C12 100%)',
        'linear-gradient(135deg, #1ABC9C 0%, #2ECC71 100%)',
        'linear-gradient(135deg, #27AE60 0%, #117A65 100%)'
    ];

    const iconSVGs = {
        robot: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4M8 15h.01M16 15h.01"></path></svg>`,
        debate: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
        code: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
        art: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.35857 19.5 5.5 20 5 21C4.5 22 5.5 22 6 21.5C6.5 21 7 20.5 7.5 21C9.28012 21.6514 10.6514 22 12 22Z"></path><circle cx="7.5" cy="10.5" r="1.5"></circle><circle cx="11.5" cy="7.5" r="1.5"></circle><circle cx="16.5" cy="9.5" r="1.5"></circle></svg>`,
        service: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="7.5" cy="15.5" r="4.5"></circle><path d="M11 12l9-9 4 4-2 2-3-3-3 3 2 2-2 2-2-2-3 3"></path></svg>`,
        globe: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10zM2 12h20"></path></svg>`,
        game: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M18 22H6v-2h12v2zm-2-4H8v-2h8v2zM12 2a3 3 0 0 0-3 3c0 2 2 3.5 3 5 1-1.5 3-3 3-5a3 3 0 0 0-3-3z"></path></svg>`,
        math: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M4 19h16M4 5h16M12 5v14M8 12h8"></path></svg>`,
        eco: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>`,
        heart: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>`,
        grad: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>`
    };

    function getIconForClub(name) {
        const n = name.toLowerCase();
        if (n.includes('code') || n.includes('coding') || n.includes('cyber') || n.includes('cad') || n.includes('dev') || n.includes('programming') || n.includes('algorithms')) return iconSVGs.code;
        if (n.includes('robot') || n.includes('engineering') || n.includes('technical')) return iconSVGs.robot;
        if (n.includes('debate') || n.includes('speech') || n.includes('sign') || n.includes('writing') || n.includes('poet') || n.includes('lit') || n.includes('journal') || n.includes('quill') || n.includes('scroll')) return iconSVGs.debate;
        if (n.includes('art') || n.includes('design') || n.includes('dance') || n.includes('thespian') || n.includes('theatre') || n.includes('improv') || n.includes('kpop') || n.includes('music') || n.includes('sing') || n.includes('capella') || n.includes('resonance') || n.includes('henna')) return iconSVGs.art;
        if (n.includes('heart') || n.includes('cancer') || n.includes('medical') || n.includes('med') || n.includes('hosa') || n.includes('health') || n.includes('trafficking') || n.includes('red cross') || n.includes('zaching')) return iconSVGs.heart;
        if (n.includes('french') || n.includes('german') || n.includes('chinese') || n.includes('spanish') || n.includes('latin') || n.includes('african') || n.includes('black') || n.includes('south asian') || n.includes('culture') || n.includes('international') || n.includes('un') || n.includes('world') || n.includes('global') || n.includes('unicef') || n.includes('amnesty')) return iconSVGs.globe;
        if (n.includes('chess') || n.includes('game') || n.includes('gaming') || n.includes('board') || n.includes('tennis') || n.includes('badminton') || n.includes('ultimate') || n.includes('ski') || n.includes('snowboard') || n.includes('sports') || n.includes('athletic') || n.includes('drill')) return iconSVGs.game;
        if (n.includes('math') || n.includes('science') || n.includes('physics') || n.includes('astronomy') || n.includes('chemistry') || n.includes('biology')) return iconSVGs.math;
        if (n.includes('green') || n.includes('climate') || n.includes('outdoor') || n.includes('environmental') || n.includes('eco') || n.includes('nature')) return iconSVGs.eco;
        return iconSVGs.grad;
    }

    const joinedClubIds = new Set(JSON.parse(localStorage.getItem('joinedClubIds') || '["african-student-association"]'));

    const dummyClubs = rawClubsTSV.trim().split('\n').slice(1).map((line, idx) => {
        const cols = line.split('\t');
        const name = cols[0] ? cols[0].trim() : '';
        const email = cols[1] ? cols[1].trim() : '';
        const sponsor = cols[2] ? cols[2].trim() : '';
        const meetingDay = cols[3] ? cols[3].trim() : '';
        const meetingRoom = cols[4] ? cols[4].trim() : '';
        const meetingTime = cols[5] ? cols[5].trim() : '';
        const meetingFreq = cols[6] ? cols[6].trim() : '';
        const mission = cols[7] ? cols[7].trim() : '';
        const jlTeam = cols[8] ? cols[8].trim() : '';
        
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const gradient = gradients[idx % gradients.length];
        const icon = getIconForClub(name);
        
        const defaultAnnouncements = [];
        if (mission) {
            defaultAnnouncements.push({
                title: `Welcome to ${name}!`,
                desc: mission
            });
        }
        if (meetingDay && meetingDay.toLowerCase() !== 'tbd') {
            defaultAnnouncements.push({
                title: `Meeting Schedule`,
                desc: `We meet on **${meetingDay}s** at **${meetingTime || '2:45 PM'}** in **Room ${meetingRoom || 'TBD'}** (${meetingFreq || 'weekly'}).`
            });
        } else if (meetingFreq) {
            defaultAnnouncements.push({
                title: `Meeting Schedule`,
                desc: `Meetings are scheduled: **${meetingFreq}** in **Room ${meetingRoom || 'TBD'}**.`
            });
        }
        if (sponsor && email) {
            defaultAnnouncements.push({
                title: `Club Sponsor`,
                desc: `Sponsored by Mr./Ms. **${sponsor}**. Reach out via email at **${email}** for questions.`
            });
        }
        
        const members = [];
        // Sponsor is always an admin
        if (sponsor) {
            const cleanSponsorName = sponsor.includes('/') ? sponsor.split('/')[0].trim() : sponsor;
            members.push({
                name: cleanSponsorName,
                isAdmin: true
            });
        }

        // Sort so admins are first
        members.sort((a, b) => (b.isAdmin ? 1 : 0) - (a.isAdmin ? 1 : 0));

        return {
            id,
            name,
            gradient,
            icon,
            desc: mission || `The Centennial High School ${name} promotes student engagement and community.`,
            defaultAnnouncements,
            announcements: [], // Will be loaded dynamically
            members
        };
    }).filter(c => c.name);

    let selectedClubId = null;
    let clubSearchTerm = '';
    let isDiscoverSearchExpanded = false;
    let eventSearchTerm = '';
    let isEventSearchExpanded = false;
    let cachedGlobalEvents = [];
    let tooltipTimeout = null;

    function showTooltip(e, text) {
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = null;
        }
        const tooltip = document.getElementById('clubGlobalTooltip');
        if (!tooltip) return;

        tooltip.innerText = text;
        tooltip.style.display = 'block';

        const rect = e.currentTarget.getBoundingClientRect();
        const tooltipHeight = tooltip.offsetHeight;

        tooltip.style.left = `${rect.right + 8}px`;
        tooltip.style.top = `${rect.top + (rect.height - tooltipHeight) / 2}px`;
        
        void tooltip.offsetWidth;

        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateX(0)';
    }

    function hideTooltip() {
        const tooltip = document.getElementById('clubGlobalTooltip');
        if (!tooltip) return;

        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateX(-5px)';

        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
        }

        tooltipTimeout = setTimeout(() => {
            if (tooltip.style.opacity === '0') {
                tooltip.style.display = 'none';
            }
        }, 150);
    }

    function renderJointClubs() {
        const iconsBar = document.getElementById('jointClubsIconsBar');
        const mobileDropdown = document.getElementById('mobileClubDropdown');
        const mobileLabel = document.getElementById('mobileClubSelectorLabel');
        
        if (!iconsBar) return;

        // Filter clubs to only those the user has joined
        const joinedClubs = dummyClubs.filter(c => joinedClubIds.has(c.id));

        if (joinedClubs.length === 0) {
            iconsBar.innerHTML = '';
            if (mobileDropdown) {
                mobileDropdown.innerHTML = '<div class="px-4 py-3 text-sm text-gray-400">No joined clubs</div>';
            }
            if (mobileLabel) {
                mobileLabel.innerText = 'No joined clubs';
            }
            
            const emptyState = document.getElementById('jointClubEmptyState');
            const detailView = document.getElementById('jointClubDetailView');
            if (emptyState) {
                emptyState.classList.remove('hidden');
                emptyState.innerHTML = `
                    <div class="py-16 text-center max-w-sm mx-auto px-4 flex flex-col items-center gap-3">
                        <div class="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-400">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                            </svg>
                        </div>
                        <h4 class="font-bold text-base text-black dark:text-white">No Joined Clubs</h4>
                        <p class="text-xs text-gray-400 leading-relaxed">You haven't joined any clubs yet. Go to the "Discover" tab to find and join clubs!</p>
                    </div>
                `;
            }
            if (detailView) detailView.classList.add('hidden');
            return;
        } else {
            // Restore default text in empty state if needed
            const emptyState = document.getElementById('jointClubEmptyState');
            if (emptyState) {
                emptyState.innerHTML = 'Select a club to view details and announcements';
            }
        }

        // Render the vertical icons list with animations (desktop only)
        iconsBar.innerHTML = joinedClubs.map((club, idx) => {
            const isActive = selectedClubId === club.id;
            const safeName = club.name.replace(/'/g, "\\'");
            return `
                <div id="btn-club-${club.id}" onclick="AppModules.News.selectClub('${club.id}')"
                    onmouseenter="AppModules.News.showTooltip(event, '${safeName}')"
                    onmouseleave="AppModules.News.hideTooltip()"
                    class="club-avatar-btn club-icon-animate ${isActive ? 'active' : ''}" 
                    style="background: ${club.gradient}; animation-delay: ${idx * 12}ms;">
                    <span class="club-card-icon">${club.icon}</span>
                </div>
            `;
        }).join('');
        
        // Update mobile dropdown
        if (mobileDropdown) {
            mobileDropdown.innerHTML = joinedClubs.map(club => {
                const isSelected = selectedClubId === club.id;
                const activeClass = isSelected ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : '';
                return `
                    <button onclick="window.selectMobileClub('${club.id}', event)"
                        class="w-full text-left px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 ${activeClass}">
                        ${club.name}
                    </button>
                `;
            }).join('');
        }
        
        // Update mobile label to show currently selected club
        if (mobileLabel && selectedClubId) {
            const selectedClub = joinedClubs.find(c => c.id === selectedClubId);
            if (selectedClub) {
                mobileLabel.innerText = selectedClub.name;
            }
        }

        // Load content for active club if selected and still in joined list, otherwise pick first joined or show empty state
        if (selectedClubId && joinedClubIds.has(selectedClubId)) {
            selectClub(selectedClubId, true);
        } else if (joinedClubs.length > 0) {
            selectClub(joinedClubs[0].id);
        } else {
            const emptyState = document.getElementById('jointClubEmptyState');
            const detailView = document.getElementById('jointClubDetailView');
            if (emptyState) emptyState.classList.remove('hidden');
            if (detailView) detailView.classList.add('hidden');
        }
    }
    
    // Global function for mobile club selection
    window.selectMobileClub = function(clubId, e) {
        if (e) e.stopPropagation();
        
        // Close the dropdown
        const dropdown = document.getElementById('mobileClubDropdown');
        const icon = document.getElementById('mobileClubDropdownIcon');
        if (dropdown) {
            dropdown.classList.add('opacity-0', 'scale-95', 'hidden');
            dropdown.classList.remove('opacity-100', 'scale-100');
        }
        if (icon) {
            icon.style.transform = 'rotate(0deg)';
        }
        
        // Select the club
        AppModules.News.selectClub(clubId);
    };

        function escapeAttr(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function formatEventMetaParts(clubName, time, room) {
        const parts = [];
        if (clubName) parts.push(clubName);
        if (time) parts.push(time);
        if (room) parts.push(room.toLowerCase().startsWith('room') ? room : `Room ${room}`);
        return parts;
    }

    function formatEventDateDisplay(dateValue) {
        if (!dateValue) return '';
        try {
            const d = new Date(`${dateValue}T00:00:00`);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return dateValue;
        }
    }

    function getFilteredDiscoverClubs() {
        const term = clubSearchTerm.trim().toLowerCase();
        if (!term) return dummyClubs;
        return dummyClubs.filter((club) => {
            const haystack = [
                club.name,
                club.sponsor || '',
                club.desc || '',
                club.meetingDay || '',
                club.meetingRoom || ''
            ].join(' ').toLowerCase();
            return haystack.includes(term);
        });
    }

    function renderDiscoverClubsList() {
        const listEl = document.getElementById('discoverClubsList');
        if (!listEl) return;
        const filteredClubs = getFilteredDiscoverClubs();

        if (filteredClubs.length === 0) {
            listEl.innerHTML = `
                <div class="py-10 text-center text-gray-400 text-sm">
                    No clubs match "${escapeAttr(clubSearchTerm)}"
                </div>
            `;
            return;
        }

        listEl.innerHTML = filteredClubs.map((club, index) => {
            const isJoined = joinedClubIds.has(club.id);
            const buttonClass = isJoined 
                ? 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-gray-400 cursor-default'
                : 'bg-blue-500 hover:bg-blue-600 active:scale-95 text-white shadow-sm';
            const buttonText = isJoined ? 'Joined' : 'Join';
            const joinAction = isJoined ? '' : `onclick="AppModules.News.joinClub('${club.id}', event)"`;

            let meetingInfo = '';
            if (club.meetingDay && club.meetingDay.toLowerCase() !== 'tbd') {
                meetingInfo = `${club.meetingDay}s at ${club.meetingTime || '2:45 PM'} (${club.meetingRoom ? 'Room ' + club.meetingRoom : 'TBD'})`;
            } else {
                meetingInfo = 'Schedule TBD';
            }

            // Get admin/executive board members
            const admins = club.members.filter(m => m.isAdmin).map(m => m.name);
            const adminCards = admins.slice(0, 3).map(name => {
                const escapedName = name.replace(/'/g, "\\'");
                return `
                    <div onclick="AppModules.News.handleMemberClick('${escapedName}')" class="bg-gray-100 dark:bg-white/5 px-3 py-2 rounded-xl text-xs font-bold text-black dark:text-white flex-1 text-center cursor-pointer hover:bg-gray-200 transition-colors">${name}</div>
                `;
            }).join('');

            return `
                <div id="discoverClubCard-${club.id}" class="p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800/80 rounded-2xl flex flex-col gap-2 hover:bg-gray-100/50 transition duration-200 text-left mb-3">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-start gap-3 flex-1">
                            <div class="w-10 h-10 aspect-square shrink-0 rounded-lg flex items-center justify-center text-white text-base" style="background: ${club.gradient}">
                                <span class="club-card-icon">${club.icon}</span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h4 class="font-bold text-base text-black dark:text-white leading-tight">${club.name}</h4>
                                <p class="text-[11px] text-gray-400 font-medium mt-0.5">Sponsor: ${club.sponsor || 'TBD'}</p>
                            </div>
                        </div>
                        <button onclick="window.toggleDiscoverClubCard('${club.id}')" class="shrink-0 px-3 py-1.5 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-gray-700 text-black dark:text-white text-xs font-bold rounded-full transition-colors flex items-center gap-1">
                            <span id="discoverBtnText-${club.id}">View</span>
                            <svg id="discoverBtnIcon-${club.id}" class="w-3 h-3 transition-transform duration-300" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                    </div>

                    <div id="discoverShortDesc-${club.id}" class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-1 line-clamp-2 transition-all duration-300 opacity-100">
                        ${club.desc}
                    </div>

                    <div id="discoverExpandArea-${club.id}" class="expandable-grid mt-2">
                        <div class="expandable-content">
                            <div class="fade-in-content pt-3 border-t border-gray-200 dark:border-white/5">
                                
                                <!-- Full Description -->
                                <div class="mt-3">
                                    <h5 class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">About</h5>
                                    <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">${club.desc}</p>
                                </div>

                                ${admins.length > 0 ? `
                                <div class="mt-3">
                                    <h5 class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Sponsor & Executive Board</h5>
                                    <div class="flex flex-wrap gap-1.5">
                                        ${adminCards}
                                    </div>
                                </div>
                                ` : ''}

                                <!-- Events Section - Load from Firebase -->
                                <div class="mt-3" id="clubEventsContainer-${club.id}">
                                    <h5 class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Events</h5>
                                    <div class="py-4 flex flex-col items-center justify-center gap-2 text-gray-400">
                                        <div class="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-blue-500 dark:border-white/20 dark:border-t-blue-400"></div>
                                        <span class="text-[11px]">Loading events...</span>
                                    </div>
                                </div>

                                <div class="mt-3">
                                    <button ${joinAction} class="w-full py-2.5 ${isJoined ? 'bg-gray-200 dark:bg-white/10 text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700' : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm'} text-xs font-bold rounded-xl transition-colors">
                                        ${isJoined ? '✓ Joined' : 'Join Club'}
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add CSS for expandable grid if not already present
        if (!document.getElementById('discoverExpandStyles')) {
            const style = document.createElement('style');
            style.id = 'discoverExpandStyles';
            style.textContent = `
                .expandable-grid {
                    display: grid;
                    grid-template-rows: 0fr;
                    transition: grid-template-rows 0.4s ease-out;
                }
                
                .expandable-grid.expanded {
                    grid-template-rows: 1fr;
                }
                
                .expandable-content {
                    overflow: hidden;
                }

                .fade-in-content {
                    opacity: 0;
                    transform: translateY(8px);
                    transition: all 0.3s ease-out;
                    transition-delay: 0s;
                }

                .expanded .fade-in-content {
                    opacity: 1;
                    transform: translateY(0);
                    transition-delay: 0.1s;
                }
            `;
            document.head.appendChild(style);
        }

        // Load events for each club after rendering
        setTimeout(() => {
            filteredClubs.forEach(club => {
                loadClubEventsForDiscover(club.id);
            });
        }, 100);
    }

    async function loadClubEventsForDiscover(clubId) {
        const container = document.getElementById(`clubEventsContainer-${clubId}`);
        if (!container) return;

        try {
            const eventsSnap = await get(ref(db, `modules/club_events/${clubId}`));
            let events = [];
            
            if (eventsSnap.exists()) {
                const val = eventsSnap.val() || {};
                events = Object.keys(val).map(key => ({
                    id: key,
                    ...val[key]
                })).sort((a, b) => new Date(a.date) - new Date(b.date));
            }

            // Filter to show only future events
            const now = new Date();
            const futureEvents = events.filter(evt => {
                const eventDate = new Date(evt.date);
                return eventDate >= now;
            });

            if (futureEvents.length === 0) {
                container.innerHTML = `
                    <h5 class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Events</h5>
                    <div class="text-center py-4 text-gray-400 dark:text-gray-500">
                        <p class="text-xs">There are no events recorded on CHSChat.</p>
                        <p class="text-[11px] mt-1">Contact club board for help.</p>
                    </div>
                `;
            } else {
                // Show next upcoming event
                const nextEvent = futureEvents[0];
                const eventTime = nextEvent.time ? new Date(`1970-01-01T${nextEvent.time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
                const dateLabel = formatEventDateDisplay(nextEvent.date);
                
                container.innerHTML = `
                    <h5 class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Events</h5>
                    <div class="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-sm bg-gradient-to-br from-blue-400 to-blue-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h6 class="text-sm font-bold text-black dark:text-white">${nextEvent.title || 'Untitled Event'}</h6>
                            <p class="text-[11px] text-gray-400 mt-0.5">${dateLabel}${eventTime ? ' at ' + eventTime : ''}</p>
                            ${nextEvent.room ? `<p class="text-[11px] text-gray-400">Room ${nextEvent.room}</p>` : ''}
                            ${nextEvent.desc ? `<p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">${nextEvent.desc}</p>` : ''}
                        </div>
                    </div>
                `;
            }
        } catch (err) {
            console.error(`Failed to load events for club ${clubId}:`, err);
            container.innerHTML = `
                <h5 class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Events</h5>
                <div class="text-center py-4 text-gray-400 dark:text-gray-500">
                    <p class="text-xs">Unable to load events.</p>
                </div>
            `;
        }
    }

    window.toggleDiscoverClubCard = function(clubId) {
        const expandArea = document.getElementById(`discoverExpandArea-${clubId}`);
        const shortDesc = document.getElementById(`discoverShortDesc-${clubId}`);
        const btnText = document.getElementById(`discoverBtnText-${clubId}`);
        const btnIcon = document.getElementById(`discoverBtnIcon-${clubId}`);

        if (!expandArea.classList.contains('expanded')) {
            expandArea.classList.add('expanded');
            shortDesc.classList.add('opacity-0', 'h-0', 'mt-0');
            
            btnText.innerText = "Close";
            btnIcon.style.transform = "rotate(180deg)";
        } else {
            expandArea.classList.remove('expanded');
            shortDesc.classList.remove('opacity-0', 'h-0', 'mt-0');
            
            btnText.innerText = "View";
            btnIcon.style.transform = "rotate(0deg)";
        }
    };

    function handleDiscoverClubSearch(e) {
        clubSearchTerm = (e?.target?.value || '').slice(0, 120);
        const clearBtn = document.getElementById('discoverClubSearchClear');
        if (clearBtn) clearBtn.classList.toggle('hidden', !clubSearchTerm.trim());
        renderDiscoverClubsList();
    }

    function clearDiscoverClubSearch() {
        clubSearchTerm = '';
        const input = document.getElementById('discoverClubSearchInput');
        const clearBtn = document.getElementById('discoverClubSearchClear');
        if (input) input.value = '';
        if (clearBtn) clearBtn.classList.add('hidden');
        renderDiscoverClubsList();
    }

    function toggleDiscoverClubSearch() {
        isDiscoverSearchExpanded = true;
        const shell = document.getElementById('discoverClubSearchShell');
        const input = document.getElementById('discoverClubSearchInput');
        const iconBtn = document.getElementById('discoverClubSearchIconBtn');
        if (shell) shell.className = 'absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-[#E9E9EB] dark:bg-[#2C2C2E] rounded-full h-8 w-44 transition-all duration-300 overflow-hidden';
        if (iconBtn) iconBtn.classList.add('hidden');
        if (input) {
            input.classList.remove('hidden');
            setTimeout(() => input.focus(), 10);
        }
    }

    function maybeCollapseDiscoverClubSearch() {
        if (clubSearchTerm.trim()) return;
        isDiscoverSearchExpanded = false;
        const shell = document.getElementById('discoverClubSearchShell');
        const input = document.getElementById('discoverClubSearchInput');
        const iconBtn = document.getElementById('discoverClubSearchIconBtn');
        if (shell) shell.className = 'absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-[#E9E9EB] dark:bg-[#2C2C2E] rounded-full h-8 w-8 transition-all duration-300 overflow-hidden';
        if (input) input.classList.add('hidden');
        if (iconBtn) iconBtn.classList.remove('hidden');
    }

    function renderDiscoverClubs() {
        const container = document.getElementById('discoverClubsContent');
        if (!container) return;

        container.innerHTML = `
            <div class="pb-1 text-left">
                <div class="relative h-8 mb-1">
                    <h3 class="font-bold text-lg text-black dark:text-white whitespace-nowrap leading-8">Clubs Directory</h3>
                    <div id="discoverClubSearchShell" class="absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-[#E9E9EB] dark:bg-[#2C2C2E] rounded-full h-8 ${isDiscoverSearchExpanded || clubSearchTerm.trim() ? 'w-44' : 'w-8'} transition-all duration-300 overflow-hidden">
                        <button id="discoverClubSearchIconBtn" onclick="AppModules.News.toggleDiscoverClubSearch()" class="${isDiscoverSearchExpanded || clubSearchTerm.trim() ? 'hidden' : ''} w-8 h-8 flex items-center justify-center text-gray-400">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                        <svg class="${isDiscoverSearchExpanded || clubSearchTerm.trim() ? '' : 'hidden'} ml-2 text-gray-400 w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input id="discoverClubSearchInput" type="text" placeholder="Search"
                            value="${escapeAttr(clubSearchTerm)}"
                            onfocus="AppModules.News.toggleDiscoverClubSearch()"
                            onblur="AppModules.News.maybeCollapseDiscoverClubSearch()"
                            oninput="AppModules.News.handleDiscoverClubSearch(event)"
                            autocomplete="off"
                            class="${isDiscoverSearchExpanded || clubSearchTerm.trim() ? '' : 'hidden'} flex-1 min-w-0 h-full bg-transparent border-none rounded-full pl-2 pr-2 text-sm outline-none placeholder-gray-400">
                        <button id="discoverClubSearchClear" onclick="AppModules.News.clearDiscoverClubSearch(); AppModules.News.maybeCollapseDiscoverClubSearch();"
                            class="${clubSearchTerm.trim() ? '' : 'hidden'} ml-1 mr-1.5 shrink-0 w-5 h-5 bg-[#C7C7CC] dark:bg-gray-500 rounded-full flex items-center justify-center text-white transition-colors">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
                <p class="text-xs text-gray-400">Discover and join Centennial High School clubs</p>
            </div>
            <div id="discoverClubsList" class="space-y-3 mt-1"></div>
        `;

        renderDiscoverClubsList();
    }
    async function joinClub(clubId, e) {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        
        const club = dummyClubs.find(c => c.id === clubId);
        if (!club) return;

        // Add to joined IDs
        joinedClubIds.add(clubId);
        localStorage.setItem('joinedClubIds', JSON.stringify(Array.from(joinedClubIds)));
        console.log(`[joinClub] Added club ${clubId} to localStorage. Current joined clubs:`, Array.from(joinedClubIds));

        // Add current user to club members list if not already there
        const currentUser = getCurrentUser();
        if (currentUser) {
            const exists = club.members.some(m => m.name.toLowerCase() === currentUser.name.toLowerCase());
            if (!exists) {
                club.members.push({
                    name: currentUser.name,
                    isAdmin: false
                });
                console.log(`[joinClub] Added ${currentUser.name} to dummyClubs members`);
            }

            // Sync to Firebase - save member to database
            try {
                const memberUid = currentUser.uid || currentUser.id;
                const memberRef = ref(db, `modules/club_members/${club.id}/${memberUid}`);
                const memberData = {
                    name: currentUser.name,
                    email: currentUser.email || '',
                    uid: memberUid,
                    joinedAt: Date.now(),
                    isAdmin: false
                };
                
                console.log(`[joinClub] Attempting to sync to Firebase at path: modules/club_members/${club.id}/${memberUid}`);
                console.log(`[joinClub] Current user info:`, {
                    id: currentUser.id,
                    uid: currentUser.uid,
                    name: currentUser.name,
                    email: currentUser.email,
                    role: currentUser.role
                });
                console.log(`[joinClub] Member data to write:`, memberData);
                
                await set(memberRef, memberData);
                console.log(`[joinClub] ✅ Successfully synced member ${currentUser.name} (UID: ${memberUid}) to Firebase for club ${club.id}`);
                
                // Verify the write by reading it back
                const verifySnap = await get(memberRef);
                if (verifySnap.exists()) {
                    console.log(`[joinClub] ✅ Verified: Data exists in Firebase:`, verifySnap.val());
                } else {
                    console.error(`[joinClub] ❌ ERROR: Data was written but cannot be read back!`);
                }
            } catch (err) {
                console.error('[joinClub] ❌ Failed to sync club member to Firebase:', err);
                console.error('[joinClub] Error details:', {
                    message: err.message,
                    code: err.code,
                    stack: err.stack
                });
                alert('Sync Error', `Failed to sync to Firebase: ${err.message}\n\nThis is likely a permissions issue. Please check:\n1. Firebase rules have been deployed\n2. You are authenticated properly`);
            }
        }

        // Re-render Discover list to show "Joined" state
        renderDiscoverClubs();

        // Re-render "My Joint" left sidebar icons
        renderJointClubs();

        // Re-render Club News to show this club's announcements
        if (window.AppModules && window.AppModules.News && typeof window.AppModules.News.renderLocalNews === 'function') {
            console.log(`[joinClub] Triggering Club News refresh for newly joined club: ${club.id}`);
            // Use getLocalNews from db module to re-fetch and re-filter
            if (window.AppModules.DB && typeof window.AppModules.DB.Local.getNews === 'function') {
                window.AppModules.News.renderLocalNews(window.AppModules.DB.Local.getNews).catch(err => {
                    console.error('[joinClub] Failed to refresh Club News:', err);
                });
            } else if (typeof window.getLocalNews === 'function') {
                window.AppModules.News.renderLocalNews(window.getLocalNews).catch(err => {
                    console.error('[joinClub] Failed to refresh Club News:', err);
                });
            }
        }

        alert('Joined Club', `You are now a member of ${club.name}!`);
    }

    function toggleSimulateAdmin() {
        window._simulateClubAdmin = !window._simulateClubAdmin;
        
        const btn = document.getElementById('btnToggleSimulateAdmin');
        if (btn) {
            if (window._simulateClubAdmin) {
                btn.classList.remove('bg-gray-100', 'dark:bg-white/5', 'text-gray-500', 'dark:text-gray-400');
                btn.classList.add('bg-blue-500/10', 'border-blue-500/30', 'text-blue-500');
                const span = btn.querySelector('span');
                if (span) span.innerText = 'Simulate Admin: ACTIVE';
            } else {
                btn.classList.remove('bg-blue-500/10', 'border-blue-500/30', 'text-blue-500');
                btn.classList.add('bg-gray-100', 'dark:bg-white/5', 'text-gray-500', 'dark:text-gray-400');
                const span = btn.querySelector('span');
                if (span) span.innerText = 'Simulate Club Administrator';
            }
        }
        
        if (selectedClubId) {
            selectClub(selectedClubId, true);
        }
    }

    let isDescExpanded = false;
    function formatDisplayName(fullName) {
        if (!fullName) return '';
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 1) return parts[0];
        return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}`;
    }

    function toggleClubDesc() {
        const wrapper = document.getElementById('jointClubDescWrapper');
        const btn = document.getElementById('btnToggleClubDesc');
        if (!wrapper || !btn) return;

        isDescExpanded = !isDescExpanded;

        if (isDescExpanded) {
            wrapper.classList.remove('hidden');
            void wrapper.offsetHeight; // Force reflow
            wrapper.style.maxHeight = wrapper.scrollHeight + 'px';
            wrapper.style.opacity = '1';
            wrapper.style.marginTop = '12px';
            wrapper.style.marginBottom = '12px';
            btn.classList.add('text-blue-500', 'dark:text-blue-400');
            btn.classList.remove('text-gray-400', 'dark:text-gray-500');
        } else {
            wrapper.style.maxHeight = '0px';
            wrapper.style.opacity = '0';
            wrapper.style.marginTop = '0px';
            wrapper.style.marginBottom = '0px';
            btn.classList.remove('text-blue-500', 'dark:text-blue-400');
            btn.classList.add('text-gray-400', 'dark:text-gray-500');
            setTimeout(() => {
                if (!isDescExpanded) {
                    wrapper.classList.add('hidden');
                }
            }, 300);
        }
    }

    async function leaveClub() {
        const club = dummyClubs.find(c => c.id === selectedClubId);
        if (!club) return;
        
        const ok = await confirm('Leave Club', `Are you sure you want to leave ${club.name}?`, 'Leave');
        if (!ok) return;

        // Remove from joined list FIRST (before any re-renders)
        joinedClubIds.delete(selectedClubId);
        localStorage.setItem('joinedClubIds', JSON.stringify(Array.from(joinedClubIds)));
        console.log(`[leaveClub] Removed club ${selectedClubId} from localStorage. Remaining clubs:`, Array.from(joinedClubIds));

        // Remove current user from club members list
        const currentUser = getCurrentUser();
        if (currentUser) {
            const idx = club.members.findIndex(m => m.name.toLowerCase() === currentUser.name.toLowerCase());
            if (idx !== -1) {
                club.members.splice(idx, 1);
            }

            // Also remove from Firebase
            try {
                const memberUid = currentUser.uid || currentUser.id;
                const memberRef = ref(db, `modules/club_members/${club.id}/${memberUid}`);
                await remove(memberRef);
                console.log(`[leaveClub] ✅ Successfully removed member ${currentUser.name} (UID: ${memberUid}) from Firebase for club ${club.id}`);
            } catch (err) {
                console.error('[leaveClub]  Failed to remove member from Firebase:', err);
            }
        }

        alert('Left Club', `You have left ${club.name} successfully.`);
        
        // Clear selected club BEFORE re-rendering
        selectedClubId = null;
        
        // Re-render My Joint (will show empty state or first joined club)
        renderJointClubs();
        
        // Also re-render Club News to hide this club's announcements
        if (window.AppModules && window.AppModules.News && window.AppModules.News.renderLocalNews) {
            // Trigger a re-sync of news
            if (window.globalDataSync) {
                window.globalDataSync();
            }
        }
    }

    async function openAddClubAnnouncementForm() {
        const club = dummyClubs.find(c => c.id === selectedClubId);
        if (!club) return;

        const html = `
            <div class="space-y-4 text-left">
                <div class="bg-gray-100 dark:bg-black rounded-2xl p-4 ring-2 ring-transparent focus-within:ring-[#007AFF]/20 transition-all">
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Announcement Title</label>
                    <input type="text" id="addClubAnnTitle" placeholder="Enter title..." class="w-full bg-transparent outline-none text-base font-medium text-black dark:text-white">
                </div>
                <div class="bg-gray-100 dark:bg-black rounded-2xl p-4 ring-2 ring-transparent focus-within:ring-[#007AFF]/20 transition-all">
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Announcement Description</label>
                    <textarea id="addClubAnnDesc" rows="4" placeholder="Enter description..." class="w-full bg-transparent outline-none text-base font-medium text-black dark:text-white resize-none"></textarea>
                </div>
            </div>
        `;
        const result = await showCustom('New Club Announcement', html, [
            { text: 'Post', value: 'post', primary: true },
            { text: 'Cancel', value: 'cancel', primary: false }
        ]);

        if (result === 'post') {
            const title = document.getElementById('addClubAnnTitle')?.value.trim();
            const desc = document.getElementById('addClubAnnDesc')?.value.trim();
            
            if (!title || !desc) {
                alert('Fields Required', 'Please enter both a title and description.');
                return;
            }

            const newAnn = {
                title: title,
                desc: desc,
                timestamp: Date.now()
            };

            try {
                const newRef = push(ref(db, `modules/club_announcements/${club.id}`));
                await set(newRef, newAnn);
                
                // Also publish to Club News feed so all users can see it
                const clubNewsRef = push(ref(db, 'news/club'));
                await set(clubNewsRef, {
                    title: club.name,
                    desc: desc,
                    timestamp: Date.now(),
                    tabType: 'club',
                    clubId: club.id,
                    clubName: club.name,
                    clubIcon: club.icon,
                    clubGradient: club.gradient,
                    postedBy: getCurrentUser()?.name || 'Club Admin',
                    isClubMemberPost: true
                });
                
                console.log(`[openAddClubAnnouncementForm] Posted announcement to both My Joint and Club News for club ${club.id}`);
                
                // Re-select/re-render the club to fetch updated announcements from database
                selectClub(selectedClubId, true);
                alert('Posted', 'Announcement published successfully to Club News.');
            } catch (err) {
                console.error("Failed to post announcement:", err);
                alert('Error', 'Failed to publish announcement: ' + err.message);
            }
        }
    }

    async function deleteClubAnnouncement(annId, e) {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

        const club = dummyClubs.find(c => c.id === selectedClubId);
        if (!club) return;

        const ok = await confirm('Delete Announcement', 'Are you sure you want to delete this announcement?', 'Delete');
        if (!ok) return;

        try {
            // Get the announcement data first to find matching post in Club News
            const annSnap = await get(ref(db, `modules/club_announcements/${club.id}/${annId}`));
            let annData = null;
            if (annSnap.exists()) {
                annData = annSnap.val();
            }
            
            // Delete from My Joint
            await remove(ref(db, `modules/club_announcements/${club.id}/${annId}`));
            
            // Also delete from Club News feed if we have the timestamp
            if (annData && annData.timestamp) {
                const newsSnap = await get(ref(db, 'news/club'));
                if (newsSnap.exists()) {
                    const newsVal = newsSnap.val() || {};
                    for (const [newsKey, newsItem] of Object.entries(newsVal)) {
                        // Match by clubId and similar timestamp (within 2 seconds)
                        if (newsItem.clubId === club.id && 
                            newsItem.timestamp && 
                            Math.abs(newsItem.timestamp - annData.timestamp) < 2000) {
                            await remove(ref(db, `news/club/${newsKey}`));
                            console.log(`[deleteClubAnnouncement] Deleted matching post from Club News: ${newsKey}`);
                            break;
                        }
                    }
                }
            }
            
            // Re-select/re-render the club to fetch updated announcements
            selectClub(selectedClubId, true);
            alert('Deleted', 'Announcement deleted successfully.');
        } catch (err) {
            console.error("Failed to delete announcement:", err);
            alert('Error', 'Failed to delete announcement: ' + err.message);
        }
    }

    async function openAddClubEventForm() {
        const club = dummyClubs.find(c => c.id === selectedClubId);
        if (!club) return;

        const html = `
            <div class="space-y-4 text-left">
                <div class="bg-gray-100 dark:bg-black rounded-2xl p-4 ring-2 ring-transparent focus-within:ring-[#007AFF]/20 transition-all">
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Event Date</label>
                    <input type="date" id="addClubEventDate" class="w-full bg-transparent outline-none text-base font-medium text-black dark:text-white">
                </div>
                <div class="bg-gray-100 dark:bg-black rounded-2xl p-4 ring-2 ring-transparent focus-within:ring-[#007AFF]/20 transition-all">
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Event Title</label>
                    <input type="text" id="addClubEventTitle" placeholder="Enter title..." class="w-full bg-transparent outline-none text-base font-medium text-black dark:text-white">
                </div>
                <div class="bg-gray-100 dark:bg-black rounded-2xl p-4 ring-2 ring-transparent focus-within:ring-[#007AFF]/20 transition-all">
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Room Number</label>
                    <input type="text" id="addClubEventRoom" placeholder="Enter room number (e.g. 214)..." class="w-full bg-transparent outline-none text-base font-medium text-black dark:text-white">
                </div>
                <div class="bg-gray-100 dark:bg-black rounded-2xl p-4 ring-2 ring-transparent focus-within:ring-[#007AFF]/20 transition-all">
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Event Time</label>
                    <input type="time" id="addClubEventTime" class="w-full bg-transparent outline-none text-base font-medium text-black dark:text-white">
                </div>
                <div class="bg-gray-100 dark:bg-black rounded-2xl p-4 ring-2 ring-transparent focus-within:ring-[#007AFF]/20 transition-all">
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Event Details</label>
                    <textarea id="addClubEventDesc" rows="4" placeholder="Optional details..." class="w-full bg-transparent outline-none text-base font-medium text-black dark:text-white resize-none"></textarea>
                </div>
            </div>
        `;
        const result = await showCustom('New Club Event', html, [
            { text: 'Add Event', value: 'add', primary: true },
            { text: 'Cancel', value: 'cancel', primary: false }
        ]);

        if (result === 'add') {
            const date = document.getElementById('addClubEventDate')?.value;
            const title = document.getElementById('addClubEventTitle')?.value.trim();
            const room = document.getElementById('addClubEventRoom')?.value.trim();
            const desc = document.getElementById('addClubEventDesc')?.value.trim();
            const time = document.getElementById('addClubEventTime')?.value;
            
            if (!date || !title || !room || !time) {
                alert('Fields Required', 'Please enter date, title, room number, and time.');
                return;
            }

            const newEvent = {
                title: title,
                date: date,
                room: room,
                time: time,
                desc: desc || '',
                timestamp: Date.now(),
                clubName: club.name,
                clubId: club.id
            };

            try {
                const newRef = push(ref(db, `modules/club_events/${club.id}`));
                await set(newRef, newEvent);
                
                // Re-select/re-render the club to fetch updated events
                selectClub(selectedClubId, true);
                alert('Added', 'Event added successfully.');
            } catch (err) {
                console.error("Failed to add event:", err);
                alert('Error', 'Failed to add event: ' + err.message);
            }
        }
    }

    async function deleteClubEvent(eventId, e) {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

        const club = dummyClubs.find(c => c.id === selectedClubId);
        if (!club) return;

        const ok = await confirm('Delete Event', 'Are you sure you want to delete this event?', 'Delete');
        if (!ok) return;

        try {
            await remove(ref(db, `modules/club_events/${club.id}/${eventId}`));
            
            // Re-select/re-render the club to fetch updated events
            selectClub(selectedClubId, true);
            alert('Deleted', 'Event deleted successfully.');
        } catch (err) {
            console.error("Failed to delete event:", err);
            alert('Error', 'Failed to delete event: ' + err.message);
        }
    }

    function getFilteredGlobalEvents() {
        const term = eventSearchTerm.trim().toLowerCase();
        if (!term) return cachedGlobalEvents;
        return cachedGlobalEvents.filter((evt) => {
            const hostClub = dummyClubs.find(c => c.id === evt.clubId) || { name: evt.clubName || 'Unknown Club' };
            const haystack = [
                evt.title || '',
                evt.desc || '',
                evt.date || '',
                evt.time || '',
                evt.room || '',
                hostClub.name || ''
            ].join(' ').toLowerCase();
            return haystack.includes(term);
        });
    }

    function renderGlobalEventsList() {
        const listContainer = document.getElementById('globalEventsList');
        if (!listContainer) return;

        const events = getFilteredGlobalEvents();
        if (events.length === 0) {
            listContainer.innerHTML = `
                <div class="py-12 px-4 text-center">
                    <div class="w-16 h-16 mx-auto bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <p class="text-sm text-gray-400 max-w-[260px] mx-auto">${eventSearchTerm.trim() ? `No events match "${escapeAttr(eventSearchTerm)}"` : 'No upcoming club events found.'}</p>
                </div>
            `;
            return;
        }

        const toMinutes = (timeValue) => {
            if (!timeValue || !/^\d{2}:\d{2}/.test(timeValue)) return Number.MAX_SAFE_INTEGER;
            const [hh, mm] = timeValue.split(':');
            return (parseInt(hh, 10) * 60) + parseInt(mm, 10);
        };

        const getDateHeader = (dateValue) => {
            if (!dateValue) return 'DATE TBD';
            try {
                const d = new Date(`${dateValue}T00:00:00`);
                return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'long' }).toUpperCase();
            } catch (e) {
                return String(dateValue).toUpperCase();
            }
        };

        const sortedEvents = [...events].sort((a, b) => {
            const aDate = a.date || '9999-12-31';
            const bDate = b.date || '9999-12-31';
            if (aDate !== bDate) return aDate.localeCompare(bDate);
            const aTime = toMinutes(a.time);
            const bTime = toMinutes(b.time);
            if (aTime !== bTime) return aTime - bTime;
            return (a.title || '').localeCompare(b.title || '');
        });

        const grouped = {};
        sortedEvents.forEach((evt) => {
            const key = evt.date || 'tbd';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(evt);
        });

        listContainer.innerHTML = Object.keys(grouped).map((dateKey) => {
            const dayEvents = grouped[dateKey];
            const dayHeader = getDateHeader(dateKey === 'tbd' ? '' : dateKey);
            const cards = dayEvents.map((evt) => {
                const hostClub = dummyClubs.find(c => c.id === evt.clubId) || { name: evt.clubName || 'Unknown Club', icon: '??', gradient: 'linear-gradient(135deg, #3a7bd5, #3a6073)' };
                const eventTime = evt.time ? new Date(`1970-01-01T${evt.time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Time TBD';
                const metaParts = [];
                metaParts.push(eventTime);
                if (evt.room) {
                    metaParts.push(evt.room.toLowerCase().startsWith('room') ? evt.room : `Room ${evt.room}`);
                } else {
                    metaParts.push('Room TBD');
                }
                const safeDesc = (evt.desc || '').trim();

                return `
                    <div class="group relative bg-gray-50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/10 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-3 transition-all duration-200 text-left">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold" style="background: ${hostClub.gradient}">
                                <span class="club-card-icon">${hostClub.icon}</span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h4 class="text-sm font-bold text-black dark:text-white truncate">${evt.title || 'Untitled Event'}</h4>
                                <p class="text-[11px] text-gray-400 truncate mt-0.5">${hostClub.name}</p>
                                <p class="text-[11px] text-gray-400 truncate mt-0.5">${metaParts.join(' | ')}</p>
                                ${safeDesc ? `<p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-1.5">${safeDesc}</p>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="space-y-2">
                    <h3 class="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">${dayHeader}</h3>
                    <div class="space-y-2">
                        ${cards}
                    </div>
                </div>
            `;
        }).join('');
    }

    function handleEventSearch(e) {
        eventSearchTerm = (e?.target?.value || '').slice(0, 120);
        const clearBtn = document.getElementById('eventSearchClear');
        if (clearBtn) clearBtn.classList.toggle('hidden', !eventSearchTerm.trim());
        renderGlobalEventsList();
    }

    function clearEventSearch() {
        eventSearchTerm = '';
        const input = document.getElementById('eventSearchInput');
        const clearBtn = document.getElementById('eventSearchClear');
        if (input) input.value = '';
        if (clearBtn) clearBtn.classList.add('hidden');
        renderGlobalEventsList();
    }

    function toggleEventSearch() {
        isEventSearchExpanded = true;
        const shell = document.getElementById('eventSearchShell');
        const input = document.getElementById('eventSearchInput');
        const iconBtn = document.getElementById('eventSearchIconBtn');
        if (shell) shell.className = 'absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-[#E9E9EB] dark:bg-[#2C2C2E] rounded-full h-8 w-44 transition-all duration-300 overflow-hidden';
        if (iconBtn) iconBtn.classList.add('hidden');
        if (input) {
            input.classList.remove('hidden');
            setTimeout(() => input.focus(), 10);
        }
    }

    function maybeCollapseEventSearch() {
        if (eventSearchTerm.trim()) return;
        isEventSearchExpanded = false;
        const shell = document.getElementById('eventSearchShell');
        const input = document.getElementById('eventSearchInput');
        const iconBtn = document.getElementById('eventSearchIconBtn');
        if (shell) shell.className = 'absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-[#E9E9EB] dark:bg-[#2C2C2E] rounded-full h-8 w-8 transition-all duration-300 overflow-hidden';
        if (input) input.classList.add('hidden');
        if (iconBtn) iconBtn.classList.remove('hidden');
    }

    function renderGlobalEvents() {
        const container = document.getElementById('eventsClubsContent');
        if (!container) return;

        container.innerHTML = `
            <div class="pb-1 text-left">
                <div class="relative h-8 mb-1">
                    <h3 class="font-bold text-lg text-black dark:text-white whitespace-nowrap leading-8">Club Events</h3>
                    <div id="eventSearchShell" class="absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-[#E9E9EB] dark:bg-[#2C2C2E] rounded-full h-8 ${isEventSearchExpanded || eventSearchTerm.trim() ? 'w-44' : 'w-8'} transition-all duration-300 overflow-hidden">
                        <button id="eventSearchIconBtn" onclick="AppModules.News.toggleEventSearch()" class="${isEventSearchExpanded || eventSearchTerm.trim() ? 'hidden' : ''} w-8 h-8 flex items-center justify-center text-gray-400">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                        <svg class="${isEventSearchExpanded || eventSearchTerm.trim() ? '' : 'hidden'} ml-2 text-gray-400 w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input id="eventSearchInput" type="text" placeholder="Search"
                            value="${escapeAttr(eventSearchTerm)}"
                            onfocus="AppModules.News.toggleEventSearch()"
                            onblur="AppModules.News.maybeCollapseEventSearch()"
                            oninput="AppModules.News.handleEventSearch(event)"
                            autocomplete="off"
                            class="${isEventSearchExpanded || eventSearchTerm.trim() ? '' : 'hidden'} flex-1 min-w-0 h-full bg-transparent border-none rounded-full pl-2 pr-2 text-sm outline-none placeholder-gray-400">
                        <button id="eventSearchClear" onclick="AppModules.News.clearEventSearch(); AppModules.News.maybeCollapseEventSearch();"
                            class="${eventSearchTerm.trim() ? '' : 'hidden'} ml-1 mr-1.5 shrink-0 w-5 h-5 bg-[#C7C7CC] dark:bg-gray-500 rounded-full flex items-center justify-center text-white transition-colors">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
                <p class="text-xs text-gray-400">Explore upcoming events hosted by school clubs</p>
            </div>
            <div id="globalEventsList" class="space-y-4 mt-1">
                <div class="py-10 flex flex-col items-center gap-2 text-gray-400">
                    <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-[#007AFF] dark:border-white/20 dark:border-t-[#0A84FF]"></div>
                    <span class="text-xs font-medium">Loading events...</span>
                </div>
            </div>
        `;

        get(ref(db, 'modules/club_events')).then(snap => {
            cachedGlobalEvents = [];
            if (snap.exists()) {
                const val = snap.val() || {};
                Object.keys(val).forEach(clubId => {
                    const clubEvts = val[clubId] || {};
                    Object.keys(clubEvts).forEach(evtId => {
                        cachedGlobalEvents.push({ id: evtId, clubId, ...clubEvts[evtId] });
                    });
                });
            }
            cachedGlobalEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
            renderGlobalEventsList();
        }).catch(err => {
            console.error("Failed to load global events:", err);
            const listContainer = document.getElementById('globalEventsList');
            if (listContainer) listContainer.innerHTML = `<div class="text-xs text-gray-400 italic py-2 text-center">Failed to load events.</div>`;
        });
    }

    function showMemberContextMenu(clientX, clientY, memberName) {
        const club = dummyClubs.find(c => c.id === selectedClubId);
        if (!club) return;

        // Remove any existing menu
        const existingMenu = document.getElementById('clubMemberContextMenu');
        if (existingMenu) existingMenu.remove();

        const member = club.members.find(m => m.name === memberName);
        if (!member) return;

        // Create the floating menu
        const menu = document.createElement('div');
        menu.id = 'clubMemberContextMenu';
        menu.className = 'fixed w-48 bg-white/95 dark:bg-[#1C1C1E]/95 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl backdrop-blur-xl py-1.5 z-[99999] opacity-0 scale-95 transition-all duration-150 origin-top-left';
        
        // Position the menu with bounds check
        let top = clientY;
        let left = clientX;
        const menuWidth = 192;
        const menuHeight = 110;

        if (left + menuWidth > window.innerWidth) {
            left = window.innerWidth - menuWidth - 16;
        }
        if (top + menuHeight > window.innerHeight) {
            top = window.innerHeight - menuHeight - 16;
        }
        if (left < 16) left = 16;
        if (top < 16) top = 16;

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;

        const escName = memberName.replace(/'/g, "\\'");
        
        let toggleAdminOption = '';
        if (member.isAdmin) {
            toggleAdminOption = `
                <button onclick="AppModules.News.toggleMemberAdminStatus('${escName}', false)" class="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    Remove Admin Role
                </button>
            `;
        } else {
            toggleAdminOption = `
                <button onclick="AppModules.News.toggleMemberAdminStatus('${escName}', true)" class="w-full text-left px-4 py-2.5 text-sm font-semibold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                    Set as Admin
                </button>
            `;
        }

        menu.innerHTML = `
            ${toggleAdminOption}
            <button onclick="AppModules.News.removeMemberFromClub('${escName}')" class="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-600/10 border-t border-gray-100 dark:border-gray-800/80 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                    <path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"></path>
                </svg>
                Remove from Club
            </button>
        `;

        document.body.appendChild(menu);

        // Animate open
        requestAnimationFrame(() => {
            menu.style.opacity = '1';
            menu.style.transform = 'scale(1)';
        });
    }

    function handleMemberContextMenu(e, memberName) {
        e.preventDefault();
        e.stopPropagation();
        
        const club = dummyClubs.find(c => c.id === selectedClubId);
        if (!club) return;

        const currentUser = getCurrentUser();
        const clubModule = window.AppModules && window.AppModules.Club;
        const isManager = clubModule ? clubModule.isClubManager(currentUser, club) : (currentUser && (currentUser.role === 'admin' || (club.email && currentUser.email && club.email.toLowerCase() === currentUser.email.toLowerCase())));

        if (!isManager) return;

        showMemberContextMenu(e.clientX, e.clientY, memberName);
    }

    function setupMemberLongPress(el, memberName) {
        let pressTimer = null;
        let isLongPress = false;

        const start = (e) => {
            const club = dummyClubs.find(c => c.id === selectedClubId);
            if (!club) return;
            const currentUser = getCurrentUser();
            const clubModule = window.AppModules && window.AppModules.Club;
            const isManager = clubModule ? clubModule.isClubManager(currentUser, club) : (currentUser && (currentUser.role === 'admin' || (club.email && currentUser.email && club.email.toLowerCase() === currentUser.email.toLowerCase())));
            if (!isManager) return;

            if (pressTimer) clearTimeout(pressTimer);
            isLongPress = false;

            pressTimer = setTimeout(() => {
                isLongPress = true;
                let clientX = 0;
                let clientY = 0;
                if (e.touches && e.touches.length > 0) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }
                e.preventDefault();
                showMemberContextMenu(clientX, clientY, memberName);
            }, 600);
        };

        const end = (e) => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
            if (isLongPress) {
                e.preventDefault();
                isLongPress = false;
            }
        };

        // Touch events
        el.addEventListener('touchstart', start, { passive: false });
        el.addEventListener('touchend', end);
        el.addEventListener('touchmove', end);
        el.addEventListener('touchcancel', end);

        // Mouse events
        el.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                start(e);
            }
        });
        el.addEventListener('mouseup', end);
        el.addEventListener('mouseleave', end);
        
        // Standard Context Menu event
        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const club = dummyClubs.find(c => c.id === selectedClubId);
            if (!club) return;
            const currentUser = getCurrentUser();
            const clubModule = window.AppModules && window.AppModules.Club;
            const isManager = clubModule ? clubModule.isClubManager(currentUser, club) : (currentUser && (currentUser.role === 'admin' || (club.email && currentUser.email && club.email.toLowerCase() === currentUser.email.toLowerCase())));
            if (!isManager) return;

            showMemberContextMenu(e.clientX, e.clientY, memberName);
        });
    }

    function handleMemberClick(memberName) {
        console.log('handleMemberClick called with:', memberName);
        
        // Get current user to check if this is the current user themselves
        const currentUser = getCurrentUser();
        console.log('Current user:', currentUser);
        if (!currentUser || !memberName) return;

        // Don't allow clicking on yourself
        if (memberName.toLowerCase() === currentUser.name.toLowerCase()) {
            console.log('Cannot click on yourself');
            return;
        }

        // Find the user ID for this member name by searching in ALL_USERS
        let targetUserId = null;
        console.log('ALL_USERS keys count:', window.ALL_USERS ? Object.keys(window.ALL_USERS).length : 0);
        
        if (window.ALL_USERS) {
            // Try exact match only (no partial matching to avoid false positives like "Moss Moss" matching "Admin Moss")
            for (const [userId, userData] of Object.entries(window.ALL_USERS)) {
                if (userData.name && userData.name.toLowerCase() === memberName.toLowerCase()) {
                    targetUserId = userId;
                    console.log('Found exact matching user:', userId, userData.name);
                    break;
                }
            }
        }

        // If we found a matching user, switch to chat with them
        if (targetUserId && window.switchChat) {
            console.log('Switching to chat with:', targetUserId);
            window.switchChat(targetUserId);
        } else {
            console.warn(`Could not find user ID for member: ${memberName}`);
            console.warn('window.switchChat available:', !!window.switchChat);
            console.warn('Available users:', window.ALL_USERS ? Object.values(window.ALL_USERS).map(u => u.name).join(', ') : 'none');
            
            // Show alert that user has not joined yet
            if (alert) {
                alert(
                    'User Not Joined',
                    `${memberName} has not joined CHS Chat yet. Invite them to join! `,
                    'Invite'
                );
            } else {
                window.alert(`${memberName} has not joined CHS Chat yet. Invite them to join! 🎉`);
            }
        }
    }

    function toggleMemberAdminStatus(memberName, isAdmin) {
        const club = dummyClubs.find(c => c.id === selectedClubId);
        if (!club) return;

        const member = club.members.find(m => m.name === memberName);
        if (!member) return;

        // Update local state
        member.isAdmin = isAdmin;

        // Sort so admins are first
        club.members.sort((a, b) => (b.isAdmin ? 1 : 0) - (a.isAdmin ? 1 : 0));

        // Also update Firebase if this is a real user with UID
        if (member.uid) {
            const memberRef = ref(db, `modules/club_members/${club.id}/${member.uid}`);
            update(memberRef, { isAdmin: isAdmin }).then(() => {
                console.log(`[toggleMemberAdminStatus] ✅ Updated ${memberName} admin status to ${isAdmin} in Firebase`);
            }).catch(err => {
                console.error('[toggleMemberAdminStatus] Failed to update Firebase:', err);
            });
        }

        // Re-render
        selectClub(selectedClubId, true);
    }

    async function removeMemberFromClub(memberName) {
        const club = dummyClubs.find(c => c.id === selectedClubId);
        if (!club) return;

        const ok = await confirm('Remove Member', `Are you sure you want to remove ${formatDisplayName(memberName)} from the club?`, 'Remove');
        if (!ok) return;

        const member = club.members.find(m => m.name === memberName);
        const idx = club.members.findIndex(m => m.name === memberName);
        
        // Remove from local state
        if (idx !== -1) {
            club.members.splice(idx, 1);
        }

        // Also remove from Firebase if this is a real user with UID
        if (member && member.uid) {
            try {
                const memberRef = ref(db, `modules/club_members/${club.id}/${member.uid}`);
                await remove(memberRef);
                console.log(`[removeMemberFromClub] ✅ Removed ${memberName} (UID: ${member.uid}) from Firebase for club ${club.id}`);
            } catch (err) {
                console.error('[removeMemberFromClub] Failed to remove from Firebase:', err);
            }
        }

        // If the removed member is the current user, update their joined list
        const currentUser = getCurrentUser();
        if (currentUser && memberName.toLowerCase() === currentUser.name.toLowerCase()) {
            joinedClubIds.delete(club.id);
            localStorage.setItem('joinedClubIds', JSON.stringify(Array.from(joinedClubIds)));
            
            selectedClubId = null;
            renderJointClubs();
            
            alert('Removed', `You have been removed from ${club.name}.`);
            return;
        }

        // Re-render
        selectClub(selectedClubId, true);
        
        alert('Removed', `${formatDisplayName(memberName)} has been removed from the club.`);
    }

    function selectClub(clubId, keepState = false) {
        selectedClubId = clubId;

        // Update active class on buttons
        dummyClubs.forEach((club) => {
            const btn = document.getElementById(`btn-club-${club.id}`);
            if (btn) {
                if (club.id === clubId) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });

        // Update simulate admin button UI state
        const simAdminBtn = document.getElementById('btnToggleSimulateAdmin');
        if (simAdminBtn) {
            if (window._simulateClubAdmin) {
                simAdminBtn.classList.remove('bg-gray-100', 'dark:bg-white/5', 'text-gray-500', 'dark:text-gray-400');
                simAdminBtn.classList.add('bg-blue-500/10', 'border-blue-500/30', 'text-blue-500');
                const span = simAdminBtn.querySelector('span');
                if (span) span.innerText = 'Simulate Admin: ACTIVE';
            } else {
                simAdminBtn.classList.remove('bg-blue-500/10', 'border-blue-500/30', 'text-blue-500');
                simAdminBtn.classList.add('bg-gray-100', 'dark:bg-white/5', 'text-gray-500', 'dark:text-gray-400');
                const span = simAdminBtn.querySelector('span');
                if (span) span.innerText = 'Simulate Club Administrator';
            }
        }

        const club = dummyClubs.find(c => c.id === clubId);
        if (!club) return;

        const emptyState = document.getElementById('jointClubEmptyState');
        const detailView = document.getElementById('jointClubDetailView');
        if (emptyState) emptyState.classList.add('hidden');
        if (detailView) detailView.classList.remove('hidden');

        // Reset description panel expansion state
        isDescExpanded = false;
        const descWrapper = document.getElementById('jointClubDescWrapper');
        const toggleBtn = document.getElementById('btnToggleClubDesc');
        if (descWrapper && toggleBtn) {
            descWrapper.style.maxHeight = '0px';
            descWrapper.style.opacity = '0';
            descWrapper.style.marginTop = '0px';
            descWrapper.style.marginBottom = '0px';
            descWrapper.classList.add('hidden');
            toggleBtn.classList.remove('text-blue-500', 'dark:text-blue-400');
            toggleBtn.classList.add('text-gray-400', 'dark:text-gray-500');
        }

        // Check if current user is club manager to show the add announcement button
        const addClubAnnBtn = document.getElementById('btnAddClubAnnouncement');
        if (addClubAnnBtn) {
            const currentUser = getCurrentUser();
            const clubModule = window.AppModules && window.AppModules.Club;
            const isManager = clubModule ? clubModule.isClubManager(currentUser, club) : (currentUser && (currentUser.role === 'admin' || (club.email && currentUser.email && club.email.toLowerCase() === currentUser.email.toLowerCase())));
            
            if (isManager) {
                addClubAnnBtn.classList.remove('hidden');
            } else {
                addClubAnnBtn.classList.add('hidden');
            }
        }

        const addClubEvtBtn = document.getElementById('btnAddClubEvent');
        if (addClubEvtBtn) {
            const currentUser = getCurrentUser();
            const clubModule = window.AppModules && window.AppModules.Club;
            const isManager = clubModule ? clubModule.isClubManager(currentUser, club) : (currentUser && (currentUser.role === 'admin' || (club.email && currentUser.email && club.email.toLowerCase() === currentUser.email.toLowerCase())));
            
            if (isManager) {
                addClubEvtBtn.classList.remove('hidden');
            } else {
                addClubEvtBtn.classList.add('hidden');
            }
        }

        // Update titles and descriptions
        const titleEl = document.getElementById('jointClubTitle');
        const descEl = document.getElementById('jointClubDesc');
        const listEl = document.getElementById('jointClubAnnouncements');

        if (titleEl) titleEl.innerText = club.name;
        if (descEl) descEl.innerText = club.desc;

        if (listEl) {
            listEl.innerHTML = `
                <div class="py-6 flex flex-col items-center justify-center gap-2 text-gray-400">
                    <div class="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-[#007AFF] dark:border-white/20 dark:border-t-[#0A84FF]"></div>
                    <span class="text-xs">Loading announcements...</span>
                </div>
            `;

            get(ref(db, `modules/club_announcements/${club.id}`)).then(snap => {
                let dbAnnouncements = [];
                if (snap.exists()) {
                    const val = snap.val() || {};
                    dbAnnouncements = Object.keys(val).map(key => ({
                        id: key,
                        ...val[key]
                    })).sort((a, b) => b.timestamp - a.timestamp);
                }

                club.announcements = [...dbAnnouncements, ...club.defaultAnnouncements];

                if (club.announcements.length === 0) {
                    listEl.innerHTML = '<div class="text-xs text-gray-400 italic">No announcements for this club yet.</div>';
                } else {
                    const currentUser = getCurrentUser();
                    const clubModule = window.AppModules && window.AppModules.Club;
                    const isManager = clubModule ? clubModule.isClubManager(currentUser, club) : (currentUser && (currentUser.role === 'admin' || (club.email && currentUser.email && club.email.toLowerCase() === currentUser.email.toLowerCase())));

                    listEl.innerHTML = club.announcements.map(ann => {
                        const deleteBtn = (isManager && ann.id) ? `
                            <button onclick="AppModules.News.deleteClubAnnouncement('${ann.id}', event)" class="absolute top-3.5 right-3.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1" title="Delete Announcement">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        ` : '';

                        return `
                            <div class="relative p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-gray-800/80">
                                <h4 class="font-bold text-base text-black dark:text-white mb-1 pr-6">${ann.title}</h4>
                                <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">${ann.desc}</p>
                                ${deleteBtn}
                            </div>
                        `;
                    }).join('');
                }
            }).catch(err => {
                console.error("Failed to load club announcements from database:", err);
                club.announcements = [...club.defaultAnnouncements];
                listEl.innerHTML = club.announcements.map(ann => {
                    return `
                        <div class="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-gray-800/80">
                            <h4 class="font-bold text-base text-black dark:text-white mb-1">${ann.title}</h4>
                            <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">${ann.desc}</p>
                        </div>
                    `;
                }).join('');
            });
        }

        // Render Club Events list dynamically
        const eventsListEl = document.getElementById('jointClubEvents');
        if (eventsListEl) {
            eventsListEl.innerHTML = `
                <div class="py-4 flex flex-col items-center justify-center gap-2 text-gray-400">
                    <div class="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-[#007AFF] dark:border-white/20 dark:border-t-[#0A84FF]"></div>
                    <span class="text-xs">Loading events...</span>
                </div>
            `;

            get(ref(db, `modules/club_events/${club.id}`)).then(snap => {
                let dbEvents = [];
                if (snap.exists()) {
                    const val = snap.val() || {};
                    dbEvents = Object.keys(val).map(key => ({
                        id: key,
                        ...val[key]
                    })).sort((a, b) => new Date(a.date) - new Date(b.date));
                }

                if (dbEvents.length === 0) {
                    eventsListEl.innerHTML = '<div class="text-xs text-gray-400 italic py-2 text-center">No recent events</div>';
                } else {
                    const currentUser = getCurrentUser();
                    const clubModule = window.AppModules && window.AppModules.Club;
                    const isManager = clubModule ? clubModule.isClubManager(currentUser, club) : (currentUser && (currentUser.role === 'admin' || (club.email && currentUser.email && club.email.toLowerCase() === currentUser.email.toLowerCase())));

                    eventsListEl.innerHTML = dbEvents.map(evt => {
                        const deleteBtn = isManager ? `
                            <button onclick="AppModules.News.deleteClubEvent('${evt.id}', event)" class="absolute top-3.5 right-3.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1" title="Delete Event">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        ` : '';

                        const eventTime = evt.time ? new Date(`1970-01-01T${evt.time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
                        const dateLabel = formatEventDateDisplay(evt.date);
                        const metaParts = formatEventMetaParts(dateLabel, eventTime, evt.room);
                        const safeDesc = (evt.desc || '').trim();

                        return `
                            <div class="group relative bg-gray-50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/10 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-3 transition-all duration-200">
                                <div class="pr-8">
                                    <h4 class="text-sm font-bold text-black dark:text-white truncate">${evt.title || 'Untitled Event'}</h4>
                                    <p class="text-[11px] text-gray-400 truncate mt-0.5">${club.name}</p>
                                    <p class="text-[11px] text-gray-400 truncate mt-0.5">${metaParts.join(' | ')}</p>
                                    ${safeDesc ? `<p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-1.5">${safeDesc}</p>` : ''}
                                </div>
                                ${deleteBtn}
                            </div>
                        `;
                    }).join('');
                }
            }).catch(err => {
                console.error("Failed to load club events from database:", err);
                eventsListEl.innerHTML = '<div class="text-xs text-gray-400 italic py-2 text-center">No recent events</div>';
            });
        }

        // Render Club Members list dynamically - load from Firebase first, then fallback to dummyClubs
        const esc = window.escapeHTML || ((str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
        const membersGrid = document.getElementById('jointClubMembersGrid');
        
        if (membersGrid) {
            // First show loading state
            membersGrid.innerHTML = `
                <div class="col-span-2 py-4 flex flex-col items-center justify-center gap-2 text-gray-400">
                    <div class="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-[#007AFF] dark:border-white/20 dark:border-t-[#0A84FF]"></div>
                    <span class="text-xs">Loading members...</span>
                </div>
            `;

            // Try to load from Firebase
            console.log(`[renderMembers] Loading members from Firebase at path: modules/club_members/${club.id}`);
            
            get(ref(db, `modules/club_members/${club.id}`)).then(snap => {
                let dbMembers = [];
                if (snap.exists()) {
                    const val = snap.val() || {};
                    dbMembers = Object.keys(val).map(key => ({
                        uid: key,
                        ...val[key],
                        isRealUser: true  // Mark as real user from Firebase
                    }));
                    console.log(`[renderMembers] ✅ Loaded ${dbMembers.length} real members from Firebase for club ${club.id}:`, dbMembers.map(m => m.name));
                } else {
                    console.log(`[renderMembers] ️ No members found in Firebase for club ${club.id}. Will use dummyClubs data.`);
                }

                // Merge Firebase members with dummyClubs members
                // First, add all real users from Firebase
                let allMembers = [...dbMembers];
                
                // Then add dummy/virtual users that are NOT already in Firebase
                const firebaseUids = new Set(dbMembers.map(m => m.uid?.toLowerCase()));
                const firebaseNames = new Set(dbMembers.map(m => m.name?.toLowerCase()));
                
                club.members.forEach(dummyMember => {
                    const dummyUid = dummyMember.uid?.toLowerCase();
                    const dummyName = dummyMember.name?.toLowerCase();
                    
                    // Check if this dummy member is already in Firebase (by UID or name)
                    const isDuplicate = dummyUid ? firebaseUids.has(dummyUid) : 
                                       firebaseNames.has(dummyName);
                    
                    if (!isDuplicate) {
                        allMembers.push({
                            ...dummyMember,
                            isRealUser: false  // Mark as virtual/dummy user
                        });
                    }
                });
                
                console.log(`[renderMembers]  Merged members: ${dbMembers.length} real + ${allMembers.length - dbMembers.length} virtual = ${allMembers.length} total`);

                // Make sure the current user is in the member list if they joined
                const currentUser = getCurrentUser();
                if (currentUser && joinedClubIds.has(club.id)) {
                    const exists = allMembers.some(m => 
                        (m.uid && m.uid === currentUser.uid) || 
                        (m.name && m.name.toLowerCase() === currentUser.name.toLowerCase())
                    );
                    if (!exists) {
                        allMembers.push({
                            name: currentUser.name,
                            uid: currentUser.uid || '',
                            email: currentUser.email || '',
                            isAdmin: false
                        });
                    }
                }

                // Reorder list to pair short names together and avoid empty spaces when a long name spans 2 columns
                const packedMembers = [];
                const remaining = [...allMembers];
                
                while (remaining.length > 0) {
                    const current = remaining.shift();
                    const currentFormatted = formatDisplayName(current.name || 'Unknown');
                    const isLong = currentFormatted.length > 9;
                    
                    if (isLong) {
                        packedMembers.push(current);
                    } else {
                        packedMembers.push(current);
                        // Find the next short member to pair with this one
                        const partnerIdx = remaining.findIndex(m => formatDisplayName(m.name || '').length <= 9);
                        if (partnerIdx !== -1) {
                            const partner = remaining.splice(partnerIdx, 1)[0];
                            packedMembers.push(partner);
                        }
                    }
                }

                membersGrid.innerHTML = packedMembers.map(m => {
                    const memberName = m.name || 'Unknown';
                    const formattedName = formatDisplayName(memberName);
                    const isLong = formattedName.length > 9;
                    const colSpanClass = isLong ? 'col-span-2' : '';
                    
                    const adminDot = m.isAdmin ? `
                        <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-white dark:border-[#1C1C1E] flex items-center justify-center shadow-md z-10" title="Administrator">
                            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                                <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
                            </svg>
                        </div>
                    ` : '';
                    const escapedName = memberName.replace(/'/g, "\\'");
                    return `
                        <div data-member-card data-member-name="${escapedName}" onclick="AppModules.News.handleMemberClick('${escapedName}')" class="relative p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition duration-200 cursor-pointer select-none ${colSpanClass}">
                            <span class="font-bold text-sm text-black dark:text-white truncate">${esc(formattedName)}</span>
                            ${adminDot}
                        </div>
                    `;
                }).join('');

                // Bind setupMemberLongPress to each card
                const cards = membersGrid.querySelectorAll('[data-member-card]');
                cards.forEach(card => {
                    const name = card.getAttribute('data-member-name');
                    setupMemberLongPress(card, name);
                });

                // Sync merged members back to club.members so context menu can find them
                // This ensures both Firebase members and dummyClubs members are available for right-click menu
                club.members = allMembers;
                console.log(`[renderMembers]  Synced ${allMembers.length} total members back to club.members for context menu support`);
            }).catch(err => {
                console.error("Failed to load club members from database:", err);
                // Fallback to dummyClubs members on error
                renderMembersFromDummyClubs(club, membersGrid, esc);
            });
        }
    }

    function renderMembersFromDummyClubs(club, membersGrid, esc) {
        // Make sure the current user is in the member list if they joined
        const currentUser = getCurrentUser();
        if (currentUser && joinedClubIds.has(club.id)) {
            const exists = club.members.some(m => m.name.toLowerCase() === currentUser.name.toLowerCase());
            if (!exists) {
                club.members.push({
                    name: currentUser.name,
                    isAdmin: false
                });
            }
        }

        // Reorder list to pair short names together and avoid empty spaces when a long name spans 2 columns
        const packedMembers = [];
        const remaining = [...club.members];
        
        while (remaining.length > 0) {
            const current = remaining.shift();
            const currentFormatted = formatDisplayName(current.name);
            const isLong = currentFormatted.length > 9;
            
            if (isLong) {
                packedMembers.push(current);
            } else {
                packedMembers.push(current);
                // Find the next short member to pair with this one
                const partnerIdx = remaining.findIndex(m => formatDisplayName(m.name).length <= 9);
                if (partnerIdx !== -1) {
                    const partner = remaining.splice(partnerIdx, 1)[0];
                    packedMembers.push(partner);
                }
            }
        }

        membersGrid.innerHTML = packedMembers.map(m => {
            const formattedName = formatDisplayName(m.name);
            const isLong = formattedName.length > 9;
            const colSpanClass = isLong ? 'col-span-2' : '';
            
            const adminDot = m.isAdmin ? `
                <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-white dark:border-[#1C1C1E] flex items-center justify-center shadow-md z-10" title="Administrator">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
                    </svg>
                </div>
            ` : '';
            const escapedName = m.name.replace(/'/g, "\\'");
            return `
                <div data-member-card data-member-name="${escapedName}" onclick="AppModules.News.handleMemberClick('${escapedName}')" class="relative p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition duration-200 cursor-pointer select-none ${colSpanClass}">
                    <span class="font-bold text-sm text-black dark:text-white truncate">${esc(formattedName)}</span>
                    ${adminDot}
                </div>
            `;
        }).join('');

        // Bind setupMemberLongPress to each card
        const cards = membersGrid.querySelectorAll('[data-member-card]');
        cards.forEach(card => {
            const name = card.getAttribute('data-member-name');
            setupMemberLongPress(card, name);
        });
    }

    // Ensure first paint is collapsed and primary state is school.
    if (typeof window !== 'undefined') {
        setTimeout(() => {
            currentPrimaryTab = getCurrentNewsTab() === 'club' ? 'club' : 'school';
            updatePrimaryTabUI();
            collapseDiscoverNav();
            updateSubTabUI(currentSubTab);
            setAddAnnouncementVisibility(currentPrimaryTab);
        }, 0);
    }

    async function processBatchData(raw) {
        if (!isAdmin()) return;
        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            alert('Import Error', 'Invalid JSON format.');
            return;
        }

        if (!Array.isArray(data)) {
            alert('Error', 'Data must be an array.');
            return;
        }

        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert('Error', 'Current user not found.');
            return;
        }

        try {
            const promises = data.map(item => {
                const type = (item?.type === 'club' || item?.type === 'club_news') ? 'club' : 'school';
                return set(push(ref(db, `news/${type}`)), {
                    title: item?.title || 'Untitled',
                    desc: item?.desc || '',
                    image: null,
                    authorId: currentUser.id,
                    authorName: currentUser.name,
                    timestamp: Date.now(),
                    type
                });
            });
            await Promise.all(promises);
            alert('Success', `Successfully published ${data.length} items.`);
            if (typeof globalDataSync === 'function') globalDataSync();
        } catch (e) {
            alert('Error', `Failed to publish: ${e.message}`);
        }
    }

    async function openBatchImport() {
        const html = `
            <div class="space-y-4 text-left">
                <p class="text-sm text-gray-500 leading-relaxed">Paste your AI-generated JSON array below. It should include <b>title</b>, <b>desc</b>, and <b>type</b> (school or club).</p>
                <textarea id="batchJsonInput" rows="10" placeholder='[{"title": "Morning Meeting", "desc": "Join us...", "type": "school"}]'
                    class="w-full bg-gray-100 dark:bg-black text-black dark:text-white rounded-2xl px-4 py-3 text-sm font-mono outline-none border border-gray-200 dark:border-gray-800 focus:ring-2 ring-[#007AFF]/20 transition-all"></textarea>
            </div>
        `;
        const result = await showCustom('Batch Import', html, [
            { text: 'Import & Publish', value: 'import', primary: true },
            { text: 'Cancel', value: 'cancel', primary: false }
        ]);

        if (result === 'import') {
            const raw = document.getElementById('batchJsonInput')?.value.trim();
            if (raw) await processBatchData(raw);
        }
    }

    async function renderLocalNews(getLocalNews) {
        const newsTabs = ['school', 'club'];
        newsTabs.forEach((tab) => {
            const containerId = tab === 'school' ? 'schoolNewsContent' : 'clubNewsContent';
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="py-10 flex flex-col items-center gap-2 text-gray-400">
                        <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-[#007AFF] dark:border-white/20 dark:border-t-[#0A84FF]"></div>
                        <span class="text-xs font-medium">Loading announcements...</span>
                    </div>
                `;
            }
        });
        await Promise.all(newsTabs.map(async (tab) => {
            let posts = await getLocalNews(tab);
            
            console.log(`\n========== [DEBUG renderLocalNews] ========== `);
            console.log(`Tab: ${tab}`);
            console.log(`Total posts from IndexedDB: ${posts.length}`);
            
            // Filter Club News by membership - only show club member posts to users who joined that club
            if (tab === 'club') {
                const currentUser = getCurrentUser();
                const userJoinedClubs = new Set(JSON.parse(localStorage.getItem('joinedClubIds') || '[]'));
                
                console.log(`Current user: ${currentUser?.name || 'None'}`);
                console.log(`User joined clubs (from localStorage):`, Array.from(userJoinedClubs));
                console.log(`localStorage raw value:`, localStorage.getItem('joinedClubIds'));
                
                console.log('\n--- Filtering Club News posts ---');
                posts.forEach((post, idx) => {
                    console.log(`Post ${idx + 1}:`);
                    console.log(`  - Key: ${post.key}`);
                    console.log(`  - Title: "${post.title}"`);
                    console.log(`  - clubName: "${post.clubName || 'undefined'}"`);
                    console.log(`  - clubId: "${post.clubId || 'undefined'}"`);
                    console.log(`  - has clubId: ${!!post.clubId}`);
                    
                    if (post.clubId) {
                        const isMember = userJoinedClubs.has(post.clubId);
                        console.log(`  - User is member of this club: ${isMember}`);
                        console.log(`  - Will show: ${isMember ? 'YES ✓' : 'NO ✗'}`);
                    } else {
                        console.log(`  - No clubId (global post): Will show YES ✓`);
                    }
                });
                
                const beforeCount = posts.length;
                posts = posts.filter(post => {
                    // If it's a club member post (has clubId), only show if user has joined that club
                    if (post.clubId) {
                        return userJoinedClubs.has(post.clubId);
                    }
                    // Otherwise show all posts (teacher/admin posts without clubId)
                    return true;
                });
                
                console.log(`\n--- After filtering ---`);
                console.log(`Before: ${beforeCount} posts`);
                console.log(`After: ${posts.length} posts`);
                console.log(`Filtered out: ${beforeCount - posts.length} posts`);
                
                if (posts.length > 0) {
                    console.log('\nPosts that will be displayed:');
                    posts.forEach((post, idx) => {
                        console.log(`  ${idx + 1}. "${post.title}" (clubId: ${post.clubId || 'none'})`);
                    });
                } else {
                    console.log('\n⚠️ NO POSTS WILL BE DISPLAYED');
                }
            }
            
            console.log('=========================================\n');
            
            const containerId = tab === 'school' ? 'schoolNewsContent' : 'clubNewsContent';
            renderNewsContentFromData(posts, containerId, tab);
            
            // For Club News, also store the filtered posts so sync.js can use them
            if (tab === 'club') {
                window._filteredClubNewsPosts = posts;
                console.log('[DEBUG] Stored filtered posts in window._filteredClubNewsPosts:', posts.length);
            }
        }));
    }

    // Global listener to close context menu
    if (typeof document !== 'undefined') {
        document.addEventListener('click', () => {
            const menu = document.getElementById('clubMemberContextMenu');
            if (menu) menu.remove();
        });
    }

    return {
        renderCard,
        renderNewsContentFromData,
        renderLocalNews,
        deleteNews,
        toggleNewsTab,
        openBatchImport,
        processBatchData,
        getCurrentNewsTab,
        selectClub,
        showTooltip,
        hideTooltip,
        toggleClubDesc,
        leaveClub,
        openAddClubAnnouncementForm,
        deleteClubAnnouncement,
        openAddClubEventForm,
        deleteClubEvent,
        handleMemberContextMenu,
        toggleMemberAdminStatus,
        removeMemberFromClub,
        joinClub,
        toggleSimulateAdmin,
        handleDiscoverClubSearch,
        clearDiscoverClubSearch,
        toggleEventSearch,
        maybeCollapseEventSearch,
        handleEventSearch,
        clearEventSearch,
        toggleDiscoverClubSearch,
        maybeCollapseDiscoverClubSearch,
        handleMemberClick
    };
}


































