
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
        import { getDatabase, ref, push, set, get, update, onValue, onChildAdded, serverTimestamp, query, limitToLast, orderByKey, startAfter } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
        import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
        import { getStorage, ref as sRef, uploadString, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

        let db, auth, storage;
        let appUser = null;
        let isAdmin = false;
        let isStaff = false;

        const MODULE_PAGE_MAP = {
            'lost_and_found': 'lostFoundPage',
            'marketplace': 'marketplacePage',
            'peer_tutoring': 'tutoringPage',
            'suggestions': 'suggestionsPage',
            'info': 'infoPage'
        };

        const MODULE_CONFIG = {
            'lost_and_found': { title: 'Lost & Found', postBtn: 'Report', hasImage: true, hasComments: true },
            'marketplace': { title: 'Marketplace', postBtn: 'Sell', hasImage: true, hasComments: true },
            'peer_tutoring': { title: 'Peer Tutoring', postBtn: 'Help', hasImage: false, hasComments: true },
            'suggestions': { title: 'Suggestions', postBtn: 'Suggest', hasImage: false, hasComments: true, anonymous: true },
            'info': { title: 'CHS Info', postBtn: null, hasImage: false, hasComments: false }
        };

        let moduleType = new URLSearchParams(window.location.search).get('type');
        let currentPostId = null;
        let postDetailListener = null;
        let currentPostBase64 = null;
        let isPostingNews = false;
        let modulePosts = [];
        let currentModuleSort = 'latest';
        let moduleListener = null;

        function linkify(text) {
            var urlRegex = /(https?:\/\/[^\s]+)/g;
            return text.replace(urlRegex, function(url) {
                return '<a href="' + url + '" target="_blank" class="text-[#007AFF] hover:underline">' + url + '</a>';
            });
        }
        function escapeHTML(str) {
            const p = document.createElement('p');
            p.textContent = str;
            return p.innerHTML;
        }
        function openGallery(imagesStr, index) {
            try {
                const images = JSON.parse(decodeURIComponent(imagesStr));
                window.parent.postMessage({ type: 'OPEN_GALLERY', images: images, index: index }, '*');
            } catch(e) {}
        }

        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'FIREBASE_CONFIG') {
                const app = initializeApp(event.data.config);
                db = getDatabase(app);
                auth = getAuth(app);
                storage = getStorage(app);
                window.parent.postMessage({ type: 'GET_USER' }, '*');
            } else if (event.data && event.data.type === 'USER_RESPONSE') {
                appUser = event.data.user;
                isAdmin = event.data.isAdmin;
                isStaff = event.data.isStaff;
                initModule();
            } else if (event.data && event.data.type === 'HEADER_BTN_CLICKED') {
                if (event.data.actionId === 'post_clicked') {
                    openPostForm();
                }
            }
        });

        function initModule() {
            const config = MODULE_CONFIG[moduleType];
            if (!config) return;
            
            window.parent.postMessage({ type: 'SET_TITLE', title: config.title }, '*');
            if (config.postBtn) {
                window.parent.postMessage({ type: 'SET_HEADER_BTN', text: config.postBtn, actionId: 'post_clicked' }, '*');
            }
            
            const pageId = MODULE_PAGE_MAP[moduleType];
            document.querySelectorAll('#pagesContainer > div').forEach(div => div.classList.add('hidden'));
            const activePage = document.getElementById(pageId);
            if (activePage) activePage.classList.remove('hidden');

            if (moduleListener) moduleListener(); // clear previous
            moduleListener = onValue(ref(db, `modules/${moduleType}`), (snapshot) => {
                const data = snapshot.val() || {};
                modulePosts = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                renderModuleList();
            });
        }

        function renderModuleList() {
            const pageId = MODULE_PAGE_MAP[moduleType];
            const listEl = document.querySelector(`#${pageId} .module-list`);
            if (!listEl) return;
            listEl.innerHTML = '';

            if (modulePosts.length === 0) {
                listEl.innerHTML = '<div class="flex flex-col items-center justify-center mt-20 text-gray-400"><svg class="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg><p class="text-sm font-medium">No posts yet</p></div>';
                return;
            }

            if (moduleTypeSort === 'latest') {
                modulePosts.sort((a, b) => b.timestamp - a.timestamp);
            } else {
                modulePosts.sort((a, b) => (Object.keys(b.likes || {}).length) - (Object.keys(a.likes || {}).length));
            }

            if (!window._masonryResizeListener) {
                let lastCols = 0;
                window._masonryResizeListener = () => {
                    if (!moduleType) return;
                    let c = 1;
                    const w = window.innerWidth;
                    if (w >= 1536) c = 5;
                    else if (w >= 1280) c = 4;
                    else if (w >= 1024) c = 3;
                    else if (w >= 640) c = 2;
                    if (c !== lastCols) {
                        lastCols = c;
                        renderModuleList();
                    }
                };
                window.addEventListener('resize', window._masonryResizeListener);
            }

            let cols = 1;
            const w = window.innerWidth;
            if (w >= 1536) cols = 5;
            else if (w >= 1280) cols = 4;
            else if (w >= 1024) cols = 3;
            else if (w >= 640) cols = 2;

            if (window._masonryResizeListener) {
                // Ensure lastCols is initialized
                window._masonryResizeListener.lastCols = cols;
            }

            const columns = Array.from({ length: cols }, () => []);
            modulePosts.forEach((post, i) => columns[i % cols].push(post));

            const mappedPostsHtml = columns.map(colPosts => {
                if (colPosts.length === 0) return '';
                return `<div class="flex-1 flex flex-col gap-4 max-w-[320px]">` + colPosts.map(post => {
                    const config = MODULE_CONFIG[moduleType];
                    const likesCount = Object.keys(post.likes || {}).length;
                    const isLiked = post.likes && auth.appUser && post.likes[auth.appUser.uid];

                    const authorName = config.anonymous ? 'Anonymous User' : (post.authorName || 'Unknown');
                    const authorAvatar = config.anonymous ? 'https://ui-avatars.com/api/?name=Anonymous&background=random' : (ALL_USERS[post.authorId]?.avatar || 'https://ui-avatars.com/api/?name=' + authorName + '&background=random');

                    let interactions = `<div class="flex items-center gap-5 mt-3">
                        <button onclick="toggleLike('${post.id}')" class="flex items-center gap-1.5 ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'} transition-colors group">
                            <svg class="w-6 h-6 ${isLiked ? 'fill-current scale-110' : 'fill-none group-active:scale-90'} transition-transform" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                            <span class="text-sm font-medium">${likesCount}</span>
                        </button>`;

                    if (config.hasComments) {
                        const commentsCount = Object.keys(post.comments || {}).length;
                        interactions += `<button onclick="openPostDetail('${post.id}')" class="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group">
                            <div class="relative">
                                <svg class="w-6 h-6 fill-none group-active:scale-90 transition-transform" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                                </svg>
                                <div id="mainUnreadDot" class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black hidden"></div>
                            </div>
                            <span class="text-sm font-medium">${commentsCount}</span>
                        </button>`;
                    }

                    interactions += `<button onclick="reportPost('${post.id}')" class="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group active:scale-95" title="Report Post"><svg class="w-6 h-6 fill-none transition-transform" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></button>`;

                    interactions += `<div class="flex-1"></div>`;

                    if (!config.anonymous && post.authorId !== appUser.id) {
                        interactions += `<button onclick="window.startModuleChat('${post.authorId}')" class="bg-[#007AFF] text-white px-4 py-1.5 rounded-full text-sm font-semibold active:scale-95 transition-transform shadow-md shadow-blue-500/20 ml-3">Chat</button>`;
                    }

                    interactions += `</div>`;

                    let adminDeleteBtn = '';
                    if (isAdmin || isStaff) {
                        adminDeleteBtn = `<button onclick="deletePost('${post.id}')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 active:scale-95 transition-transform p-1 ml-2" title="Delete Post"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>`;
                    }

                    return `
                        <div class="bg-white dark:bg-[#1C1C1E] rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-white/5 active:bg-gray-50 dark:active:bg-white/5 transition-colors w-full">
                            <div class="flex items-start mb-3">
                                <img src="${authorAvatar}" class="w-10 h-10 rounded-full object-cover shadow-sm mr-3">
                                <div class="flex-1 min-w-0">
                                    <div class="font-bold text-sm leading-tight text-black dark:text-white truncate">${escapeHTML(authorName)}</div>
                                    <div class="text-xs text-gray-500 font-medium mt-0.5">${new Date(post.timestamp).toLocaleString()}</div>
                                </div>
                                ${adminDeleteBtn}
                            </div>
                            <div class="font-bold text-lg mb-2 text-black dark:text-white leading-snug cursor-pointer" ${config.hasComments ? `onclick="openPostDetail('${post.id}')"` : ''}>${escapeHTML(post.title)}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">${linkify(escapeHTML(post.desc))}</div>
                            ${(post.image && !window.isPhotoDisabled) ? `
                            <div class="relative w-full">
                                <img src="${post.image}" class="w-full aspect-square object-cover rounded-2xl mt-3 cursor-pointer border border-gray-100 dark:border-white/5" 
                                     onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');"
                                     onclick="openGallery('${encodeURIComponent(JSON.stringify([post.image]))}')">
                                <div class="hidden mt-3 px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-2xl text-gray-400 text-xs italic flex items-center gap-2 border border-dashed border-gray-200 dark:border-gray-800">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                    Photo no longer available
                                </div>
                            </div>` : ''}
                            ${(post.image && window.isPhotoDisabled) ? `<div class="mt-3 px-4 py-3 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-400 text-xs italic flex items-center gap-2 border border-gray-100 dark:border-white/5"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Photos Disabled</div>` : ''}
                            ${getSuggestionVotingHtml(post)}
                            ${interactions}
                        </div>
                    `;
                }).join('') + `</div>`;
            }).join('');

            listEl.innerHTML = `<div class="flex gap-4 items-start justify-center w-full mx-auto max-w-[1600px]">${mappedPostsHtml}</div>`;
        }


        window.openModule = (moduleName) => {
            moduleType = moduleName;
            moduleTypeSort = 'latest';
            const config = MODULE_CONFIG[moduleName];
            const pageId = MODULE_PAGE_MAP[moduleName];

            if (pageId === 'extensionPage') {
                window.openExtension(moduleName);
                return;
            }

            const page = document.getElementById(pageId);
            if (page) {
                const titleEl = page.querySelector('.module-title');
                const addBtn = page.querySelector('.module-add-btn');
                if (titleEl) titleEl.innerText = config.title;
                if (addBtn) {
                    if (config.postBtn) {
                        addBtn.innerText = config.postBtn;
                        addBtn.classList.remove('hidden');
                    } else {
                        addBtn.classList.add('hidden');
                    }
                }
            }

            openOverlayPage(pageId, () => setModuleSort('latest'));
        };


        window.closeModule = () => {
            const pageId = MODULE_PAGE_MAP[moduleType];
            closeOverlayPage(pageId, () => {
                if (moduleListener) { moduleListener(); moduleListener = null; }
                moduleType = null;
            });
        };


        window.openPostForm = () => {
            console.log('App: Opening Module Post Form. Module:', moduleType);
            isPostingNews = false;
            document.getElementById('postInputTitle').value = '';
            document.getElementById('postInputDesc').value = '';
            window.clearPostImage();
            const postBtnLabel = (moduleType && MODULE_CONFIG[moduleType]) ? MODULE_CONFIG[moduleType].postBtn : 'Post';
            document.getElementById('postPageTitle').innerText = 'New ' + (postBtnLabel || 'Post');
            document.getElementById('batchImportBtn')?.classList.add('hidden');

            const imgArea = document.querySelector('#postPage .bg-gray-100.dark\\:bg-black.rounded-2xl.p-8');
            if (imgArea) imgArea.style.display = window.isPhotoDisabled ? 'none' : 'flex';

            const page = document.getElementById('postPage');
            page.classList.remove('hidden');
            requestAnimationFrame(() => {
                document.getElementById('postPageBackdrop').classList.add('opacity-100');
                document.getElementById('postPageContent').classList.remove('translate-y-full');
            });
        };


        window.closePostForm = () => {
            document.getElementById('postPageBackdrop').classList.remove('opacity-100');
            document.getElementById('postPageContent').classList.add('translate-y-full');
            setTimeout(() => {
                document.getElementById('postPage').classList.add('hidden');
                isPostingNews = false;
                isRequestingExtension = false;
                // Reset placeholders
                document.getElementById('postInputTitle').placeholder = "Subject";
                document.getElementById('postInputDesc').placeholder = "What's on your mind?";
                const imgArea = document.querySelector('#postPage .bg-gray-100.dark\\:bg-black.rounded-2xl.p-8');
                if (imgArea) imgArea.classList.remove('hidden');
            }, 400);
        };


        window.handlePostImageSelect = (e) => {
            if (window.isPhotoDisabled) {
                showCustomAlert("Restricted", "Photo uploads are currently disabled by the administrator.");
                e.target.value = '';
                return;
            }
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    currentPostBase64 = canvas.toDataURL('image/jpeg', 0.8);

                    document.getElementById('postImagePreview').src = currentPostBase64;
                    document.getElementById('postImagePreview').classList.remove('hidden');
                    document.getElementById('postImageClearBtn').classList.remove('hidden');
                    document.getElementById('postImagePlaceholder').classList.add('hidden');
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        };


        window.clearPostImage = (e) => {
            if (e) e.stopPropagation();
            currentPostBase64 = null;
            document.getElementById('postFileInput').value = '';
            document.getElementById('postImagePreview').classList.add('hidden');
            document.getElementById('postImageClearBtn').classList.add('hidden');
            document.getElementById('postImagePlaceholder').classList.remove('hidden');
        };


        window.submitPost = () => {
            const now = Date.now();
            if (now - lastPostSentTime < POST_COOLDOWN) {
                alert(`Please wait ${Math.ceil((POST_COOLDOWN - (now - lastPostSentTime)) / 1000)}s before posting again.`);
                return;
            }

            const title = document.getElementById('postInputTitle').value.trim();
            const desc = document.getElementById('postInputDesc').value.trim();
            if (!title || !desc) { alert("Title and description are required."); return; }

            if (title.length > 200 || desc.length > 1000) {
                showCustomAlert("Content Too Long", "Titles are limited to 200 characters and descriptions to 1000 characters.");
                return;
            }

            if (currentPostBase64 && window.isPhotoDisabled) {
                showCustomAlert("Restricted", "Photo uploads are currently disabled by the administrator.");
                window.clearPostImage();
                return;
            }

            checkModeration(`Title: ${title}\nDesc: ${desc}`).then(isSafe => {
                if (!isSafe) {
                    showCustomAlert("Submission Blocked", "Your post contains content that violates our community safety guidelines.");
                    return;
                }

                const config = (moduleType && MODULE_CONFIG[moduleType]) ? MODULE_CONFIG[moduleType] : {};
                const isAnonymous = config.anonymous || false;
                lastPostSentTime = now;

                if (isRequestingExtension) {
                    const adminId = ADMIN_EMAIL.split('@')[0].replace(/\./g, '_');
                    const requestText = `[EXTENSION REQUEST]\nTool Name: ${title}\nDescription: ${desc}\nSubmitted by: ${appUser.name} (${appUser.id})`;

                    const adminChatId = getChatId(ADVICE_BOT_ID, adminId);
                    push(ref(db, `messages/${adminChatId}`), {
                        senderId: ADVICE_BOT_ID,
                        senderName: 'Advice Bot',
                        text: requestText,
                        timestamp: serverTimestamp()
                    });
                    update(ref(db, `user_chats/${adminId.toLowerCase()}`), { [ADVICE_BOT_ID]: serverTimestamp() });

                    const userChatId = getChatId(ADVICE_BOT_ID, appUser.id);
                    const confirmText = `[SUBMISSION SUCCESSFUL]\nThank you for your suggestion! "Advice Bot" has delivered your request for "${title}" to the Admin team for review.`;
                    push(ref(db, `messages/${userChatId}`), {
                        senderId: ADVICE_BOT_ID,
                        senderName: 'Advice Bot',
                        text: confirmText,
                        timestamp: serverTimestamp()
                    });
                    update(ref(db, `user_chats/${appUser.id.toLowerCase()}`), { [ADVICE_BOT_ID]: serverTimestamp() });

                    showCustomAlert("Success", "Your suggestion has been sent to Admin. Thank you!");
                    closePostForm();
                    return;
                }

                const publishContent = async () => {
                    let finalImageUrl = null;
                    if (currentPostBase64) {
                        // Show a temporary hint in the alert/form if possible
                        finalImageUrl = await uploadImageToStorage(currentPostBase64, isPostingNews ? 'announcements' : 'modules');
                    }

                    const dbRefStr = isPostingNews ? `news/${currentNewsTab}` : `modules/${moduleType}`;
                    set(push(ref(db, dbRefStr)), {
                        title, desc,
                        image: finalImageUrl,
                        authorId: isAnonymous ? 'anonymous' : appUser.id,
                        authorName: isAnonymous ? 'Anonymous' : appUser.name,
                        timestamp: Date.now(),
                        likes: {}
                    }).then(() => {
                        showCustomAlert("Success", "Published successfully!");
                        closePostForm();
                        if (isPostingNews) globalDataSync();
                    }).catch(err => {
                        lastPostSentTime = 0;
                        alert("Failed to post: " + err.message);
                    });
                };

                publishContent();
            });
        };


        window.openPostDetail = (postId) => {
            currentPostId = postId;
            const page = document.getElementById('detailPage');
            page.classList.remove('hidden');
            requestAnimationFrame(() => page.classList.remove('translate-x-full'));

            const config = MODULE_CONFIG[moduleType];
            document.getElementById('commentInputArea').classList.toggle('hidden', !config.hasComments);

            if (postDetailListener) postDetailListener();
            postDetailListener = onValue(ref(db, `modules/${moduleType}/${postId}`), (snap) => {
                const post = snap.val();
                if (post) renderPostDetail(postId, post);
            });
        };


        window.closeDetail = () => {
            const page = document.getElementById('detailPage');
            page.classList.add('translate-x-full');
            setTimeout(() => page.classList.add('hidden'), 380);
            if (postDetailListener) { postDetailListener(); postDetailListener = null; }
            currentPostId = null;
        };


        async function renderPostDetail(postId, post) {
            const contentEl = document.getElementById('detailContent');
            const config = MODULE_CONFIG[moduleType];
            const likesCount = Object.keys(post.likes || {}).length;
            const isLiked = post.likes && auth.appUser && post.likes[auth.appUser.uid];

            const authorName = config.anonymous ? 'Anonymous' : (post.authorName || 'Unknown');
            const author = !config.anonymous ? await fetchUser(post.authorId) : null;
            const authorAvatar = config.anonymous ? 'https://ui-avatars.com/api/?name=Anon&background=random' : (author?.avatar || 'https://ui-avatars.com/api/?name=' + authorName);

            let html = `
                <div class="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                    <div class="flex items-center gap-4 mb-5">
                        <img src="${authorAvatar}" class="w-14 h-14 rounded-full object-cover">
                        <div>
                            <div class="font-bold text-lg text-black dark:text-white">${authorName}</div>
                            <div class="text-sm text-gray-400 font-medium">${new Date(post.timestamp).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="font-extrabold text-2xl mb-3 text-black dark:text-white">${escapeHTML(post.title)}</div>
                    <div class="text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${linkify(escapeHTML(post.desc))}</div>
                    ${(post.image && !window.isPhotoDisabled) ? `
                    <div class="relative w-full">
                        <img src="${post.image}" class="w-full rounded-2xl mt-5 border border-gray-100 dark:border-white/5 cursor-pointer" 
                             onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');"
                             onclick="openGallery('${encodeURIComponent(JSON.stringify([post.image]))}')">
                        <div class="hidden mt-5 px-5 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-gray-500 text-sm italic flex items-center gap-3 border border-dashed border-gray-200 dark:border-gray-800">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            Photo no longer available
                        </div>
                    </div>` : ''}
                    ${(post.image && window.isPhotoDisabled) ? `<div class="mt-5 px-5 py-4 bg-gray-100 dark:bg-white/5 rounded-2xl text-gray-500 text-sm italic flex items-center gap-3 border border-gray-100 dark:border-white/5"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Photos Blocked by Administrator</div>` : ''}
                    ${getSuggestionVotingHtml({ ...post, id: postId })}
                    <div class="flex items-center gap-5 mt-5 pt-5 border-t border-gray-100 dark:border-white/5">
                        <button onclick="toggleLike('${postId}')" class="flex items-center gap-1.5 ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}">
                            <svg class="w-7 h-7 ${isLiked ? 'fill-current' : 'fill-none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                            <span class="text-base font-medium">${likesCount}</span>
                        </button>
                        <button onclick="reportPost('${postId}')" class="text-gray-400 hover:text-gray-600"><svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></button>
                    </div>
                </div>`;

            if (config.hasComments) {
                const comments = post.comments || {};
                const sorted = Object.keys(comments).map(k => ({ id: k, ...comments[k] })).sort((a, b) => a.timestamp - b.timestamp);
                html += `<div class="mt-8 font-bold text-xl mb-5 px-2 text-black dark:text-white">Comments (${sorted.length})</div>`;
                if (sorted.length === 0) {
                    html += `<div class="text-center text-gray-400 text-sm mt-5">No comments yet.</div>`;
                } else {
                    html += `<div class="space-y-4">`;
                    for (const c of sorted) {
                        const cAuthorName = config.anonymous ? 'Anonymous' : (c.authorName || 'Unknown');
                        const cAuthor = !config.anonymous ? await fetchUser(c.authorId) : null;
                        const cAuthorAvatar = config.anonymous ? 'https://ui-avatars.com/api/?name=Anon&background=random' : (cAuthor?.avatar || 'https://ui-avatars.com/api/?name=' + cAuthorName);
                        html += `<div class="flex gap-4"><img src="${cAuthorAvatar}" class="w-10 h-10 rounded-full mt-1"><div class="flex-1 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/5 rounded-2xl p-4 shadow-sm"><div class="flex justify-between mb-1"><span class="font-bold text-sm text-black dark:text-white">${escapeHTML(cAuthorName)}</span><span class="text-gray-400 text-xs">${new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><div class="text-base text-gray-700 dark:text-gray-300">${linkify(escapeHTML(c.text))}</div></div></div>`;
                    }
                    html += `</div>`;
                }
            }
            contentEl.innerHTML = html;
        }


        window.submitComment = () => {

            const now = Date.now();
            if (now - lastCommentSentTime < COMMENT_COOLDOWN) return;
            const input = document.getElementById('commentInput');
            const text = input.value.trim();
            if (!text || !currentPostId) return;

            checkModeration(text).then(isSafe => {
                if (!isSafe) {
                    showCustomAlert("Blocked", "Inappropriate content detected.");
                    return;
                }
                const config = MODULE_CONFIG[moduleType] || {};
                const isAnonymous = config.anonymous || false;
                lastCommentSentTime = now;
                set(push(ref(db, `modules/${moduleType}/${currentPostId}/comments`)), {
                    text,
                    authorId: isAnonymous ? 'anonymous' : appUser.id,
                    authorName: isAnonymous ? 'Anonymous' : appUser.name,
                    timestamp: Date.now()
                }).then(() => { input.value = ''; }).catch(e => alert(e.message));
            });
        };


        window.deletePost = async (postId) => {
            if (!confirm("Are you sure you want to delete this post?")) return;
            try {
                await set(ref(db, `modules/${moduleType}/${postId}`), null);
            } catch (e) {
                alert("Failed to delete post.");
            }
        };


        window.toggleLike = async (postId) => {
            if (!auth.appUser) return;
            const uid = auth.appUser.uid;
            const postRef = ref(db, `modules/${moduleType}/${postId}/likes/${uid}`);
            const post = modulePosts.find(p => p.id === postId);
            try {
                if (post && post.likes && post.likes[uid]) {
                    await set(postRef, null);
                } else {
                    await set(postRef, true);
                }
            } catch (err) { console.error(err); }
        };


        function getSuggestionVotingHtml(post) {
            if (moduleType !== 'suggestions') return '';
            const supportVotes = post.supportVotes || {};
            const notSupportVotes = post.notSupportVotes || {};
            const supportCount = Object.keys(supportVotes).length;
            const notSupportCount = Object.keys(notSupportVotes).length;
            const totalVotes = supportCount + notSupportCount;
            const supportPercent = totalVotes > 0 ? Math.round((supportCount / totalVotes) * 100) : 0;
            const notSupportPercent = totalVotes > 0 ? Math.round((notSupportCount / totalVotes) * 100) : 0;
            const userVote = auth.appUser ? (supportVotes[auth.appUser.uid] ? 'support' : (notSupportVotes[auth.appUser.uid] ? 'not_support' : null)) : null;

            let barHtml = '';
            if (totalVotes === 0) {
                barHtml = '<div class="h-full flex-1 bg-gray-200 dark:bg-white/10"></div>';
            } else {
                let slantHtml = '';
                if (notSupportPercent > 0 && supportPercent > 0) {
                    slantHtml = '<div class="h-[150%] w-[3px] bg-white dark:bg-[#1C1C1E] transform skew-x-[-20deg] z-10 -mx-[1.5px]"></div>';
                }
                barHtml = '<div class="h-full bg-red-500 transition-all duration-700 ease-out" style="width: ' + notSupportPercent + '%;"></div>' +
                    slantHtml +
                    '<div class="h-full bg-blue-500 transition-all duration-700 ease-out flex-1"></div>';
            }

            return `
                <div class="mt-4 border border-gray-100 dark:border-white/5 rounded-2xl p-2 bg-gray-50/50 dark:bg-white/5 shadow-sm">
                    <div class="flex justify-between items-center px-2 py-1 mb-2">
                        <button onclick="voteSuggestion('${post.id}', 'not_support'); event.stopPropagation();" 
                                class="flex flex-col items-start active:scale-95 transition-transform group cursor-pointer w-1/2">
                            <div class="flex items-center gap-1.5">
                                <div class="w-6 h-6 rounded-full flex items-center justify-center ${userVote === 'not_support' ? 'bg-red-500 text-white shadow-md shadow-red-500/30' : 'bg-red-100 text-red-500 dark:bg-red-500/20 group-hover:bg-red-200 dark:group-hover:bg-red-500/30'} transition-all">
                                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </div>
                                <span class="font-bold text-sm ${userVote === 'not_support' ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}">Not Support</span>
                            </div>
                            <div class="text-xs font-bold mt-1 ${userVote === 'not_support' ? 'text-red-500' : 'text-gray-400'} ml-7">${notSupportPercent}% (${notSupportCount})</div>
                        </button>
                        
                        <button onclick="voteSuggestion('${post.id}', 'support'); event.stopPropagation();" 
                                class="flex flex-col items-end active:scale-95 transition-transform group cursor-pointer w-1/2">
                            <div class="flex items-center gap-1.5 justify-end w-full">
                                <span class="font-bold text-sm ${userVote === 'support' ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'}">Support</span>
                                <div class="w-6 h-6 rounded-full flex items-center justify-center ${userVote === 'support' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'bg-blue-100 text-blue-500 dark:bg-blue-500/20 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/30'} transition-all">
                                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            </div>
                            <div class="text-xs font-bold mt-1 ${userVote === 'support' ? 'text-blue-500' : 'text-gray-400'} mr-7">${supportPercent}% (${supportCount})</div>
                        </button>
                    </div>
                    
                    <div class="h-2 w-full bg-gray-200 dark:bg-black/50 rounded-full overflow-hidden flex items-center shadow-inner">
                        ${barHtml}
                    </div>
                </div>
            `;
        }


        window.voteSuggestion = async (postId, voteType) => {
            if (!auth.appUser) return;
            const uid = auth.appUser.uid;
            const supportRef = ref(db, `modules/suggestions/${postId}/supportVotes/${uid}`);
            const notSupportRef = ref(db, `modules/suggestions/${postId}/notSupportVotes/${uid}`);

            const post = modulePosts.find(p => p.id === postId) || (currentPostId === postId ? (await get(ref(db, `modules/suggestions/${postId}`))).val() : null);
            if (!post) return;

            const currentVote = (post.supportVotes && post.supportVotes[uid]) ? 'support'
                : (post.notSupportVotes && post.notSupportVotes[uid]) ? 'not_support' : null;

            try {
                if (voteType === 'support') {
                    if (currentVote === 'support') {
                        await set(supportRef, null);
                    } else {
                        await set(supportRef, true);
                        if (currentVote === 'not_support') await set(notSupportRef, null);
                    }
                } else {
                    if (currentVote === 'not_support') {
                        await set(notSupportRef, null);
                    } else {
                        await set(notSupportRef, true);
                        if (currentVote === 'support') await set(supportRef, null);
                    }
                }
            } catch (err) {
                alert("Failed to vote: " + err.message);
                console.error(err);
            }
        };


        window.reportPost = (postId) => {
    window.parent.postMessage({ type: "SHOW_TOAST", message: "Report feature moved to main app." }, "*");
    return;

            const adminId = ADMIN_EMAIL.split('@')[0].replace(/\./g, '_');
            const post = modulePosts.find(p => p.id === postId);
            if (!post) return;
            const author = await fetchUser(post.authorId);
            const receiverName = author?.name || 'Unknown';

            try {
                // 1. Notify Admin
                const adminChatId = getChatId(SAFETY_BOT_ID, adminId);
                const reportText = `[REPORT - POST]\nModule: ${moduleType}\nSubject: ${post.title}\nContent: ${post.desc}\nAuthor: ${receiverName} (${post.authorId})\nReported by: ${appUser.name} (${appUser.id})`;
                await push(ref(db, `messages/${adminChatId}`), {
                    senderId: SAFETY_BOT_ID,
                    senderName: 'Safety Bot',
                    text: reportText,
                    timestamp: serverTimestamp()
                });
                update(ref(db, `user_chats/${adminId.toLowerCase()}`), { [SAFETY_BOT_ID]: serverTimestamp() });

                // 2. Notify Reporter
                const userChatId = getChatId(SAFETY_BOT_ID, appUser.id);
                const confirmText = `[REPORT - POST - SUCCESSFUL]\nYour report regarding the post "${post.title}" has been submitted. Thank you.`;
                await push(ref(db, `messages/${userChatId}`), {
                    senderId: SAFETY_BOT_ID,
                    senderName: 'Safety Bot',
                    text: confirmText,
                    timestamp: serverTimestamp()
                });
                update(ref(db, `user_chats/${appUser.id.toLowerCase()}`), { [SAFETY_BOT_ID]: serverTimestamp() });

                alert("Post reported successfully! Administrators will review it via Safety Bot.");
            } catch (e) {
                alert("Reporting failed: " + e.message);
            }
        };


        window.startModuleChat = (authorId) => {
    window.parent.postMessage({ type: "SHOW_TOAST", message: "Chat feature moved to main app." }, "*");
    return;

            closeModule();
            setTimeout(() => {
                const isMobile = window.innerWidth < 1024;
                if (isMobile) {
                    const messagesBtn = document.getElementById('tabBtn-messages');
                    if (messagesBtn) messagesBtn.click();
                }
                switchChat(authorId);
            }, 350);
        };




        // Export required functions to window object
        window.openPostForm = openPostForm;
        window.closePostForm = closePostForm;
        window.handlePostImageSelect = handlePostImageSelect;
        window.clearPostImage = clearPostImage;
        window.submitPost = submitPost;
        window.toggleLike = toggleLike;
        window.openPostDetail = openPostDetail;
        window.closeDetail = closeDetail;
        window.submitComment = submitComment;
        window.deletePost = deletePost;
        window.voteSuggestion = voteSuggestion;
        
        window.parent.postMessage({ type: 'READY_FOR_CONFIG' }, '*');
    