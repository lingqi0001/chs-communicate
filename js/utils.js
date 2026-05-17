/**
 * ==================================================================================
 * 模块名称：AppUtils (全站工具?
 * 目标文件：js/utils.js
 * 
 * 【设计哲学】：
 * 本模块存放的是“绝对纯净”的辅助函数。它们不依赖任何业务逻辑，也不保存任何状态? * 它们存在的意义是解决 JS 原生 API 在文本处理、日期计算、以?UI 视觉反馈上的不足? * 
 * 【函数清?& 使用手册】：
 * 
 * 1. UIUtils.formatTime(timestamp) [模糊时间转换]
 *    - 【输入】：timestamp (Number) - 毫秒时间戳? *    - 【返回】：String - ?"5m ago", "Just now"? *    - 【存在理由】：比原?`Date.toString()` 更符合人类阅读习惯，常用于公告卡片的时间显示? * 
 * 2. UIUtils.escape(str) [XSS 防御核心]
 *    - 【输入】：str (String) - 待转义文本? *    - 【返回】：String - 转义后的 HTML 编码字符串? *    - 【存在理由】：这是一个极其高效的“奇技淫巧”。它通过创建一个内存中?`p` 标签并设置其 `textContent`，利用浏览器自带的渲染引擎实?100% 安全的转义，比手动正则替换更稳健? * 
 * 3. UIUtils.highlight(el) [交互反馈]
 *    - 【输入】：el (HTMLElement) - 目标 DOM? *    - 【存在理由】：为新加载的消息或刚点击的元素提供一个短暂的“呼吸灯”效果，增强用户视觉引导? * 
 * 4. UIUtils.linkify(text) [超链接识别]
 *    - 【输入】：text (String) - 包含 URL 的原始文本? *    - 【返回】：String - 带有 `<a>` 标签?External Link 图标?HTML 字符串? *    - 【存在理由】：自动将用户发送的网址转化为可点击的链接，并统一注入样式规范? * 
 * 5. UIUtils.formatLastSeen(timestamp) [在线状态计算]
 *    - 【输入】：timestamp (Number)? *    - 【返回】：String - ?"online", "last seen 2 hours ago"? *    - 【存在理由】：专为联系人列表设计，定义?2 分钟内的“活跃阈值”? * 
 * 6. DateUtils.getLocalDateString(offsetDays) [标准日期生成]
 *    - 【输入】：offsetDays (Number) - 偏移天数（如 -1 代表昨天）? *    - 【返回】：String - "YYYY-MM-DD" 格式? *    - 【存在理由】：全站数据库的日期节点（如 `eagle_time/2026-05-13`）都依赖此函数生成的唯一字符串作为索引? * ==================================================================================
 */

export const UIUtils = {
    /**
     * 将毫秒时间戳转换为人性化的模糊时?(? 5m ago)
     */
    formatTime: function (timestamp) {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const now = new Date();
        const diff = (now - date) / 1000;

        if (diff < 60) return "Just now";
        if (diff < 3600) return Math.floor(diff / 60) + "m ago";
        if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
        return date.toLocaleDateString();
    },

    /**
     * XSS 安全转义，防?HTML 注入
     */
    escape: (str) => {
        if (!str) return "";
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    },

    /**
     * 为元素添加短暂的高亮闪烁动画
     */
    highlight: (el) => {
        if (!el) return;
        el.classList.add('highlight-pulse');
        setTimeout(() => el.classList.remove('highlight-pulse'), 1200);
    },

    /**
     * 自动识别文本中的链接并转换为 HTML 标签
     */
    linkify: (text, isInverseColor = false) => {
        if (!text) return "";
        const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]])/g;
        return text.replace(urlRegex, (url) => {
            const colorClass = isInverseColor 
                ? "text-white underline decoration-white/60 hover:text-white/80" 
                : "text-[#007AFF] hover:underline";
            return `<a href="${url}" target="_blank" class="${colorClass} font-bold inline-flex items-center gap-0.5 mx-1">Link <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>`;
        });
    },

    /**
     * 格式化最后上线时?     */
    formatLastSeen: (timestamp) => {
        if (!timestamp) return "";
        const now = Date.now();
        const diff = now - timestamp;
        const mins = Math.floor(diff / 60000);

        if (mins < 2) return "online";
        if (mins < 60) return `last seen ${mins} minute${mins > 1 ? 's' : ''} ago`;

        const hours = Math.floor(mins / 60);
        if (hours < 24) return `last seen ${hours} hour${hours > 1 ? 's' : ''} ago`;

        const days = Math.floor(hours / 24);
        return `last seen ${days} day${days > 1 ? 's' : ''} ago`;
    },

    /**
     * Hide full-page loading page and trigger first-time compatibility guide
     */
    hideLoading: function (onFirstTimeCallback) {
        const lp = document.getElementById('loadingPage');
        if (lp) {
            lp.classList.add('opacity-0');
            setTimeout(() => {
                lp.classList.add('hidden');
                if (!localStorage.getItem('compatibility_dismissed') && onFirstTimeCallback) {
                    onFirstTimeCallback();
                }
            }, 500);
        }
    }
};

