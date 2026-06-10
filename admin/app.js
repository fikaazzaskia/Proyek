/* ============================================================
   KING BARBERSHOP — ADMIN PANEL · app.js
   Vanilla JS · SPA · fetch + async/await
   ============================================================ */

(() => {
    'use strict';

    // ── API Base ──
    const API = 'api/';

    // ── Helpers: Format ──
    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    };

    const HARI_INDO = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const BULAN_INDO = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const formatTanggal = (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d)) return dateStr;
        const hari = HARI_INDO[d.getDay()];
        const tgl = d.getDate();
        const bulan = BULAN_INDO[d.getMonth()];
        const tahun = d.getFullYear();
        const jam = String(d.getHours()).padStart(2, '0');
        const menit = String(d.getMinutes()).padStart(2, '0');
        return `${hari}, ${tgl} ${bulan} ${tahun} · ${jam}:${menit}`;
    };

    const formatTanggalShort = (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d)) return dateStr;
        const tgl = d.getDate();
        const bulan = BULAN_INDO[d.getMonth()];
        const tahun = d.getFullYear();
        return `${tgl} ${bulan} ${tahun}`;
    };

    // ── Helpers: DOM ──
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ── Helpers: Fetch ──
    async function apiFetch(endpoint, options = {}) {
        try {
            const res = await fetch(API + endpoint, {
                credentials: 'include',
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                }
            });

            // Unauthorized → redirect to login
            if (res.status === 401) {
                showLogin();
                return null;
            }

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Terjadi kesalahan');
            }
            return data;
        } catch (err) {
            if (err.name !== 'AbortError') {
                showToast(err.message || 'Gagal menghubungi server', 'error');
            }
            return null;
        }
    }

    // ── Toast ──
    function showToast(message, type = 'success') {
        const container = $('#toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icon = type === 'success' ? '✓' : '✕';
        toast.innerHTML = `<span class="toast-icon">${icon}</span> ${message}`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.35s ease forwards';
            setTimeout(() => toast.remove(), 350);
        }, 3500);
    }

    // ── Confirm Dialog ──
    let confirmCallback = null;

    function showConfirm(title, text, btnText, btnClass) {
        return new Promise((resolve) => {
            $('#confirm-title').textContent = title;
            $('#confirm-text').textContent = text;
            const btnOk = $('#btn-confirm-ok');
            btnOk.textContent = btnText || 'Ya, Lanjutkan';
            btnOk.className = `btn ${btnClass || 'btn-gold'}`;
            openModal('modal-confirm');
            confirmCallback = resolve;
        });
    }

    // ── Modal ──
    function openModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('active');
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('active');

        // If confirm modal, resolve false
        if (id === 'modal-confirm' && confirmCallback) {
            confirmCallback(false);
            confirmCallback = null;
        }
    }

    // Close modal buttons
    document.addEventListener('click', (e) => {
        const closeBtn = e.target.closest('[data-close-modal]');
        if (closeBtn) {
            closeModal(closeBtn.dataset.closeModal);
        }
    });

    // Close modal on overlay click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            const id = e.target.id;
            closeModal(id);
        }
    });

    // Confirm OK
    $('#btn-confirm-ok').addEventListener('click', () => {
        const cb = confirmCallback;
        confirmCallback = null;
        closeModal('modal-confirm');
        if (cb) cb(true);
    });


    /* ============================================================
       1. LOGIN
       ============================================================ */
    function showLogin() {
        $('#login-page').classList.remove('hidden');
        $('#admin-panel').classList.remove('active');
    }

    function showAdmin() {
        $('#login-page').classList.add('hidden');
        $('#admin-panel').classList.add('active');
    }

    // Check session on load
    async function checkSession() {
        const data = await apiFetch('admin-login.php');
        if (data && data.logged_in) {
            showAdmin();
            loadDashboard();
        } else {
            showLogin();
        }
    }

    // Login form
    $('#login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = $('#login-username').value.trim();
        const password = $('#login-password').value.trim();
        const errorEl = $('#login-error');
        const btnEl = $('#btn-login');

        errorEl.textContent = '';

        // Client-side validation
        if (!username || !password) {
            errorEl.textContent = 'Username dan password wajib diisi';
            return;
        }

        btnEl.disabled = true;
        btnEl.textContent = 'MEMPROSES...';

        try {
            const res = await fetch(API + 'admin-login.php', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.success) {
                showAdmin();
                loadDashboard();
                showToast('Selamat datang, Admin!');
            } else {
                errorEl.textContent = data.message || 'Login gagal';
            }
        } catch {
            errorEl.textContent = 'Gagal menghubungi server';
        } finally {
            btnEl.disabled = false;
            btnEl.textContent = 'MASUK';
        }
    });

    // Logout
    $('#btn-logout').addEventListener('click', async () => {
        await apiFetch('admin-login.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'logout' })
        });
        showLogin();
        $('#login-username').value = '';
        $('#login-password').value = '';
        $('#login-error').textContent = '';
    });


    /* ============================================================
       2. SIDEBAR NAVIGATION
       ============================================================ */
    const pageTitles = {
        dashboard: 'Dashboard',
        bookings: 'Booking Masuk',
        schedules: 'Jadwal & Operasional',
        barbers: 'Data Barber',
        services: 'Layanan & Harga',
        transactions: 'Riwayat Transaksi'
    };

    const pageLoaders = {
        dashboard: loadDashboard,
        bookings: loadBookings,
        schedules: loadSchedules,
        barbers: loadBarbers,
        services: loadServices,
        transactions: loadTransactions
    };

    function navigateTo(page) {
        // Update nav items
        $$('.nav-item[data-page]').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update sections
        $$('.page-section').forEach(section => {
            section.classList.toggle('active', section.id === `section-${page}`);
        });

        // Update header
        $('#header-title').textContent = pageTitles[page] || 'Dashboard';

        // Load data
        if (pageLoaders[page]) pageLoaders[page]();

        // Close mobile sidebar
        $('#sidebar').classList.remove('mobile-open');
        $('#mobile-overlay').classList.remove('active');
    }

    // Nav click handlers
    $$('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.dataset.page);
        });
    });

    // Sidebar toggle (desktop)
    $('#sidebar-toggle').addEventListener('click', () => {
        const sidebar = $('#sidebar');
        sidebar.classList.toggle('collapsed');
        const btn = $('#sidebar-toggle');
        btn.textContent = sidebar.classList.contains('collapsed') ? '›' : '‹';
    });

    // Mobile toggle
    $('#mobile-toggle').addEventListener('click', () => {
        $('#sidebar').classList.toggle('mobile-open');
        $('#mobile-overlay').classList.toggle('active');
    });

    $('#mobile-overlay').addEventListener('click', () => {
        $('#sidebar').classList.remove('mobile-open');
        $('#mobile-overlay').classList.remove('active');
    });


    /* ============================================================
       3. DASHBOARD
       ============================================================ */
    async function loadDashboard() {
        const data = await apiFetch('admin-dashboard.php');
        if (!data) return;

        $('#dash-total-booking').textContent = data.total_booking;
        $('#dash-total-pending').textContent = data.total_pending;
        $('#dash-total-confirmed').textContent = data.total_confirmed;
        $('#dash-pendapatan').textContent = formatRupiah(data.pendapatan);

        if (data.settings && data.settings.nama_barbershop) {
            $('#header-shop-name').textContent = data.settings.nama_barbershop;
            document.title = `Admin Panel — ${data.settings.nama_barbershop}`;
        }

        const tbody = $('#dash-recent-table');

        if (!data.recent_bookings || data.recent_bookings.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="7">
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-text">Belum ada booking hari ini</div>
                    </div>
                </td></tr>`;
            return;
        }

        tbody.innerHTML = data.recent_bookings.map(b => `
            <tr>
                <td><strong>${escHtml(b.kode_booking)}</strong></td>
                <td>${escHtml(b.nama)}</td>
                <td>${escHtml(b.layanan)}</td>
                <td>${escHtml(b.barber)}</td>
                <td>${formatTanggal(b.jadwal)}</td>
                <td>${escHtml(b.metode_bayar)}</td>
                <td>${statusBadge(b.status)}</td>
            </tr>
        `).join('');
    }


    /* ============================================================
       4. BOOKING MASUK
       ============================================================ */
    async function loadBookings() {
        const status = $('#filter-booking-status').value;
        const data = await apiFetch(`admin-bookings.php?status=${status}`);
        if (!data) return;

        const tbody = $('#bookings-table');

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="9">
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-text">Tidak ada data booking</div>
                    </div>
                </td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(b => `
            <tr>
                <td><strong>${escHtml(b.kode_booking)}</strong></td>
                <td>${escHtml(b.nama)}</td>
                <td>${escHtml(b.no_hp)}</td>
                <td>${escHtml(b.layanan)}</td>
                <td>${escHtml(b.barber)}</td>
                <td>${formatTanggal(b.jadwal)}</td>
                <td>${escHtml(b.metode_bayar)}</td>
                <td>${statusBadge(b.status)}</td>
                <td>${bookingActions(b)}</td>
            </tr>
        `).join('');

        // Attach action handlers
        tbody.querySelectorAll('.btn-booking-action').forEach(btn => {
            btn.addEventListener('click', handleBookingAction);
        });
    }

    function bookingActions(b) {
        if (b.status === 'pending') {
            return `
                <button class="btn btn-success btn-sm btn-booking-action" data-id="${b.id}" data-action="confirm">✓ Selesai</button>
                <button class="btn btn-danger btn-sm btn-booking-action" data-id="${b.id}" data-action="cancel">✕ Batalkan</button>
            `;
        }
        if (b.status === 'selesai') {
            return `<span class="badge badge-confirmed">Selesai</span>`;
        }
        if (b.status === 'cancelled') {
            return `<span class="badge badge-cancelled">Dibatalkan</span>`;
        }
        return '';
    }

    async function handleBookingAction(e) {
        const btn = e.currentTarget;
        const id = parseInt(btn.dataset.id);
        const action = btn.dataset.action;

        const actionText = action === 'confirm' ? 'menyelesaikan' : 'membatalkan';
        const confirmed = await showConfirm(
            'Konfirmasi',
            `Apakah Anda yakin ingin ${actionText} booking ini?`,
            action === 'confirm' ? 'Ya, Selesaikan' : 'Ya, Batalkan',
            action === 'confirm' ? 'btn-success' : 'btn-danger'
        );

        if (!confirmed) return;

        const data = await apiFetch('admin-booking-action.php', {
            method: 'POST',
            body: JSON.stringify({ id, action })
        });

        if (data && data.success) {
            showToast(data.message);
            loadBookings();
        }
    }

    $('#filter-booking-status').addEventListener('change', loadBookings);
    $('#btn-refresh-bookings').addEventListener('click', loadBookings);


    /* ============================================================
       5. JADWAL & JAM OPERASIONAL
       ============================================================ */
    async function loadSchedules() {
        const data = await apiFetch('admin-schedules.php');
        if (!data) return;

        const container = $('#schedules-container');

        container.innerHTML = data.map(s => `
            <div class="schedule-row" data-schedule-id="${s.id}">
                <div class="schedule-day">${escHtml(s.hari)}</div>
                <div class="schedule-inputs">
                    <label class="toggle-switch" title="Libur">
                        <input type="checkbox" class="sch-libur" ${parseInt(s.libur) ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                    <span style="font-size:0.75rem;color:var(--ivory-muted);min-width:40px">Libur</span>

                    <input type="time" class="form-control sch-buka" value="${(s.jam_buka || '08:00').substring(0,5)}" style="width:120px">
                    <span class="time-sep">s/d</span>
                    <input type="time" class="form-control sch-tutup" value="${(s.jam_tutup || '21:00').substring(0,5)}" style="width:120px">

                    <button class="btn btn-gold btn-sm btn-save-schedule" data-id="${s.id}">Simpan</button>
                </div>
            </div>
        `).join('');

        // Attach save handlers
        container.querySelectorAll('.btn-save-schedule').forEach(btn => {
            btn.addEventListener('click', handleSaveSchedule);
        });

        // Load blocked dates
        loadBlockedDates();
    }

    async function handleSaveSchedule(e) {
        const btn = e.currentTarget;
        const id = parseInt(btn.dataset.id);
        const row = btn.closest('.schedule-row');
        const libur = row.querySelector('.sch-libur').checked ? 1 : 0;
        const jam_buka = row.querySelector('.sch-buka').value;
        const jam_tutup = row.querySelector('.sch-tutup').value;

        btn.disabled = true;
        btn.textContent = '...';

        const data = await apiFetch('admin-schedules.php', {
            method: 'PATCH',
            body: JSON.stringify({ id, libur, jam_buka, jam_tutup })
        });

        if (data && data.success) {
            showToast(data.message);
        }

        btn.disabled = false;
        btn.textContent = 'Simpan';
    }

    // ── Blocked Dates ──
    async function loadBlockedDates() {
        const data = await apiFetch('admin-blocked-dates.php');
        if (!data) return;

        const container = $('#blocked-dates-list');

        if (data.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding:24px">
                    <div class="empty-state-text">Belum ada tanggal yang diblokir</div>
                </div>`;
            return;
        }

        container.innerHTML = data.map(d => `
            <div class="blocked-date-item">
                <div class="blocked-date-info">
                    <span class="blocked-date-val">${formatTanggalShort(d.tanggal)}</span>
                    <span class="blocked-date-ket">${escHtml(d.keterangan || '-')}</span>
                </div>
                <button class="btn btn-danger btn-sm btn-del-blocked" data-id="${d.id}">Hapus</button>
            </div>
        `).join('');

        container.querySelectorAll('.btn-del-blocked').forEach(btn => {
            btn.addEventListener('click', handleDeleteBlocked);
        });
    }

    $('#btn-add-blocked').addEventListener('click', async () => {
        const tanggal = $('#blocked-date-input').value;
        const keterangan = $('#blocked-ket-input').value.trim();

        if (!tanggal) {
            showToast('Pilih tanggal terlebih dahulu', 'error');
            return;
        }

        const data = await apiFetch('admin-blocked-dates.php', {
            method: 'POST',
            body: JSON.stringify({ tanggal, keterangan })
        });

        if (data && data.success) {
            showToast(data.message);
            $('#blocked-date-input').value = '';
            $('#blocked-ket-input').value = '';
            loadBlockedDates();
        }
    });

    async function handleDeleteBlocked(e) {
        const id = parseInt(e.currentTarget.dataset.id);
        const confirmed = await showConfirm(
            'Hapus Blokir',
            'Apakah Anda yakin ingin menghapus blokir tanggal ini?',
            'Ya, Hapus',
            'btn-danger'
        );
        if (!confirmed) return;

        const data = await apiFetch('admin-blocked-dates.php', {
            method: 'DELETE',
            body: JSON.stringify({ id })
        });

        if (data && data.success) {
            showToast(data.message);
            loadBlockedDates();
        }
    }


    /* ============================================================
       6. DATA BARBER
       ============================================================ */
    let barbersCache = [];

    async function loadBarbers() {
        const data = await apiFetch('admin-barbers.php');
        if (!data) return;

        barbersCache = data;
        const grid = $('#barbers-grid');

        if (data.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✂</div>
                    <div class="empty-state-text">Belum ada data barber</div>
                </div>`;
            return;
        }

        grid.innerHTML = data.map(b => {
            const initial = b.nama ? b.nama.charAt(0).toUpperCase() : '?';
            const isAktif = parseInt(b.aktif);
            return `
                <div class="barber-card">
                    <div class="barber-avatar">${initial}</div>
                    <div class="barber-info">
                        <div class="barber-name">${escHtml(b.nama)}</div>
                        <div class="barber-spec">${escHtml(b.spesialisasi || 'Belum ada spesialisasi')}</div>
                        <span class="badge ${isAktif ? 'badge-aktif' : 'badge-nonaktif'}">${isAktif ? 'Aktif' : 'Nonaktif'}</span>
                    </div>
                    <div class="barber-actions" style="flex-direction:column;">
                        <button class="btn btn-gold btn-sm btn-edit-barber" data-id="${b.id}">Edit</button>
                        <button class="btn ${isAktif ? 'btn-danger' : 'btn-success'} btn-sm btn-toggle-barber" data-id="${b.id}" data-aktif="${isAktif}">
                            ${isAktif ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach handlers
        grid.querySelectorAll('.btn-edit-barber').forEach(btn => {
            btn.addEventListener('click', handleEditBarber);
        });
        grid.querySelectorAll('.btn-toggle-barber').forEach(btn => {
            btn.addEventListener('click', handleToggleBarber);
        });
    }

    // Add barber
    $('#btn-add-barber').addEventListener('click', () => {
        $('#modal-barber-title').textContent = 'Tambah Barber';
        $('#barber-edit-id').value = '';
        $('#barber-nama').value = '';
        $('#barber-spec').value = '';
        openModal('modal-barber');
    });

    // Edit barber
    function handleEditBarber(e) {
        const id = parseInt(e.currentTarget.dataset.id);
        const barber = barbersCache.find(b => parseInt(b.id) === id);
        if (!barber) return;

        $('#modal-barber-title').textContent = 'Edit Barber';
        $('#barber-edit-id').value = barber.id;
        $('#barber-nama').value = barber.nama;
        $('#barber-spec').value = barber.spesialisasi || '';
        openModal('modal-barber');
    }

    // Save barber
    $('#btn-save-barber').addEventListener('click', async () => {
        const id = $('#barber-edit-id').value;
        const nama = $('#barber-nama').value.trim();
        const spesialisasi = $('#barber-spec').value.trim();

        if (!nama) {
            showToast('Nama barber wajib diisi', 'error');
            return;
        }

        const body = { nama, spesialisasi };
        let method = 'POST';

        if (id) {
            body.id = parseInt(id);
            method = 'PATCH';
        }

        const data = await apiFetch('admin-barbers.php', {
            method,
            body: JSON.stringify(body)
        });

        if (data && data.success) {
            showToast(data.message);
            closeModal('modal-barber');
            loadBarbers();
        }
    });

    // Toggle barber aktif/nonaktif
    async function handleToggleBarber(e) {
        const id = parseInt(e.currentTarget.dataset.id);
        const currentAktif = parseInt(e.currentTarget.dataset.aktif);
        const newAktif = currentAktif ? 0 : 1;
        const actionText = currentAktif ? 'menonaktifkan' : 'mengaktifkan';

        const confirmed = await showConfirm(
            'Konfirmasi',
            `Apakah Anda yakin ingin ${actionText} barber ini?`,
            currentAktif ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan',
            currentAktif ? 'btn-danger' : 'btn-success'
        );
        if (!confirmed) return;

        const data = await apiFetch('admin-barbers.php', {
            method: 'PATCH',
            body: JSON.stringify({ id, aktif: newAktif })
        });

        if (data && data.success) {
            showToast(data.message);
            loadBarbers();
        }
    }


    /* ============================================================
       7. LAYANAN & HARGA
       ============================================================ */
    let servicesCache = [];

    async function loadServices() {
        const data = await apiFetch('admin-services.php');
        if (!data) return;

        servicesCache = data;
        const tbody = $('#services-table');

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="5">
                    <div class="empty-state">
                        <div class="empty-state-icon">💈</div>
                        <div class="empty-state-text">Belum ada data layanan</div>
                    </div>
                </td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(s => {
            const isAktif = parseInt(s.aktif);
            return `
                <tr>
                    <td><strong>${escHtml(s.nama)}</strong></td>
                    <td>${s.durasi} menit</td>
                    <td>${formatRupiah(s.harga)}</td>
                    <td>${isAktif
                        ? '<span class="badge badge-aktif">Aktif</span>'
                        : '<span class="badge badge-nonaktif">Nonaktif</span>'}</td>
                    <td>
                        <button class="btn btn-gold btn-sm btn-edit-service" data-id="${s.id}">Edit</button>
                        ${isAktif
                            ? `<button class="btn btn-danger btn-sm btn-del-service" data-id="${s.id}">Hapus</button>`
                            : `<button class="btn btn-success btn-sm btn-activate-service" data-id="${s.id}">Aktifkan</button>`}
                    </td>
                </tr>
            `;
        }).join('');

        // Attach handlers
        tbody.querySelectorAll('.btn-edit-service').forEach(btn => {
            btn.addEventListener('click', handleEditService);
        });
        tbody.querySelectorAll('.btn-del-service').forEach(btn => {
            btn.addEventListener('click', handleDeleteService);
        });
        tbody.querySelectorAll('.btn-activate-service').forEach(btn => {
            btn.addEventListener('click', handleActivateService);
        });
    }

    // Add service
    $('#btn-add-service').addEventListener('click', () => {
        $('#modal-service-title').textContent = 'Tambah Layanan';
        $('#service-edit-id').value = '';
        $('#service-nama').value = '';
        $('#service-durasi').value = '';
        $('#service-harga').value = '';
        openModal('modal-service');
    });

    // Edit service
    function handleEditService(e) {
        const id = parseInt(e.currentTarget.dataset.id);
        const service = servicesCache.find(s => parseInt(s.id) === id);
        if (!service) return;

        $('#modal-service-title').textContent = 'Edit Layanan';
        $('#service-edit-id').value = service.id;
        $('#service-nama').value = service.nama;
        $('#service-durasi').value = service.durasi;
        $('#service-harga').value = service.harga;
        openModal('modal-service');
    }

    // Save service
    $('#btn-save-service').addEventListener('click', async () => {
        const id = $('#service-edit-id').value;
        const nama = $('#service-nama').value.trim();
        const durasi = parseInt($('#service-durasi').value);
        const harga = parseInt($('#service-harga').value);

        if (!nama || !durasi || !harga) {
            showToast('Semua field wajib diisi', 'error');
            return;
        }

        const body = { nama, durasi, harga };
        let method = 'POST';

        if (id) {
            body.id = parseInt(id);
            method = 'PATCH';
        }

        const data = await apiFetch('admin-services.php', {
            method,
            body: JSON.stringify(body)
        });

        if (data && data.success) {
            showToast(data.message);
            closeModal('modal-service');
            loadServices();
        }
    });

    // Delete (soft) service
    async function handleDeleteService(e) {
        const id = parseInt(e.currentTarget.dataset.id);
        const confirmed = await showConfirm(
            'Hapus Layanan',
            'Layanan akan dinonaktifkan dan tidak tampil di halaman booking. Lanjutkan?',
            'Ya, Hapus',
            'btn-danger'
        );
        if (!confirmed) return;

        const data = await apiFetch('admin-services.php', {
            method: 'DELETE',
            body: JSON.stringify({ id })
        });

        if (data && data.success) {
            showToast(data.message);
            loadServices();
        }
    }

    // Activate service
    async function handleActivateService(e) {
        const id = parseInt(e.currentTarget.dataset.id);
        const data = await apiFetch('admin-services.php', {
            method: 'PATCH',
            body: JSON.stringify({ id, aktif: 1 })
        });

        if (data && data.success) {
            showToast(data.message);
            loadServices();
        }
    }


    /* ============================================================
       8. RIWAYAT TRANSAKSI
       ============================================================ */
    let transBarberLoaded = false;

    async function loadTransactions() {
        const from = $('#filter-trans-from').value;
        const to = $('#filter-trans-to').value;
        const barberId = $('#filter-trans-barber').value;
        const metode = $('#filter-trans-metode').value;

        let qs = '?';
        if (from) qs += `from=${from}&`;
        if (to) qs += `to=${to}&`;
        if (barberId) qs += `barber_id=${barberId}&`;
        if (metode) qs += `metode=${metode}&`;

        const data = await apiFetch(`admin-transactions.php${qs}`);
        if (!data) return;

        // Populate barber filter (only once)
        if (!transBarberLoaded && data.barbers) {
            const sel = $('#filter-trans-barber');
            data.barbers.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.id;
                opt.textContent = b.nama;
                sel.appendChild(opt);
            });
            transBarberLoaded = true;
        }

        // Total
        $('#trans-total-pendapatan').textContent = formatRupiah(data.total_pendapatan);

        const tbody = $('#transactions-table');
        const bookings = data.bookings || [];

        if (bookings.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="8">
                    <div class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <div class="empty-state-text">Tidak ada data transaksi</div>
                    </div>
                </td></tr>`;
            return;
        }

        tbody.innerHTML = bookings.map(b => `
            <tr>
                <td><strong>${escHtml(b.kode_booking)}</strong></td>
                <td>${formatTanggal(b.jadwal)}</td>
                <td>${escHtml(b.nama)}</td>
                <td>${escHtml(b.layanan)}</td>
                <td>${escHtml(b.barber)}</td>
                <td>${escHtml(b.metode_bayar)}</td>
                <td>${formatRupiah(b.harga)}</td>
                <td>${statusBadge(b.status)}</td>
            </tr>
        `).join('');
    }

    $('#btn-filter-trans').addEventListener('click', loadTransactions);
    $('#btn-print-trans').addEventListener('click', () => {
        window.print();
    });


    // UTILITIES
    function statusBadge(status) {
        const map = {
            pending: '<span class="badge badge-pending">Pending</span>',
            selesai: '<span class="badge badge-confirmed">Selesai</span>',
            cancelled: '<span class="badge badge-cancelled">Dibatalkan</span>'
        };
        return map[status] || `<span class="badge">${status}</span>`;
    }

    function escHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }


    // INIT
    checkSession();

})();
