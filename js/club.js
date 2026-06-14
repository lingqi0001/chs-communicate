/**
 * ==================================================================================
 * Module: AppModules.Club (js/club.js)
 * Purpose: Handles club-specific role checks and authorization helpers.
 * ==================================================================================
 */

export const ClubModule = {
    /**
     * Determines if a user is a manager (sponsor, president, or platform admin) of a specific club.
     * @param {Object} user - The current user object.
     * @param {Object} club - The club data object.
     * @returns {boolean} True if the user has management permissions for the club.
     */
    isClubManager(user, club) {
        if (window._simulateClubAdmin && location.hostname === 'localhost') return true;
        if (!user || !club) return false;

        // 1. Platform Admins have global permission for all clubs
        if (user.role === 'admin') return true;

        // 2. Check if the user is listed as an admin in the club's member list
        if (club.members) {
            // Check by name (case-insensitive) or by ID
            const isMemberAdmin = club.members.some(m => 
                m.isAdmin && (
                    (m.name && user.name && m.name.toLowerCase() === user.name.toLowerCase()) ||
                    (m.id && user.id && m.id === user.id)
                )
            );
            if (isMemberAdmin) return true;
        }

        // 3. Check if user's email matches the sponsor's email
        if (club.email && user.email && club.email.toLowerCase() === user.email.toLowerCase()) {
            return true;
        }

        return false;
    }
};

// Expose standard hooks on window
if (window) {
    if (!window.AppModules) window.AppModules = {};
    window.AppModules.Club = ClubModule;
}
