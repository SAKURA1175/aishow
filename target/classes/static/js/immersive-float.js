/**
 * 全局沉浸模式悬浮窗
 * 在除了 profile.html 的所有页面显示
 */

(function() {
    // 检查是否在 profile.html 页面
    function isProfilePage() {
        return window.location.pathname.includes('profile.html');
    }

    // 如果在 profile.html，不显示悬浮窗
    if (isProfilePage()) {
        return;
    }

    // 创建悬浮窗元素
    function createFloatingBtn() {
        const btn = document.createElement('button');
        btn.className = 'immersive-float-btn';
        btn.title = '进入沉浸模式';
        btn.innerHTML = '🌟';
        
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // 导航到 profile.html 并进入沉浸模式
            sessionStorage.setItem('enterImmersiveMode', 'true');
            window.location.href = 'profile.html';
        });

        return btn;
    }

    // 在 DOM 加载完成后添加悬浮窗
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            const floatingBtn = createFloatingBtn();
            document.body.appendChild(floatingBtn);
        });
    } else {
        const floatingBtn = createFloatingBtn();
        document.body.appendChild(floatingBtn);
    }
})();
