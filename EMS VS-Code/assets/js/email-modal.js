// Shared Custom Email Notification Modal for EMS Dashboard Header
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const SENT_EMAILS_STORAGE_KEY = "ems_sent_emails_history";

export function initEmailModal(currentUser) {
    // Inject modal styles if not already present
    if (!document.getElementById('email-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'email-modal-styles';
        style.textContent = `
            .ems-email-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(5, 10, 30, 0.78);
                backdrop-filter: blur(5px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            .ems-email-modal-overlay.show {
                opacity: 1;
                pointer-events: auto;
            }
            .ems-email-modal-box {
                background: #111c44;
                border: 1px solid #1b2e6e;
                border-radius: 16px;
                width: 95%;
                max-width: 640px;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
                transform: translateY(-20px);
                transition: transform 0.3s ease;
                overflow: hidden;
            }
            .ems-email-modal-overlay.show .ems-email-modal-box {
                transform: translateY(0);
            }
            .ems-email-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 18px 24px;
                border-bottom: 1px solid #1b2e6e;
                background: #14204d;
            }
            .ems-email-modal-header h3 {
                color: #ffffff;
                font-size: 17px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .ems-email-modal-header h3 i {
                color: #4299e1;
            }
            .ems-email-modal-close {
                background: none;
                border: none;
                color: #8898aa;
                font-size: 18px;
                cursor: pointer;
                transition: .2s;
            }
            .ems-email-modal-close:hover {
                color: #f87171;
            }
            .ems-email-modal-tabs {
                display: flex;
                background: #0b1437;
                border-bottom: 1px solid #1b2e6e;
                padding: 0 24px;
                gap: 8px;
            }
            .ems-email-tab-btn {
                background: none;
                border: none;
                outline: none;
                color: #8898aa;
                padding: 12px 16px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: .2s;
                border-bottom: 2px solid transparent;
            }
            .ems-email-tab-btn:hover {
                color: #fff;
            }
            .ems-email-tab-btn.active {
                color: #4299e1;
                border-bottom-color: #4299e1;
            }
            .ems-email-modal-body {
                padding: 20px 24px;
                overflow-y: auto;
                flex: 1;
                color: #d7dfef;
            }
            .ems-form-group {
                margin-bottom: 14px;
            }
            .ems-form-group label {
                display: block;
                color: #8898aa;
                font-size: 11.5px;
                font-weight: 600;
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .ems-form-group input,
            .ems-form-group select,
            .ems-form-group textarea {
                width: 100%;
                padding: 10px 14px;
                background: #0b1437;
                border: 1px solid #1b2e6e;
                border-radius: 8px;
                color: #ffffff;
                font-size: 13.5px;
                outline: none;
                font-family: inherit;
            }
            .ems-form-group input:focus,
            .ems-form-group select:focus,
            .ems-form-group textarea:focus {
                border-color: #4299e1;
                box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
            }
            .ems-form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }
            .ems-quick-templates {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 14px;
                flex-wrap: wrap;
            }
            .ems-tpl-tag {
                background: #0b1437;
                border: 1px solid #1b2e6e;
                color: #cbd5e1;
                padding: 4px 10px;
                border-radius: 6px;
                font-size: 11px;
                cursor: pointer;
                transition: .2s;
            }
            .ems-tpl-tag:hover {
                border-color: #4299e1;
                color: #4299e1;
                background: rgba(66, 153, 225, 0.1);
            }
            .ems-email-modal-footer {
                padding: 14px 24px;
                border-top: 1px solid #1b2e6e;
                background: #14204d;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            .ems-btn-send {
                background: #4299e1;
                border: none;
                color: #fff;
                padding: 9px 20px;
                border-radius: 8px;
                font-size: 13.5px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: .2s;
            }
            .ems-btn-send:hover {
                background: #3182ce;
            }
            .ems-btn-cancel {
                background: transparent;
                border: 1px solid #1b2e6e;
                color: #cbd5e1;
                padding: 9px 16px;
                border-radius: 8px;
                font-size: 13.5px;
                cursor: pointer;
            }
            .ems-btn-cancel:hover {
                background: #1b2e6e;
                color: #fff;
            }
            .ems-toast {
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: #111c44;
                border: 1px solid #4ade80;
                border-left: 4px solid #4ade80;
                border-radius: 10px;
                padding: 14px 20px;
                color: #ffffff;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 13.5px;
                z-index: 10000;
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s ease;
            }
            .ems-toast.show {
                transform: translateY(0);
                opacity: 1;
            }
            .sent-item {
                background: #0b1437;
                border: 1px solid #1b2e6e;
                border-radius: 10px;
                padding: 14px 16px;
                margin-bottom: 12px;
            }
            .sent-item-top {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
            }
            .sent-badge {
                font-size: 10.5px;
                padding: 2px 8px;
                border-radius: 12px;
                background: rgba(66, 153, 225, 0.18);
                color: #60a5fa;
                font-weight: 600;
            }
            .sent-time {
                font-size: 11px;
                color: #8898aa;
            }
        `;
        document.head.appendChild(style);
    }

    // Check if modal container already exists
    if (document.getElementById('emsEmailModalOverlay')) return;

    const modalHTML = `
        <div class="ems-email-modal-overlay" id="emsEmailModalOverlay">
            <div class="ems-email-modal-box">
                <div class="ems-email-modal-header">
                    <h3><i class="fa-solid fa-paper-plane"></i> Send Custom Email Notification</h3>
                    <button class="ems-email-modal-close" id="emsEmailModalClose"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="ems-email-modal-tabs">
                    <button class="ems-email-tab-btn active" id="tabComposeEmail">Compose Email</button>
                    <button class="ems-email-tab-btn" id="tabSentEmailHistory">Sent History</button>
                </div>
                <div class="ems-email-modal-body" id="emailModalBodyCompose">
                    <div class="ems-quick-templates">
                        <span style="font-size:11.5px; color:#8898aa; margin-right:4px;">Quick Templates:</span>
                        <button type="button" class="ems-tpl-tag" data-tpl="allhands"><i class="fa-solid fa-users"></i> All-Hands Meeting</button>
                        <button type="button" class="ems-tpl-tag" data-tpl="attendance"><i class="fa-solid fa-clock"></i> Attendance Reminder</button>
                        <button type="button" class="ems-tpl-tag" data-tpl="holiday"><i class="fa-solid fa-calendar-check"></i> Holiday Notice</button>
                        <button type="button" class="ems-tpl-tag" data-tpl="review"><i class="fa-solid fa-chart-line"></i> Performance Cycle</button>
                    </div>
                    <form id="emsSendEmailForm">
                        <div class="ems-form-row">
                            <div class="ems-form-group">
                                <label for="emailTargetAudience">Target Audience / Recipients</label>
                                <select id="emailTargetAudience" required>
                                    <option value="All Staff (Company-wide)">All Staff (Everyone - Employees, Managers, Interns)</option>
                                    <option value="All Managers">All Managers</option>
                                    <option value="All Regular Employees">All Regular Employees</option>
                                    <option value="All Interns">All Interns</option>
                                    <option value="All HR Team">All HR Team</option>
                                    <option value="Department: Engineering">Department: Engineering</option>
                                    <option value="Department: Product & Design">Department: Product & Design</option>
                                    <option value="Department: Marketing">Department: Marketing</option>
                                    <option value="Department: Operations">Department: Operations</option>
                                    <option value="Individual User">Specific Individual Employee</option>
                                </select>
                            </div>
                            <div class="ems-form-group">
                                <label for="emailPriority">Priority & Category</label>
                                <select id="emailPriority">
                                    <option value="General Announcement" selected>General Announcement</option>
                                    <option value="Urgent Notice">Urgent Notice (High Priority)</option>
                                    <option value="Meeting Invitation">Meeting Invitation</option>
                                    <option value="Policy Update">Company Policy Update</option>
                                    <option value="Administrative Alert">Administrative Alert</option>
                                </select>
                            </div>
                        </div>
                        <div class="ems-form-group">
                            <label for="emailSubject">Email Subject</label>
                            <input type="text" id="emailSubject" placeholder="e.g. Q3 Company All-Hands Meeting & Quarterly Goals" required>
                        </div>
                        <div class="ems-form-group">
                            <label for="emailBody">Email Message Body</label>
                            <textarea id="emailBody" rows="6" placeholder="Write your email notification message here..." required></textarea>
                        </div>
                        <div class="ems-form-group">
                            <label for="emailActionLink">Action Link / Meeting URL (Optional)</label>
                            <input type="url" id="emailActionLink" placeholder="https://meet.google.com/xyz or link to document">
                        </div>
                        <div class="ems-email-modal-footer" style="margin: 18px -24px -20px; border-radius: 0 0 16px 16px;">
                            <button type="button" class="ems-btn-cancel" id="emsEmailCancelBtn">Cancel</button>
                            <button type="submit" class="ems-btn-send" id="emsEmailSubmitBtn">
                                <i class="fa-solid fa-paper-plane"></i> Send Email Broadcast
                            </button>
                        </div>
                    </form>
                </div>
                <div class="ems-email-modal-body" id="emailModalBodyHistory" style="display:none;">
                    <div id="sentEmailsList">
                        <!-- Sent history populated via JS -->
                    </div>
                </div>
            </div>
        </div>
        <div class="ems-toast" id="emsEmailToast">
            <i class="fa-solid fa-circle-check" style="color:#4ade80; font-size:18px;"></i>
            <span id="emsToastMsg">Email notification sent successfully!</span>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modalOverlay = document.getElementById('emsEmailModalOverlay');
    const closeBtn = document.getElementById('emsEmailModalClose');
    const cancelBtn = document.getElementById('emsEmailCancelBtn');
    const emailForm = document.getElementById('emsSendEmailForm');
    const tabCompose = document.getElementById('tabComposeEmail');
    const tabHistory = document.getElementById('tabSentEmailHistory');
    const bodyCompose = document.getElementById('emailModalBodyCompose');
    const bodyHistory = document.getElementById('emailModalBodyHistory');
    const toast = document.getElementById('emsEmailToast');
    const toastMsg = document.getElementById('emsToastMsg');

    function openModal() {
        modalOverlay.classList.add('show');
    }
    function closeModal() {
        modalOverlay.classList.remove('show');
    }

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    // Bind to all envelope buttons in header
    const envelopeBtns = document.querySelectorAll('#navEmailBtn, .fa-envelope, .nav-icon-btn:has(.fa-envelope)');
    envelopeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    });

    // Tab switching
    tabCompose?.addEventListener('click', () => {
        tabCompose.classList.add('active');
        tabHistory.classList.remove('active');
        bodyCompose.style.display = 'block';
        bodyHistory.style.display = 'none';
    });

    tabHistory?.addEventListener('click', () => {
        tabHistory.classList.add('active');
        tabCompose.classList.remove('active');
        bodyHistory.style.display = 'block';
        bodyCompose.style.display = 'none';
        renderSentHistory();
    });

    // Template quick fills
    document.querySelectorAll('.ems-tpl-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const tpl = tag.getAttribute('data-tpl');
            if (tpl === 'allhands') {
                document.getElementById('emailTargetAudience').value = 'All Staff (Company-wide)';
                document.getElementById('emailPriority').value = 'Meeting Invitation';
                document.getElementById('emailSubject').value = 'All-Hands Company Townhall Meeting - Friday 3:00 PM';
                document.getElementById('emailBody').value = `Dear Team,\n\nPlease join us for our monthly All-Hands company meeting this Friday at 3:00 PM.\n\nAgenda:\n1. Company Growth & Performance Updates\n2. New Product Feature Demos\n3. Q&A and Team Recognition\n\nPlease find the meeting link attached below. We look forward to seeing everyone there!\n\nBest regards,\nExecutive Management`;
                document.getElementById('emailActionLink').value = 'https://meet.google.com/ems-all-hands';
            } else if (tpl === 'attendance') {
                document.getElementById('emailTargetAudience').value = 'All Regular Employees';
                document.getElementById('emailPriority').value = 'Urgent Notice';
                document.getElementById('emailSubject').value = 'Reminder: Daily Attendance Check-In & Timesheet Verification';
                document.getElementById('emailBody').value = `Dear Employees and Interns,\n\nThis is a friendly reminder to ensure you log your check-in and check-out times accurately every working day on the EMS portal.\n\nPlease note our 3 consecutive late check-in policy. If you have any pending leave or timesheet corrections, please notify HR promptly.\n\nThank you for your cooperation!`;
            } else if (tpl === 'holiday') {
                document.getElementById('emailTargetAudience').value = 'All Staff (Company-wide)';
                document.getElementById('emailPriority').value = 'General Announcement';
                document.getElementById('emailSubject').value = 'Upcoming Company Holiday Notice & Office Schedule';
                document.getElementById('emailBody').value = `Hello Everyone,\n\nPlease be informed that our offices will be closed on Monday for the upcoming holiday. Normal business hours and support operations will resume on Tuesday.\n\nWishing you and your families a restful holiday!`;
            } else if (tpl === 'review') {
                document.getElementById('emailTargetAudience').value = 'All Managers';
                document.getElementById('emailPriority').value = 'Policy Update';
                document.getElementById('emailSubject').value = 'Quarterly Performance Review Cycle - Manager Submissions Due';
                document.getElementById('emailBody').value = `Dear Managers,\n\nThe Q2 Performance Review cycle is now officially open. Please submit your team evaluations and 1-on-1 feedback before the end of next week.\n\nThank you for guiding and elevating your teams!`;
            }
        });
    });

    function showToast(msg) {
        if (toastMsg) toastMsg.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
    }

    function getSentHistory() {
        try {
            const raw = localStorage.getItem(SENT_EMAILS_STORAGE_KEY);
            return raw ? JSON.parse(raw) : [
                {
                    id: 'EML-101',
                    subject: 'Q2 All-Hands Meeting & Product Roadmaps',
                    target: 'All Staff (Company-wide)',
                    priority: 'Meeting Invitation',
                    date: '2025-05-20 14:30',
                    sender: 'Admin (John Doe)'
                },
                {
                    id: 'EML-102',
                    subject: 'Updated Remote Work & Timesheet Policy',
                    target: 'All Regular Employees',
                    priority: 'Policy Update',
                    date: '2025-05-15 09:15',
                    sender: 'Admin (John Doe)'
                }
            ];
        } catch {
            return [];
        }
    }

    function saveSentHistory(list) {
        localStorage.setItem(SENT_EMAILS_STORAGE_KEY, JSON.stringify(list));
    }

    function renderSentHistory() {
        const container = document.getElementById('sentEmailsList');
        if (!container) return;
        const list = getSentHistory();
        if (list.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:30px; color:#8898aa;">No emails sent yet.</div>`;
            return;
        }
        container.innerHTML = list.map(item => `
            <div class="sent-item">
                <div class="sent-item-top">
                    <strong style="color:#ffffff; font-size:14px;">${item.subject}</strong>
                    <span class="sent-badge">${item.target}</span>
                </div>
                <div style="font-size:12px; color:#8898aa; margin-top:4px; display:flex; justify-content:space-between;">
                    <span>Priority: <strong style="color:#cbd5e1;">${item.priority}</strong> &bull; Sent by: ${item.sender || 'Admin'}</span>
                    <span class="sent-time">${item.date}</span>
                </div>
            </div>
        `).join('');
    }

    emailForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const target = document.getElementById('emailTargetAudience').value;
        const priority = document.getElementById('emailPriority').value;
        const subject = document.getElementById('emailSubject').value.trim();
        const body = document.getElementById('emailBody').value.trim();
        const link = document.getElementById('emailActionLink').value.trim();

        const submitBtn = document.getElementById('emsEmailSubmitBtn');
        const origBtnHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending...`;
        submitBtn.disabled = true;

        const emailRecord = {
            targetAudience: target,
            priority: priority,
            subject: subject,
            message: body,
            actionLink: link,
            senderName: currentUser ? currentUser.name : 'System Admin',
            senderRole: currentUser ? currentUser.role : 'admin',
            createdAt: new Date().toISOString(),
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            timestamp: serverTimestamp()
        };

        try {
            await addDoc(collection(db, "emailNotifications"), emailRecord);
            await addDoc(collection(db, "notifications"), {
                title: subject,
                description: body.slice(0, 140) + '...',
                category: priority,
                recipientRole: target.includes('Manager') ? 'manager' : (target.includes('Intern') ? 'intern' : (target.includes('Employee') ? 'employee' : 'all')),
                isRead: false,
                timestamp: serverTimestamp(),
                time: "Just now"
            });
        } catch (dbErr) {
            console.warn("Firestore email broadcast fallback: ", dbErr);
        }

        // Save local history
        const list = getSentHistory();
        list.unshift({
            id: `EML-${Date.now()}`,
            subject: subject,
            target: target,
            priority: priority,
            date: emailRecord.date,
            sender: emailRecord.senderName
        });
        saveSentHistory(list);

        submitBtn.innerHTML = origBtnHTML;
        submitBtn.disabled = false;
        emailForm.reset();
        closeModal();
        showToast(`Email Notification sent successfully to ${target}!`);
    });
}
