/* ============================================================
   GlucoSense AI — Interactive Logic
   ============================================================ */

// ─── Particle Canvas ─────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['rgba(110,231,247,', 'rgba(167,139,250,', 'rgba(52,211,153,'];

  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : H + 10;
      this.r = Math.random() * 1.5 + 0.5;
      this.speed = Math.random() * 0.4 + 0.1;
      this.drift = (Math.random() - 0.5) * 0.2;
      this.alpha = Math.random() * 0.5 + 0.1;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.twinkle = Math.random() * Math.PI * 2;
    }
    update() {
      this.y -= this.speed;
      this.x += this.drift;
      this.twinkle += 0.02;
      if (this.y < -10) this.reset(false);
    }
    draw() {
      const a = this.alpha * (0.7 + 0.3 * Math.sin(this.twinkle));
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color + a + ')';
      ctx.fill();
    }
  }

  for (let i = 0; i < 80; i++) particles.push(new Particle());

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
})();


// ─── Field Configuration ──────────────────────────────────────
const FIELDS = [
  { id: 'age',           name: 'Age',                       min: 1,   max: 120, step: 1,     integer: true  },
  { id: 'pregnancies',   name: 'Pregnancies',               min: 0,   max: 20,  step: 1,     integer: true  },
  { id: 'glucose',       name: 'Glucose',                   min: 0,   max: 300, step: 1,     integer: true  },
  { id: 'bloodPressure', name: 'Blood Pressure',            min: 0,   max: 200, step: 1,     integer: true  },
  { id: 'skinThickness', name: 'Skin Thickness',            min: 0,   max: 100, step: 1,     integer: true  },
  { id: 'insulin',       name: 'Insulin',                   min: 0,   max: 1000,step: 1,     integer: true  },
  { id: 'bmi',           name: 'BMI',                       min: 0,   max: 80,  step: 0.1,   integer: false },
  { id: 'dpf',           name: 'Pedigree Function',         min: 0,   max: 3,   step: 0.001, integer: false },
];

const SAMPLE_DATA = {
  age: 45, pregnancies: 3, glucose: 148, bloodPressure: 72,
  skinThickness: 35, insulin: 0, bmi: 33.6, dpf: 0.627,
};

const API_URL = 'http://127.0.0.1:5000/predict';


// ─── DOM Refs ─────────────────────────────────────────────────
const form        = document.getElementById('prediction-form');
const predictBtn  = document.getElementById('predict-btn');
const resetBtn    = document.getElementById('reset-btn');
const sampleBtn   = document.getElementById('fill-sample-btn');
const resultEl    = document.getElementById('result-container');
const resultSec   = document.getElementById('result-section');


// ─── Validation ───────────────────────────────────────────────
function validateField(field) {
  const el      = document.getElementById(field.id);
  const group   = document.getElementById(`field-${field.id}`);
  const errEl   = document.getElementById(`err-${field.id}`);
  const val     = el.value.trim();

  if (val === '') {
    showError(group, errEl, `${field.name} is required`);
    return null;
  }

  const num = parseFloat(val);
  if (isNaN(num)) {
    showError(group, errEl, 'Please enter a valid number');
    return null;
  }
  if (num < field.min || num > field.max) {
    showError(group, errEl, `Must be between ${field.min} and ${field.max}`);
    return null;
  }

  clearError(group, errEl);
  return field.integer ? parseInt(num) : num;
}

function showError(group, errEl, msg) {
  group.classList.add('has-error');
  errEl.textContent = msg;
  shake(group);
}

function clearError(group, errEl) {
  group.classList.remove('has-error');
  errEl.textContent = '';
}

function clearAllErrors() {
  FIELDS.forEach(f => {
    const group = document.getElementById(`field-${f.id}`);
    const errEl = document.getElementById(`err-${f.id}`);
    clearError(group, errEl);
  });
}

function shake(el) {
  el.animate([
    { transform: 'translateX(0)' },
    { transform: 'translateX(-5px)' },
    { transform: 'translateX(5px)' },
    { transform: 'translateX(-4px)' },
    { transform: 'translateX(4px)' },
    { transform: 'translateX(0)' },
  ], { duration: 300, easing: 'ease-in-out' });
}


// ─── Live input clearing ──────────────────────────────────────
FIELDS.forEach(f => {
  const el    = document.getElementById(f.id);
  const group = document.getElementById(`field-${f.id}`);
  const errEl = document.getElementById(`err-${f.id}`);
  el.addEventListener('input', () => clearError(group, errEl));
});


