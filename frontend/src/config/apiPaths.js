export const API_PATHS = {
    user: {
        list: () => "/user/list",
        search: (term) => `/user/search?name=${encodeURIComponent(term)}`,
        byId: (id) => `/user/${id}`,
        me: () => "/user/me",
        meStats: () => "/user/me/stats",
        register: () => "/user",
    },
    auth: {
        logout: () => "/api/auth/logout",
    },
    admin: {
        login: () => "/admin/login",
        logout: () => "/admin/logout",
        users: (params) => `/admin/users?${params.toString()}`,
        statsOverview: (qs) => `/api/admin/stats/overview?${qs}`,
        statsLeaderboard: (type, qs) =>
            `/api/admin/stats/leaderboards?type=${type}&${qs}`,
    },
    photos: {
        ofUser: (id) => `/photosOfUser/${id}`,
        recent: (params) => `/photos/recent?${params.toString()}`,
        create: () => "/photos/new",
        byId: (id) => `/photos/${id}`,
        replaceImage: (id) => `/photos/${id}/image`,
    },
    comments: {
        ofPhoto: (photoId) => `/commentsOfPhoto/${photoId}`,
        byId: (photoId, commentId) => `/commentsOfPhoto/${photoId}/${commentId}`,
    },
    friends: {
        list: (limit, skip) => `/api/friends/list?limit=${limit}&skip=${skip}`,
        status: (userId) => `/api/friends/status/${userId}`,
        requestsIncoming: (limit, skip) =>
            `/api/friends/requests/incoming?limit=${limit}&skip=${skip}`,
        requestsOutgoing: (limit, skip) =>
            `/api/friends/requests/outgoing?limit=${limit}&skip=${skip}`,
        requestAccept: (requestId) => `/api/friends/requests/${requestId}/accept`,
        requestDecline: (requestId) => `/api/friends/requests/${requestId}/decline`,
        requestCancel: (requestId) => `/api/friends/requests/${requestId}`,
        requestSend: (userId) => `/api/friends/requests/${userId}`,
        unfriend: (userId) => `/api/friends/${userId}`,
    },
    reactions: {
        photo: (photoId) => `/api/photos/${photoId}/reaction`,
        comment: (commentId) => `/api/comments/${commentId}/reaction`,
    },
};
