const NotifModule = {
    init() {
        // Initialization if needed
    },

    render() {
        const container = document.getElementById('notif-list');
        if (!container) return;

        let notifications = [...App.state.notifications];
        
        if (notifications.length === 0) {
            container.innerHTML = '<div class="no-data">No notifications right now</div>';
            this.updateBadge();
            return;
        }

        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        container.innerHTML = notifications.map(notif => {
            const style = Utils.getNotifStyle(notif.type);
            const unreadClass = notif.isRead ? '' : 'unread';
            
            return `
                <div class="notif-item ${unreadClass}" onclick="NotifModule.markRead('${notif.id}')">
                    <div class="notif-icon ${style.className}">
                        <span class="material-icons">${style.icon}</span>
                    </div>
                    <div class="notif-content">
                        <h4>${notif.title}</h4>
                        <p>${notif.message}</p>
                        <span class="notif-time">${Utils.timeAgo(notif.createdAt)}</span>
                    </div>
                </div>
            `;
        }).join('');

        this.updateBadge();
    },

    async markRead(id) {
        try {
            await ApiService.markNotificationRead(id);
            // Update local state
            const notif = App.state.notifications.find(n => n.id === id);
            if (notif) notif.isRead = true;
            
            this.render();
        } catch (error) {
            console.error('Error marking notification read', error);
        }
    },

    markAllRead() {
        if (App.state.notifications.length === 0) return;
        
        // Mock mark all read
        App.state.notifications.forEach(n => n.isRead = true);
        this.render();
        Utils.showToast('All notifications marked as read', 'success');
    },

    updateBadge() {
        const badge = document.getElementById('notif-badge');
        if (!badge) return;

        const unreadCount = App.state.notifications.filter(n => !n.isRead).length;
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
};
window.NotifModule = NotifModule;
