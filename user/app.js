/* ============================================
   BARBERSHOP — Customer Booking App
   PHP API Integration & Booking Logic
   ============================================ */

// ─── API Configuration ─────────────────────────────
const API_BASE = '/barbershop/user/api';

// ─── Application State ─────────────────────────────
const state = {
  settings: null,
  services: [],
  barbers: [],
  schedules: [],
  currentStep: 0,
  booking: {
    service: null,
    barber: null,
    date: null,
    time: null,
    nama: '',
    no_hp: ''
  }
};

const HARI_MAP = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const BULAN_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const SLOT_INTERVAL = 30; // minutes

let qrisTimerInterval = null;

// ─── Initialize App ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initEventListeners();
  loadAllData();
});

// ─── Navbar ─────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });

  mobileToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Close mobile menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });
}

// ─── Event Listeners ────────────────────────────────
function initEventListeners() {
  // Hero & Nav booking buttons
  document.getElementById('hero-book-btn').addEventListener('click', scrollToBooking);
  document.getElementById('nav-book-btn').addEventListener('click', (e) => {
    e.preventDefault();
    scrollToBooking();
  });

  // Step navigation
  document.getElementById('btn-next-0').addEventListener('click', () => goToStep(1));
  document.getElementById('btn-next-1').addEventListener('click', () => goToStep(2));
  document.getElementById('btn-next-2').addEventListener('click', () => goToStep(3));
  document.getElementById('btn-next-3').addEventListener('click', () => handleCustomerInfoSubmit());

  document.getElementById('btn-back-1').addEventListener('click', () => goToStep(0));
  document.getElementById('btn-back-2').addEventListener('click', () => goToStep(1));
  document.getElementById('btn-back-3').addEventListener('click', () => goToStep(2));
  document.getElementById('btn-back-summary').addEventListener('click', () => goToStep(3));

  // Payment options
  document.getElementById('pay-qris').addEventListener('click', () => handlePayment('QRIS'));
  document.getElementById('pay-kasir').addEventListener('click', () => handlePayment('KASIR'));

  // Home button
  document.getElementById('btn-home').addEventListener('click', () => {
    window.location.reload();
  });
}

function scrollToBooking() {
  document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' });
}

// ─── Data Loading ───────────────────────────────────
async function loadAllData() {
  try {
    await Promise.all([
      loadSettings(),
      loadServices(),
      loadBarbers(),
      loadSchedules()
    ]);
    renderServices();
    renderBookingServices();
    renderBarbers();
    renderDatePicker();
  } catch (err) {
    console.error('Error loading data:', err);
    showToast('Gagal memuat data. Periksa koneksi API server.', 'error');
  }
}

