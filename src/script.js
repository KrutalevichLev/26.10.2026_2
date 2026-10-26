// ===== PAYMENT FORM - Pure Vanilla JS =====

const form = document.getElementById('paymentForm');
const submitBtn = document.getElementById('submitBtn');
const successScreen = document.getElementById('successScreen');
const resetBtn = document.getElementById('resetBtn');

// Card preview elements
const cardNumberEl = document.getElementById('cardNumber');
const cardHolderEl = document.getElementById('cardHolder');
const cardExpiryEl = document.getElementById('cardExpiry');
const cardBrandEl = document.getElementById('cardBrand');

// Input elements
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const middleNameInput = document.getElementById('middleName');
const emailInput = document.getElementById('email');
const cardNumberInput = document.getElementById('cardNumberInput');
const expiryInput = document.getElementById('expiry');
const cvvInput = document.getElementById('cvv');

const touched = {};

// ===== FORMATTERS =====
function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(' ') : digits;
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 2) {
    return digits.slice(0, 2) + '/' + digits.slice(2, 4);
  }
  return digits;
}

function getCardType(number) {
  const cleaned = number.replace(/\s/g, '');
  if (cleaned.startsWith('4')) return 'VISA';
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'MC';
  if (cleaned.startsWith('2200') || cleaned.startsWith('2201')) return 'МИР';
  return '💳';
}

function luhnCheck(num) {
  const digits = num.replace(/\s/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

// ===== VALIDATION =====
function validateField(name, value) {
  switch (name) {
    case 'firstName':
      if (!value.trim()) return 'Введите имя';
      if (value.trim().length < 2) return 'Минимум 2 символа';
      if (!/^[а-яА-ЯёЁa-zA-Z\s-]+$/.test(value)) return 'Только буквы';
      return null;
    case 'lastName':
      if (!value.trim()) return 'Введите фамилию';
      if (value.trim().length < 2) return 'Минимум 2 символа';
      if (!/^[а-яА-ЯёЁa-zA-Z\s-]+$/.test(value)) return 'Только буквы';
      return null;
    case 'middleName':
      if (!value.trim()) return 'Введите отчество';
      if (value.trim().length < 2) return 'Минимум 2 символа';
      if (!/^[а-яА-ЯёЁa-zA-Z\s-]+$/.test(value)) return 'Только буквы';
      return null;
    case 'email':
      if (!value.trim()) return 'Введите email';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Некорректный email';
      return null;
    case 'cardNumber':
      if (!value.trim()) return 'Введите номер карты';
      if (!luhnCheck(value)) return 'Некорректный номер карты';
      return null;
    case 'expiry':
      if (!value.trim()) return 'Введите срок';
      const parts = value.split('/');
      if (parts.length !== 2 || parts[0].length !== 2 || parts[1].length !== 2) return 'Формат ММ/ГГ';
      const month = parseInt(parts[0], 10);
      const year = parseInt('20' + parts[1], 10);
      if (month < 1 || month > 12) return 'Некорректный месяц';
      const now = new Date();
      const expDate = new Date(year, month);
      if (expDate < now) return 'Карта просрочена';
      return null;
    case 'cvv':
      if (!value.trim()) return 'Введите CVV';
      if (!/^\d{3,4}$/.test(value)) return '3 или 4 цифры';
      return null;
    default:
      return null;
  }
}

function showError(name, message) {
  const errorEl = document.getElementById('error-' + name);
  const inputEl = name === 'cardNumber' ? cardNumberInput : document.getElementById(name);

  if (message) {
    errorEl.querySelector('span').textContent = message;
    errorEl.classList.add('visible');
    inputEl.classList.add('error');
  } else {
    errorEl.classList.remove('visible');
    inputEl.classList.remove('error');
  }
}

function shakeField(name) {
  const groupEl = document.getElementById('group-' + name);
  groupEl.classList.add('shake');
  setTimeout(() => groupEl.classList.remove('shake'), 500);
}

// ===== UPDATE CARD PREVIEW =====
function updateCardPreview() {
  const num = cardNumberInput.value || '•••• •••• •••• ••••';
  cardNumberEl.textContent = num;

  const fn = firstNameInput.value || 'ТАЙЛЕР';
  const ln = lastNameInput.value ? lastNameInput.value[0] + '.' : 'Д.';
  cardHolderEl.textContent = fn.toUpperCase() + ' ' + ln;

  cardExpiryEl.textContent = expiryInput.value || 'MM/YY';
  cardBrandEl.textContent = getCardType(cardNumberInput.value);
}

// ===== INPUT HANDLERS =====
function handleInput(e) {
  const input = e.target;
  const name = input.name;
  let value = input.value;

  if (name === 'cardNumber') {
    value = formatCardNumber(value);
    input.value = value;
  } else if (name === 'expiry') {
    value = formatExpiry(value);
    input.value = value;
  } else if (name === 'cvv') {
    value = value.replace(/\D/g, '').slice(0, 4);
    input.value = value;
  } else if (['firstName', 'lastName', 'middleName'].includes(name)) {
    value = value.replace(/[^а-яА-ЯёЁa-zA-Z\s-]/g, '');
    input.value = value;
  }

  if (touched[name]) {
    const error = validateField(name, value);
    showError(name, error);
  }

  updateCardPreview();
}

function handleBlur(e) {
  const input = e.target;
  const name = input.name;
  touched[name] = true;
  const error = validateField(name, input.value);
  showError(name, error);
}

// Attach listeners
const allInputs = [firstNameInput, lastNameInput, middleNameInput, emailInput, cardNumberInput, expiryInput, cvvInput];
allInputs.forEach(input => {
  input.addEventListener('input', handleInput);
  input.addEventListener('blur', handleBlur);
});

// ===== FORM SUBMIT =====
form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const fields = ['firstName', 'lastName', 'middleName', 'email', 'cardNumber', 'expiry', 'cvv'];
  const inputs = {
    firstName: firstNameInput,
    lastName: lastNameInput,
    middleName: middleNameInput,
    email: emailInput,
    cardNumber: cardNumberInput,
    expiry: expiryInput,
    cvv: cvvInput,
  };

  let hasError = false;
  let firstErrorField = null;

  fields.forEach(field => {
    touched[field] = true;
    const error = validateField(field, inputs[field].value);
    showError(field, error);
    if (error && !hasError) {
      hasError = true;
      firstErrorField = field;
    }
  });

  if (hasError) {
    shakeField(firstErrorField);
    return;
  }

  // Simulate submission
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Обработка...';

  await new Promise(resolve => setTimeout(resolve, 2000));

  submitBtn.disabled = false;
  submitBtn.innerHTML = 'Оплатить 💀';
  successScreen.classList.add('visible');
});

// ===== RESET =====
resetBtn.addEventListener('click', function () {
  successScreen.classList.remove('visible');
  form.reset();
  Object.keys(touched).forEach(k => delete touched[k]);
  ['firstName', 'lastName', 'middleName', 'email', 'cardNumber', 'expiry', 'cvv'].forEach(name => {
    showError(name, null);
  });
  updateCardPreview();
});

// Initial card preview
updateCardPreview();
