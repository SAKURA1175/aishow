/**
 * 现代化弹窗系统 - ChatGPT 风格
 * 提供 alert、confirm、prompt、loading 等功能
 */

class ModalManager {
    constructor() {
        this.modals = [];
        this.toastContainer = null;
        this.initToastContainer();
    }

    initToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        this.toastContainer = container;
    }

    /**
     * 显示提示弹窗
     * @param {string} title - 标题
     * @param {string} message - 消息内容
     * @param {function} onConfirm - 确认回调
     */
    alert(title, message, onConfirm) {
        return this.show({
            title,
            message,
            buttons: [
                { text: '确定', primary: true, action: onConfirm }
            ]
        });
    }

    /**
     * 显示确认弹窗
     * @param {string} title - 标题
     * @param {string} message - 消息内容
     * @param {function} onConfirm - 确认回调
     * @param {function} onCancel - 取消回调
     */
    confirm(title, message, onConfirm, onCancel) {
        return this.show({
            title,
            message,
            buttons: [
                { text: '取消', action: onCancel },
                { text: '确认', primary: true, action: onConfirm }
            ]
        });
    }

    /**
     * 显示删除确认弹窗（危险操作）
     * @param {string} title - 标题
     * @param {string} message - 消息内容
     * @param {function} onConfirm - 确认回调
     * @param {function} onCancel - 取消回调
     */
    confirmDelete(title, message, onConfirm, onCancel) {
        return this.show({
            title,
            message,
            buttons: [
                { text: '取消', action: onCancel },
                { text: '删除', danger: true, action: onConfirm }
            ]
        });
    }

    /**
     * 显示输入框弹窗
     * @param {string} title - 标题
     * @param {string} message - 消息内容
     * @param {string} placeholder - 输入框占位符
     * @param {function} onConfirm - 确认回调（传入输入值）
     * @param {function} onCancel - 取消回调
     */
    prompt(title, message, placeholder, onConfirm, onCancel) {
        return this.show({
            title,
            message,
            hasInput: true,
            inputPlaceholder: placeholder,
            buttons: [
                { text: '取消', action: onCancel },
                { text: '确认', primary: true, action: onConfirm }
            ]
        });
    }

    /**
     * 显示加载弹窗
     * @param {string} title - 标题
     * @param {string} message - 消息内容
     */
    loading(title, message) {
        return this.show({
            title,
            message,
            hasSpinner: true,
            closeable: false,
            buttons: []
        });
    }

    /**
     * 核心弹窗显示方法
     */
    show(options) {
        const {
            title = '',
            message = '',
            buttons = [],
            hasInput = false,
            inputPlaceholder = '',
            hasSpinner = false,
            closeable = true
        } = options;

        // 创建 overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        // 创建内容容器
        const content = document.createElement('div');
        content.className = 'modal-content';

        // 创建 header
        let headerHtml = '';
        if (title) {
            headerHtml = `
                <div class="modal-header">
                    <h3>${this.escapeHtml(title)}</h3>
                    ${closeable ? '<button class="modal-close-btn" type="button">✕</button>' : ''}
                </div>
            `;
        }

        // 创建 body
        let bodyHtml = `<div class="modal-body">`;
        
        if (hasSpinner) {
            bodyHtml += '<div class="modal-spinner"></div>';
        }
        
        if (message) {
            bodyHtml += `<p>${this.escapeHtml(message)}</p>`;
        }
        
        if (hasInput) {
            bodyHtml += `<input type="text" class="modal-input" placeholder="${this.escapeHtml(inputPlaceholder)}" style="width: 100%; padding: 10px; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; background: rgba(0,0,0,0.3); color: var(--text-primary); box-sizing: border-box; margin-top: 12px; font-size: 14px;" />`;
        }
        
        bodyHtml += '</div>';

        // 创建 footer（按钮）
        let footerHtml = '';
        if (buttons.length > 0) {
            footerHtml = '<div class="modal-footer">';
            buttons.forEach((btn, idx) => {
                const btnClass = btn.primary ? 'modal-btn-primary' : btn.danger ? 'modal-btn-danger' : 'modal-btn-secondary';
                footerHtml += `<button class="modal-btn ${btnClass}" data-btn-index="${idx}" type="button">${this.escapeHtml(btn.text)}</button>`;
            });
            footerHtml += '</div>';
        }

        // 组装 HTML
        content.innerHTML = headerHtml + bodyHtml + footerHtml;

        // 绑定关闭按钮
        if (closeable) {
            const closeBtn = content.querySelector('.modal-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal(overlay));
            }
        }

        // 点击 overlay 背景关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && closeable) {
                this.closeModal(overlay);
            }
        });

        // 绑定按钮事件
        buttons.forEach((btn, idx) => {
            const btnElement = content.querySelector(`[data-btn-index="${idx}"]`);
            if (btnElement) {
                btnElement.addEventListener('click', () => {
                    const inputValue = hasInput ? content.querySelector('.modal-input')?.value : null;
                    if (btn.action) {
                        btn.action(inputValue);
                    }
                    this.closeModal(overlay);
                });
            }
        });

        // 支持 Enter 键提交
        if (hasInput) {
            const input = content.querySelector('.modal-input');
            if (input && buttons.length > 0) {
                const primaryBtn = buttons.find(b => b.primary);
                if (primaryBtn) {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            const inputValue = input.value;
                            if (primaryBtn.action) {
                                primaryBtn.action(inputValue);
                            }
                            this.closeModal(overlay);
                        }
                    });
                    // 自动聚焦
                    setTimeout(() => input.focus(), 100);
                }
            }
        }

        overlay.appendChild(content);
        document.body.appendChild(overlay);

        this.modals.push(overlay);

        return overlay;
    }

    /**
     * 关闭弹窗
     */
    closeModal(overlay) {
        overlay.style.animation = 'fadeOut 0.2s ease-in forwards';
        setTimeout(() => {
            overlay.remove();
            this.modals = this.modals.filter(m => m !== overlay);
        }, 200);
    }

    /**
     * 关闭所有弹窗
     */
    closeAll() {
        this.modals.forEach(modal => modal.remove());
        this.modals = [];
    }

    /**
     * 显示 Toast 通知
     * @param {string} message - 消息
     * @param {string} type - 类型：'success', 'error', 'warning', 'info'
     * @param {number} duration - 显示时长（毫秒）
     */
    toast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // 图标
        const icon = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        }[type] || 'ℹ';

        toast.innerHTML = `<span style="font-weight: 600;">${icon}</span><span>${this.escapeHtml(message)}</span>`;
        
        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /**
     * HTML 转义，防止 XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 添加 fadeOut 动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// 创建全局实例
window.Modal = new ModalManager();

// 导出为全局函数简化使用
window.showAlert = (title, message, onConfirm) => window.Modal.alert(title, message, onConfirm);
window.showConfirm = (title, message, onConfirm, onCancel) => window.Modal.confirm(title, message, onConfirm, onCancel);
window.showDeleteConfirm = (title, message, onConfirm, onCancel) => window.Modal.confirmDelete(title, message, onConfirm, onCancel);
window.showLoading = (title, message) => window.Modal.loading(title, message);
window.showToast = (message, type, duration) => window.Modal.toast(message, type, duration);
