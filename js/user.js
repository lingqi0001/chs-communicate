/**
 * js/user.js
 * 用户与权限核心模块 (User & Auth Core)
 * 
 * [职责] 
 * 身份解析、权限分发、档案同步。
 * 
 * [包含函数清单]
 * 1. isAdmin(email): [权限] 判断是否为超级管理员。
 * 2. isTeacher(email): [权限] 判断是否为 HCPSS 教职员工。
 * 3. isStaff(email): [权限] 综合判断管理权限。
 * 4. fetchUser(userId, db, cache): [数据] 抓取用户资料（含机器人拦截）。
 * 5. syncProfile(user, db): [生命周期] 登录后的首轮资料对齐与心跳开启。
 */

export const UserModule = {
    /**
     * [权限判定] 判断是否为超级管理员
     */
    isAdmin: (email) => {
        if (!email) return false;
        // 依赖全局常量池中的配置
        return email.toLowerCase() === window.CONSTANTS.ADMIN_EMAIL;
    },

    /**
     * [权限判定] 判断是否为 HCPSS 教职员工
     */
    isTeacher: (email) => {
        if (!email) return false;
        return email.toLowerCase().endsWith('@hcpss.org');
    },

    /**
     * [权限判定] 综合判断是否有管理权限 (管理员或老师)
     */
    isStaff: (email) => {
        return UserModule.isAdmin(email) || UserModule.isTeacher(email);
    },

    /**
     * [数据抓取] 获取用户信息 (无 UI 副作用)
     * @param {string} userId - 用户 ID 前缀
     * @param {object} db - Firebase Database 实例
     * @param {object} cache - 可选的内存缓存对象 (ALL_USERS)
     */
    fetchUser: async (userId, db, cache) => {
        if (!userId) return null;
        const cleanedId = userId.toLowerCase();

        // 1. 机器人账户拦截 (硬编码逻辑保持一致)
        if (cleanedId === window.CONSTANTS.SAFETY_BOT_ID) {
            return { id: cleanedId, name: 'Safety Bot', avatar: 'https://cdn-icons-png.flaticon.com/512/1067/1067562.png' };
        }
        if (cleanedId === window.CONSTANTS.ADVICE_BOT_ID) {
            return { id: cleanedId, name: 'Advice Bot', avatar: 'https://cdn-icons-png.flaticon.com/512/3260/3260831.png' };
        }

        // 2. 管理员 Moss 账户拦截
        if (cleanedId === 'moss104088' || cleanedId === 'admin_moss') {
            const adminUser = { id: 'moss104088', name: 'Moss', avatar: window.CONSTANTS.SUSHI_AVATAR, email: window.CONSTANTS.ADMIN_EMAIL };
            if (cache) cache[cleanedId] = adminUser;
            return adminUser;
        }

        // 3. 检查缓存
        if (cache && cache[cleanedId]) return cache[cleanedId];

        // 4. 联网获取
        try {
            const { ref, get } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js");
            const snap = await get(ref(db, `users/${userId}`));
            if (snap.exists()) {
                const userData = snap.val();
                if (cache) cache[userId] = userData;
                return userData;
            }
        } catch (e) {
            console.error('UserModule: fetchUser failed', e);
        }
        return null;
    },

    /**
     * [核心逻辑] 登录后的档案同步与初始化
     * @returns {object} 初始化后的用户信息对象
     */
    syncProfile: async (user, db) => {
        const { ref, get, update, set, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js");
        const email = user.email.toLowerCase();
        const idPrefix = email.split('@')[0].replace(/\./g, '_');
        
        // 分配角色
        let role = 'user';
        if (UserModule.isAdmin(email)) role = 'admin';
        else if (UserModule.isTeacher(email)) role = 'teacher';
        else if (email.endsWith('@inst.hcpss.org')) role = 'student';

        const defaultName = email.split('@')[0];
        const capitalizedDefaultName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
        
        let profile = { name: capitalizedDefaultName, id: idPrefix, role: role, email: email };
        const userRef = ref(db, `users/${idPrefix}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.name) profile.name = userData.name;
            profile.avatar = userData.avatar || null;
            profile.hasAcceptedTerms = userData.hasAcceptedTerms || false;
            
            // 更新数据库
            await update(userRef, { lastSeen: serverTimestamp(), role: role, email: email });

            // 管理员强制头像逻辑
            if (profile.id === 'moss104088' && userData.avatar !== window.CONSTANTS.SUSHI_AVATAR) {
                await update(userRef, { avatar: window.CONSTANTS.SUSHI_AVATAR });
                profile.avatar = window.CONSTANTS.SUSHI_AVATAR;
            }
        } else {
            // 新用户
            profile.hasAcceptedTerms = false;
            profile._isNewUser = true;
            await set(userRef, {
                name: profile.name,
                role: role,
                email: email,
                lastSeen: serverTimestamp(),
                registeredAt: serverTimestamp(),
                hasAcceptedTerms: false
            });
        }
        return profile;
    }
};
