document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initDashboard();
  initProjects();
  initAcademics();
  initVolunteeringAndTimeline();
});

// Navigation Handling
function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const sections = document.querySelectorAll('.tab-content');
  const activePill = document.querySelector('.nav-active-pill');

  function updateActivePill() {
    const activeTab = document.querySelector('.nav-tab.active');
    if (activeTab && activePill) {
      if (window.innerWidth <= 768) {
        activePill.style.width = `${activeTab.offsetWidth}px`;
        activePill.style.height = `${activeTab.offsetHeight}px`;
        activePill.style.left = `${activeTab.offsetLeft}px`;
        activePill.style.top = `${activeTab.offsetTop}px`;
      }
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      
      tab.classList.add('active');
      const targetSection = document.getElementById(targetTab);
      if (targetSection) {
        targetSection.classList.add('active');
      }
      
      // Update sliding pill position
      updateActivePill();
    });
  });

  // Run resize updates
  window.addEventListener('resize', updateActivePill);
  
  // Initial render (delayed slightly to wait for DOM size calculations)
  setTimeout(updateActivePill, 80);
}

// Overview Dashboard Initializer
function initDashboard() {
  // Populate Total Volunteer Hours
  const totalVolunteeringHours = PORTFOLIO_DATA.volunteering.reduce((acc, curr) => acc + curr.hours, 0);
  const volunteeringBadge = document.getElementById('dash-volunteer-hours');
  if (volunteeringBadge) {
    volunteeringBadge.textContent = "100h+";
  }

  // Render recent milestones into the mini-timeline on dashboard
  const miniTimeline = document.getElementById('mini-timeline');
  if (miniTimeline) {
    miniTimeline.innerHTML = PORTFOLIO_DATA.milestones.slice(0, 3).map(m => `
      <div class="timeline-item">
        <div class="timeline-date">${m.date}</div>
        <div class="timeline-task">${m.task}</div>
      </div>
    `).join('');
  }
}

// Project Portfolio Section Initializer
function initProjects() {
  const filterContainer = document.querySelector('.project-filters');
  const grid = document.querySelector('.projects-grid');
  if (!grid) return;

  function renderProjects(category = 'all') {
    const filtered = category === 'all' 
      ? PORTFOLIO_DATA.projects 
      : PORTFOLIO_DATA.projects.filter(p => p.category === category);

    grid.innerHTML = filtered.map(p => `
      <div class="glass-card project-card" data-category="${p.category}">
        <div class="project-category">${p.category}</div>
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <div class="project-tags">
          ${p.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}
        </div>
        <ul class="project-highlights">
          ${p.highlights.map(h => `<li>${h}</li>`).join('')}
        </ul>
      </div>
    `).join('');
  }

  // Setup click handlers for filters
  if (filterContainer) {
    filterContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        renderProjects(e.target.getAttribute('data-filter'));
      }
    });
  }

  // Initial render
  renderProjects();
}

// Academic & GPA Section Initializer
function initAcademics() {
  // Populate TOEFL Tracker
  const toeflTrack = document.getElementById('toefl-track');
  if (toeflTrack) {
    toeflTrack.innerHTML = PORTFOLIO_DATA.toefl.map(t => `
      <div class="toefl-node ${t.target ? 'target' : ''}">
        <div class="toefl-date">${t.date}</div>
        <div class="toefl-scores">
          <div class="score-chip"><span>R</span><span>${t.r}</span></div>
          <div class="score-chip"><span>L</span><span>${t.l}</span></div>
          <div class="score-chip"><span>S</span><span>${t.s}</span></div>
          <div class="score-chip"><span>W</span><span>${t.w}</span></div>
        </div>
        <div class="toefl-total">${t.total}</div>
      </div>
    `).join('');
  }

  // Populate GPA Tables
  const g10g11Body = document.getElementById('g10g11-course-table-body');
  if (g10g11Body) {
    g10g11Body.innerHTML = PORTFOLIO_DATA.courses.g10g11.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td data-label="Final Result">${c.grade}</td>
        <td data-label="Course Level"><span class="badge-gt">${c.level}</span></td>
      </tr>
    `).join('');
  }

  const g12Body = document.getElementById('g12-course-table-body');
  if (g12Body) {
    g12Body.innerHTML = PORTFOLIO_DATA.courses.g12.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td data-label="Option / Detail">${c.detail}</td>
        <td data-label="Expected">${c.expected}</td>
        <td data-label="Status"><span class="badge-ap">${c.status}</span></td>
      </tr>
    `).join('');
  }
}

// Volunteering & Timeline Section Initializer
function initVolunteeringAndTimeline() {
  // Populate volunteering log
  const volLog = document.getElementById('volunteering-log');
  if (volLog) {
    volLog.innerHTML = PORTFOLIO_DATA.volunteering.map(v => `
      <div class="volunteering-item">
        <span>${v.name}</span>
        <span class="volunteering-hours">${v.hours} hrs</span>
      </div>
    `).join('');
  }

  // Populate milestones timeline
  const fullTimeline = document.getElementById('full-timeline');
  if (fullTimeline) {
    fullTimeline.innerHTML = PORTFOLIO_DATA.milestones.map(m => `
      <div class="timeline-item">
        <div class="timeline-date">${m.date}</div>
        <div class="timeline-task">${m.task}</div>
      </div>
    `).join('');
  }
}

// Handle email pill expand toggle on click (tap to expand, tap again to collapse, zero redirects)
document.addEventListener('DOMContentLoaded', () => {
  const emailPill = document.querySelector('.email-pill');
  if (emailPill) {
    emailPill.addEventListener('click', (e) => {
      e.stopPropagation();
      emailPill.classList.toggle('expanded');
    });

    document.addEventListener('click', () => {
      emailPill.classList.remove('expanded');
    });
  }
});