async function loadSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings.php`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.settings = data;
    applySettings(data);
  } catch (err) {
    console.warn('Could not load settings:', err.message);
  }
}

function applySettings(settings) {
  if (!settings) return;

  const name = settings.nama_barbershop || 'Barbershop';
  const tagline = settings.tagline || 'Style Starts Here';

  document.title = `${name} — Booking Online`;
  document.getElementById('nav-brand').textContent = name;
  document.getElementById('hero-shop-name').textContent = name;
  document.getElementById('hero-tagline').textContent = tagline;
  document.getElementById('footer-brand').textContent = name;
  document.getElementById('footer-copy').innerHTML = `&copy; ${new Date().getFullYear()} ${name}. All rights reserved.`;
}

async function loadServices() {
  const res = await fetch(`${API_BASE}/services.php`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  state.services = data || [];
}

async function loadBarbers() {
  const res = await fetch(`${API_BASE}/barbers.php`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  state.barbers = data || [];
}

async function loadSchedules() {
  const res = await fetch(`${API_BASE}/schedules.php`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  state.schedules = data || [];
}

// ─── Render: Services Section ───────────────────────
function renderServices() {
  const grid = document.getElementById('services-grid');
  if (state.services.length === 0) {
    grid.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:40px;">Belum ada layanan tersedia.</p>';
    return;
  }

  grid.innerHTML = state.services.map((service, i) => `
    <div class="service-card" style="transition-delay: ${i * 0.08}s">
      <div class="service-card-icon">✂️</div>
      <div class="service-card-name">${escapeHtml(service.nama)}</div>
      <div class="service-card-price">${formatCurrency(service.harga)}</div>
    </div>
  `).join('');

  // Animate cards on scroll
  observeCards();
}

function observeCards() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.service-card').forEach(card => observer.observe(card));
}

// ─── Render: Booking Step 1 — Services ──────────────
function renderBookingServices() {
  const container = document.getElementById('booking-services-list');
  if (state.services.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:20px;">Tidak ada layanan tersedia</p>';
    return;
  }

  container.innerHTML = state.services.map(service => `
    <div class="selectable-card" data-id="${service.id}" onclick="selectService(${service.id})">
      <div class="selectable-card-info">
        <div class="selectable-card-name">${escapeHtml(service.nama)}</div>
      </div>
      <div style="display:flex; align-items:center; gap:12px;">
        <div class="selectable-card-price">${formatCurrency(service.harga)}</div>
        <div class="selectable-card-check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>
    </div>
  `).join('');
}

function selectService(id) {
  state.booking.service = state.services.find(s => s.id === id);
  highlightSelected('booking-services-list', id);
  document.getElementById('btn-next-0').disabled = false;
}

// ─── Render: Booking Step 2 — Barbers ───────────────
function renderBarbers() {
  const container = document.getElementById('booking-barbers-list');
  if (state.barbers.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:20px;">Tidak ada barber aktif</p>';
    return;
  }

  container.innerHTML = state.barbers.map(barber => `
    <div class="selectable-card" data-id="${barber.id}" onclick="selectBarber(${barber.id})">
      <div class="selectable-card-info">
        <div class="selectable-card-name">${escapeHtml(barber.nama)}</div>
        <div class="selectable-card-detail">${escapeHtml(barber.spesialisasi || '')}</div>
      </div>
      <div class="selectable-card-check">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
    </div>
  `).join('');
}

function selectBarber(id) {
  state.booking.barber = state.barbers.find(b => b.id === id);
  highlightSelected('booking-barbers-list', id);
  document.getElementById('btn-next-1').disabled = false;
}

// ─── Render: Booking Step 3 — Date & Time ───────────
function renderDatePicker() {
  const container = document.getElementById('date-picker');
  const dates = generateDates(14);

  container.innerHTML = dates.map(dateObj => {
    const { date, dayName, dayNum, monthName, isAvailable } = dateObj;
    const dateStr = formatDateISO(date);
    return `
      <div class="date-card ${isAvailable ? '' : 'disabled'}" 
           data-date="${dateStr}"
           onclick="${isAvailable ? `selectDate('${dateStr}')` : ''}">
        <div class="date-card-day">${dayName}</div>
        <div class="date-card-num">${dayNum}</div>
        <div class="date-card-month">${monthName}</div>
      </div>
    `;
  }).join('');
}

function generateDates(count) {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayIndex = d.getDay();
    const dayName = HARI_MAP[dayIndex];

    // Check schedule availability
    const schedule = state.schedules.find(s =>
      s.hari.toLowerCase() === dayName.toLowerCase()
    );
    const isAvailable = schedule && !schedule.libur;

    dates.push({
      date: d,
      dayName: dayName.substring(0, 3),
      dayNum: d.getDate(),
      monthName: BULAN_SHORT[d.getMonth()],
      isAvailable
    });
  }

  return dates;
}

async function selectDate(dateStr) {
  state.booking.date = dateStr;
  state.booking.time = null;
  document.getElementById('btn-next-2').disabled = true;

  // Highlight selected date
  document.querySelectorAll('.date-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.date === dateStr);
  });

  // Load available time slots
  await renderTimeSlots(dateStr);
}

async function renderTimeSlots(dateStr) {
  const container = document.getElementById('time-slots-container');
  const grid = document.getElementById('time-slots-grid');
  container.style.display = 'block';

  const date = new Date(dateStr + 'T00:00:00');
  const dayName = HARI_MAP[date.getDay()];
  const schedule = state.schedules.find(s =>
    s.hari.toLowerCase() === dayName.toLowerCase()
  );

  if (!schedule || schedule.libur) {
    grid.innerHTML = '<div class="no-slots-message"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Tidak tersedia di hari ini</div>';
    return;
  }

  // Generate all possible slots
  const allSlots = generateTimeSlots(schedule.jam_buka, schedule.jam_tutup);

  // Get booked slots for this date + barber
  const bookedSlots = await getBookedSlots(dateStr, state.booking.barber.id);

  // Filter: also skip past times if date is today
  const now = new Date();
  const isToday = formatDateISO(now) === dateStr;

  grid.innerHTML = allSlots.map(slot => {
    const isBooked = bookedSlots.includes(slot);
    let isPast = false;
    if (isToday) {
      const [h, m] = slot.split(':').map(Number);
      isPast = (h < now.getHours()) || (h === now.getHours() && m <= now.getMinutes());
    }
    const disabled = isBooked || isPast;

    return `
      <div class="time-slot ${disabled ? 'disabled' : ''}"
           onclick="${disabled ? '' : `selectTime('${slot}')`}">
        ${slot}
      </div>
    `;
  }).join('');

  if (allSlots.length === 0) {
    grid.innerHTML = '<div class="no-slots-message">Tidak ada slot waktu tersedia</div>';
  }
}

function generateTimeSlots(jamBuka, jamTutup) {
  const slots = [];
  let [h, m] = jamBuka.split(':').map(Number);
  const [endH, endM] = jamTutup.split(':').map(Number);
  const endMinutes = endH * 60 + endM;

  // Consider service duration for the last available slot
  const serviceDuration = state.booking.service ? state.booking.service.durasi : SLOT_INTERVAL;

  while (true) {
    const currentMinutes = h * 60 + m;
    if (currentMinutes + serviceDuration > endMinutes) break;

    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += SLOT_INTERVAL;
    if (m >= 60) {
      h += Math.floor(m / 60);
      m = m % 60;
    }
  }

  return slots;
}

async function getBookedSlots(dateStr, barberId) {
  try {
    const res = await fetch(`${API_BASE}/booked-slots.php?date=${dateStr}&barber_id=${barberId}`);
    if (!res.ok) {
      console.warn('Error fetching booked slots:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn('Error fetching booked slots:', err.message);
    return [];
  }
}

function selectTime(time) {
  state.booking.time = time;
  document.querySelectorAll('.time-slot').forEach(slot => {
    slot.classList.toggle('selected', slot.textContent.trim() === time);
  });
  document.getElementById('btn-next-2').disabled = false;
}

// ─── Step Navigation ────────────────────────────────
function goToStep(stepIndex) {
  // Hide all steps
  document.querySelectorAll('.booking-step').forEach(el => el.classList.remove('active'));

  if (stepIndex <= 3) {
    // Normal numbered steps
    state.currentStep = stepIndex;
    document.getElementById(`step-${stepIndex}`).classList.add('active');
    updateStepsIndicator(stepIndex);
  }

  // Scroll to booking container
  document.getElementById('booking-container').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

function showStepById(id) {
  document.querySelectorAll('.booking-step').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('booking-container').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

function updateStepsIndicator(activeIndex) {
  const items = document.querySelectorAll('.step-item');
  const connectors = document.querySelectorAll('.step-connector');

  items.forEach((item, i) => {
    item.classList.remove('active', 'completed');
    if (i === activeIndex) item.classList.add('active');
    else if (i < activeIndex) item.classList.add('completed');
  });

  connectors.forEach((conn, i) => {
    conn.classList.toggle('active', i < activeIndex);
  });
}

// ─── Step 4: Customer Info ──────────────────────────
function handleCustomerInfoSubmit() {
  const nama = document.getElementById('input-nama').value.trim();
  const hp = document.getElementById('input-hp').value.trim();
  let valid = true;

  // Validate name
  if (!nama) {
    document.getElementById('error-nama').classList.add('visible');
    valid = false;
  } else {
    document.getElementById('error-nama').classList.remove('visible');
  }

  // Validate phone
  const phoneClean = hp.replace(/[^0-9]/g, '');
  const phoneValid = phoneClean.length >= 10 && 
    (phoneClean.startsWith('08') || phoneClean.startsWith('628'));
  if (!phoneValid) {
    document.getElementById('error-hp').classList.add('visible');
    valid = false;
  } else {
    document.getElementById('error-hp').classList.remove('visible');
  }

  if (!valid) return;

  state.booking.nama = nama;
  state.booking.no_hp = hp;

  // Render summary and show it
  renderSummary();
  updateStepsIndicator(4); // All steps done
  showStepById('step-summary');
}

// ─── Summary ────────────────────────────────────────
function renderSummary() {
  const { service, barber, date, time } = state.booking;
  const dateFormatted = formatDateFull(date);
  const dayName = HARI_MAP[new Date(date + 'T00:00:00').getDay()];

  document.getElementById('summary-details').innerHTML = `
    <div class="summary-row">
      <span class="summary-label">Layanan</span>
      <span class="summary-value">${escapeHtml(service.nama)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Barber</span>
      <span class="summary-value">${escapeHtml(barber.nama)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Jadwal</span>
      <span class="summary-value">${dayName}, ${dateFormatted}<br/>${time} WIB</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Nama</span>
      <span class="summary-value">${escapeHtml(state.booking.nama)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">No. HP</span>
      <span class="summary-value">${escapeHtml(state.booking.no_hp)}</span>
    </div>
  `;

  document.getElementById('summary-total-price').textContent = formatCurrency(service.harga);
}

// ─── Payment Handling ───────────────────────────────
async function handlePayment(method) {
  try {
    const kodeBooking = await submitBooking(method);

    if (method === 'QRIS') {
      showQRIS(kodeBooking);
    } else {
      showConfirmation(kodeBooking);
    }
  } catch (err) {
    console.error('Booking error:', err);
    showToast('Gagal menyimpan booking. Silakan coba lagi.', 'error');
  }
}

async function submitBooking(metodeBayar) {
  const { service, barber, date, time, nama, no_hp } = state.booking;
  const jadwal = `${date}T${time}:00`;

  const res = await fetch(`${API_BASE}/bookings.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      nama: nama,
      no_hp: no_hp,
      layanan_id: service.id,
      barber_id: barber.id,
      jadwal: jadwal,
      metode_bayar: metodeBayar
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.kode_booking;
}

// ─── QRIS View ──────────────────────────────────────
function showQRIS(kodeBooking) {
  const qrisUrl = state.settings?.qris_image_url || '';

  document.getElementById('qris-image').src = qrisUrl;
  document.getElementById('qris-total-price').textContent = formatCurrency(state.booking.service.harga);

  showStepById('step-qris');

  // Start countdown
  let seconds = 30;
  const timerEl = document.getElementById('qris-timer');
  timerEl.textContent = seconds;

  if (qrisTimerInterval) clearInterval(qrisTimerInterval);

  qrisTimerInterval = setInterval(() => {
    seconds--;
    timerEl.textContent = seconds;

    if (seconds <= 0) {
    clearInterval(qrisTimerInterval);
    document.getElementById('qris-countdown').innerHTML = 
        '✅ Selesai scan? <strong>Tunjukkan bukti transfer ke kasir</strong>';
}
  }, 1000);
}

// ─── Confirmation View ──────────────────────────────
function showConfirmation(kodeBooking) {
  if (qrisTimerInterval) clearInterval(qrisTimerInterval);

  document.getElementById('booking-code').textContent = kodeBooking;

  const { service, barber, date, time } = state.booking;
  const dayName = HARI_MAP[new Date(date + 'T00:00:00').getDay()];
  const dateFormatted = formatDateFull(date);

  document.getElementById('confirmation-summary').innerHTML = `
    <div class="confirmation-summary-title">Detail Booking</div>
    <div class="summary-row">
      <span class="summary-label">Layanan</span>
      <span class="summary-value">${escapeHtml(service.nama)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Barber</span>
      <span class="summary-value">${escapeHtml(barber.nama)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Jadwal</span>
      <span class="summary-value">${dayName}, ${dateFormatted} — ${time} WIB</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Total</span>
      <span class="summary-value" style="color:var(--accent-dark);font-size:16px;">${formatCurrency(service.harga)}</span>
    </div>
    <div class="summary-row">
      <span class=\"summary-value\" style=\"color:var(--color-text-warning);\">⏳ MENUNGGU KONFIRMASI KASIR</span>
      <span class="summary-value" style="color:var(--success);">✓ TERKONFIRMASI</span>
    </div>
  `;

  // Hide steps indicator
  document.getElementById('steps-indicator').style.display = 'none';

  showStepById('step-confirmation');
}

// ─── UI Helpers ─────────────────────────────────────
function highlightSelected(containerId, selectedId) {
  const container = document.getElementById(containerId);
  container.querySelectorAll('.selectable-card').forEach(card => {
    card.classList.toggle('selected', Number(card.dataset.id) === selectedId);
  });
}

function showToast(message, type = 'error') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      ${type === 'error'
        ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
        : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'}
    </svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('exiting');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ─── Formatters ─────────────────────────────────────
function formatCurrency(amount) {
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

function formatDateISO(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateFull(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${BULAN_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