export const DateUtils = {
    /**
     * 获取指定偏移天数?ISO 日期字符?(YYYY-MM-DD)
     */
    getLocalDateString: (offsetDays = 0) => {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};


export const ImageUtils = {
    /**
     * Equal-ratio Canvas Image Compression (Jpeg, Quality=0.6)
     */
    compress: function (file, maxSize = 800, quality = 0.6) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onerror = () => reject(new Error("Image failed to load"));
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxSize) { height *= maxSize / width; width = maxSize; }
                    } else {
                        if (height > maxSize) { width *= maxSize / height; height = maxSize; }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    },

    /**
     * Storage Limit Verification & Cleanup
     */
    checkLimitAndCleanup: async function (files, db, auth, get, ref, update, set) {
        if (!auth.currentUser) return false;
        const uidLower = auth.currentUser.uid.toLowerCase();
        const snap = await get(ref(db, `user_image_index/${uidLower}`));
        const uploads = snap.val() || {};
        const keys = Object.keys(uploads);
        const currentTotalImages = keys.reduce((acc, k) => acc + (uploads[k].imgCount || 1), 0);

        if (currentTotalImages + files.length > 15) {
            const step1 = await window.AppModules.Modal.confirm(
                "Storage Limit Reached",
                `You currently have ${currentTotalImages} images saved. Sending these ${files.length} images will exceed your 15-image limit.`
            );
            if (!step1) return false;

            const step2 = await window.AppModules.Modal.confirm(
                "Confirm Expiration",
                "Are you REALLY sure? This will cause your oldest photos to be marked as expired and removed from the server history.",
                "Yes, I'm Sure"
            );
            if (!step2) return false;

            const sortedKeys = keys.sort((a, b) => (uploads[a].timestamp || 0) - (uploads[b].timestamp || 0));
            let neededToDelete = (currentTotalImages + files.length) - 15;

            for (const k of sortedKeys) {
                if (neededToDelete <= 0) break;
                const item = uploads[k];
                if (!item || !item.chatId || !item.msgKey) continue;
                try {
                    await update(ref(db, `messages/${item.chatId}/${item.msgKey}`), {
                        text: "Image Expired",
                        type: "text",
                        isExpired: true
                    });
                    neededToDelete -= (item.imgCount || 1);
                } catch (e) { }
                await set(ref(db, `user_image_index/${uidLower}/${k}`), null);
            }
        }
        return true;
    },

    /**
     * Base64 to Firebase Cloud Storage Upload
     */
    uploadToStorage: async function (base64Data, sRefFn, uploadString, getDownloadURL, auth, folder = 'uploads') {
        if (!base64Data || !base64Data.startsWith('data:image')) return null;
        try {
            const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            let path = `${folder}/${filename}`;
            if (folder === 'chats' && auth.currentUser) {
                path = `chats/${auth.currentUser.uid}/${filename}`;
            }
            const storageRef = sRefFn(path);
            const snapshot = await uploadString(storageRef, base64Data, 'data_url');
            console.log('Storage: Upload successful', snapshot.metadata.fullPath);
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        } catch (error) {
            console.error('Storage: Upload failed', error);
            window.AppModules.Modal.alert("Upload Error", "Failed to save image to cloud. Using temporary local data instead.");
            return base64Data;
        }
    },

    /**
     * Handle Image selection event, compress and send
     */
    handleUploadEvent: async function (e, db, auth, get, ref, update, set) {
        let files = Array.from(e.target.files);
        if (!files.length) return;

        if (files.length > 5) {
            await window.AppModules.Modal.alert("Limit Exceeded", "Maximum 5 images allowed per message. The rest will be ignored.");
            files = files.slice(0, 5);
        }

        const input = document.getElementById('u-msg');

        try {
            if (input) {
                input.placeholder = "Processing...";
                input.disabled = true;
            }

            const allowed = await this.checkLimitAndCleanup(files, db, auth, get, ref, update, set);
            if (!allowed) return;

            const base64s = await Promise.all(files.map(f => this.compress(f)));
            if (base64s.length > 0) {
                if (input) input.placeholder = "Uploading images...";
                await window.MessageEngine.sendImages(base64s);
            }
        } catch (err) {
            console.error("Image sending error:", err);
            await window.AppModules.Modal.alert("Upload Error", "Upload failed. Check your network.");
        } finally {
            if (input) {
                input.disabled = false;
                input.placeholder = "Type a message...Use Shift+Enter to change lines";
            }
            e.target.value = '';
        }
    }
};
