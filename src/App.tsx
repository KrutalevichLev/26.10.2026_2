import { useState, useCallback, useMemo } from 'react';

interface FormData {
  lastName: string;
  firstName: string;
  middleName: string;
  email: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

interface FormErrors {
  lastName?: string;
  firstName?: string;
  middleName?: string;
  email?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
}

interface TouchedFields {
  [key: string]: boolean;
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(' ') : digits;
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 2) {
    return digits.slice(0, 2) + '/' + digits.slice(2, 4);
  }
  return digits;
}

function getCardType(number: string): string {
  const cleaned = number.replace(/\s/g, '');
  if (cleaned.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
  if (cleaned.startsWith('2200') || cleaned.startsWith('2201')) return 'mir';
  return 'unknown';
}

function luhnCheck(num: string): boolean {
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

export default function App() {
  const [formData, setFormData] = useState<FormData>({
    lastName: '',
    firstName: '',
    middleName: '',
    email: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shakeField, setShakeField] = useState<string | null>(null);

  const validateField = useCallback((name: string, value: string): string | undefined => {
    switch (name) {
      case 'lastName':
        if (!value.trim()) return 'Введите фамилию';
        if (value.trim().length < 2) return 'Минимум 2 символа';
        if (!/^[а-яА-ЯёЁa-zA-Z\s-]+$/.test(value)) return 'Только буквы';
        return undefined;
      case 'firstName':
        if (!value.trim()) return 'Введите имя';
        if (value.trim().length < 2) return 'Минимум 2 символа';
        if (!/^[а-яА-ЯёЁa-zA-Z\s-]+$/.test(value)) return 'Только буквы';
        return undefined;
      case 'middleName':
        if (!value.trim()) return 'Введите отчество';
        if (value.trim().length < 2) return 'Минимум 2 символа';
        if (!/^[а-яА-ЯёЁa-zA-Z\s-]+$/.test(value)) return 'Только буквы';
        return undefined;
      case 'email':
        if (!value.trim()) return 'Введите email';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Некорректный email';
        return undefined;
      case 'cardNumber':
        if (!value.trim()) return 'Введите номер карты';
        if (!luhnCheck(value)) return 'Некорректный номер карты';
        return undefined;
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
        return undefined;
      case 'cvv':
        if (!value.trim()) return 'Введите CVV';
        if (!/^\d{3,4}$/.test(value)) return '3 или 4 цифры';
        return undefined;
      default:
        return undefined;
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      const digits = value.replace(/\D/g, '').slice(0, 16);
      formattedValue = formatCardNumber(digits);
    } else if (name === 'expiry') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      formattedValue = formatExpiry(digits);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    } else if (['lastName', 'firstName', 'middleName'].includes(name)) {
      formattedValue = value.replace(/[^а-яА-ЯёЁa-zA-Z\s-]/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));

    if (touched[name]) {
      const error = validateField(name, formattedValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};
    const fields: (keyof FormData)[] = ['lastName', 'firstName', 'middleName', 'email', 'cardNumber', 'expiry', 'cvv'];
    
    let hasError = false;
    fields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        hasError = true;
      }
    });

    setErrors(newErrors);
    setTouched({ lastName: true, firstName: true, middleName: true, email: true, cardNumber: true, expiry: true, cvv: true });

    if (hasError) {
      const firstErrorField = fields.find(f => newErrors[f]);
      if (firstErrorField) {
        setShakeField(firstErrorField);
        setTimeout(() => setShakeField(null), 500);
      }
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setIsSuccess(true);
  }, [formData, validateField]);

  const cardType = useMemo(() => getCardType(formData.cardNumber), [formData.cardNumber]);

  const cardBrandLogo = useMemo(() => {
    switch (cardType) {
      case 'visa': return 'VISA';
      case 'mastercard': return 'MC';
      case 'mir': return 'МИР';
      default: return '💳';
    }
  }, [cardType]);

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-red-950 animate-gradient">
        <div className="glass rounded-3xl p-12 text-center animate-slide-up max-w-md mx-4">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-3xl font-bold text-white mb-4">Оплата прошла!</h2>
          <p className="text-gray-400 mb-2">Первый правило бойцовского клуба:</p>
          <p className="text-red-400 font-semibold text-lg mb-6">Не рассказывать никому об успешной оплате.</p>
          <button
            onClick={() => {
              setIsSuccess(false);
              setFormData({ lastName: '', firstName: '', middleName: '', email: '', cardNumber: '', expiry: '', cvv: '' });
              setTouched({});
              setErrors({});
            }}
            className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl font-semibold hover:from-red-500 hover:to-red-700 transition-all duration-300 hover:scale-105"
          >
            Ещё раз
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-red-950 animate-gradient p-4">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-800/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-center">
        {/* Credit Card Preview */}
        <div className="w-full lg:w-2/5 flex justify-center">
          <div className="animate-float">
            <div className="card-glass rounded-2xl p-8 w-80 h-48 relative overflow-hidden shadow-2xl">
              {/* Card chip */}
              <div className="absolute top-8 left-8 w-12 h-9 bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-md opacity-80">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-8 h-6 border border-yellow-500/50 rounded-sm"></div>
                </div>
              </div>

              {/* Card brand */}
              <div className="absolute top-6 right-8 text-2xl font-bold text-white/80">
                {cardBrandLogo}
              </div>

              {/* Card number */}
              <div className="absolute bottom-20 left-8 right-8">
                <p className="text-white text-xl tracking-[0.2em] font-mono">
                  {formData.cardNumber || '•••• •••• •••• ••••'}
                </p>
              </div>

              {/* Card holder */}
              <div className="absolute bottom-6 left-8">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider">Card Holder</p>
                <p className="text-white text-sm font-medium tracking-wide">
                  {formData.lastName || 'ИВАНОВ'} {formData.firstName ? formData.firstName[0] + '.' : 'И.'}
                </p>
              </div>

              {/* Expiry */}
              <div className="absolute bottom-6 right-8">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider">Expires</p>
                <p className="text-white text-sm font-mono">
                  {formData.expiry || 'MM/YY'}
                </p>
              </div>

              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600/20 rounded-full"></div>
              <div className="absolute -bottom-10 -right-5 w-24 h-24 bg-red-700/20 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="w-full lg:w-3/5">
          <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                💀 Оплата
              </h1>
              <p className="text-gray-400 text-sm">
                «Лишь утратив всё до конца, мы обретаем свободу.» — Тайлер Дерден
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Personal Info Section */}
              <div className="mb-6">
                <h3 className="text-red-400 text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Личные данные
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    label="Фамилия"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.lastName ? errors.lastName : undefined}
                    placeholder="Дерден"
                    shake={shakeField === 'lastName'}
                  />
                  <InputField
                    label="Имя"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.firstName ? errors.firstName : undefined}
                    placeholder="Тайлер"
                    shake={shakeField === 'firstName'}
                  />
                  <InputField
                    label="Отчество"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.middleName ? errors.middleName : undefined}
                    placeholder="Сигмович"
                    shake={shakeField === 'middleName'}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="mb-6">
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email ? errors.email : undefined}
                  placeholder="tyler@fightclub.com"
                  icon="✉️"
                  shake={shakeField === 'email'}
                />
              </div>

              {/* Card Section */}
              <div className="mb-6">
                <h3 className="text-red-400 text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Данные карты
                </h3>
                <div className="mb-4">
                  <InputField
                    label="Номер карты"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.cardNumber ? errors.cardNumber : undefined}
                    placeholder="4242 4242 4242 4242"
                    icon="💳"
                    shake={shakeField === 'cardNumber'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Срок действия"
                    name="expiry"
                    value={formData.expiry}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.expiry ? errors.expiry : undefined}
                    placeholder="MM/YY"
                    icon="📅"
                    shake={shakeField === 'expiry'}
                  />
                  <InputField
                    label="CVV"
                    name="cvv"
                    type="password"
                    value={formData.cvv}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.cvv ? errors.cvv : undefined}
                    placeholder="•••"
                    icon="🔒"
                    shake={shakeField === 'cvv'}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 mt-6
                  ${isSubmitting 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-red-600 to-red-800 text-white hover:from-red-500 hover:to-red-700 hover:scale-[1.02] hover:shadow-lg hover:shadow-red-900/30 active:scale-[0.98]'
                  }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Обработка...
                  </span>
                ) : (
                  'Оплатить 💀'
                )}
              </button>

              {/* Security note */}
              <p className="text-center text-gray-500 text-xs mt-4">
                🔐 Данные защищены шифрованием. Мы не храним данные карт.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  icon?: string;
  shake?: boolean;
}

function InputField({ label, name, value, onChange, onBlur, error, placeholder, type = 'text', icon, shake }: InputFieldProps) {
  return (
    <div className={`transition-all duration-300 ${shake ? 'animate-shake' : ''}`}>
      <label className="block text-gray-300 text-sm font-medium mb-1.5">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">{icon}</span>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`w-full px-4 py-3 ${icon ? 'pl-10' : ''} rounded-xl bg-gray-900/80 border text-white placeholder-gray-600 transition-all duration-300 focus:ring-2
            ${error 
              ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-gray-700/50 focus:border-red-500/50 focus:ring-red-500/20 hover:border-gray-600'
            }`}
        />
      </div>
      {error && (
        <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}
