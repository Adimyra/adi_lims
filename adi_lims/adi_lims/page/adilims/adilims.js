frappe.provide("adi_lims.adilims");

adi_lims.adilims.AdiLimsDashboard = class AdiLimsDashboard {
    constructor(wrapper) {
        this.wrapper = $(wrapper);
        this.page = frappe.ui.make_app_page({
            parent: wrapper,
            title: 'MediLIMS Dashboard',
            single_column: true
        });

        this.bind_events();
        this.render_layout();
        this.render_dashboard();
    }

    load_dashboard_data() {
        this.get_dashboard_counts();
        this.get_recent_activities();
    }

    get_dashboard_counts() {
        frappe.call({
            method: "adi_lims.api.get_doctype_counts",
            callback: (r) => {
                if (r.message) {
                    this.update_stat_card("total_samples", r.message.total_samples);
                    this.update_stat_card("samples_in_progress", r.message.samples_in_progress);
                    this.update_stat_card("reports_pending", r.message.reports_pending);
                    // Critical Alerts placeholder for now
                }
            }
        });
    }

    get_recent_activities() {
        frappe.call({
            method: "adi_lims.api.get_recent_activity",
            callback: (r) => {
                if (r.message) {
                    this.render_recent_activity(r.message);
                }
            }
        });
    }

    update_stat_card(id, value) {
        const card = this.wrapper.find(`.stat-card[data-id='${id}'] .stat-value`);
        if (card.length) {
            card.text(value);
        }
    }

    get_top_bar_html() {
        return `
        <div class="dashboard-top-bar" style="margin-bottom: 0;">
            <div class="global-search">
                <span class="search-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </span>
                <input type="text" placeholder="Global Search (Patients, Tests, IDs)..." />
            </div>
            
            <div class="top-bar-actions">
                <button class="icon-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <span class="notification-dot"></span>
                </button>
                <div class="user-profile">
                    <div class="user-info">
                        <span class="user-name">Dr. Alex Chen</span>
                        <span class="user-role">Lab Director</span>
                    </div>
                    <div class="user-avatar">
                        <img src="https://ui-avatars.com/api/?name=Alex+Chen&background=DBEAFE&color=2563EB" alt="AC" />
                    </div>
                </div>
            </div>
        </div>`;
    }

    render_layout() {
        const layout_template = `
<div class="adi-lims-dashboard">
    <!-- Sidebar -->
    <div class="dashboard-sidebar" id="dashboard-sidebar">
        <div class="sidebar-header">
            <div class="brand-logo">
                <div class="logo-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                </div>
                <span class="brand-name">MediLIMS</span>
            </div>
            <button class="collapse-btn" id="sidebar-toggle">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
        </div>

        <nav class="sidebar-nav">
            ${this.get_nav_item_html('dashboard', 'Dashboard', 'grid', true)}
            ${this.get_nav_item_html('appointments', 'Appointments', 'calendar')}
            ${this.get_nav_item_html('phlebotomy', 'Phlebotomy', 'activity')}
            ${this.get_nav_item_html('patients', 'Patients', 'users')}
            ${this.get_nav_item_html('samples', 'Sample Management', 'archive')}
            ${this.get_nav_item_html('test_results_entry', 'Test Results Entry', 'clipboard')}
            ${this.get_nav_item_html('reports', 'Reports', 'file-text')}
            ${this.get_nav_item_html('settings', 'Settings', 'settings')}
        </nav>

        <div class="sidebar-footer">
            <div class="storage-card">
                <div class="storage-header"><span>Storage Status</span></div>
                <div class="storage-progress-wrapper">
                    <div class="storage-info">
                        <span class="storage-percent">82%</span>
                        <span class="storage-label">Full</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 82%"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content Wrapper -->
    <div class="dashboard-main-wrapper">
        <!-- Top Bar (Fixed) -->
        ${this.get_top_bar_html()}
        
        <!-- Scrollable Content Area -->
        <div class="dashboard-content-area" id="main-content">
            <!-- Content will be injected here -->
            <div id="content-mount-point"></div>
        </div>
    </div>
</div>`;
        this.page.main.html(layout_template);
    }

    get_nav_item_html(id, label, iconType, active = false) {
        let iconSvg = '';
        if (iconType === 'grid') {
            iconSvg = `<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>`;
        } else if (iconType === 'calendar') {
            iconSvg = `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>`;
        } else if (iconType === 'activity') {
            iconSvg = `<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>`;
        } else if (iconType === 'users') {
            iconSvg = `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`;
        } else if (iconType === 'archive') {
            iconSvg = `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>`;
        } else if (iconType === 'file-text') {
            iconSvg = `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line>`;
        } else if (iconType === 'settings') {
            iconSvg = `<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>`;
        } else if (iconType === 'clipboard') {
            iconSvg = `<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>`;
        }

        return `
            <a href="#" class="nav-item ${active ? 'active' : ''}" data-target="${id}">
                <span class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconSvg}</svg></span>
                <span class="nav-text">${label}</span>
            </a>
        `;
    }

    render_sample_management() {
        const that = this;
        frappe.call({
            method: "adi_lims.api.get_samples_for_listing",
            callback: (r) => {
                if (r.message && r.message.data) {
                    const samples = r.message.data;
                    let sample_rows = '';
                    if (samples.length === 0) {
                        sample_rows = '<tr><td colspan="7" class="text-center">No samples found.</td></tr>';
                    } else {
                        samples.forEach(sample => {
                            sample_rows += `
                                <tr>
                                    <td>${sample.name}</td>
                                    <td>${sample.sample_name}</td>
                                    <td>${sample.sample_type}</td>
                                    <td>${frappe.datetime.global_date_and_time_to_user(sample.collection_date).split(' ')[0]}</td>
                                    <td>${frappe.datetime.global_date_and_time_to_user(sample.received_date).split(' ')[0]}</td>
                                    <td><span class="badge ${sample.status.toLowerCase().replace('-', '')}-status">${sample.status}</span></td>
                                    <td class="text-right"><a href="#Form/Sample/${sample.name}" class="btn-view">View</a></td>
                                </tr>
                            `;
                        });
                    }

                    const samples_view = `
                    <div class="sample-view fade-in">
                        <div class="view-header">
                            <div class="title-section">
                                <h1>Sample Management</h1>
                                <p>Directory of all registered samples.</p>
                            </div>
                            <button class="btn-primary" data-action="register-sample"><span class="icon">+</span> Register Sample</button>
                        </div>
                        <div class="view-controls">
                            <div class="search-bar">
                                <span class="search-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
                                <input type="text" placeholder="Search samples...">
                            </div>
                            <button class="btn-filter"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg></button>
                        </div>
                        <div class="sample-table-container">
                            <table class="sample-table">
                                <thead><tr><th>ID</th><th>NAME</th><th>TYPE</th><th>COLLECTION DATE</th><th>RECEIVED DATE</th><th>STATUS</th><th style="text-align: right">ACTIONS</th></tr></thead>
                                <tbody>
                                    ${sample_rows}
                                </tbody>
                            </table>
                        </div>
                    </div>`;
                    that.wrapper.find('#content-mount-point').html(samples_view);

                    that.wrapper.on('click', '.btn-primary[data-action="register-sample"]', function () {
                        frappe.new_doc('Sample');
                    });
                } else {
                    that.wrapper.find('#content-mount-point').html(`<div style="padding: 20px; text-align: center; color: #EF4444;"><h2>Error</h2><p>Could not load sample data.</p></div>`);
                }
            }
        });
    }

    render_test_result_entry() {
        // Split Layout matching mockup
        const view_template = `
        <div class="test-results-view-split fade-in">
            <!-- Left Sidebar -->
            <div class="results-sidebar">
                <div class="sidebar-header-search">
                    <span class="icon">📝</span> Pending Results
                </div>
                <div class="sidebar-list-container" id="results-sidebar-list">
                    <div class="loading-state-sm">Loading...</div>
                </div>
            </div>

            <!-- Right Main Content -->
            <div class="results-main-content">
                <div id="results-empty-state" class="empty-state-results">
                    <div class="empty-icon">⚗️</div>
                    <h3>Select a sample to enter results</h3>
                </div>
                <div id="results-entry-form-container" class="results-form-wrapper" style="display: none;">
                    <!-- Form loaded here -->
                </div>
            </div>
        </div>`;

        this.wrapper.find('#content-mount-point').html(view_template);
        this.load_samples_for_result_entry();
    }

    load_samples_for_result_entry() {
        const that = this;
        frappe.call({
            method: "adi_lims.api.get_samples_for_result_entry",
            callback: (r) => {
                const listContainer = that.wrapper.find('#results-sidebar-list');
                listContainer.empty();

                if (r.message && r.message.length > 0) {
                    r.message.forEach(sample => {
                        // Extract test names for preview
                        const testNames = sample.sample_test_results ?
                            sample.sample_test_results.map(t => t.lab_test).join(', ') : 'No Tests';

                        const listItem = `
                            <div class="result-list-item" data-sample-name="${sample.name}">
                                <div class="item-header">
                                    <div class="patient-name">${sample.patient_name || 'Unknown'}</div>
                                    <span class="status-badge-sm blue-status">${sample.status === 'In-Progress' ? 'ACCESSIONED' : 'PROCESSING'}</span>
                                </div>
                                <div class="item-sub">
                                    <div class="uhid-text">${sample.name}</div>
                                </div>
                                <div class="item-tests">
                                    ${testNames}
                                </div>
                            </div>
                        `;
                        const $item = $(listItem);

                        // Store sample data for click handler
                        $item.data('sample', sample);

                        $item.on('click', function () {
                            that.wrapper.find('.result-list-item').removeClass('active');
                            $(this).addClass('active');
                            that.render_result_entry_form($(this).data('sample'));
                        });

                        listContainer.append($item);
                    });
                } else {
                    listContainer.html('<div class="empty-list-msg">No pending results.</div>');
                }
            }
        });
    }

    render_result_entry_form(sample) {
        const that = this;
        const container = this.wrapper.find('#results-entry-form-container');
        const emptyState = this.wrapper.find('#results-empty-state');

        // Hide empty state, show form
        emptyState.hide();
        container.show();

        let tests_html = '';
        if (sample.sample_test_results) {
            sample.sample_test_results.forEach(test => {
                tests_html += `
                    <div class="result-entry-row">
                        <div class="test-meta">
                            <div class="test-name">${test.lab_test}</div>
                            <div class="test-range">Results</div>
                        </div>
                        <div class="result-input-group">
                            <input type="text" class="form-control result-input" 
                                value="${test.result_value || ''}" 
                                placeholder="Enter Value"
                                data-name="${test.name}">
                            <span class="unit-label">${test.unit || ''}</span>
                        </div>
                        <div class="reference-range">
                            Normal: ${test.reference_range || 'N/A'}
                        </div>
                        <button class="btn-icon-save save-single-result" data-name="${test.name}">
                            <span class="icon">💾</span>
                        </button>
                    </div>
                `;
            });
        }

        const form_html = `
            <div class="result-form-header">
                <div class="header-left">
                    <h2>${sample.patient_name || 'Unknown'}</h2>
                    <div class="sub-ids">
                        <span class="badge-gray">${sample.name}</span>
                        <span class="sep">•</span>
                        <span class="text-muted">${sample.sample_type || 'Sample'}</span>
                    </div>
                </div>
                <div class="header-actions">
                    <button class="btn-primary" id="save-all-results">Save All</button>
                </div>
            </div>
            
            <div class="result-form-body">
                ${tests_html}
            </div>
        `;

        container.html(form_html);

        // Bind Save Events
        container.find('.save-single-result').on('click', function () {
            const btn = $(this);
            const name = btn.data('name');
            const val = btn.siblings('.result-input-group').find('.result-input').val();
            that.save_test_result(name, val, btn);
        });
    }

    save_test_result(name, value, btn) {
        frappe.call({
            method: "adi_lims.api.update_test_result",
            args: {
                test_result_name: name,
                result_value: value
            },
            callback: (r) => {
                if (r.message && r.message.status === 'success') {
                    frappe.show_alert({ message: 'Saved', indicator: 'green' });
                    if (btn) {
                        btn.addClass('saved').html('<span class="icon">✓</span>');
                        setTimeout(() => btn.removeClass('saved').html('<span class="icon">💾</span>'), 2000);
                    }
                }
            }
        });
    }

    render_dashboard() {
        const dashboard_view = `
        <div class="dashboard-header">
            <div class="greeting-section">
                <h1 class="adl-p-4 adl-text-2xl adl-font-bold">Good Morning, Dr. Chen</h1>
                <p>Here is what's happening in your lab today.</p>
            </div>
            <div class="date-section">
                <span class="sub-text">Today's Date</span>
                <span class="date-text">${frappe.datetime.str_to_user(frappe.datetime.get_today())}</span>
            </div>
        </div>
        ${this.get_stats_cards_html()}
        <div class="dashboard-main-content">
            ${this.get_activity_section_html()}
            <div class="quick-actions-column">
                ${this.get_quick_actions_html()}
            </div>
        </div>`;
        this.wrapper.find('#content-mount-point').html(dashboard_view);
        this.load_dashboard_data(); // Load data after rendering the structure
    }

    get_stats_cards_html() {
        return `
        <div class="stats-row">
            ${this.get_stat_card_html('total_samples', 'Total Samples', '0', '+0%', true, 'blue', '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>')}
            ${this.get_stat_card_html('samples_in_progress', 'Samples In Progress', '0', '', false, 'orange', '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>')}
            ${this.get_stat_card_html('reports_pending', 'Reports Pending', '0', '', false, 'red', '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>')}
            ${this.get_stat_card_html('critical_alerts', 'Critical Alerts', '0', '', false, 'red', '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>')}
        </div>`;
    }

    get_stat_card_html(id, label, value, change, isPositive, color, svgPath) {
        return `
        <div class="stat-card" data-id="${id}">
            <div class="icon-box ${color}-bg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${svgPath}</svg>
            </div>
            ${change ? `<div class="stat-change ${isPositive ? 'positive' : 'negative'}">${change}</div>` : ''}
            <div class="stat-value">${value}</div>
            <div class="stat-label">${label}</div>
        </div>`;
    }

    get_activity_section_html() {
        return `
        <div class="recent-activity-section">
            <h3 class="section-title"><span class="icon">⚡</span> Recent Activity</h3>
            <div class="activity-list" id="dashboard-activity-list">
                <!-- Activities will be rendered here -->
            </div>
        </div>`;
    }

    get_quick_actions_html() {
        return `
        <div class="quick-actions-card">
            <div class="qa-header">
                <h3>Quick Actions</h3>
                <p>Common tasks for today</p>
            </div>
            <div class="action-buttons">
                <button class="btn-action" data-action="new-patient">+ New Patient Registration</button>
                <button class="btn-action" data-action="new-sample">⤡ Accession Samples</button>
                <button class="btn-action" data-action="print-reports">🖨️ Print Pending Reports</button>
            </div>
            <div class="system-status">
                <span>System Status</span>
                <span class="status-online"><span class="dot"></span> Online</span>
            </div>
        </div>`;
    }

    render_phlebotomy() {
        const that = this;
        // Basic Layout
        const view_template = `
            <div class="phlebotomy-view fade-in">
                <div class="view-header">
                    <div class="title-section">
                        <h1>Phlebotomy Queue</h1>
                        <p>Pending sample collections for scheduled patients.</p>
                    </div>
                </div>
                
                <div class="phlebotomy-grid" id="phlebotomy-queue-container">
                    <div class="loading-state">Loading queue...</div>
                </div>
            </div>`;

        this.wrapper.find('#content-mount-point').html(view_template);

        // Load Queue
        frappe.call({
            method: "adi_lims.api.get_phlebotomy_queue",
            callback: (r) => {
                const queue = r.message || [];
                let cards_html = '';

                if (queue.length === 0) {
                    cards_html = '<div class="empty-state">No pending collections.</div>';
                } else {
                    queue.forEach(item => {
                        cards_html += that.get_phlebotomy_card(item);
                    });
                }

                that.wrapper.find('#phlebotomy-queue-container').html(cards_html);
            }
        });

        // Bind Actions
        this.wrapper.on('click', '.btn-collect-sample', function () {
            const appointment_name = $(this).data('name');
            // Logic to open collection form or confirm action
            frappe.msgprint(`Initiating collection for ${appointment_name}`);
            // Ideally: frappe.set_route('Form', 'Collection Appointment', appointment_name);
        });
    }

    get_phlebotomy_card(data) {
        // Format Time
        const timeStr = data.appointment_time ? data.appointment_time.substring(0, 5) : '00:00';
        const [hours, minutes] = timeStr.split(':');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        const formattedTime = `${hours12}:${minutes} ${ampm}`;
        const avatar_initial = (data.patient_name || 'U').charAt(0).toUpperCase();

        return `
            <div class="phlebotomy-card">
                <div class="card-header">
                    <div class="avatar-circle">${avatar_initial}</div>
                    <div class="time-pill">${formattedTime}</div>
                </div>
                <div class="card-body">
                    <div class="patient-name">${data.patient_name}</div>
                    <div class="patient-uhid">${data.patient}</div>
                    
                    <div class="test-section">
                        <div class="test-label">TEST REQUESTED</div>
                        <div class="test-value">${data.collection_type || 'Standard Panel'}</div>
                    </div>
                </div>
                <div class="card-footer">
                     <button class="btn-dark-full btn-collect-sample" data-name="${data.name}">
                        <span class="icon">💉</span> Collect Sample
                     </button>
                </div>
            </div>
        `;
    }

    get_header_actions_html(type) {
        if (type === 'patient') {
            return `
                <div class="header-actions">
                    <button class="btn-primary" data-action="register-patient"><span class="icon">+</span> Register Patient</button>
                </div>`;
        } else if (type === 'sample') {
            return `
                <div class="header-actions">
                    <button class="btn-primary" data-action="register-sample"><span class="icon">+</span> Register Sample</button>
                    <button class="btn-secondary" data-action="create-dummy-sample"><span class="icon">🧪</span> Create Dummy Sample</button>
                </div>`;
        }
        return '';
    }



    render_appointments() {
        const that = this;
        frappe.call({
            method: "adi_lims.api.get_appointments_for_listing",
            callback: (r) => {
                if (r.message && r.message.data) {
                    const appointments = r.message.data;
                    let appointment_rows = '';
                    if (appointments.length === 0) {
                        appointment_rows = '<tr><td colspan="6" class="text-center">No appointments found.</td></tr>';
                    } else {
                        appointments.forEach(appointment => {
                            appointment_rows += `
                                <tr>
                                    <td>${appointment.name}</td>
                                    <td><a href="#Form/Patient/${appointment.patient}">${appointment.patient}</a></td>
                                    <td>${frappe.datetime.global_date_and_time_to_user(appointment.appointment_date)}</td>
                                    <td>${frappe.datetime.global_date_and_time_to_user(appointment.appointment_time)}</td>
                                    <td><span class="badge ${appointment.status.toLowerCase().replace(' ', '-')}-status">${appointment.status}</span></td>
                                    <td class="text-right"><a href="#Form/Patient Appointment/${appointment.name}" class="btn-view">View</a></td>
                                </tr>
                            `;
                        });
                    }

                    const appointments_view = `
                    <div class="appointments-view fade-in">
                        <div class="view-header">
                            <div class="title-section">
                                <h1>Appointments Management</h1>
                                <p>View and manage patient appointments.</p>
                            </div>
                            <div class="header-actions">
                                <button class="btn-primary" data-action="new-appointment"><span class="icon">+</span> New Appointment</button>
                            </div>
                        </div>
                        <div class="view-controls">
                            <div class="search-bar">
                                <span class="search-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
                                <input type="text" placeholder="Search appointments...">
                            </div>
                            <button class="btn-filter"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg></button>
                        </div>
                        <div class="appointment-table-container">
                            <table class="appointment-table">
                                <thead><tr><th>ID</th><th>PATIENT</th><th>DATE</th><th>TIME</th><th>STATUS</th><th style="text-align: right">ACTIONS</th></tr></thead>
                                <tbody>
                                    ${appointment_rows}
                                </tbody>
                            </table>
                        </div>
                    </div>`;
                    that.wrapper.find('#content-mount-point').html(appointments_view);

                    that.wrapper.on('click', '.btn-primary[data-action="new-appointment"]', function () {
                        frappe.new_doc('Patient Appointment');
                    });
                } else {
                    that.wrapper.find('#content-mount-point').html(`<div style="padding: 20px; text-align: center; color: #EF4444;"><h2>Error</h2><p>Could not load appointment data.</p></div>`);
                }
            }
        });
    }

    bind_events() {
        const toggleBtn = this.wrapper.find('#sidebar-toggle');
        const sidebar = this.wrapper.find('#dashboard-sidebar');
        const that = this;

        if (toggleBtn.length && sidebar.length) {
            toggleBtn.on('click', () => {
                sidebar.toggleClass('collapsed');
            });
        }

        this.wrapper.on('click', '.nav-item', function (e) {
            e.preventDefault();
            const target = $(this).data('target');
            // Remove active class from all nav items and add to the clicked one
            that.wrapper.find('.nav-item').removeClass('active');
            $(this).addClass('active');

            if (target === 'dashboard') that.render_dashboard();
            else if (target === 'appointments') that.render_appointments();
            else if (target === 'phlebotomy') that.render_phlebotomy();
            else if (target === 'patients') that.render_patients();
            else if (target === 'samples') that.render_samples();
            else if (target === 'test_results_entry') that.render_test_result_entry();
            else if (target === 'reports') that.render_reports();
            else if (target === 'settings') that.render_settings();
            else that.wrapper.find('#content-mount-point').html(`<div style="padding: 20px; text-align: center; color: #6b7280;"><h2>${$(this).find('.nav-text').text()}</h2><p>This module is coming soon.</p></div>`);
        });

        // Quick Actions
        this.wrapper.on('click', '.btn-action', function () {
            const action = $(this).data('action');
            if (action === 'new-patient') {
                frappe.new_doc('Patient'); // Opens new Patient form
            } else if (action === 'new-sample') {
                frappe.new_doc('Sample'); // Opens new Sample form
            } else if (action === 'print-reports') {
                frappe.msgprint(__('Functionality for printing reports is coming soon.'));
            } else if (action === 'create-dummy-sample') {
                frappe.call({
                    method: "adi_lims.api.create_dummy_sample_with_tests",
                    callback: (r) => {
                        if (r.message && r.message.status === 'success') {
                            frappe.show_alert({ message: __('Dummy sample created: ') + r.message.sample_name, indicator: 'green' });
                            that.render_sample_management(); // Reload list
                            that.load_dashboard_data(); // Reload dashboard stats
                        } else {
                            frappe.show_alert({ message: __('Error creating dummy sample: ') + r.message.message, indicator: 'red' });
                        }
                    }
                });
            }
        });
    }

    render_patients() {
        const that = this;
        frappe.call({
            method: "adi_lims.api.get_patients_for_listing",
            callback: (r) => {
                if (r.message && r.message.data) {
                    const patients = r.message.data;
                    let patient_rows = '';
                    if (patients.length === 0) {
                        patient_rows = '<tr><td colspan="6" class="text-center">No patients found.</td></tr>';
                    } else {
                        patients.forEach(patient => {
                            const avatar_initial = (patient.first_name || patient.name || 'U').charAt(0).toUpperCase();
                            const gender_initial = patient.gender ? patient.gender.charAt(0).toUpperCase() : '';
                            const dob_year = patient.dob ? new Date(patient.dob).getFullYear() : '';
                            const current_year = new Date().getFullYear();
                            const age = dob_year ? current_year - dob_year : '';

                            patient_rows += `
                                <tr>
                                    <td><div class="avatar s-avatar">${avatar_initial}</div></td>
                                    <td><div class="patient-name">${patient.first_name || ''} ${patient.last_name || patient.name || ''}</div><div class="patient-uhid">${patient.name}</div></td>
                                    <td>${age} Y / ${gender_initial}</td>
                                    <td><div class="contact-info"><span class="icon">📞</span> ${patient.mobile_no || 'N/A'}</div></td>
                                    <td>${frappe.datetime.global_date_and_time_to_user(patient.modified).split(' ')[0]}</td>
                                    <td class="text-right"><a href="#Form/Patient/${patient.name}" class="btn-view">View</a></td>
                                </tr>
                            `;
                        });
                    }

                    const patients_view = `
                    <div class="patient-view fade-in">
                                            <div class="view-header">
                                                <div class="title-section">
                                                    <h1>Patient Management</h1>
                                                    <p>Directory of all registered patients.</p>
                                                </div>
                                                ${this.get_header_actions_html('patient')}
                                            </div>                        <div class="view-controls">
                            <div class="search-bar">
                                <span class="search-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
                                <input type="text" placeholder="Search patients...">
                            </div>
                            <button class="btn-filter"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg></button>
                        </div>
                        <div class="patient-table-container">
                            <table class="patient-table">
                                <thead><tr><th style="width: 50px;"></th><th>NAME / UHID</th><th>DEMOGRAPHICS</th><th>CONTACT</th><th>LAST VISIT</th><th style="text-align: right">ACTIONS</th></tr></thead>
                                <tbody>
                                    ${patient_rows}
                                </tbody>
                            </table>
                        </div>
                    </div>`;
                    that.wrapper.find('#content-mount-point').html(patients_view);

                    that.wrapper.on('click', '.btn-primary[data-action="register-patient"]', function () {
                        frappe.new_doc('Patient');
                    });
                } else {
                    that.wrapper.find('#content-mount-point').html(`<div style="padding: 20px; text-align: center; color: #EF4444;"><h2>Error</h2><p>Could not load patient data.</p></div>`);
                }
            }
        });
    }

    render_samples() {
        const that = this;
        // Basic Layout for Sample Management
        const view_template = `
            <div class="sample-management-view fade-in">
                <div class="view-header">
                    <div class="title-section">
                        <h1>Sample Management</h1>
                        <p>Manage accessioning, rejection, and chain of custody.</p>
                    </div>
                    <button class="btn-dark" id="scan-barcode-btn"><span class="icon">⤡</span> Scan Barcode</button>
                </div>
                
                <div class="stats-row" id="sample-stats-container">
                    <!-- Stats will be loaded here -->
                    <div class="loading-state">Loading stats...</div>
                </div>

                <div class="worklist-container">
                    <div class="worklist-header">
                        <div class="worklist-title"><span class="icon">Y</span> Worklist</div>
                        <div class="worklist-filters">
                            <button class="filter-tab active" data-status="All">All</button>
                            <button class="filter-tab" data-status="Pending">Pending</button>
                        </div>
                    </div>
                    
                    <div class="worklist-table-wrapper" id="sample-worklist-container">
                        <!-- Table will be loaded here -->
                        <div class="loading-state">Loading worklist...</div>
                    </div>
                </div>
            </div>`;

        this.wrapper.find('#content-mount-point').html(view_template);

        // Load Stats
        frappe.call({
            method: "adi_lims.api.get_sample_stats",
            callback: (r) => {
                if (r.message) {
                    const stats = r.message;
                    const stats_html = `
                        ${this.get_sample_stat_card('Pending Accession', stats.pending_accession, 'orange', 'clock')}
                        ${this.get_sample_stat_card('Accessioned', stats.accessioned, 'blue', 'beaker')}
                        ${this.get_sample_stat_card('Processing', stats.processing, 'purple', 'activity')}
                        ${this.get_sample_stat_card('Rejected', stats.rejected, 'red', 'alert')}
                    `;
                    that.wrapper.find('#sample-stats-container').html(stats_html);
                }
            }
        });

        // Load Worklist
        this.load_sample_worklist("All");

        // Bind Local Events
        this.wrapper.find('.filter-tab').on('click', function () {
            that.wrapper.find('.filter-tab').removeClass('active');
            $(this).addClass('active');
            that.load_sample_worklist($(this).data('status'));
        });
    }

    get_sample_stat_card(label, count, color, icon) {
        let iconSvg = '';
        if (icon === 'clock') iconSvg = '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>';
        if (icon === 'beaker') iconSvg = '<path d="M4.5 3h15"></path><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"></path><line x1="6" y1="11" x2="18" y2="11"></line>';
        if (icon === 'activity') iconSvg = '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>';
        if (icon === 'alert') iconSvg = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';

        return `
            <div class="stat-card sample-stat-card">
                <div class="icon-circle ${color}-bg">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconSvg}</svg>
                </div>
                <div class="stat-details">
                    <div class="stat-count">${count}</div>
                    <div class="stat-label">${label}</div>
                </div>
            </div>
        `;
    }

    load_sample_worklist(status) {
        const that = this;
        frappe.call({
            method: "adi_lims.api.get_sample_worklist",
            args: { status: status },
            callback: (r) => {
                if (r.message) {
                    const samples = r.message;
                    let rows = '';
                    if (samples.length === 0) {
                        rows = '<tr><td colspan="5" class="text-center">No samples found.</td></tr>';
                    } else {
                        samples.forEach(sample => {
                            let action_btn = '';
                            if (sample.ui_status === 'Pending') {
                                action_btn = `<button class="btn-sm btn-white">Accession</button>`;
                            } else if (sample.ui_status === 'Pending Accession') { // Fallback handling
                                action_btn = `<button class="btn-sm btn-white">Accession</button>`;
                            }

                            rows += `
                                <tr>
                                    <td><span class="status-badge ${sample.status_color}">${sample.ui_status}</span></td>
                                    <td>
                                        <div class="patient-name">${sample.patient_name || 'Unknown'}</div>
                                        <div class="patient-uhid">${sample.patient_uhid || sample.patient || '-'}</div>
                                    </td>
                                    <td>
                                        <div class="test-info">${sample.test_info || 'No Tests'}</div>
                                        <div class="sample-id">${sample.sample_name || sample.name}</div>
                                    </td>
                                    <td>${frappe.datetime.str_to_user(sample.collection_date)} <br> <span class="text-muted">08:30 AM</span></td>
                                    <td class="text-right">${action_btn}</td>
                                </tr>
                            `;
                        });
                    }

                    const table_html = `
                        <table class="worklist-table">
                            <thead>
                                <tr>
                                    <th>STATUS</th>
                                    <th>PATIENT DETAILS</th>
                                    <th>TEST INFO</th>
                                    <th>COLLECTED AT</th>
                                    <th class="text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    `;
                    that.wrapper.find('#sample-worklist-container').html(table_html);

                }
            }
        });
    }


    render_appointments() {
        const that = this;
        // Basic Layout
        const view_template = `
            <div class="appointment-view fade-in">
                <div class="view-header">
                    <div class="title-section">
                        <h1>Appointments</h1>
                        <p>Schedule patient tests and home collections.</p>
                    </div>
                    <button class="btn-primary" data-action="book-appointment"><span class="icon">+</span> Book Appointment</button>
                </div>
                
                <div class="stats-row" id="appointment-stats-container">
                    <div class="loading-state">Loading stats...</div>
                </div>

                <div class="worklist-container">
                    <div class="worklist-header" style="border-bottom: none; padding-bottom: 0;">
                        <div class="worklist-title"><span class="icon">📅</span> Upcoming Schedule</div>
                    </div>
                    
                    <div class="worklist-table-wrapper" id="appointment-list-container">
                        <div class="loading-state">Loading appointments...</div>
                    </div>
                </div>
            </div>`;

        this.wrapper.find('#content-mount-point').html(view_template);

        // Load Stats
        frappe.call({
            method: "adi_lims.api.get_appointment_stats",
            callback: (r) => {
                if (r.message) {
                    const stats = r.message;
                    const stats_html = `
                        ${this.get_appointment_stat_card('calendar', stats.scheduled_today, 'Scheduled Today', 'blue')}
                        ${this.get_appointment_stat_card('syringe', stats.pending_collection, 'Pending Collection', 'orange')}
                        ${this.get_appointment_stat_card('check-circle', stats.completed, 'Completed', 'green')}
                    `;
                    that.wrapper.find('#appointment-stats-container').html(stats_html);
                }
            }
        });

        // Load List
        frappe.call({
            method: "adi_lims.api.get_appointments",
            callback: (r) => {
                const appointments = r.message || [];
                let rows = '';
                if (appointments.length === 0) {
                    rows = '<tr><td colspan="5" class="text-center">No upcoming appointments found.</td></tr>';
                } else {
                    appointments.forEach(app => {
                        // Format Time and Date
                        const dateObj = frappe.datetime.str_to_obj(app.appointment_date);
                        const timeStr = app.appointment_time ? app.appointment_time.substring(0, 5) : '00:00'; // HH:MM
                        // Convert HH:MM to AM/PM format
                        const [hours, minutes] = timeStr.split(':');
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        const hours12 = hours % 12 || 12;
                        const formattedTime = `${hours12}:${minutes} ${ampm}`;
                        const formattedDate = dateObj ? frappe.datetime.obj_to_user(dateObj) : app.appointment_date;

                        rows += `
                            <tr>
                                <td>
                                    <div class="time-main">${formattedTime}</div>
                                    <div class="date-sub">${formattedDate}</div>
                                </td>
                                <td>
                                    <div class="patient-name">${app.patient_name || 'Unknown'}</div>
                                    <div class="patient-uhid">${app.patient || '-'}</div>
                                </td>
                                <td>${app.collection_type || 'Walk-in'}</td>
                                <td><span class="status-badge ${app.status === 'Scheduled' ? 'blue-status' : 'gray-status'}">${app.status}</span></td>
                                <td class="text-right">
                                    <button class="icon-btn-sm"><span class="icon">...</span></button>
                                </td>
                            </tr>
                        `;
                    });
                }

                const table_html = `
                    <table class="worklist-table appointment-table">
                        <thead>
                            <tr>
                                <th>TIME / DATE</th>
                                <th>PATIENT</th>
                                <th>COLLECTION TYPE</th>
                                <th>STATUS</th>
                                <th class="text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>`;
                that.wrapper.find('#appointment-list-container').html(table_html);
            }
        });

        // Bind Actions
        this.wrapper.on('click', '.btn-primary[data-action="book-appointment"]', function () {
            frappe.new_doc('Collection Appointment');
        });
    }

    get_appointment_stat_card(icon, value, label, color) {
        let iconSvg = '';
        // Simplified SVGs for demo
        if (icon === 'calendar') iconSvg = '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>';
        if (icon === 'syringe') iconSvg = '<path d="m19 13.5 1.5-1.5"></path><path d="m13 7.5 1.5-1.5"></path><path d="m4.5 16 1.5 1.5"></path><path d="m17.5 12-11.5 11.5"></path><path d="m19 13.5-7.5-7.5"></path><path d="m5 18-2 3"></path><path d="m18 5 3-2"></path>';
        if (icon === 'check-circle') iconSvg = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';

        return `
            <div class="stat-card appointment-card">
                <div class="icon-square ${color}-bg-light">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="${color}-stroke" stroke="currentColor" stroke-width="2">${iconSvg}</svg>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${value}</div>
                    <div class="stat-label">${label}</div>
                </div>
            </div>
        `;
    }



    render_reports() {
        const that = this;
        frappe.call({
            method: "adi_lims.api.get_pending_reports",
            callback: (r) => {
                const reports = r.message || [];
                let rows = '';
                if (reports.length === 0) {
                    rows = '<tr><td colspan="4" class="text-center">No reports ready for printing.</td></tr>';
                } else {
                    reports.forEach(rep => {
                        rows += `
                            <tr>
                                <td>${rep.patient_name || 'Unknown'}</td>
                                <td>${rep.template_name || rep.test_name || 'Lab Test'}</td>
                                <td>${frappe.datetime.str_to_user(rep.creation)}</td>
                                <td class="text-right"><button class="btn-sm btn-white" onclick="frappe.set_route('Form', 'Lab Test', '${rep.name}')">Print</button></td>
                            </tr>
                        `;
                    });
                }

                const view = `
                    <div class="fade-in">
                        <div class="view-header"><h1>Reports</h1><p>Completed tests ready for printing.</p></div>
                        <div class="worklist-container" style="margin-top:0">
                            <table class="worklist-table">
                                <thead><tr><th>PATIENT</th><th>TEST</th><th>DATE</th><th class="text-right">ACTIONS</th></tr></thead>
                                <tbody>${rows}</tbody>
                            </table>
                        </div>
                    </div>`;
                that.wrapper.find('#content-mount-point').html(view);
            }
        });
    }

    render_settings() {
        const view = `
            <div class="fade-in">
                <div class="view-header"><h1>Settings</h1><p>Configure laboratory preferences.</p></div>
                <div class="worklist-container" style="margin-top:0">
                    <form style="max-width: 600px;">
                        <div class="frappe-control">
                            <label class="control-label">Default Lab Name</label>
                            <input type="text" class="form-control" value="MediLIMS Laboratory" disabled>
                        </div>
                        <div class="frappe-control" style="margin-top: 15px;">
                            <label class="control-label">Auto-Approve Normal Results</label>
                            <input type="checkbox"> Enable
                        </div>
                        <div class="frappe-control" style="margin-top: 15px;">
                            <label class="control-label">Printers</label>
                            <select class="form-control"><option>Default System Printer</option></select>
                        </div>
                        <button type="button" class="btn btn-primary" style="margin-top: 20px;">Save Settings</button>
                    </form>
                </div>
            </div>`;
        this.wrapper.find('#content-mount-point').html(view);
    }
}

frappe.pages['adilims'].on_page_load = function (wrapper) {
    new adi_lims.adilims.AdiLimsDashboard(wrapper);
}