// ─── Sample Data ──────────────────────────────────────────────
sampleBtn.addEventListener('click', () => {
  clearAllErrors();
  FIELDS.forEach(f => {
    const el = document.getElementById(f.id);
    el.value = SAMPLE_DATA[f.id];
    // Tiny ripple animation on fill
    el.animate([
      { background: 'rgba(110,231,247,0.12)' },
      { background: 'rgba(255,255,255,0.05)' },
    ], { duration: 600, easing: 'ease-out' });
  });
});


// ─── Reset ────────────────────────────────────────────────────
resetBtn.addEventListener('click', () => {
  form.reset();
  clearAllErrors();
  resultEl.innerHTML = '';
});


// ─── Form Submit ──────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validate all fields
  let hasError = false;
  const payload = {};

  FIELDS.forEach(f => {
    const val = validateField(f);
    if (val === null) {
      hasError = true;
    } else {
      // Build API payload key from field id → API name mapping
      const apiKey = getApiKey(f.id);
      payload[apiKey] = val;
    }
  });

  if (hasError) return;

  // Loading state
  setLoading(true);
  resultEl.innerHTML = '';

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server error: ${res.status}`);
    }

    const data = await res.json();
    renderResult(data, payload);
    resultSec.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    renderError(err.message);
    resultSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } finally {
    setLoading(false);
  }
});


// ─── API Key Mapping ──────────────────────────────────────────
function getApiKey(id) {
  const map = {
    age:           'Age',
    pregnancies:   'Pregnancies',
    glucose:       'Glucose',
    bloodPressure: 'BloodPressure',
    skinThickness: 'SkinThickness',
    insulin:       'Insulin',
    bmi:           'BMI',
    dpf:           'DiabetesPedigreeFunction',
  };
  return map[id];
}


// ─── Loading State ────────────────────────────────────────────
function setLoading(on) {
  predictBtn.classList.toggle('loading', on);
  predictBtn.disabled = on;
}


// ─── Render Result ────────────────────────────────────────────
function renderResult(data, payload) {
  const isDiabetic        = data.prediction_class === 1;
  const label             = data.prediction_label;
  const pctDiabetic       = (data.confidence_scores['Diabetic'] * 100).toFixed(1);
  const pctNonDiabetic    = (data.confidence_scores['Non-Diabetic'] * 100).toFixed(1);
  const riskLevel         = getRiskLevel(parseFloat(pctDiabetic), isDiabetic);
  const cardClass         = isDiabetic ? 'diabetic' : 'non-diabetic';
  const icon              = isDiabetic ? '⚠️' : '✅';
  const subText           = isDiabetic
    ? 'Higher risk indicators detected. Please consult a healthcare professional.'
    : 'Your metrics indicate a lower risk. Maintain a healthy lifestyle!';

  resultEl.innerHTML = `
    <div class="result-card glass ${cardClass}">

      <div class="result-header">
        <div class="result-icon-wrap">${icon}</div>
        <div>
          <div class="result-label">${label}</div>
          <div class="result-sub">${subText}</div>
        </div>
      </div>

      <div class="confidence-section">
        <div class="confidence-title">Confidence Scores</div>
        <div class="confidence-bar-group">

          <div class="confidence-bar-item">
            <div class="confidence-bar-label">
              <span>✅ Non-Diabetic</span>
              <span class="confidence-bar-pct">${pctNonDiabetic}%</span>
            </div>
            <div class="confidence-bar-track">
              <div class="confidence-bar-fill non-diabetic-fill" id="bar-nd" style="width:0%"></div>
            </div>
          </div>

          <div class="confidence-bar-item">
            <div class="confidence-bar-label">
              <span>⚠️ Diabetic</span>
              <span class="confidence-bar-pct">${pctDiabetic}%</span>
            </div>
            <div class="confidence-bar-track">
              <div class="confidence-bar-fill diabetic-fill" id="bar-d" style="width:0%"></div>
            </div>
          </div>

        </div>
      </div>

      <div class="risk-summary">
        <div class="risk-chip">
          <div class="risk-chip-label">Risk Level</div>
          <div class="risk-chip-value ${riskLevel.cls}">${riskLevel.label}</div>
        </div>
        <div class="risk-chip">
          <div class="risk-chip-label">Glucose</div>
          <div class="risk-chip-value" style="color: var(--cyan)">${payload['Glucose']} mg/dL</div>
        </div>
        <div class="risk-chip">
          <div class="risk-chip-label">BMI</div>
          <div class="risk-chip-value" style="color: var(--violet)">${payload['BMI']}</div>
        </div>
        <div class="risk-chip">
          <div class="risk-chip-label">Age</div>
          <div class="risk-chip-value" style="color: var(--amber)">${payload['Age']} yrs</div>
        </div>
      </div>

      <div class="result-disclaimer">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0;margin-top:1px"><path d="M7 1a6 6 0 1 0 0 12A6 6 0 0 0 7 1zm0 9.5v-5m0 6.5v-1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        This result is generated by an AI model for informational purposes only. It is not a medical diagnosis. Always consult a qualified physician for professional medical advice.
      </div>

    </div>
  `;

  // Animate bars after a short delay (allow DOM paint)
  requestAnimationFrame(() => {
    setTimeout(() => {
      const barND = document.getElementById('bar-nd');
      const barD  = document.getElementById('bar-d');
      if (barND) barND.style.width = pctNonDiabetic + '%';
      if (barD)  barD.style.width  = pctDiabetic + '%';
    }, 120);
  });
}


// ─── Risk Level Helper ────────────────────────────────────────
function getRiskLevel(pctDiabetic, isDiabetic) {
  if (!isDiabetic && pctDiabetic < 25)  return { cls: 'low',      label: '🟢 Low'       };
  if (!isDiabetic && pctDiabetic < 45)  return { cls: 'moderate', label: '🟡 Moderate'  };
  if (isDiabetic  && pctDiabetic < 65)  return { cls: 'moderate', label: '🟡 Moderate'  };
  return                                       { cls: 'high',     label: '🔴 High'      };
}


// ─── Render Error ─────────────────────────────────────────────
function renderError(msg) {
  resultEl.innerHTML = `
    <div class="result-error">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style="flex-shrink:0">
        <circle cx="14" cy="14" r="12" stroke="#FB7185" stroke-width="2"/>
        <path d="M14 8v7M14 18v1" stroke="#FB7185" stroke-width="2.2" stroke-linecap="round"/>
      </svg>
      <div>
        <div style="font-weight:700;margin-bottom:4px;color:#FB7185">Prediction Failed</div>
        <div style="font-size:0.85rem;color:rgba(240,244,255,0.6)">${escapeHtml(msg)}</div>
        <div style="font-size:0.78rem;color:rgba(240,244,255,0.4);margin-top:6px">Make sure the Flask server is running on <code style="font-size:0.78rem;background:rgba(255,255,255,0.07);padding:1px 5px;border-radius:4px">http://127.0.0.1:5000</code></div>
      </div>
    </div>
  `;
}


// ─── Utility ──────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


// ─── Input ripple on focus ────────────────────────────────────
document.querySelectorAll('.input-wrapper input').forEach(input => {
  input.addEventListener('focus', () => {
    input.parentElement.querySelectorAll('.input-focus-bar').forEach(bar => {
      bar.style.transform = 'translateX(-50%) scaleX(1)';
    });
  });
  input.addEventListener('blur', () => {
    if (!input.closest('.field-group').classList.contains('has-error')) {
      input.parentElement.querySelectorAll('.input-focus-bar').forEach(bar => {
        bar.style.transform = 'translateX(-50%) scaleX(0)';
      });
    }
  });
});


// ─── Subtle tilt on form card (mouse parallax) ────────────────
(function initTilt() {
  const card = document.querySelector('.form-card');
  if (!card || window.matchMedia('(pointer: coarse)').matches) return;

  card.addEventListener('mousemove', (e) => {
    const rect   = card.getBoundingClientRect();
    const cx     = rect.left + rect.width / 2;
    const cy     = rect.top  + rect.height / 2;
    const dx     = (e.clientX - cx) / (rect.width  / 2);
    const dy     = (e.clientY - cy) / (rect.height / 2);
    const rotX   = dy * -2;
    const rotY   = dx *  2;
    card.style.transform = `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.005)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)';
    card.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1)';
    setTimeout(() => { card.style.transition = ''; }, 500);
  });
})();


console.log('%cGlucoSense AI 🧬', 'font-size:18px;font-weight:bold;background:linear-gradient(135deg,#6EE7F7,#A78BFA);-webkit-background-clip:text;color:transparent');
console.log('%cDiabetes Prediction API connected to http://127.0.0.1:5000', 'color:#6EE7F7');
