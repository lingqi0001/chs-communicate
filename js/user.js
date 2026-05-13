/**
 * js/user.js
 * 用户与权限核心模块 (User & Auth Core)
 * [职责] 负责身份解析、权限分发、档案同步。
 * [依赖] 仅依赖 db.js?v=2 导出的标准接口，不直接操作 Firebase SDK。
 */

import { db, auth, CloudDB, PATHS } from './db.js?v=2';

// 全局常量
const ADMIN_EMAIL = 'moss104088@gmail.com';
const MOSS_ID = 'moss104088';
const SUSHI_AVATAR = 'https://raw.githubusercontent.com/yikuansun/chs-static/main/sushi.png';

export const UserModule = {
    current: null, // 当前用户状态持有者

    isAdmin() {
        return this.current?.email?.toLowerCase() === ADMIN_EMAIL;
    },

    isTeacher() {
        return this.current?.email?.toLowerCase().endsWith('@hcpss.org');
    },

    isStudent() {
        return this.current?.email?.toLowerCase().endsWith('@inst.hcpss.org');
    },

    /**
     * [兼容性函数] 保持旧有接口名，内部调用 init
     */
    async syncProfile(firebaseUser) {
        return this.init(firebaseUser);
    },

    /**
     * [核心初始化] 初始化并同步用户档案
     */
    async init(firebaseUser) {
        // 防御性：等待 DB 实例接通
        if (!db) {
            await new Promise(r => setTimeout(r, 150));
        }

        if (!firebaseUser || !firebaseUser.email) return null;

        const email = firebaseUser.email.toLowerCase();
        const idPrefix = email.split('@')[0].replace(/\./g, '_');
        
        let role = 'user';
        if (email === ADMIN_EMAIL) role = 'admin';
        else if (email.endsWith('@hcpss.org')) role = 'teacher';
        else if (email.endsWith('@inst.hcpss.org')) role = 'student';

        const defaultName = email.split('@')[0];
        const capitalizedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
        
        let profile = { 
            name: capitalizedName, 
            id: idPrefix, 
            role: role, 
            email: email,
            uid: firebaseUser.uid 
        };

        // 使用 CloudDB 标准接口读取
        const userData = await CloudDB.get(PATHS.user(idPrefix));

        if (userData) {
            profile = { ...profile, ...userData };
            // 更新最后登录时间与角色
            await CloudDB.update(PATHS.user(idPrefix), { 
                lastSeen: CloudDB.serverTime(), 
                role: role, 
                email: email 
            });

            // 管理员强制头像补偿
            if (profile.id === MOSS_ID && profile.avatar !== SUSHI_AVATAR) {
                await CloudDB.update(PATHS.user(idPrefix), { avatar: SUSHI_AVATAR });
                profile.avatar = SUSHI_AVATAR;
            }
        } else {
            // 新用户初始化
            profile.hasAcceptedTerms = false;
            profile._isNewUser = true;
            await CloudDB.set(PATHS.user(idPrefix), {
                name: profile.name,
                role: role,
                email: email,
                lastSeen: CloudDB.serverTime(),
                registeredAt: CloudDB.serverTime(),
                hasAcceptedTerms: false
            });
        }

        this.current = profile;
        return profile;
    },

    /**
     * [数据抓取] 获取任意用户信息
     */
    async fetchUser(userId, cache) {
        if (!userId) return null;
        const cleanedId = userId.toLowerCase();

        // 机器人与管理员拦截逻辑
        if (cleanedId === 'safety_bot') return { id: 'safety_bot', name: 'Safety Bot', avatar: 'https://cdn-icons-png.flaticon.com/512/1067/1067562.png' };
        if (cleanedId === 'advice_bot') return { id: 'advice_bot', name: 'Advice Bot', avatar: 'https://cdn-icons-png.flaticon.com/512/3260/3260831.png' };
        if (cleanedId === MOSS_ID || cleanedId === 'admin_moss') return { id: MOSS_ID, name: 'Moss', avatar: SUSHI_AVATAR, email: ADMIN_EMAIL };

        if (cache && cache[cleanedId]) return cache[cleanedId];

        try {
            // 使用 CloudDB 标准接口
            const userData = await CloudDB.get(PATHS.user(userId));
            if (userData && cache) cache[userId] = userData;
            return userData;
        } catch (e) {
            console.error('UserModule: fetchUser failed', e);
        }
        return null;
    }
};
