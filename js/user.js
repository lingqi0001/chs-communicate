/**
 * ==================================================================================
 * 模块名称：UserModule (用户与权限中心)
 * 目标文件：js/user.js
 * 
 * 【设计哲学】：
 * 用户模块是全站的“通行证”。它不直接操作 Firebase SDK，而是通过 db.js 提供的
 * 云端接口，将复杂的 UID (Firebase 随机 ID) 映射为易读的 ID Prefix (Email 前缀)。
 * 它决定了谁是管理员、谁是老师、谁是学生，并负责在登录瞬间完成档案对账。
 * 
 * 【函数清单 & 使用手册】：
 * 
 * 1. isAdmin() [公开 API]
 *    - 【输入】：无。
 *    - 【返回】：Boolean - 是否为最高管理员。
 *    - 【存在理由】：用于控制 UI 中“删除公告”、“管理后台”等高危操作按钮的显隐。
 * 
 * 2. isTeacher() [公开 API]
 *    - 【输入】：无。
 *    - 【返回】：Boolean - 是否为教职员工 (hcpss.org 邮箱)。
 *    - 【存在理由】：教职员工拥有发布校园公告、管理班级等中等权限。
 * 
 * 3. isStudent() [公开 API]
 *    - 【输入】：无。
 *    - 【返回】：Boolean - 是否为学生 (inst.hcpss.org 邮箱)。
 *    - 【存在理由】：限制学生只能访问学术模块，无法进入教工管理区域。
 * 
 * 4. syncProfile(firebaseUser) [兼容性桥接]
 *    - 【输入】：firebaseUser (Object) - Firebase Auth 原始对象。
 *    - 【返回】：Promise(Object) - 整理后的用户档案。
 *    - 【存在理由】：它是旧版代码调用的入口，内部直接调用新版的 init()，确保重构期间不影响业务运行。
 * 
 * 5. init(firebaseUser) [核心初始化]
 *    - 【输入】：firebaseUser (Object) - Firebase Auth 原始对象。
 *    - 【返回】：Promise(Object) - 包含 name, id, role, avatar, uid 等完整信息的档案。
 *    - 【存在理由】：这是全站最核心的初始化函数。它负责将 Email 转为 ID Prefix，从云端拉取档案。如果是新用户，它还负责在云端数据库创建第一条初始记录。
 * 
 * 6. fetchUser(userId, cache) [数据拉取 API]
 *    - 【输入】：userId (String) - 目标用户 ID；cache (Object) - 可选的缓存对象。
 *    - 【返回】：Promise(Object | null) - 目标用户的档案数据。
 *    - 【存在理由】：它是聊天和社交模块的命脉。它内置了对 Safety Bot、Advice Bot 等虚拟账户的拦截返回逻辑，并支持内存缓存，避免高频重复请求数据库。
 * ==================================================================================
 */

import { db, auth, CloudDB, PATHS } from './db.js';
import { SYSTEM_USERS, APP_CONSTANTS } from './config.js';

// 全局常量 (从 Config 继承)
const ADMIN_EMAIL = APP_CONSTANTS.ADMIN_EMAIL;
const MOSS_ID = 'moss104088';

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
            if (profile.id === MOSS_ID) {
                const sysAdmin = SYSTEM_USERS[MOSS_ID];
                if (profile.avatar !== sysAdmin.avatar) {
                    await CloudDB.update(PATHS.user(idPrefix), { avatar: sysAdmin.avatar });
                    profile.avatar = sysAdmin.avatar;
                }
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

        // 1. 优先检查系统预定义账户 (Bots/Admin)
        if (SYSTEM_USERS[cleanedId]) {
            return SYSTEM_USERS[cleanedId];
        }

        // 2. 兼容性拦截 (针对旧代码中可能存在的 admin_moss 变体)
        if (cleanedId === 'admin_moss') return SYSTEM_USERS[MOSS_ID];

        // 3. 检查内存缓存
        if (cache && cache[cleanedId]) return cache[cleanedId];

        try {
            // 4. 使用 CloudDB 标准接口从云端拉取
            const userData = await CloudDB.get(PATHS.user(userId));
            if (userData && cache) cache[userId] = userData;
            return userData;
        } catch (e) {
            console.error('UserModule: fetchUser failed', e);
        }
        return null;
    }
};
